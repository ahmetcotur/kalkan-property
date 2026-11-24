import React, {useEffect, useRef, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Badge} from '@astryxdesign/core/Badge';
import {Theme, defineTheme} from '@astryxdesign/core/theme';
import {ChevronDown, ChevronLeft, ChevronRight, Heart, Mail, MapPin, MessageCircle, Phone, Play} from 'lucide-react';
import {archivedListing, categories, collectionListings, email, featured, findRoute, listings, locations, phone, priceLabel, socialProfiles, telephone, whatsapp, withBase} from './routes.js';
import Header, {Brand} from './MegaNav.jsx';
import {Gallery} from './ListingMedia.jsx';
import {PropertyGrid, PropertyViewPicker} from './PropertyGrid.jsx';
import {ListingLocation, ListingNavigation, ValuationSection} from './ListingContext.jsx';
import {ListingFeatures, ListingOverview} from './ListingOverview.jsx';
import SavedDialog from './SavedDialog.jsx';
import InquiryForm from './InquiryForm.jsx';
import testimonials from './testimonials.json';
import {buyGuidePath} from './editorial.js';
import liveMenu from './menu-data.json';
import {useImageMotion, usePageMotion} from './motion.js';
import {emptyFilters, matchesBudget, matchesPreferences, readFilters, SearchForm, SortPicker} from './SearchUI.jsx';

const mavi = defineTheme({name: 'mavi', tokens: {'--color-accent': ['#2245e0', '#9cb2ff']}});
const buyGuide = buyGuidePath;

const heroViews = [
  {photo:withBase('/media/da249.webp'), caption:'Kalkan Bay', alt:'Hillside homes above Kalkan Bay and the Mediterranean'},
  {photo:withBase('/media/lv095.webp'), caption:'Kalamar at dusk', alt:'Terrace in Kalamar looking out to sea at sunset'},
  {photo:withBase('/media/hero.webp'), caption:'The Kalkan coastline', alt:'Kalkan’s coastline and hillside neighbourhoods from above'},
];

function Hero() {
  const [current, setCurrent] = useState(0);
  function step(delta) {
    setCurrent(index => (index + delta + heroViews.length) % heroViews.length);
  }
  return <>
    <section className="hero" aria-labelledby="home-hero-title">
      <div className="hero-images">
        {heroViews.map((view,index) => <img key={view.photo} className={'hero-photo' + (index === current ? ' current' : '')}
          src={view.photo} alt={view.alt} aria-hidden={index !== current}
          loading={index ? 'lazy' : 'eager'} fetchPriority={index ? 'low' : 'high'}/>)}
      </div>
      <div className="container hero-content">
        <div className="hero-panel">
          <p className="hero-eyebrow" data-intro>Kalkan, Türkiye</p>
          <h1 id="home-hero-title" data-intro>Find your place <em>in Kalkan.</em></h1>
          <p className="hero-description" data-intro>Explore villas, apartments and land for sale on Türkiye’s Mediterranean coast.</p>
          <a className="hero-link" href="#featured-title" data-intro>Discover the collection <ChevronDown size={15} className="hero-link-arrow" aria-hidden="true"/></a>
        </div>
        <div className="hero-caption" aria-label="Coastline photographs">
          <span className="frame-caption" aria-live="polite"><MapPin size={16} aria-hidden="true"/>{heroViews[current].caption}</span>
          <div className="frame-controls">
            <button type="button" aria-label="Previous view" onClick={() => step(-1)}><ChevronLeft size={20} aria-hidden="true"/></button>
            <button type="button" aria-label="Next view" onClick={() => step(1)}><ChevronRight size={20} aria-hidden="true"/></button>
          </div>
        </div>
      </div>
    </section>
    <div className="container search-holder"><SearchForm hero/></div>
  </>;
}

function Places() {
  const [active, setActive] = useState(0);
  const imageRef = useRef(null);
  const direction = useRef(1);
  const place = locations[active];
  useImageMotion(imageRef, active, direction);

  function choose(index) {
    direction.current = index >= active ? 1 : -1;
    setActive(index);
  }
  return <div className="places-editorial">
    <a className="place-preview" href={place.path} aria-label={'Explore ' + place.name}>
      <img ref={imageRef} key={place.image} src={place.image} width="960" height="640" alt="" loading="lazy"/>
      <span><MapPin size={15}/> {place.name}</span>
    </a>
    <div className="place-list">{locations.map((entry,index) => <article className={'place-item' + (index === active ? ' active' : '')} key={entry.path}>
      <button type="button" className="place-select" aria-expanded={index === active} aria-controls={'place-' + index} onClick={() => choose(index)}>
        <span>{entry.name}</span><span className="place-indicator" aria-hidden="true"></span>
      </button>
      <div hidden={index !== active} id={'place-' + index}><p>{entry.description}</p></div>
      <a className="place-link" href={entry.path} aria-label={'View properties in ' + entry.name}>View properties</a>
    </article>)}</div>
  </div>;
}

function Home({saved, toggle}) {
  const [type, setType] = useState('');
  const home = useRef(null);
  usePageMotion(home, [type]);
  const items = type ? listings.filter(item => item.type === type).slice(0, 3) : featured;
  const viewAll = categories.find(item => item.type === type)?.path ?? withBase('/properties');
  return <div className="home" ref={home}>
    <Hero/>
    <section className="container featured" aria-labelledby="featured-title">
      <div className="section-heading" data-reveal><div><p className="kicker">THE PORTFOLIO</p><h2 id="featured-title">Selected <em>properties.</em></h2></div>
        <Button label="View all properties" className="quiet-action" href={viewAll}/></div>
      <div className="chips" aria-label="Featured property types">
        <Button label="All properties" className={'chip' + (!type ? ' active' : '')} aria-pressed={!type} onClick={() => setType('')}/>
        {categories.slice(0, 3).map(category => (
          <Button key={category.type} label={category.name} className={'chip' + (type === category.type ? ' active' : '')} aria-pressed={type === category.type} onClick={() => setType(category.type)}/>
        ))}
      </div>
      <PropertyGrid items={items} saved={saved} toggle={toggle}/>
    </section>
    <section className="area-section" data-reveal>
      <div className="container">
        <div className="section-heading" data-reveal><div><p className="kicker">THE NEIGHBOURHOODS</p><h2>A place in <em>Kalkan.</em></h2></div><Button label="Explore all locations" className="quiet-action" href={withBase('/locations')}/></div>
        <Places/>
      </div>
    </section>
    <section className="container local-section" data-reveal>
      <div className="local-photo"><img src={withBase('/media/kemal.webp')} alt="Kemal at Mavi Real Estate" loading="lazy"/></div>
      <div data-reveal><p className="kicker">YOUR LOCAL TEAM</p><h2>Talk to someone who <em>knows Kalkan.</em></h2><p>Ask Kemal about a property, arrange a viewing, or discuss which part of Kalkan is right for you.</p>
      <Button label="Contact Mavi Real Estate" variant="primary" className="action" href={withBase('/contact-us')} icon={<MessageCircle size={18}/>}/></div>
    </section>
  </div>;
}

function Breadcrumb({label, parent}) {
  return <nav className="breadcrumb" aria-label="Breadcrumb"><a href={withBase('/')}>Home</a><ChevronRight size={14}/>
    {parent && <><a href={parent.path}>{parent.name}</a><ChevronRight size={14}/></>}
    <span aria-current="page">{label}</span>
  </nav>;
}

const guideHeadings = {
  '/locations/near-seafront':'Buying near the seafront',
  '/locations/near-town-centre':'Buying near the town centre',
  '/locations/rural':'Buying in the countryside',
  '/locations/secluded':'Finding a more private property',
};

function AreaGuide({route}) {
  const [intro, more] = route.areaGuide;
  const heading = guideHeadings[route.rawPath || route.path] ?? 'Buying property in ' + route.areaName;
  return <section className="area-guide" aria-labelledby="area-guide-heading">
    <h2 id="area-guide-heading">{heading}</h2>
    <p>{intro}</p>
    <details>
      <summary><span className="area-read-more">Read more</span><span className="area-read-less">Read less</span><ChevronDown size={16} aria-hidden="true"/></summary>
      <p>{more}</p>
      <a href={withBase('/locations')} className="text-link">Explore more locations</a>
    </details>
  </section>;
}

function Collection({route, saved, toggle}) {
  const pageRef = useRef(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [sort, setSort] = useState('');
  const [view, setView] = useState('grid');
  useEffect(() => {
    try {
      if (localStorage.getItem('mavi-property-view') === 'list') setView('list');
    } catch {}
  }, []);
  function changeView(value) {
    setView(value);
    try { localStorage.setItem('mavi-property-view', value); } catch {}
  }
  useEffect(() => {
    const sync = () => setFilters(readFilters(new URLSearchParams(window.location.search), emptyFilters));
    sync();
    window.addEventListener('popstate',sync);
    return () => window.removeEventListener('popstate',sync);
  }, []);
  const pool = collectionListings(route);
  const items = pool.filter(item => matchesPreferences(item, filters) && matchesBudget(item, filters));
  if (sort) items.sort((a,b) => {
    if (!a.price || !b.price) return Number(!a.price) - Number(!b.price);
    return sort === 'asc' ? a.price - b.price : b.price - a.price;
  });
  usePageMotion(pageRef, [route.rawPath || route.path, items.length, view, sort]);
  function apply(values) {
    const params = new URLSearchParams(Object.entries(values).filter(([,value]) => value));
    const next = withBase(route.rawPath || route.path) + (params.size ? '?' + params : '');
    if (window.location.pathname + window.location.search !== next) window.history.pushState(null,'',next);
    setFilters(values);
  }
  const parent = route.area ? {name:'Locations',path:withBase('/locations')} : route.category ? {name:'Properties',path:withBase('/properties')} : null;
  const categoryLabel = route.area ? 'EXPLORE THE AREA' : route.path === '/property-for-rent' ? 'THE RENTAL PORTFOLIO' : 'THE SALES PORTFOLIO';
  return <main id="main" className="collection-page" ref={pageRef}>
    <section className="collection-banner">
      <div className="collection-cover"><img src={route.image} alt="" fetchPriority="high"/></div>
      <div className="container collection-intro" data-intro>
        <Breadcrumb label={route.heading} parent={parent}/>
        <p className="kicker">{categoryLabel}</p><h1>{route.heading}</h1><p className="lede">{route.description}</p>
      </div>
    </section>
    <div className="container collection-body">
      <SearchForm initial={filters} onApply={apply} action={route.path} inventory={pool}/>
      {route.areaGuide && <div data-reveal><AreaGuide route={route}/></div>}
      {route.path === '/turkish-citizenship' && <section className="citizenship-note" data-reveal>
        <h2>Considering property as part of a citizenship application?</h2>
        <p>An independent adviser can check whether your circumstances and the individual property meet current requirements. Share the property reference with Mavi and review the official documentation before committing.</p>
        <a className="text-link" href={withBase('/legal-matters')}>Review the legal checklist</a>
      </section>}
      <div className="result-bar" data-intro>
        <div><span aria-live="polite">{items.length} {items.length === 1 ? 'property' : 'properties'}</span>
          {Object.values(filters).some(Boolean) && <button type="button" className="results-clear" onClick={() => apply({...emptyFilters})}>Clear filters</button>}</div>
        <div className="result-controls">
          <SortPicker value={sort} onChange={setSort}/>
          <PropertyViewPicker value={view} onChange={changeView}/>
        </div>
      </div>
      {items.length ? <PropertyGrid items={items} saved={saved} toggle={toggle} view={view}/> : <div className="empty">
        <h2>{pool.length ? 'No matching properties' : 'Ask us what’s available.'}</h2>
        <p>{pool.length ? 'Try broadening your area, budget or room preferences.' : 'The team can help you explore this part of the portfolio.'}</p>
        {pool.length ? <Button label="Clear filters" onClick={() => apply({...emptyFilters})} className="quiet-action"/> :
          <Button label="Contact Mavi" href={withBase('/contact-us')} className="quiet-action"/>}
      </div>}
    </div>
  </main>;
}

function Detail({item,saved,toggle}) {
  const pageRef = useRef(null);
  usePageMotion(pageRef, [item.id]);
  const savedItem = saved.includes(item.id);
  const archived = archivedListing(item);
  const comparable = listings.filter(other => other.id!==item.id && !archivedListing(other) && (other.status==='For Rent')===(item.status==='For Rent'))
    .sort((a,b) => Number(b.area===item.area)*2+Number(b.type===item.type) - Number(a.area===item.area)*2-Number(a.type===item.type)).slice(0,3);
  const message = 'Hello Mavi Estate, I would like to arrange a viewing for property ' + item.id + '.';
  return <main id="main" className="container interior listing-page" ref={pageRef}>
    <div data-intro><Breadcrumb label={item.id} parent={item.status==='For Rent' ? {name:'Rent',path:withBase('/property-for-rent')} : {name:'Properties',path:withBase('/properties')}}/></div>
    <header className="listing-heading" data-intro>
      <div><p className="kicker">{item.area ? item.area + ' · ' : ''}REF {item.id}</p><h1>{item.name}</h1></div>
      <div className="listing-price"><strong>{priceLabel(item.price)}</strong>{item.status && <Badge label={item.status}/>}</div>
    </header>
    <div data-intro><Gallery item={item}/></div>
    <ListingNavigation item={item}/>
    <div className="listing-body" data-reveal>
      <div>
        <ListingOverview item={item}/>
        <ListingFeatures item={item}/>
      </div>
      <aside className="listing-inquiry">
        <div className="listing-agent"><img src={withBase('/media/kemal.webp')} alt="" width="54" height="54" loading="lazy"/><div><strong>Kemal Safyurek</strong><span>Mavi Real Estate</span></div></div>
        <h2>{archived ? 'Find a similar property.' : 'See it in person.'}</h2><p>{archived ? 'Ask Kemal about comparable listings in the area.' : 'Ask Kemal about this property or arrange a viewing.'}</p>
        {archived ? <Button label="Ask about alternatives" className="action" variant="primary" href={withBase('/quick-inquiry') + '?property=' + encodeURIComponent(item.id)}/> :
          <Button label="Arrange a viewing" className="action" variant="primary" icon={<MessageCircle size={18}/>} href={whatsapp(message)}/>}
        <Button label={savedItem ? 'Remove from shortlist' : 'Save to shortlist'} className="quiet-action" icon={<Heart size={17} fill={savedItem ? 'currentColor' : 'none'}/>} onClick={() => toggle(item.id)} aria-pressed={savedItem}/>

      </aside>
    </div>
    <div data-reveal><ListingLocation item={item}/></div>
    <div data-reveal><ValuationSection item={item}/></div>
    {comparable.length>0 && <section className="similar-listings" data-reveal><div className="section-heading"><h2>You might also like.</h2><Button label="Back to properties" className="quiet-action" href={withBase(item.status==='For Rent' ? '/property-for-rent' : '/properties')}/></div>
      <PropertyGrid items={comparable} saved={saved} toggle={toggle}/></section>}
  </main>;
}

function Contact() {
  const pageRef = useRef(null);
  usePageMotion(pageRef);
  return <main id="main" className="contact-page" ref={pageRef}>
    <section className="contact-cover">
      <div className="container contact-layout">
        <div className="contact-copy" data-intro><Breadcrumb label="Contact"/><p className="kicker">MAVI REAL ESTATE</p><h1>Let’s talk <em>property.</em></h1>
          <p className="lede">The Kalkan office meets clients by appointment. Get in touch to discuss buying, selling or arrange viewings around your trip.</p>
          <div className="contact-list">
            <a href={telephone}><Phone size={19}/><span><small>Call our team</small>{phone}</span></a>
            <a href={'mailto:' + email}><Mail size={19}/><span><small>Email us</small>{email}</span></a>
            <a href="https://maps.app.goo.gl/gvAR34F8Ug3EJn317"><MapPin size={19}/><span><small>Get directions</small>Kalkan Mah. Nilüfer Sok. No 2, Kaş, Antalya</span></a>
          </div>
          <div className="inquiry-actions"><Button label="Chat on WhatsApp" variant="primary" className="action" icon={<MessageCircle size={18}/>} href={whatsapp()}/>
            <a className="contact-inquiry-link" href={withBase('/quick-inquiry')}>Write an inquiry</a></div>
          <SocialLinks/>
        </div>
        <figure className="contact-image" data-reveal><img src={withBase('/media/contact-source.webp')} alt=""/><figcaption>Kalkan, Antalya</figcaption></figure>
      </div>
    </section>
  </main>;
}

function LocationPage({route}) {
  const pageRef = useRef(null);
  usePageMotion(pageRef, [route.heading]);
  return <main id="main" className="location-page" ref={pageRef}>
    <section className="location-cover">
      <div className="container" data-intro>
        <Breadcrumb label="Locations"/><p className="kicker">THE NEIGHBOURHOODS</p>
        <h1>{route.heading}</h1><p className="lede">Explore homes around Kalkan’s harbour, across Kalamar Bay and in the hill villages above town.</p><Places/>
      </div>
    </section>
    <section className="container region-directory" data-reveal><h2>Browse all areas.</h2><div className="directory-grid">
      {liveMenu.locations.map(group => <div key={group.title}><h3>{group.title}</h3><ul>{group.links.map(([label,path]) => <li key={path}><a href={withBase(path)}>{label}</a></li>)}</ul></div>)}
    </div></section>
  </main>;
}

function SocialLinks() {
  const icons = {YouTube:Play, 'Google Business Profile':MapPin};
  return <ul className="social-links" aria-label="Mavi Real Estate on social media">{socialProfiles.map(({name,url}) => {
    const Icon = icons[name];
    return <li key={name}><a href={url}>{Icon && <Icon size={17} aria-hidden="true"/>}{name}</a></li>;
  })}</ul>;
}

function EditorialPage({route}) {
  const pageRef = useRef(null);
  usePageMotion(pageRef, [route.rawPath || route.path, route.heading]);
  const journal = route.kind === 'journal';
  return <main id="main" className="editorial-page" ref={pageRef}>
    <section className={'editorial-top' + (route.image.endsWith('kemal.webp') ? ' portrait-top' : '')} data-intro>
      <div className="container editorial-layout">
        <div><Breadcrumb label={route.kicker} parent={route.kind==='article' ? {name:'Journal',path:withBase('/blogs')} : null}/>
          <p className="kicker">{route.kicker}</p><h1>{route.heading}</h1><p className="lede">{route.description}</p>
        </div>
        <img src={withBase(route.image)} alt={route.image.endsWith('kemal.webp') ? 'Kemal Safyurek, Mavi Real Estate' : ''}/>
      </div>
    </section>
    {journal ? <section className="container journal-entry" data-reveal>
      <a href={withBase(buyGuide)}><img src={withBase('/media/buying-source.webp')} alt="" loading="lazy"/><div><p className="kicker">BUYING IN KALKAN</p><h2>Property for sale in Kalkan, Türkiye.</h2><span className="text-link">Read the guide</span></div></a>
    </section> : <div className="container editorial-article" data-reveal>
      {route.kind === 'inquiry' ? <InquiryForm/> :
        route.kind === 'testimonials' ? <article className="testimonial-list">{testimonials.map(({name,text}) =>
          <figure key={name}><blockquote>{text.split(/\n+/).filter(Boolean).map((paragraph,index) => <p key={index}>{paragraph}</p>)}</blockquote><figcaption>{name}</figcaption></figure>)}</article> :
        <article>{route.sections.map(([title,text]) => route.kind === 'faq'
          ? <details className="editorial-faq" key={title}><summary>{title}</summary><p>{text}</p></details>
          : <section key={title}><h2>{title}</h2><p>{text}</p></section>)}</article>}
      <aside>{(route.links ?? [['Contact the Kalkan office','/contact-us'],['Browse properties','/properties']]).map(([label,path]) =>
        <Button key={path} label={label} href={withBase(path)} className="quiet-action"/>)}</aside>
    </div>}
  </main>;
}

function Footer() {
  return <footer className="footer"><div className="container">
    <div className="footer-main">
      <div><Brand/><p>Real estate in Kalkan, Kaş and the surrounding area.</p></div>
      <div><h2>Properties</h2>{categories.map(item => <a href={item.path} key={item.path}>{item.name}</a>)}</div>
      <div><h2>Kalkan</h2><a href={withBase('/locations')}>Explore areas</a><a href={withBase(buyGuide)}>Buying in Kalkan</a><a href={withBase('/our-services')}>Our services</a><a href={withBase('/about-us')}>About Mavi</a><a href={withBase('/faq')}>FAQ</a><a href={withBase('/testimonials')}>Testimonials</a></div>
      <div><h2>Get in touch</h2><a href={telephone}>{phone}</a><a href={'mailto:' + email}>{email}</a><a href={withBase('/contact-us')}>Office details</a><a href={withBase('/quick-inquiry')}>Quick inquiry</a></div>
    </div><div className="footer-bottom"><span>© Mavi Real Estate</span><SocialLinks/></div>
  </div></footer>;
}

export default function App({path}) {
  const route = findRoute(path);
  const [saved, setSaved] = useState([]);
  const savedDialog = useRef(null);
  useEffect(() => {
    try {
      const values = JSON.parse(localStorage.getItem('mavi-saved') || '[]');
      if (Array.isArray(values)) setSaved(values.filter(id => listings.some(item => item.id === id)));
    } catch {}
  }, []);
  function toggle(id) {
    const values = saved.includes(id) ? saved.filter(value => value !== id) : [...saved, id];
    setSaved(values);
    try { localStorage.setItem('mavi-saved', JSON.stringify(values)); } catch {}
  }
  return <Theme theme={mavi} mode="light">
    <a className="skip" href="#main">Skip to content</a>
    <Header count={saved.length} onSaved={() => savedDialog.current?.showModal()} path={path}/>
    {route.kind === 'home' && <main id="main"><Home saved={saved} toggle={toggle}/></main>}
    {route.kind === 'collection' && <Collection route={route} saved={saved} toggle={toggle}/>}
    {route.kind === 'detail' && <Detail item={route.item} saved={saved} toggle={toggle}/>}
    {route.kind === 'locations' && <LocationPage route={route}/>}
    {['editorial','article','journal','faq','testimonials','inquiry'].includes(route.kind) && <EditorialPage route={route}/>}
    {route.kind === 'contact' && <Contact/>}
    {route.kind === 'missing' && <main id="main" className="container interior"><h1>Page not found</h1><p className="lede">You can still browse the Kalkan property portfolio.</p><Button label="Browse properties" href={withBase('/properties')} variant="primary" className="action"/></main>}
    <Footer/>
    <SavedDialog dialogRef={savedDialog} saved={saved} toggle={toggle}/>
  </Theme>;
}
