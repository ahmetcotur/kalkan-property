import React from 'react';
import {renderToString} from 'react-dom/server';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import App from './App.jsx';
import {collectionListings, email, locations, origin, phone, routes, socialProfiles} from './routes.js';

const site = {
  '@type': 'WebSite', '@id': origin + '/#website', name: 'Kalkan Property',
  url: origin + '/', publisher: {'@id': origin + '/#agency'}, inLanguage: 'en',
};
const agency = {
  '@type': 'RealEstateAgent', '@id': origin + '/#agency', name: 'Mavi Real Estate',
  url: origin + '/', telephone: phone, email,
  logo: origin + '/media/mavi-logo.webp',
  sameAs: socialProfiles.map(profile => profile.url),
  address: {'@type': 'PostalAddress', streetAddress: 'Kalkan Mah. Nilüfer Sok. No 2', addressLocality: 'Kaş', addressRegion: 'Antalya', postalCode: '07960', addressCountry: 'TR'},
  areaServed: {'@type':'Place', name:'Kalkan, Kaş, Antalya'},
};
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const absoluteMedia = photo => photo.startsWith('/') ? origin + photo : photo;
const inlineJson = value => JSON.stringify(value).replace(/</g, '\\u003c');
const meta = (property, content) => '<meta property="' + property + '" content="' + escape(content) + '">';
const field = (name, content) => '<meta name="' + name + '" content="' + escape(content) + '">';

function pageGraph(path, page) {
  const url = origin + (page.canonicalPath ?? path);
  const values = path === '/' ? [site, agency] : [];
  if (path !== '/') {
    const trail = [{name: 'Home', item: origin + '/'}];
    if (page.kind === 'detail' || page.category) {
      const rental = page.item?.status === 'For Rent';
      trail.push({name:rental ? 'Rent' : 'Properties', item:origin + (rental ? '/property-for-rent' : '/properties')});
    }
    if (page.kind === 'article') trail.push({name:'Journal',item:origin + '/blogs'});
    if (page.area) trail.push({name:'Locations', item: origin + '/locations'});
    trail.push({name: page.item?.id ?? (page.kind === 'contact' ? 'Contact' : page.kind === 'locations' ? 'Locations' : page.heading), item: url});
    values.push({'@type':'BreadcrumbList', '@id':url + '#breadcrumb', itemListElement:trail.map((item, i) => ({'@type':'ListItem', position: i + 1, ...item}))});
  }
  if (page.kind === 'collection' || page.kind === 'locations') {
    const results = page.kind === 'locations' ? locations : collectionListings(page);
    values.push({'@type':'CollectionPage', '@id':url + '#page', name:page.heading, url, description:page.description,
      mainEntity:{'@type':'ItemList', itemListElement:results.map((item, i) => ({'@type':'ListItem', position:i+1, url:origin + item.path, name:item.name}))}});
  }
  if (page.kind === 'contact') values.push(agency);
  if (page.kind === 'article') values.push({'@type':'Article','@id':url+'#article',headline:page.heading,url,description:page.description,image:absoluteMedia(page.image),datePublished:page.published,publisher:{'@id':agency['@id']}},agency);
  if (page.item) {
    const item = page.item;
    const homeType = item.type === 'Apartment' ? 'Apartment' : ['Villa','Townhouse'].includes(item.type) ? 'SingleFamilyResidence' : 'Place';
    const property = {
      '@type': homeType, '@id':url + '#property', name:item.name,
      address:{'@type':'PostalAddress', ...(item.area ? {addressLocality:item.area} : {}), addressCountry:'TR'},
      ...(item.beds > 0 ? {numberOfBedrooms:item.beds} : {}),
      ...(item.baths > 0 ? {numberOfBathroomsTotal:item.baths} : {}),
      ...(item.position ? {geo:{'@type':'GeoCoordinates',latitude:item.position[0],longitude:item.position[1]}} : {}),
      ...(item.features.length ? {amenityFeature:item.features.map(name => ({'@type':'LocationFeatureSpecification',name,value:true}))} : {}),
    };
    values.push({'@type':'RealEstateListing', '@id':url + '#listing', url, name:item.name, description:page.description,
      image:item.photos.slice(0,4).map(absoluteMedia), mainEntity:property, publisher:{'@id':agency['@id']},
      ...(item.price > 0 && item.status?.startsWith('For Sale') ? {offers:{'@type':'Offer',price:item.price,priceCurrency:'GBP',url,seller:{'@id':agency['@id']},itemOffered:{'@id':property['@id']}}} : {}),
    }, agency);
  }
  return {'@context':'https://schema.org', '@graph': values};
}

const base = (process.env.BASE_PATH || '').replace(/\/$/, '');

function prefixPaths(html, base) {
  if (!base) return html;
  const escapedBase = base.replace(/^\//, '');
  return html.replace(/(href|src|action)=["']\/([^"']*)["']/g, (match, attr, path) => {
    if (path.startsWith(escapedBase + '/') || path === escapedBase || path.startsWith('/') || path.startsWith('http:') || path.startsWith('https:')) {
      return match;
    }
    return `${attr}="${base}/${path}"`;
  });
}

const template = await readFile('dist/index.html', 'utf8');
for (const [path, page] of Object.entries(routes)) {
  const url = origin + (page.canonicalPath ?? path);
  const image = absoluteMedia(page.image);
  const description = page.areaGuide?.[0].match(/^.*?\.(?: |$)/)?.[0].trim() ?? page.description;
  const tags = [
    '<title>' + escape(page.title) + '</title>',
    field('description', description),
    '<link rel="canonical" href="' + escape(url) + '">',
    meta('og:type',page.kind === 'article' ? 'article' : 'website'), meta('og:site_name','Mavi Real Estate'),
    meta('og:title',page.title), meta('og:description',description),
    meta('og:url',url), meta('og:image',image), meta('og:image:alt',page.item?.name ?? 'Kalkan and the Mediterranean coast'),
    field('twitter:card','summary_large_image'), field('twitter:title',page.title),
    field('twitter:description',description), field('twitter:image',image),
    '<script type="application/ld+json">' + inlineJson(pageGraph(path, page)) + '</script>',
  ].join('\n');
  let html = template.replace(/<!-- metadata:start -->.*?<!-- metadata:end -->/s, () => tags)
    .replace('<div id="root"></div>', () => '<div id="root">' + renderToString(<App path={path}/>) + '</div>');
  if (base) {
    html = prefixPaths(html, base);
  }
  const folder = join('dist', path.slice(1));
  await mkdir(folder, {recursive:true});
  await writeFile(join(folder,'index.html'), html);
}

let missing = template.replace(/<!-- metadata:start -->.*?<!-- metadata:end -->/s, '<title>Page not found | Mavi Real Estate</title>')
  .replace('<div id="root"></div>', () => '<div id="root">' + renderToString(<App path="/404"/>) + '</div>');
if (base) {
  missing = prefixPaths(missing, base);
}
await writeFile('dist/404.html',missing);

const canonicalPaths = Object.keys(routes).filter(path => !routes[path].canonicalPath);
const locationPages = canonicalPaths.filter(path => path === '/locations' || routes[path].area);
const propertyPages = canonicalPaths.filter(path => ['collection','detail'].includes(routes[path].kind) && !routes[path].area);
const generalPages = canonicalPaths.filter(path => !locationPages.includes(path) && !propertyPages.includes(path));
const catalogue = [['pages',generalPages],['properties',propertyPages],['locations',locationPages]];
const xml = '<' + '?xml version="1.0" encoding="UTF-8"?' + '>\n';
const migration = 'migration/sitemap-example';
await mkdir(migration,{recursive:true});
for (const [name, paths] of catalogue) {
  await writeFile(join(migration, 'sitemap-' + name + '.xml'), xml + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths.map(path => '  <url><loc>' + escape(origin + path) + '</loc></url>').join('\n') + '\n</urlset>\n');
}
await writeFile(join(migration,'sitemap.xml'), xml + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  catalogue.map(([name]) => '  <sitemap><loc>' + origin + '/sitemap-' + name + '.xml</loc></sitemap>').join('\n') + '\n</sitemapindex>\n');
console.log('Prerendered', Object.keys(routes).length, 'pages and drafted production sitemap samples.');
