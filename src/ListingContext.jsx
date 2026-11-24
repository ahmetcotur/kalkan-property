import React, {useEffect, useRef, useState} from 'react';
import {ArrowUpRight, Compass, MapPin, MessageCircle, X} from 'lucide-react';
import {Button} from '@astryxdesign/core/Button';
import {archivedListing, currency, getLocation, listings, priceLabel, whatsapp} from './routes.js';

const areaGuides = {
  Kalamar: [
    ['Life around the bay','A coastal setting with homes around Kalamar Bay. Compare the access from each street to the waterfront.'],
    ['Old Town within reach','Try the route to the harbour and the town centre in person. The slope makes the return walk feel different.'],
    ['Terraces and outlook','Check the direction of the terrace, afternoon shade and whether nearby buildings affect the view.'],
  ],
  'Kalkan Town Centre': [
    ['Harbour and Old Town','The harbour, old streets and restaurants make this a useful base for spending time in town.'],
    ['Everyday access','Walk the route to the shops and check the gradient, steps and parking near the property.'],
    ['Visit at two times','Check how the street feels by day and evening before choosing between a central location and a quieter street.'],
  ],
  'İslamlar Village': [
    ['A hillside village setting','Choose this area if a village setting and outdoor space are priorities in your shortlist.'],
    ['Closer to countryside','Ask to visit the garden or terrace in person and check the property’s outlook and exposure.'],
    ['Check access on a visit','Try the drive to Kalkan, including the last stretch of road and the approach to the property.'],
  ],
  'Kızıltaş': [
    ['Hillside outlook','A useful area to compare homes with views across Kalkan Bay. Check the outlook from the rooms you will use most.'],
    ['Town access','Try the route to the town centre on foot or by car and check the return gradient.'],
    ['Practical details','Check parking and the level access between the street and the property.'],
  ],
  Ortaalan: [
    ['A base near town','Compare access to Kalkan’s shops and town centre while looking at quieter streets.'],
    ['Outdoor space','Consider how the terrace, pool and living level connect when you tour the villa.'],
  ],
  'Kışla': [
    ['A different side of the bay','Compare the outlook across Kalkan Bay with homes nearer the centre.'],
    ['Plan your route','Check the route to the waterfront, as well as the drive to town and parking at the property.'],
  ],
  'Kömürlük': [
    ['The coastal setting','Compare how the home faces the bay and the amount of sun it receives across the day.'],
    ['Waterfront access','Check the route to the shoreline and the last stretch to the home in person.'],
  ],
};

export function ListingNavigation({item}) {
  const nav = useRef(null);
  const [active, setActive] = useState(null);
  const links = [
    ['overview', 'Overview'],
    ...(item.features.length > 0 ? [['features', 'Features']] : []),
    ['location', 'Location'],
    ...(item.status !== 'For Rent' && !archivedListing(item) ? [['valuation', 'Valuation']] : []),
  ];
  useEffect(() => {
    const sections = Array.from(nav.current.querySelectorAll('a'), link =>
      document.getElementById(link.hash.slice(1))).filter(Boolean);
    let frame = 0;
    function update() {
      frame = 0;
      const line = nav.current.getBoundingClientRect().bottom + 20;
      const section = sections.findLast(target => target.getBoundingClientRect().top <= line);
      setActive(section?.id ?? null);
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [item]);
  return <nav ref={nav} className="listing-section-nav" aria-label="On this listing">
    {links.map(([id, label]) => <a key={id} href={'#' + id}
      aria-current={active === id ? 'location' : undefined}>{label}</a>)}
  </nav>;
}

function PropertyMap({coordinates,label}) {
  const container = useRef(null);
  const [failed,setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    let map;
    import('leaflet').then(({default:L}) => {
      if (!active) return;
      map = L.map(container.current,{scrollWheelZoom:false}).setView(coordinates,15);
      const layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
        maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      });
      layer.once('tileload',() => setFailed(false));
      layer.once('tileerror',() => setFailed(true));
      layer.addTo(map);
      const icon = L.divIcon({className:'listing-map-marker',html:'',iconSize:[22,22],iconAnchor:[11,11]});
      L.marker(coordinates,{icon,title:label,alt:label}).addTo(map);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; map?.remove(); };
  }, [coordinates,label]);
  return <div className="property-map-shell">
    <div className="property-map-canvas" ref={container} aria-label={'Map near ' + label}/>
    {failed && <p className="map-load-note">Some map tiles are unavailable. Open the full map using the link below.</p>}
  </div>;
}

export function ListingLocation({item}) {
  const [showMap,setShowMap] = useState(false);
  const areaName = item.area || item.locations[0] || 'the surrounding area';
  const area = getLocation(areaName);
  const guide = areaGuides[areaName];
  const coordinates = item.position;
  let placeLink;
  if (coordinates) {
    const [lat,lon] = coordinates;
    placeLink = 'https://www.openstreetmap.org/?' + new URLSearchParams({mlat:lat,mlon:lon}) + '#map=15/' + lat + '/' + lon;
  } else {
    placeLink = 'https://www.openstreetmap.org/search?' + new URLSearchParams({query:areaName + ', Türkiye'});
  }
  return <section className="detail-section location-detail" id="location">
    <div className="section-heading"><div><p className="kicker">THE NEIGHBOURHOOD</p><h2>Life in {areaName}.</h2></div>
      {area && <Button href={area.path} label={'Explore ' + area.name} className="quiet-action"/>}
    </div>
    <div className="listing-map">
      {showMap && coordinates ? <PropertyMap coordinates={coordinates} label={areaName}/> :
        <div className="map-cover">
          <img src={area?.image || item.photos[0]} alt="" loading="lazy"/>
          <div><MapPin size={23}/><strong>{areaName}</strong>
            {coordinates ? <Button type="button" label="Show interactive map" variant="primary" className="action" onClick={() => setShowMap(true)}/> :
              <Button href={placeLink} label="Explore the area on OpenStreetMap" target="_blank" rel="noopener noreferrer" variant="primary" className="action"/>}
          </div>
        </div>}
    </div>
    <div className="map-caption">
      <p>{coordinates ? 'Pin from the original listing. Confirm the exact address for a viewing.' : 'This listing publishes the area without a property pin.'}</p>
      {coordinates && <a className="text-link" href={placeLink} target="_blank" rel="noopener noreferrer">Open in OpenStreetMap <ArrowUpRight size={15}/></a>}
    </div>
    {guide ? <div className="area-advantages">{guide.map(([title,description]) => <article key={title}><Compass size={19}/><div><h3>{title}</h3><p>{description}</p></div></article>)}</div> :
      item.locations.length>0 && <ul className="feature-list area-tags">{[...new Set(item.locations)].map(place => <li key={place}><MapPin size={15}/>{place}</li>)}</ul>}
  </section>;
}

function compareSet(item) {
  const norm = text => text?.toLocaleLowerCase('tr').normalize('NFD').replace(/\p{Diacritic}/gu,'').replaceAll('ı','i');
  const kalkan = new Set(['kalkan','kalkan town centre','kalamar','kiziltas','komurluk','kisla','ortaalan']);
  const area = norm(item.area);
  const candidates = listings.filter(candidate => candidate.id!==item.id && candidate.price>0 &&
    candidate.status?.startsWith('For Sale') && candidate.type===item.type);
  const local = candidates.filter(candidate => area && norm(candidate.area)===area);
  const near = kalkan.has(area) ? candidates.filter(candidate => kalkan.has(norm(candidate.area))) : local;
  const sample = local.length>=3 ? local : near;
  const rooms = sample.filter(candidate => item.beds>0 && candidate.beds===item.beds);
  return {place:sample===local ? item.area : 'Kalkan',roomMatch:rooms.length>=3,sample:rooms.length>=3 ? rooms : sample};
}

function ValuationRequest({item}) {
  const dialog = useRef(null);
  const trigger = useRef(null);
  const [intent,setIntent] = useState('listing');
  const [notes,setNotes] = useState('');
  const theirProperty = intent==='own';
  const message = (theirProperty ? 'Hello Mavi Real Estate, I would like to request a valuation for a property I own.' :
    'Hello Mavi Real Estate, I would like to discuss a valuation for property ' + item.id + ' in ' + (item.area || 'the area') + '.') +
    (notes.trim() ? '\n\n' + notes.trim() : '');
  return <>
    <div className="valuation-cta"><div><h3>Ask Mavi for a valuation.</h3><p>Share the property reference or give the team a few details about your own home.</p></div>
      <button type="button" className="valuation-button" ref={trigger} onClick={() => dialog.current.showModal()}>Request a valuation</button>
    </div>
    <dialog ref={dialog} className="valuation-dialog" aria-label="Request a valuation" onClose={() => trigger.current?.focus({preventScroll:true})}>
      <div className="dialog-inner">
        <div className="dialog-heading"><h2>Request a valuation.</h2><button type="button" className="icon-button" aria-label="Close valuation request" onClick={() => dialog.current.close()}><X size={22}/></button></div>
        <div className="valuation-options" aria-label="Property to value" role="group">
          <button type="button" aria-pressed={!theirProperty} onClick={() => setIntent('listing')}>This listing · {item.id}</button>
          <button type="button" aria-pressed={theirProperty} onClick={() => setIntent('own')}>A property I own</button>
        </div>
        <label className="valuation-notes"><span>Notes (optional)</span>
          <textarea rows={4} maxLength={500} value={notes} onChange={event => setNotes(event.target.value)}
            placeholder={theirProperty ? 'Area, property type, size and condition' : 'Any questions or details you want to share'}/></label>
        <Button label="Open WhatsApp draft" href={whatsapp(message)} variant="primary" className="action" icon={<MessageCircle size={18}/>}/>
      </div>
    </dialog>
  </>;
}

export function ValuationSection({item}) {
  if (item.status==='For Rent' || archivedListing(item)) return null;
  const {place,roomMatch,sample} = compareSet(item);
  const ordered = [...sample].sort((a,b)=>a.price-b.price);
  const enough = ordered.length>=3;
  const center = Math.floor(ordered.length/2);
  const median = enough ? (ordered[center].price + ordered[Math.floor((ordered.length-1)/2)].price)/2 : 0;
  const peers = enough ? [...sample].sort((a,b)=>Math.abs(a.price-item.price)-Math.abs(b.price-item.price)).slice(0,3) : [];
  return <section className="valuation-section detail-section" id="valuation">
    <div className="valuation-intro"><p className="kicker">PRICE CONTEXT</p><h2>What are similar homes asking?</h2>
      <p>{enough ? `${ordered.length} ${item.type.toLowerCase()} listings in ${place}${roomMatch ? ' with the same bedroom count' : ''} from the current catalogue.` :
        'There are too few matching listings in the current catalogue to show a useful price range.'}</p></div>
    <dl className="valuation-metrics">
      <div><dt>This listing</dt><dd>{priceLabel(item.price)}</dd></div>
      {enough && <>
        <div><dt>Median asking price</dt><dd>{currency(median)}</dd></div>
        <div><dt>Asking-price range</dt><dd>{currency(ordered[0].price)} – {currency(ordered.at(-1).price)}</dd></div>
      </>}
    </dl>
    {enough && <>
      <p className="valuation-note">Prices are from advertised listings. A valuation also considers sale evidence, condition and floor area.</p>
      <ul className="valuation-peers" aria-label="Example properties in this comparison">{peers.map(peer =>
        <li key={peer.id}><a href={peer.path}><span>{peer.name}</span><strong>{currency(peer.price)}</strong></a></li>
      )}</ul>
    </>}
    <ValuationRequest item={item}/>
  </section>;
}
