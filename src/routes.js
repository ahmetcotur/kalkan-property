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

export const basePath = (typeof process !== 'undefined' && process.env?.BASE_PATH
  ? process.env.BASE_PATH
  : (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/')).replace(/\/$/, '');

export const withBase = path => {
  if (!basePath) return path;
  if (!path || typeof path !== 'string') return path;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('mailto:') || path.startsWith('tel:') || path.startsWith('#') || path.startsWith('//')) return path;
  if (path === basePath || path === basePath + '/') return path;
  if (path === '/') return basePath + '/';
  if (path.startsWith(basePath + '/')) return path;
  if (path.startsWith('/')) return basePath + path;
  return path;
};

export const categories = [
  {name:'Villas',type:'Villa',path:withBase('/properties/villas'),rawPath:'/properties/villas',image:withBase('/media/dvl093.webp')},
  {name:'Apartments',type:'Apartment',path:withBase('/properties/apartments'),rawPath:'/properties/apartments',image:withBase('/media/da249.webp')},
  {name:'Land',type:'Land',path:withBase('/properties/land-for-sale'),rawPath:'/properties/land-for-sale',image:withBase('/media/l903.webp')},
  {name:'Townhouses',type:'Townhouse',path:withBase('/properties/town-houses-old-town'),rawPath:'/properties/town-houses-old-town',image:withBase('/media/da086.webp')},
  {name:'Commercial',type:'Commercial',path:withBase('/properties/commercial-property'),rawPath:'/properties/commercial-property'},
  {name:'Hotels',type:'Hotel',path:withBase('/properties/hotel-for-sale'),rawPath:'/properties/hotel-for-sale'},
];
export const locations = [
  {name:'Kalkan Town Centre',path:withBase('/locations/kalkan-town-centre'),rawPath:'/locations/kalkan-town-centre',image:withBase('/media/da249.webp'),description:'The harbour, old town streets and everyday amenities within reach.'},
  {name:'Kalamar',path:withBase('/locations/kalamar'),rawPath:'/locations/kalamar',image:withBase('/media/lv095.webp'),description:'Homes on the slopes around Kalamar Bay, close to the waterfront.'},
  {name:'İslamlar Village',path:withBase('/locations/islamlar-village'),rawPath:'/locations/islamlar-village',image:withBase('/media/lv886.webp'),description:'Hillside villas and land in the countryside above Kalkan.'},
];
const byArea = new Map(locations.map(item => [item.rawPath,item]));
const byCategory = new Map(categories.map(item => [item.rawPath,item]));
export const listings = [...original,...extra].map(item => {
  const mediaItem = media[item.id] || {};
  const detailItem = details[item.id] || {};
  const rawPhotos = mediaItem.photos || item.photos || [];
  const rawPath = item.path;
  return {
    features: [],
    categories: [],
    videos: [],
    ...item,
    ...detailItem,
    ...mediaItem,
    rawPath,
    path: withBase(rawPath),
    image: withBase(item.image || rawPhotos[0] || ''),
    photos: rawPhotos.map(withBase),
  };
});
const byId = new Map(listings.map(item => [item.id,item]));
const featuredIds = ['LV095','DA249','LV034'];
export const featured = featuredIds.map(id => byId.get(id));
export const getLocation = name => locations.find(item => item.name === name) ??
  Object.entries(collections).filter(([path]) => path.startsWith('/locations/')).map(([path,item]) => ({name:item.name,path:withBase(path)})).find(item => item.name.toLocaleLowerCase('en') === name.toLocaleLowerCase('en'));
export const currency = val => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(val);
export const priceLabel = value => value > 0 ? currency(value) : 'Price on request';

const base = {description:'Explore villas, apartments and land for sale in Kalkan and surrounding areas with Mavi Real Estate.',image:withBase('/media/og-home.jpg')};
const collectionRoutes = Object.fromEntries(Object.entries(collections).map(([path,entry]) => {
  const area = path.startsWith('/locations/');
  const areaInfo = byArea.get(path);
  const areaGuide = area ? areaGuides[path.slice('/locations/'.length)] : undefined;
  const category = byCategory.get(path);
  const name = areaInfo?.name || entry.name;
  const heading = area || path === '/kalkan' ? 'Property in ' + name : category ? category.name + ' for sale in Kalkan' : name;
  const description = areaInfo?.description ?? (area ? 'Browse the Mavi Real Estate portfolio for ' + name + '.' : 'Explore the ' + name.toLowerCase() + ' portfolio from Mavi Real Estate.');
  return [path,{kind:'collection',path:withBase(path),rawPath:path,heading,title:heading + ' | Mavi Real Estate',description,area,areaName:name,areaGuide,category:path.startsWith('/properties/'),ids:entry.ids,
    image:path === '/turkish-citizenship' ? withBase('/media/citizenship-source.webp') : areaInfo?.image || category?.image || byId.get(entry.ids[0])?.photos[0] || withBase('/media/hero.webp')}];
}));

export const routes = {
  '/':{kind:'home',path:withBase('/'),rawPath:'/',title:'Property for Sale in Kalkan | Mavi Real Estate',...base},
  '/locations':{kind:'locations',path:withBase('/locations'),rawPath:'/locations',heading:'Find your part of Kalkan.',title:'Explore Locations in Kalkan | Mavi Real Estate',...base,image:withBase('/media/da249.webp')},
  '/contact-us':{kind:'contact',path:withBase('/contact-us'),rawPath:'/contact-us',heading:'Let’s talk property.',title:'Contact Mavi Real Estate in Kalkan',description:'Make an appointment with the Mavi Real Estate office to discuss buying, selling or viewing property in Kalkan.',image:withBase('/media/contact-source.webp')},
  ...collectionRoutes,
  '/properties':{...collectionRoutes['/properties'],path:withBase('/properties'),rawPath:'/properties',heading:'Property for sale in Kalkan',title:'Browse Properties for Sale | Mavi Real Estate',...base,image:withBase('/media/guide.webp')},
  ...Object.fromEntries(Object.entries(aliases).map(([path,target]) => [path,{...collectionRoutes[target],path:withBase(path),rawPath:path,canonicalPath:target}])),
  ...Object.fromEntries(Object.entries(editorial).map(([path,page]) => [path,{...page,path:withBase(path),rawPath:path,image:withBase(page.image),title:(page.kind === 'article' ? page.heading : page.kicker).replace(/\.$/,'') + ' | Mavi Real Estate'}])),
  ...Object.fromEntries(listings.map(item => [item.rawPath,{
    kind:'detail',path:item.path,rawPath:item.rawPath,title:item.title + ' | Mavi Real Estate',
    description:item.description.trim().replace(/\s+/g,' ').slice(0,157) || 'Explore ' + item.name + ' with Mavi Real Estate.',
    image:item.photos[0],item,
  }])),
};
export const findRoute = rawPath => {
  const clean = (rawPath || '/').replace(/\/$/, '') || '/';
  const stripped = (basePath && clean.startsWith(basePath)) ? clean.slice(basePath.length) || '/' : clean;
  return routes[clean] ?? routes[stripped] ?? {kind:'missing',title:'Page not found | Mavi Real Estate',...base};
};

export function collectionListings(route) {
  if (route.ids) return route.ids.map(id => byId.get(id)).filter(Boolean);
  return listings.filter(item => item.status !== 'For Rent');
}
