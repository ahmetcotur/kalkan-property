import React, {useEffect, useRef, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {ChevronDown, Heart, Menu, X} from 'lucide-react';
import liveMenu from './menu-data.json';

import {buyGuidePath} from './editorial.js';
const menu = {
  buy: {
    label:'Buy', navLabel:'Property for sale', title:'Find a home.',
    path:'/properties', action:'View all properties', image:'/media/guide.webp', groups:liveMenu.buy,
  },
  locations: {
    label:'Locations', navLabel:'Locations', title:'Explore the coast.',
    path:'/locations', action:'View all locations', image:'/media/da249.webp', groups:liveMenu.locations,
  },
  guides: {
    label:'Guides & services', navLabel:'Guides and services', title:'Local knowledge.',
    path:buyGuidePath, action:'Read the buying guide', image:'/media/da086.webp', groups:[
      {title:'Plan your purchase',links:[['Buying in Kalkan',buyGuidePath],['Legal matters','/legal-matters'],['FAQ','/faq'],['Blog','/blogs']]},
      {title:'Work with Mavi',links:[['Our services','/our-services'],['About Mavi','/about-us'],['Testimonials','/testimonials'],['Quick inquiry','/quick-inquiry'],['Contact us','/contact-us']]},
      {title:'Explore the market',links:[['Land','/land'],['Property for rent','/property-for-rent'],['Turkish citizenship','/turkish-citizenship']]},
    ],
  },
};

export function Brand() {
  return <a className="brand" href="/" aria-label="Mavi Real Estate home">
    <img className="legacy-logo" src="/media/mavi-logo.webp" width="105" height="56" alt="Mavi Real Estate"/>
  </a>;
}

function MegaPanel({id, isOpen}) {
  const item = menu[id];
  return <div className="mega-panel" id={'mega-' + id} hidden={!isOpen} aria-labelledby={'trigger-' + id}>
    <div className="mega-panel-frame">
      <a className="mega-feature" href={item.path}>
        {isOpen && <img src={item.image} alt="" width="420" height="470"/>}
        <div><span className="mega-feature-title">{item.title}</span><span className="mega-feature-link">{item.action}</span></div>
      </a>
      <div className="mega-columns">{item.groups.map(group => <div className="mega-group" key={group.title}>
        <h2>{group.title}</h2>
        <ul>{group.links.map(([label,path]) => <li key={path}><a href={path}>{label}</a></li>)}</ul>
      </div>)}</div>
    </div>
  </div>;
}

export default function Header({count, onSaved, path}) {
  const [expanded, setExpanded] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const header = useRef(null);
  const mobileTrigger = useRef(null);
  useEffect(() => {
    if (!expanded && !mobileOpen) return;
    function outside(event) {
      if (!header.current.contains(event.target)) {
        setExpanded('');
        setMobileOpen(false);
      }
    }
    function escape(event) {
      if (event.key !== 'Escape') return;
      if (expanded) {
        document.getElementById('trigger-' + expanded)?.focus();
        setExpanded('');
      } else {
        mobileTrigger.current?.focus();
        setMobileOpen(false);
      }
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [expanded, mobileOpen]);

  function navGroup(id) {
    const item = menu[id];
    const active = expanded === id;
    const current = id === 'buy' ? path.startsWith('/properties') : id === 'locations' && path.startsWith('/locations');
    return <div className="nav-group">
      <button className="mega-trigger" id={'trigger-' + id} type="button" aria-label={item.navLabel}
        aria-expanded={active} aria-controls={'mega-' + id} data-current={current || undefined}
        onClick={() => setExpanded(active ? '' : id)}>{item.label}<ChevronDown size={15} aria-hidden="true"/></button>
      <MegaPanel id={id} isOpen={active}/>
    </div>;
  }

  return <header className="header" ref={header} onBlur={event => {
    if (event.relatedTarget && !header.current.contains(event.relatedTarget)) {
      setExpanded('');
      setMobileOpen(false);
    }
  }}>
    <div className="container topbar">
      <Brand/>
      <button ref={mobileTrigger} className="mobile-toggle icon-button" onClick={() => {
        if (mobileOpen) setExpanded('');
        setMobileOpen(!mobileOpen);
      }} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} aria-controls="nav">{mobileOpen ? <X size={23}/> : <Menu size={23}/>}</button>
      <nav id="nav" className={mobileOpen ? 'nav open' : 'nav'} aria-label="Main navigation">
        {navGroup('buy')}
        {navGroup('locations')}
        <a href="/property-for-rent">Rent</a>
        {navGroup('guides')}
        <a className="mobile-contact" href="/contact-us">Contact us</a>
      </nav>
      <div className="top-actions">
        <button className="icon-button bookmark" type="button" aria-label={'Saved listings' + (count ? ' (' + count + ')' : '')} onClick={onSaved}><Heart size={20}/>{count > 0 && <span className="count">{count}</span>}</button>
        <Button variant="primary" className="action contact" label="Contact us" href="/contact-us"/>
      </div>
    </div>
  </header>;
}
