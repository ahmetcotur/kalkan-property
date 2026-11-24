import React, {useRef, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Columns3, X} from 'lucide-react';
import {archivedListing, listings, priceLabel} from './routes.js';
import {listingSpecs} from './listing-specs.js';
import {formatArea} from './ListingOverview.jsx';
import ComparisonAdvice from './ComparisonAdvice.jsx';
import {isRental, rentalPeriod} from './comparison-insights.js';

const maxSelection = 3;
const pool = item => item.features.find(feature => /infinity pool/i.test(feature)) ||
  item.features.find(feature => /^(?:private (?:swimming )?|shared )pool$/i.test(feature));

function comparisonPrice(item) {
  const price = priceLabel(item.price);
  if (!isRental(item) || !(item.price > 0)) return price;
  const period = rentalPeriod(item);
  return period ? price + ' / ' + period : price + ' · confirm rental period';
}

const rows = [
  ['Asking price', comparisonPrice],
  ['Status', item => item.status],
  ['Area', item => item.area],
  ['Type', item => item.type],
  ['Bedrooms', item => item.beds > 0 ? item.beds : null],
  ['Bathrooms', (item, spec) => spec.bathroomNote ? 'Confirm with agent' : item.baths > 0 ? item.baths : null],
  ['Building / interior area', (item, spec) => spec.interior
    ? [formatArea(spec.interior), spec.interiorLabel].filter(Boolean).join(' · ') : null],
  ['Plot area', (item, spec) => spec.plot || item.plotArea ? formatArea(spec.plot || item.plotArea, spec.plotApprox) : null],
  ['Pool', item => pool(item)?.replace(/^Private Swimming Pool$/i, 'Private Pool')],
  ['View', item => item.features.filter(feature => /\bviews?\b/i.test(feature)).join(', ')],
  ['Parking', item => item.features.find(feature => /parking/i.test(feature))],
];

function matchReasons(candidate, reference) {
  if (isRental(candidate) !== isRental(reference)) return null;
  const sameType = candidate.type === reference.type;
  const sameArea = Boolean(reference.area) && candidate.area === reference.area;
  const closePrice = !isRental(reference) && candidate.price > 0 && reference.price > 0 &&
    Math.abs(candidate.price - reference.price) / reference.price <= .2;
  const sameBeds = candidate.beds > 0 && candidate.beds === reference.beds;
  if (!sameType && !sameArea) return null;
  return {
    score: Number(sameType) * 4 + Number(sameArea) * 4 + Number(closePrice) * 2 + Number(sameBeds),
    reasons: [
      sameArea && 'Same area', sameType && 'Same property type', closePrice && 'Similar asking price', sameBeds && 'Same bedroom count',
    ].filter(Boolean),
  };
}

function recommendations(items, saved) {
  return listings.filter(candidate => !saved.includes(candidate.id) && !archivedListing(candidate)).flatMap(candidate => {
    const best = items.map(reference => {
      const match = matchReasons(candidate, reference);
      return match && {...match, reference};
    }).filter(Boolean).sort((a, b) => b.score - a.score)[0];
    return best ? [{candidate, ...best}] : [];
  }).sort((a, b) => b.score - a.score).slice(0, 3);
}

function Comparison({items, saved}) {
  const suggestions = recommendations(items, saved);
  return <>
    <div className="comparison-scroll" role="region" aria-label="Property comparison table" tabIndex={0}>
      <table className="comparison-table">
        <caption className="visually-hidden">Selected properties side by side</caption>
        <thead><tr><th scope="col">Property</th>{items.map(item => <th scope="col" key={item.id}>
          <a href={item.path}><img src={item.photos[0]} alt=""/><span>{item.name}</span></a>
          <small>REF {item.id}</small>
        </th>)}</tr></thead>
        <tbody>{rows.map(([label, value]) => {
          const values = items.map(item => value(item, listingSpecs[item.id] || {}));
          if (values.every(entry => !entry)) return null;
          return <tr key={label}><th scope="row">{label}</th>{values.map((entry, index) =>
            <td key={items[index].id}>{entry || 'Not listed'}</td>)}</tr>;
        })}</tbody>
      </table>
    </div>
    <section className="comparison-recommendations" aria-labelledby="comparison-recommendations">
      <h3 id="comparison-recommendations">Recommendations</h3>
      <ComparisonAdvice items={items}/>
      {suggestions.length > 0 ? <>
        <h4>Similar properties to consider</h4>
        <ul className="comparison-suggestions">{suggestions.map(({candidate, reference, reasons}) =>
          <li key={candidate.id}><a href={candidate.path}>
            <img src={candidate.photos[0]} alt="" loading="lazy"/>
            <span className="comparison-suggestion-copy"><strong>{candidate.name}</strong><span>{comparisonPrice(candidate)}</span></span>
          </a><p>{reasons.join(' · ')}<span>Compared with REF {reference.id}</span></p></li>
        )}</ul>
      </> : <p>No close matches outside your shortlist in the current portfolio.</p>}
    </section>
  </>;
}

function Shortlist({items, selected, select, toggle}) {
  return <ul className="saved-list">{items.map(item => {
    const checked = selected.includes(item.id);
    return <li key={item.id}>
      <label className="saved-select"><input type="checkbox" checked={checked}
        disabled={!checked && selected.length >= maxSelection}
        onChange={() => select(item.id)} aria-label={'Compare ' + item.name}/></label>
      <a href={item.path}><img src={item.photos[0]} alt=""/><span>{item.name}<strong>{priceLabel(item.price)}</strong></span></a>
      <button type="button" className="icon-button" onClick={() => toggle(item.id)} aria-label={'Remove ' + item.name}><X size={16}/></button>
    </li>;
  })}</ul>;
}

export default function SavedDialog({dialogRef, saved, toggle}) {
  const items = saved.map(id => listings.find(item => item.id === id)).filter(Boolean);
  const [selection, setSelection] = useState(null);
  const [comparing, setComparing] = useState(false);
  const heading = useRef(null);
  const selected = (selection ?? saved.slice(0, maxSelection)).filter(id => saved.includes(id));
  const comparedItems = items.filter(item => selected.includes(item.id));
  const comparisonOpen = comparing && comparedItems.length >= 2;

  function changeView(next) {
    setComparing(next);
    const dialog = dialogRef.current;
    dialog.scrollTop = 0;
    heading.current.focus({preventScroll:true});
  }

  function select(id) {
    setSelection(selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id]);
  }

  return <dialog ref={dialogRef} className={'saved-dialog' + (comparisonOpen ? ' comparing' : '')}
    aria-labelledby="saved-heading" onClose={() => { setComparing(false); setSelection(null); }}
    onClick={event => { if (event.target === event.currentTarget) dialogRef.current.close(); }}>
    <div className="dialog-inner">
      <div className="dialog-heading">
        <h2 id="saved-heading" ref={heading} tabIndex={-1}>{comparisonOpen ? 'Compare properties' : 'Saved properties'}</h2>
        <button type="button" className="icon-button" onClick={() => dialogRef.current.close()} aria-label="Close saved properties"><X size={23}/></button>
      </div>
      {comparisonOpen ? <>
        <div className="comparison-actions"><Button label="Edit selection" className="quiet-action" onClick={() => changeView(false)}/></div>
        <Comparison items={comparedItems} saved={saved}/>
      </> : items.length === 0 ? <p>Tap the heart on a property to add it to your shortlist.</p> : <>
        <p className="saved-help">{items.length < 2 ? 'Save one more property to compare your shortlist.' : 'Choose up to three properties to compare side by side.'}</p>
        <Shortlist items={items} selected={selected} select={select} toggle={id => {
          setSelection(selected.filter(value => value !== id));
          toggle(id);
        }}/>
        <div className="saved-actions">
          <span aria-live="polite">{selected.length} of {maxSelection} selected</span>
          <Button label="Compare properties" className="action" variant="primary" icon={<Columns3 size={18}/>}
            disabled={selected.length < 2} onClick={() => changeView(true)}/>
        </div>
      </>}
    </div>
  </dialog>;
}
