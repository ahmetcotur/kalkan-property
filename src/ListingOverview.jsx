import React from 'react';
import {Bath, BedDouble, Check, LayoutGrid, MapPin, Ruler} from 'lucide-react';
import {priceLabel} from './routes.js';
import {typeIcons} from './SearchUI.jsx';
import {listingSpecs} from './listing-specs.js';

export function formatArea(value, approximate = false) {
  return (approximate ? 'Approx. ' : '') + value.toLocaleString('en-GB') + ' m²';
}

const headings = /^(?:(?:lower |upper )?(?:ground|first|second|third|fourth|top|roof(?: top)?|basement) floor|(?:ground|first|second|third) floor\s*\/\s*roof terrace|basement|outside(?: the villa)?|interior|living space|bedrooms|key features|(?:property )?features|property details|swimming pool|room details):?$/i;

function descriptionSections(description) {
  const result = [{heading:null, paragraphs:[]}];
  for (const paragraph of description.split(/\n\n+/)) {
    const text = paragraph.replace(/\u200b/g,'').trim();
    if (!text || /^please inqu[iu]re for more details[.!]?$/i.test(text)) continue;
    if (headings.test(text)) {
      result.push({heading:text.replace(/:$/, ''), paragraphs:[]});
    } else {
      result.at(-1).paragraphs.push(text);
    }
  }
  return result.filter(section => section.paragraphs.length);
}

function Description({text}) {
  const sections = descriptionSections(text);
  return <div className="description-sections">
    {sections.map(({heading,paragraphs},index) => (
      <div className={heading ? 'description-chapter' : 'description-intro'} key={index}>
        {heading && <h3>{heading}</h3>}
        {paragraphs.map((paragraph,i) => {
          if (!/^[•*-]\s+/.test(paragraph)) return <p key={i}>{paragraph}</p>;
          return <ul key={i}>{paragraph.split(/\s+[•*-]\s+/).map((line,j) => <li key={j}>{line.replace(/^[•*-]\s+/,'')}</li>)}</ul>;
        })}
      </div>
    ))}
  </div>;
}

export function ListingOverview({item}) {
  const spec = listingSpecs[item.id] ?? {};
  const plot = spec.plot || item.plotArea;
  const TypeIcon = typeIcons[item.type] || LayoutGrid;
  const facts = [
    [TypeIcon,item.type,'Property type'],
    ...(item.beds>0 ? [[BedDouble,item.beds,'Bedrooms']] : []),
    ...(item.baths>0 && !spec.bathroomNote ? [[Bath,item.baths,'Bathrooms']] : []),
    ...(spec.interior ? [[Ruler,formatArea(spec.interior),spec.interiorLabel ?? 'Interior area']] : []),
    ...(plot ? [[Ruler,formatArea(plot,spec.plotApprox),'Plot area']] : []),
    ...(item.area ? [[MapPin,item.area,'Location']] : []),
  ];
  const pool = item.features.find(feature => /Infinity Pool/i.test(feature)) || item.features.find(feature => /Private (?:Swimming )?Pool|Shared Pool/i.test(feature));
  const furnished = item.features.find(feature => /furnished/i.test(feature));
  const parking = item.features.find(feature => /parking/i.test(feature));
  const rows = [
    ['Reference',item.id], ['Price',priceLabel(item.price)], ['Status',item.status], ['Layout',spec.layout], ['Pool',pool],
    ['Furnishing',furnished], ['Parking',parking], ['Bathroom count',spec.bathroomNote ? 'Confirm with the agent' : null],
  ].filter(([,value]) => value);
  return <section className="detail-section listing-overview" id="overview">
    <div className="listing-story">
      <p className="kicker">LISTING DETAILS</p><h2>Property details.</h2>
      <dl className="listing-facts">{facts.map(([Fact,value,label]) => <div key={label}><Fact size={20} aria-hidden="true"/><div><dt>{label}</dt><dd>{value}</dd></div></div>)}</dl>
      <dl className="listing-specifications">{rows.map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      {spec.bathroomNote && <p className="listing-field-note">{spec.bathroomNote} Ask Mavi to confirm.</p>}
      {item.categories.length>0 && <ul className="listing-categories" aria-label="Listing categories">{item.categories.map(category => <li key={category}>{category}</li>)}</ul>}
      {item.description && <Description text={item.description}/>}
    </div>
  </section>;
}

const featureGroups = [
  {title:'Outdoor space & outlook',matches:/pool|garden|terrace|sea view/i},
  {title:'Interior & layout',matches:/furnished|bedroom|apartment|storage|study/i},
  {title:'Access & setting',matches:/parking|seafront|centre|countryside|secluded/i},
];

export function ListingFeatures({item}) {
  if (!item.features.length) return null;
  const features = [...new Set(item.features.map(feature => {
    if (/^private swimming pool$/i.test(feature)) return 'Private Pool';
    if (/^gardens?$/i.test(feature)) return 'Garden';
    return feature;
  }))];
  const groups = featureGroups.map(({title,matches})=>({title,items:features.filter(feature=>matches.test(feature))}));
  const other = features.filter(feature=>!featureGroups.some(group=>group.matches.test(feature)));
  if (other.length) groups.push({title:'Other features',items:other});
  return <section className="listing-story detail-section" id="features">
    <p className="kicker">PROPERTY FEATURES</p><h2>What comes with it.</h2>
    <div className="listing-feature-groups">{groups.filter(group=>group.items.length).map(({title,items})=>
      <section key={title}><h3>{title}</h3><ul className="feature-list">{items.map(feature=><li key={feature}><Check size={16} aria-hidden="true"/>{feature}</li>)}</ul></section>
    )}</div>
  </section>;
}
