import original from './data.json';
import extra from './listings-extra.json';
import collections from './collection-data.json';
import media from './media-data.json';
import details from './listing-details.json';
import aliases from './legacy-aliases.json';
import {editorial} from './editorial.js';
import {areaGuides} from './area-guides.js';

export const origin = 'https://www.kalkanproperty.com';
export const phone = '+90 532 261 2296';
export const telephone = 'tel:+905322612296';
export const email = 'info@kalkanproperty.com';
export const socialProfiles = [
  {name:'YouTube',url:'https://www.youtube.com/@mavirealestate4909'},
  {name:'Google Business Profile',url:'https://www.google.com/maps?cid=4138131092427295550'},
];
export const archivedListing = item => ['Sold','Withdrawn'].includes(item.status);
export const whatsapp = (message = 'Hello Mavi Estate, I would like some information about buying a property in Kalkan.') =>
  'https://wa.me/905322612296?text=' + encodeURIComponent(message);

export const categories = [
  {name:'Villas',type:'Villa',path:'/properties/villas',image:'/media/dvl093.webp'},
  {name:'Apartments',type:'Apartment',path:'/properties/apartments',image:'/media/da249.webp'},
  {name:'Land',type:'Land',path:'/properties/land-for-sale',image:'/media/l903.webp'},
  {name:'Townhouses',type:'Townhouse',path:'/properties/town-houses-old-town',image:'/media/da086.webp'},
  {name:'Commercial',type:'Commercial',path:'/properties/commercial-property'},
  {name:'Hotels',type:'Hotel',path:'/properties/hotel-for-sale'},
];
export const locations = [
  {name:'Kalkan Town Centre',path:'/locations/kalkan-town-centre',image:'/media/da249.webp',description:'The harbour, old town streets and everyday amenities within reach.'},
  {name:'Kalamar',path:'/locations/kalamar',image:'/media/lv095.webp',description:'Homes on the slopes around Kalamar Bay, close to the waterfront.'},
  {name:'İslamlar Village',path:'/locations/islamlar-village',image:'/media/lv886.webp',description:'Hillside villas and land in the countryside above Kalkan.'},
];
const byArea = new Map(locations.map(item => [item.path,item]));
const byCategory = new Map(categories.map(item => [item.path,item]));
export const listings = [...original,...extra].map(item => ({features:[],categories:[],videos:[],...item,...details[item.id],...media[item.id]}));
const byId = new Map(listings.map(item => [item.id,item]));
const featuredIds = ['LV095','DA249','LV034'];
export const featured = featuredIds.map(id => byId.get(id));
export const getLocation = name => locations.find(item => item.name === name) ??
  Object.entries(collections).filter(([path]) => path.startsWith('/locations/')).map(([path,item]) => ({name:item.name,path})).find(item => item.name.toLocaleLowerCase('en') === name.toLocaleLowerCase('en'));
export const currency = val => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(val);
export const priceLabel = value => value > 0 ? currency(value) : 'Price on request';

const base = {description:'Explore villas, apartments and land for sale in Kalkan and surrounding areas with Mavi Real Estate.',image:'/media/og-home.jpg'};
const collectionRoutes = Object.fromEntries(Object.entries(collections).map(([path,entry]) => {
  const area = path.startsWith('/locations/');
  const areaInfo = byArea.get(path);
  const areaGuide = area ? areaGuides[path.slice('/locations/'.length)] : undefined;
  const category = byCategory.get(path);
  const name = areaInfo?.name || entry.name;
  const heading = area || path === '/kalkan' ? 'Property in ' + name : category ? category.name + ' for sale in Kalkan' : name;
  const description = areaInfo?.description ?? (area ? 'Browse the Mavi Real Estate portfolio for ' + name + '.' : 'Explore the ' + name.toLowerCase() + ' portfolio from Mavi Real Estate.');
  return [path,{kind:'collection',path,heading,title:heading + ' | Mavi Real Estate',description,area,areaName:name,areaGuide,category:path.startsWith('/properties/'),ids:entry.ids,
    image:path === '/turkish-citizenship' ? '/media/citizenship-source.webp' : areaInfo?.image || category?.image || byId.get(entry.ids[0])?.photos[0] || '/media/hero.webp'}];
}));

export const routes = {
  '/':{kind:'home',title:'Property for Sale in Kalkan | Mavi Real Estate',...base},
  '/locations':{kind:'locations',heading:'Find your part of Kalkan.',title:'Explore Locations in Kalkan | Mavi Real Estate',...base,image:'/media/da249.webp'},
  '/contact-us':{kind:'contact',heading:'Let’s talk property.',title:'Contact Mavi Real Estate in Kalkan',description:'Make an appointment with the Mavi Real Estate office to discuss buying, selling or viewing property in Kalkan.',image:'/media/contact-source.webp'},
  ...collectionRoutes,
  '/properties':{...collectionRoutes['/properties'],path:'/properties',heading:'Property for sale in Kalkan',title:'Browse Properties for Sale | Mavi Real Estate',...base,image:'/media/guide.webp'},
  ...Object.fromEntries(Object.entries(aliases).map(([path,target]) => [path,{...collectionRoutes[target],path,canonicalPath:target}])),
  ...Object.fromEntries(Object.entries(editorial).map(([path,page]) => [path,{...page,title:(page.kind === 'article' ? page.heading : page.kicker).replace(/\.$/,'') + ' | Mavi Real Estate'}])),
  ...Object.fromEntries(listings.map(item => [item.path,{
    kind:'detail',title:item.title + ' | Mavi Real Estate',
    description:item.description.trim().replace(/\s+/g,' ').slice(0,157) || 'Explore ' + item.name + ' with Mavi Real Estate.',
    image:item.photos[0],item,
  }])),
};
export const findRoute = path => routes[path.replace(/\/$/,'') || '/'] ?? {kind:'missing',title:'Page not found | Mavi Real Estate',...base};

export function collectionListings(route) {
  if (route.ids) return route.ids.map(id => byId.get(id)).filter(Boolean);
  return listings.filter(item => item.status !== 'For Rent');
}
