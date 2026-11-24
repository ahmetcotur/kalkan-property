import React, {useState} from 'react';
import {Badge} from '@astryxdesign/core/Badge';
import {Bath, BedDouble, Heart, House, LayoutGrid, List, MapPin, Ruler} from 'lucide-react';
import {CardPhotos} from './ListingMedia.jsx';
import {formatArea} from './ListingOverview.jsx';
import {listingSpecs} from './listing-specs.js';
import {priceLabel} from './routes.js';
import {typeIcons} from './SearchUI.jsx';

function PropertyCard({item, saved, toggle, showSummary}) {
  const [hover, setHover] = useState(false);
  const TypeIcon = typeIcons[item.type] || House;
  const spec = listingSpecs[item.id] ?? {};
  const plot = spec.plot || item.plotArea;
  const size = spec.interior
    ? formatArea(spec.interior) + (spec.interiorLabel === 'Building area' ? ' building' : ' interior')
    : plot ? formatArea(plot, spec.plotApprox) + ' plot' : '';
  const summary = showSummary ? item.description.trim().split(/\n\s*\n/, 1)[0].replace(/\s+/g,' ') : '';
  return <article className="property" onPointerEnter={event => { if (event.pointerType === 'mouse') setHover(true); }}
    onPointerLeave={() => setHover(false)}>
    <CardPhotos item={item} hover={hover}>
      {item.status && <div className="status"><Badge label={item.status}/></div>}
      <button type="button" className={'save icon-button' + (saved ? ' selected' : '')} aria-pressed={saved}
        aria-label={(saved ? 'Remove from saved: ' : 'Save: ') + item.name} onClick={() => toggle(item.id)}>
        <Heart size={19} fill={saved ? 'currentColor' : 'none'} aria-hidden="true"/>
      </button>
    </CardPhotos>
    <div className="card-copy">
      <div className="property-meta">
        {item.area && <span className="property-area"><MapPin size={15} aria-hidden="true"/>{item.area}</span>}
        <span className="property-ref">REF {item.id}</span>
      </div>
      <h3><a href={item.path}>{item.name}</a></h3>
      {summary && <p className="property-summary">{summary}</p>}
      <ul className="property-facts" aria-label="Property facts">
        <li><TypeIcon size={16} aria-hidden="true"/>{item.type}</li>
        {item.beds > 0 && <li><BedDouble size={16} aria-hidden="true"/>{item.beds} {item.beds === 1 ? 'bed' : 'beds'}</li>}
        {item.baths > 0 && !spec.bathroomNote && <li><Bath size={16} aria-hidden="true"/>{item.baths} {item.baths === 1 ? 'bath' : 'baths'}</li>}
        {size && <li><Ruler size={16} aria-hidden="true"/>{size}</li>}
      </ul>
      <div className="card-bottom">
        <strong className={item.price > 0 ? undefined : 'price-on-request'}>{priceLabel(item.price)}</strong>
        <a href={item.path} aria-label={'View ' + item.name}>View property</a>
      </div>
    </div>
  </article>;
}

export function PropertyGrid({items, saved, toggle, view = 'grid'}) {
  const showSummary = view === 'list';
  return <div className={'property-grid' + (showSummary ? ' property-list' : '')}>
    {items.map(item => <PropertyCard key={item.id} item={item} saved={saved.includes(item.id)} toggle={toggle} showSummary={showSummary}/>)}
  </div>;
}

const views = [['grid','Grid',LayoutGrid],['list','List',List]];
export function PropertyViewPicker({value, onChange}) {
  return <div className="property-view-picker" role="group" aria-label="Property layout">
    {views.map(([view,label,Icon]) => <button type="button" key={view} aria-pressed={view === value} onClick={() => onChange(view)}>
      <Icon size={17} aria-hidden="true"/>{label}
    </button>)}
  </div>;
}
