import React, {useState} from 'react';
import {currency} from './routes.js';
import {formatArea} from './ListingOverview.jsx';
import {compareListings, isRental} from './comparison-insights.js';

const formatPercent = new Intl.NumberFormat('en-GB', {style:'percent', maximumFractionDigits:1});

function priceDifference(reference, candidate, result) {
  const {priceDelta, pricePercent, period} = result;
  if (isRental(reference) !== isRental(candidate)) return 'One is for sale and one is for rent.';
  if (priceDelta === null) return isRental(reference)
    ? 'Confirm both asking rents and billing periods to compare.'
    : 'Request the missing asking price to compare.';
  if (priceDelta === 0) return period ? 'Same asking rent per ' + period : 'Same asking price';
  let text = currency(Math.abs(priceDelta)) + (period ? ' per ' + period : '') + (priceDelta > 0 ? ' more' : ' less');
  return text + ' (' + formatPercent.format(pricePercent) + ')';
}

function quantityDifference(before, after, unit, delta) {
  if (delta === null) return 'Confirm both counts with the agent';
  return before + ' to ' + after + ' ' + unit;
}

function spaceDifference(before, after, delta, firstApprox = false, secondApprox = false) {
  if (delta === null) return 'Request comparable measurements';
  const sizes = formatArea(before, firstApprox) + ' to ' + formatArea(after, secondApprox);
  return delta ? sizes + ' (' + (delta > 0 ? '+' : '−') + formatArea(Math.abs(delta), firstApprox || secondApprox) + ')' : sizes;
}

function FeatureSummary({item, features}) {
  return <div className="advice-features">
    <h6>Listed on REF {item.id}</h6>
    <p>{features.length ? features.join(' · ') : 'No additional features documented for this comparison.'}</p>
  </div>;
}

function visitPriorities(reference, candidate, comparison) {
  const {first, second, priceDelta, bedDelta, interiorDelta, plotDelta, extraFeatures, referenceFeatures} = comparison;
  const spaceDirection = Math.sign(bedDelta || interiorDelta || plotDelta || 0);
  const spaceProperty = spaceDirection > 0 ? candidate : reference;
  const spaceFactor = bedDelta ? 'bedrooms' : interiorDelta ? 'interior space' : 'plot space';
  const notes = [];

  if (priceDelta && spaceDirection && Math.sign(priceDelta) === spaceDirection) {
    const lowerPrice = priceDelta > 0 ? reference : candidate;
    notes.push('View REF ' + spaceProperty.id + ' first if you need more ' + spaceFactor + '. Start with REF ' + lowerPrice.id + ' if keeping the asking price down is your priority.');
  } else if (spaceDirection) {
    notes.push('If you need more ' + spaceFactor + ', start with REF ' + spaceProperty.id + ' and check how the layout works for you.');
  }

  if (priceDelta && !spaceDirection) {
    const higherPrice = priceDelta > 0 ? candidate : reference;
    notes.push('At REF ' + higherPrice.id + ', ask which differences in condition, finish or location account for the higher asking price.');
  }
  if (bedDelta && interiorDelta && Math.sign(bedDelta) !== Math.sign(interiorDelta)) {
    const larger = interiorDelta > 0 ? candidate : reference;
    notes.push('REF ' + larger.id + ' has more measured interior space. Compare the floor plans if room size matters more than the bedroom count.');
  }
  const annex = 'Self-contained apartment';
  const withAnnex = extraFeatures.includes(annex) ? candidate : referenceFeatures.includes(annex) ? reference : null;
  if (withAnnex) {
    notes.push('If you plan to host guests independently, ask to see the self-contained apartment and its access at REF ' + withAnnex.id + '.');
  }
  if (reference.area && candidate.area && reference.area !== candidate.area) {
    notes.push('Try the routes you use most from both properties and check the approach, slope and parking in person.');
  }
  if (reference.type !== 'Land' && candidate.type !== 'Land' && !comparison.sameAreaBasis) {
    notes.push('Ask for floor plans and measurements on the same basis before judging value per square metre.');
  }
  if (!notes.length && first.plot && second.plot) {
    notes.push('Check plot boundaries and how much of each plot you can use before deciding.');
  }
  return notes;
}

function PairAdvice({reference, candidate}) {
  const comparison = compareListings(reference, candidate);
  const {first, second, period, sameType, pricePerSqm, extraFeatures, referenceFeatures, bedDelta, bathDelta, interiorDelta, plotDelta} = comparison;
  const location = reference.area === candidate.area ? candidate.area : [reference.area, candidate.area].filter(Boolean).join(' / ');
  const priorities = visitPriorities(reference, candidate, comparison);
  const rows = [
    [period ? 'Asking rent difference' : 'Asking price difference', priceDifference(reference, candidate, comparison)],
    ['Location', location],
    ['Property type', !sameType && reference.type + ' / ' + candidate.type],
    ['Bedrooms', (first.beds > 0 || second.beds > 0) && quantityDifference(first.beds, second.beds, 'bedrooms', bedDelta)],
    ['Bathrooms', (first.baths > 0 || second.baths > 0) && quantityDifference(first.baths, second.baths, 'bathrooms', bathDelta)],
    [first.areaBasis === second.areaBasis ? first.areaBasis : 'Building / interior area',
      (first.interior || second.interior) && spaceDifference(first.interior, second.interior, interiorDelta)],
    ['Plot area', (first.plot || second.plot) && spaceDifference(first.plot, second.plot, plotDelta, first.plotApprox, second.plotApprox)],
    ['Asking price per interior m²', pricePerSqm && pricePerSqm.map(value => currency(value) + '/m²').join(' to ')],
  ].filter(([, value]) => Boolean(value));
  return <article className="comparison-advice">
    <div className="advice-title">
      <p>REF {reference.id} compared with</p>
      <h5><a href={candidate.path}>{candidate.name}</a></h5>
      <span>REF {candidate.id}</span>
    </div>
    <dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    {(extraFeatures.length > 0 || referenceFeatures.length > 0) && <div className="advice-feature-grid">
      <FeatureSummary item={reference} features={referenceFeatures}/>
      <FeatureSummary item={candidate} features={extraFeatures}/>
    </div>}
    {priorities.length > 0 && <div className="advice-next">
      <h6>What to check on a viewing</h6>
      <ul>{priorities.map(note => <li key={note}>{note}</li>)}</ul>
    </div>}
  </article>;
}

export default function ComparisonAdvice({items}) {
  const [referenceId, setReferenceId] = useState(items[0].id);
  const reference = items.find(item => item.id === referenceId) ?? items[0];
  return <div className="comparison-advice-group">
    {items.length > 2 && <label className="advice-reference">Compare against
      <select value={reference.id} onChange={event => setReferenceId(event.target.value)}>
        {items.map(item => <option key={item.id} value={item.id}>REF {item.id} · {item.name}</option>)}
      </select>
    </label>}
    <p className="advice-intro">See what changes in price, space and features against <a href={reference.path}>REF {reference.id}</a>. Feature differences reflect the details advertised in each listing.</p>
    {items.filter(item => item.id !== reference.id).map(item => <PairAdvice key={item.id} reference={reference} candidate={item}/>)}
  </div>;
}
