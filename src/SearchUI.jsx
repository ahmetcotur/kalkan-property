import React, {useEffect, useId, useRef, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Building2, BedDouble, Check, ChevronDown, House, MapPin, Minus, Mountain, Plus, Search, SlidersHorizontal, Wallet, X} from 'lucide-react';
import {categories, collectionListings, currency, findRoute, listings, locations} from './routes.js';

export const typeIcons = {Villa:House, Apartment:Building2, Land:Mountain, Townhouse:House, Commercial:Building2, Hotel:Building2};
export const emptyFilters = {type:'', area:'', min_price:'', budget:'', beds:'', baths:''};
const salesInventory = collectionListings(findRoute('/properties'));
export const roomOptions = ['', '1', '2', '3', '4', '5+'];
const normalize = value => value.toLocaleLowerCase('tr').normalize('NFD').replace(/\p{Diacritic}/gu,'').replaceAll('ı','i');
const areaLabels = new Map();
const names = [...locations.map(item => item.name), ...listings.map(item => item.area), ...listings.flatMap(item => item.locations)];
for (const label of names.filter(Boolean)) {
  if (!areaLabels.has(normalize(label))) areaLabels.set(normalize(label),label);
}
const areaOptions = [...areaLabels.values()];
export function matchesArea(item, area) {
  return !area || [item.area,...item.locations].filter(Boolean).some(name => normalize(name) === normalize(area));
}
const validPrice = value => /^\d{1,9}$/.test(value) && Number(value) > 0;
const readPrice = value => validPrice(value) ? String(Number(value)) : '';

export function readFilters(query, defaults) {
  const option = (name, allowed) => {
    const value = query.get(name);
    return value === null || !allowed.includes(value) ? defaults[name] : value;
  };
  let minimum = readPrice(query.get('min_price'));
  let maximum = readPrice(query.get('budget')) || readPrice(query.get('max_price'));
  if (minimum && maximum && Number(minimum) > Number(maximum)) {
    [minimum, maximum] = [maximum, minimum];
  }
  return {
    type:option('type', ['', ...categories.map(item => item.type)]),
    area:areaLabels.get(normalize(query.get('area') || '')) || '',
    min_price:minimum, budget:maximum,
    beds:option('beds', roomOptions), baths:option('baths', roomOptions),
  };
}

export function matchesRoom(count, value) {
  if (!value) return true;
  return value === '5+' ? count >= 5 : count === Number(value);
}

export function matchesPreferences(item, filters) {
  return (!filters.type || item.type === filters.type) && matchesArea(item, filters.area) &&
    matchesRoom(item.beds, filters.beds) && matchesRoom(item.baths, filters.baths);
}

export function matchesBudget(item, filters) {
  const {min_price:minimum, budget:maximum} = filters;
  if (!minimum && !maximum) return true;
  return item.price > 0 && (!minimum || item.price >= Number(minimum)) &&
    (!maximum || item.price <= Number(maximum));
}

function useDisclosure() {
  const [open, setOpen] = useState('');
  const [direction, setDirection] = useState({});
  const root = useRef(null);
  const trigger = useRef(null);
  function close(refocus = false) {
    if (refocus) trigger.current?.focus({preventScroll:true});
    setOpen('');
  }
  useEffect(() => {
    if (!open) return;
    function outside(event) {
      if (!root.current?.contains(event.target)) setOpen('');
    }
    document.addEventListener('pointerdown', outside);

    const frameId = window.requestAnimationFrame(() => {
      const panel = root.current?.querySelector('.selector-panel:not([hidden])');
      if (panel) {
        const panelRect = panel.getBoundingClientRect();
        if (panelRect.bottom > window.innerHeight - 20) {
          const overflow = panelRect.bottom - window.innerHeight + 24;
          window.scrollBy({ top: Math.ceil(overflow), behavior: 'smooth' });
        } else if (panelRect.top < 84) {
          const underflow = panelRect.top - 84 - 12;
          window.scrollBy({ top: Math.floor(underflow), behavior: 'smooth' });
        }
      }
    });

    return () => {
      document.removeEventListener('pointerdown', outside);
      window.cancelAnimationFrame(frameId);
    };
  }, [open]);
  return {
    open, root, close, direction,
    toggle(key, event) {
      trigger.current = event.currentTarget;
      if (open === key) {
        setOpen('');
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const prefersUp = spaceBelow < 330 && spaceAbove > 240;
      setDirection(curr => ({ ...curr, [key]: prefersUp ? 'up' : 'down' }));
      setOpen(key);
    },
    onBlur(event) {
      if (open && event.relatedTarget && !root.current?.contains(event.relatedTarget)) close();
    },
    onKeyDown(event) {
      if (open && event.key === 'Escape') {
        event.stopPropagation();
        close(true);
      }
    },
  };
}

function Selector({name, label, value, icon:Icon, control, children}) {
  const id = useId();
  const active = control.open === name;
  const isUp = control.direction[name] === 'up';
  return <div className={'select-cell select-' + name + (isUp ? ' dropup' : '')}>
    <button type="button" className="select-trigger" aria-label={label + ': ' + value} aria-expanded={active} aria-controls={id}
      onClick={event => control.toggle(name,event)}>
      <Icon size={21} aria-hidden="true"/>
      <span className="select-summary"><strong>{label}</strong><span>{value}</span></span>
      <ChevronDown className="select-chevron" size={15} aria-hidden="true"/>
    </button>
    <div className="selector-panel" id={id} hidden={!active}>{active && children}</div>
  </div>;
}

function Choice({selected, onClick, icon:Icon, children}) {
  return <button type="button" className="selector-choice" aria-pressed={selected} onClick={onClick}>
    {Icon && <Icon size={17} aria-hidden="true"/>}<span>{children}</span>
    {selected && <Check size={16} className="selector-check" aria-hidden="true"/>}
  </button>;
}

function LocationOptions({selected, choose}) {
  const [term,setTerm] = useState('');
  const options = areaOptions.filter(name => normalize(name).includes(normalize(term.trim())));
  return <>
    <label className="selector-query"><Search size={17}/><input type="search" value={term} onChange={event => setTerm(event.target.value)} placeholder="Find an area" aria-label="Find an area"/></label>
    <div className="location-options">
      {!term.trim() && <Choice selected={!selected} onClick={() => choose('area','')} icon={MapPin}>Any location</Choice>}
      {options.map(name => <Choice key={name} selected={selected === name} onClick={() => choose('area',name)} icon={MapPin}>{name}</Choice>)}
      {!options.length && <p className="selector-empty">No areas found.</p>}
    </div>
  </>;
}

function priceSummary(minimum, maximum) {
  if (minimum && maximum) return currency(Number(minimum)) + ' – ' + currency(Number(maximum));
  if (minimum) return 'From ' + currency(Number(minimum));
  if (maximum) return 'Up to ' + currency(Number(maximum));
  return 'Any price';
}

function PriceSlider({prices, minimum, maximum, setMinimum, setMaximum}) {
  const end = prices.length - 1;
  const lower = minimum ? prices.findLastIndex(price => price <= Number(minimum)) : 0;
  const upper = maximum ? prices.findIndex(price => price >= Number(maximum)) : end;
  const high = upper === -1 ? end : upper;
  const low = Math.min(Math.max(0, lower), high);
  const style = {'--range-start': (low / end * 100) + '%', '--range-end': (high / end * 100) + '%'};
  return <>
    <div className="budget-slider" style={style}>
      <span className="budget-track" aria-hidden="true"/>
      <input type="range" aria-label="Minimum price slider" aria-valuetext={currency(prices[low])}
        className={high === end ? 'budget-thumb-front' : undefined} min={0} max={end} value={low}
        onChange={event => {
          const index = Math.min(Number(event.target.value), high);
          setMinimum(index === 0 ? '' : String(prices[index]));
        }}/>
      <input type="range" aria-label="Maximum price slider" aria-valuetext={currency(prices[high])}
        min={0} max={end} value={high} onChange={event => {
          const index = Math.max(Number(event.target.value), low);
          setMaximum(index === end ? '' : String(prices[index]));
        }}/>
    </div>
    <div className="budget-limits"><span>{currency(prices[0])}</span><span>{currency(prices.at(-1))}</span></div>
  </>;
}

function BudgetOptions({filters, inventory, apply}) {
  const [minimum,setMinimum] = useState(filters.min_price);
  const [maximum,setMaximum] = useState(filters.budget);
  const prices = [...new Set(inventory.filter(item => item.price > 0 && matchesPreferences(item, filters))
    .map(item => item.price))].sort((a,b) => a - b);
  const invalid = (minimum && !validPrice(minimum)) || (maximum && !validPrice(maximum));
  const reversed = minimum && maximum && Number(minimum) > Number(maximum);
  const issue = invalid ? 'Enter a price above £0.' : reversed ? 'Maximum must be at least the minimum.' : '';
  const issueId = useId();
  function setRange() {
    if (!issue) apply(readPrice(minimum), readPrice(maximum));
  }
  function handleEnter(event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    setRange();
  }
  return <>
    <p className="selector-heading">Price range <span>GBP</span></p>
    {prices.length > 1 ? <PriceSlider prices={prices} minimum={minimum} maximum={maximum}
      setMinimum={setMinimum} setMaximum={setMaximum}/> :
      <p className="budget-limits">{prices.length ? 'Listed price ' + currency(prices[0]) : 'No listed prices for these selections.'}</p>}
    <div className="budget-fields" onKeyDown={handleEnter}>
      {[['Minimum',minimum,setMinimum,prices[0]],['Maximum',maximum,setMaximum,prices.at(-1)]].map(([label,value,setValue,placeholder]) =>
        <label key={label}>{label}
          <span><b aria-hidden="true">£</b><input type="text" inputMode="numeric" maxLength={9} value={value}
            aria-label={label + ' price'} aria-describedby={issue ? issueId : undefined} aria-invalid={issue ? true : undefined}
            placeholder={placeholder ? String(placeholder) : 'Any'}
            onChange={event => setValue(event.target.value.replace(/\D/g,''))}/></span>
        </label>)}
    </div>
    {issue && <p className="budget-error" id={issueId} role="status">{issue}</p>}
    <div className="selector-actions">
      <button type="button" className="room-clear" onClick={() => apply('','')}>Clear price</button>
      <Button type="button" label="Set range" className="action room-done" variant="primary" onClick={setRange} disabled={Boolean(issue)}/>
    </div>
  </>;
}

function Rooms({filters, setFilters, close}) {
  const finalStep = roomOptions.length - 1;
  function step(key, delta) {
    setFilters(current => {
      const index = roomOptions.indexOf(current[key]);
      const next = Math.min(finalStep, Math.max(0, index + delta));
      return {...current,[key]:roomOptions[next]};
    });
  }

  return <>
    {[['beds','Bedrooms'],['baths','Bathrooms']].map(([key,label]) => <div className="room-row" key={key}>
      <strong>{label}</strong>
      <div className="room-stepper" role="group" aria-label={label}>
        <button type="button" aria-label={'Decrease ' + label.toLowerCase()} onClick={() => step(key,-1)} disabled={!filters[key]}>
          <Minus size={18} aria-hidden="true"/>
        </button>
        <output aria-label={label + ' selected'}>{filters[key] || 'Any'}</output>
        <button type="button" aria-label={'Increase ' + label.toLowerCase()} onClick={() => step(key,1)} disabled={filters[key] === roomOptions[finalStep]}>
          <Plus size={18} aria-hidden="true"/>
        </button>
      </div>
    </div>)}
    <div className="selector-actions">
      <button type="button" className="room-clear" onClick={() => setFilters(current => ({...current,beds:'',baths:''}))} disabled={!filters.beds && !filters.baths}>Clear rooms</button>
      <Button type="button" label="Done" variant="primary" className="action room-done" onClick={() => close(true)}/>
    </div>
  </>;
}

export function SearchForm({initial=emptyFilters, onApply, hero, action='/properties', inventory=salesInventory}) {
  const [filters,setFilters] = useState(initial);
  const control = useDisclosure();
  useEffect(() => setFilters(initial), [initial]);
  function choose(name,value) {
    setFilters(current => ({...current,[name]:value}));
    control.close(true);
  }
  function applyBudget(minimum, maximum) {
    setFilters(current => ({...current,min_price:minimum,budget:maximum}));
    control.close(true);
  }
  const rooms = [filters.beds && filters.beds + (filters.beds === '1' ? ' bed' : ' beds'), filters.baths && filters.baths + (filters.baths === '1' ? ' bath' : ' baths')].filter(Boolean).join(' · ');
  return <form ref={control.root} className={'search-form' + (hero ? ' hero-search' : '')} action={action} method="get"
    onBlur={control.onBlur} onKeyDown={control.onKeyDown} onSubmit={onApply ? event => {event.preventDefault();onApply(filters);} : undefined}>
    {Object.entries(filters).map(([key,value]) => <input key={key} type="hidden" name={key} value={value}/>)}
    <Selector name="type" label="Property type" icon={House} value={categories.find(item => item.type === filters.type)?.name || 'All types'} control={control}>
      <div className="selector-heading">Choose a property type</div>
      <div className="type-options">
        <Choice icon={SlidersHorizontal} selected={!filters.type} onClick={() => choose('type','')}>All property types</Choice>
        {categories.map(item => <Choice key={item.type} icon={typeIcons[item.type]} selected={filters.type === item.type} onClick={() => choose('type',item.type)}>{item.name}</Choice>)}
      </div>
    </Selector>
    <Selector name="area" label="Location" icon={MapPin} value={filters.area || 'Any location'} control={control}>
      <LocationOptions selected={filters.area} choose={choose}/>
    </Selector>
    <Selector name="budget" label="Price range" icon={Wallet} value={priceSummary(filters.min_price, filters.budget)} control={control}>
      <BudgetOptions filters={filters} inventory={inventory} apply={applyBudget}/>
    </Selector>
    <Selector name="rooms" label="Rooms" icon={BedDouble} value={rooms || 'Any'} control={control}>
      <Rooms filters={filters} setFilters={setFilters} close={control.close}/>
    </Selector>
    <Button type="submit" variant="primary" className="action search-button" label="Search properties" icon={<Search size={19}/>}/>
  </form>;
}

const sorting = [['','Featured'],['asc','Price, low to high'],['desc','Price, high to low']];
export function SortPicker({value, onChange}) {
  const control = useDisclosure();
  return <div className="sort-picker" ref={control.root} onBlur={control.onBlur} onKeyDown={control.onKeyDown}>
    <Selector name="sort" label="Sort by" icon={SlidersHorizontal} value={sorting.find(([key]) => key === value)[1]} control={control}>
      {sorting.map(([key,label]) => <Choice key={key} selected={key===value} onClick={() => {onChange(key);control.close(true);}}>{label}</Choice>)}
    </Selector>
  </div>;
}
