import {listingSpecs} from './listing-specs.js';

export const isRental = item => item.status === 'For Rent';

export function rentalPeriod(item) {
  return item.description.match(/^£[\d,]+ per (day|week|month|year)\b/i)?.[1]?.toLowerCase();
}

const featureLabels = {
  'additional bedrooms possible': 'Potential for additional bedrooms',
  'extra study/hobby room': 'Study or hobby room',
  'gardens': 'Garden',
  'near seafront': 'Near the seafront',
  'near town centre': 'Near the town centre',
  'private swimming pool': 'Private pool',
  'self-contained apartment': 'Self-contained apartment',
  'secluded property': 'Secluded setting',
  'town centre': 'Town-centre location',
};

function amenities(item) {
  return [...new Set(item.features
    .filter(feature => !/^(resale|brand new)$/i.test(feature))
    .map(feature => featureLabels[feature.toLowerCase()] ?? feature))];
}

function facts(item) {
  const spec = listingSpecs[item.id] ?? {};
  return {
    beds: item.beds,
    baths: spec.bathroomNote ? null : item.baths,
    interior: spec.interior,
    areaBasis: spec.interiorLabel ?? 'Interior area',
    plot: spec.plot || item.plotArea,
    plotApprox: spec.plotApprox,
    features: amenities(item),
  };
}

export function compareListings(reference, candidate) {
  const first = facts(reference);
  const second = facts(candidate);
  const bothRentals = isRental(reference) && isRental(candidate);
  const bothSales = !isRental(reference) && !isRental(candidate);
  const period = bothRentals ? rentalPeriod(reference) : undefined;
  const canComparePrice = reference.price > 0 && candidate.price > 0 &&
    (bothSales || (period && period === rentalPeriod(candidate)));
  const priceDelta = canComparePrice ? candidate.price - reference.price : null;
  const sameAreaBasis = first.interior > 0 && second.interior > 0 && first.areaBasis === second.areaBasis;
  const comparableUnitPrice = bothSales && canComparePrice && sameAreaBasis &&
    first.areaBasis === 'Interior area' && reference.type === candidate.type;
  const sameType = reference.type === candidate.type;
  const firstFeatures = new Set(first.features.map(feature => feature.toLowerCase()));
  const secondFeatures = new Set(second.features.map(feature => feature.toLowerCase()));
  return {
    first, second, sameType, sameAreaBasis, period, priceDelta,
    pricePercent: canComparePrice ? Math.abs(priceDelta) / reference.price : null,
    pricePerSqm: comparableUnitPrice ? [reference.price / first.interior, candidate.price / second.interior] : null,
    extraFeatures: second.features.filter(feature => !firstFeatures.has(feature.toLowerCase())),
    referenceFeatures: first.features.filter(feature => !secondFeatures.has(feature.toLowerCase())),
    bedDelta: first.beds > 0 && second.beds > 0 ? second.beds - first.beds : null,
    bathDelta: first.baths > 0 && second.baths > 0 ? second.baths - first.baths : null,
    interiorDelta: sameAreaBasis ? second.interior - first.interior : null,
    plotDelta: first.plot > 0 && second.plot > 0 ? second.plot - first.plot : null,
  };
}
