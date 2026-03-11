// In-memory build — returns a Map of filepath → content string.
// No filesystem access needed (Workers compatible).

import { renderPage, renderCollectionItemPage, renderIndexPage } from './render.js';
import { BASE_CSS } from './base-css.js';

function getSetting(settings, key, fallback = '') {
  const s = settings.find(s => s.key === key);
  if (!s) return fallback;
  let val = s.value || fallback;
  if (typeof val === 'string' && val.startsWith("'")) val = val.slice(1);
  return val;
}

function collectComponentCSS(components) {
  return components
    .filter(c => (c.style || c.css) && !c.__archived)
    .map(c => {
      let css = c.style || c.css;
      if (css.startsWith("'")) css = css.slice(1);
      return `/* Component: ${c.name || c.id} */\n${css}`;
    })
    .join('\n\n');
}

function generateSitemap(pages, collections, collectionItems, settings) {
  const siteUrl = getSetting(settings, 'site_url', 'https://nostackapps-blog.pages.dev');
  const urls = [];

  urls.push(`  <url><loc>${siteUrl}/</loc><priority>1.0</priority></url>`);

  for (const page of pages) {
    if (page.status !== 'published' || page.__archived) continue;
    const path = page.slug === 'index' ? '/' : `/${page.slug}.html`;
    if (path === '/') continue;
    urls.push(`  <url><loc>${siteUrl}${path}</loc><priority>0.8</priority></url>`);
  }

  for (const collection of collections) {
    if (collection.__archived) continue;
    urls.push(`  <url><loc>${siteUrl}/${collection.slug}/</loc><priority>0.7</priority></url>`);
    const items = collectionItems.filter(
      i => i.collection_id === collection.id && i.status === 'published' && !i.__archived
    );
    for (const item of items) {
      urls.push(`  <url><loc>${siteUrl}/${collection.slug}/${item.slug}.html</loc><priority>0.6</priority></url>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

export function buildInMemory(data, siteId) {
  const { sites, pages, layouts, components, pageSections, settings,
    collections, collectionFields, collectionItems, assets,
    menus, menuItems } = data;

  const files = new Map();
  const renderData = { layouts, components, pageSections, settings, collections, collectionFields, collectionItems, menus: menus || [], menuItems: menuItems || [], pages };

  // 1. Render published pages
  const publishedPages = pages.filter(
    p => p.status === 'published' && !p.__archived && (!siteId || p.site_id === siteId)
  );

  for (const page of publishedPages) {
    const filename = page.slug === 'index' ? 'index.html' : `${page.slug}.html`;
    files.set(filename, renderPage(page, renderData));
  }

  // 2. Render collection pages
  const activeCollections = collections.filter(
    c => !c.__archived && (!siteId || c.site_id === siteId)
  );

  for (const collection of activeCollections) {
    const fields = collectionFields.filter(f => f.collection_id === collection.id);
    const items = collectionItems.filter(i => i.collection_id === collection.id && !i.__archived);
    const publishedItems = items.filter(i => i.status === 'published');

    // Index page
    files.set(`${collection.slug}/index.html`, renderIndexPage(items, collection, fields, renderData));

    // Item pages
    for (const item of publishedItems) {
      files.set(`${collection.slug}/${item.slug}.html`, renderCollectionItemPage(item, collection, fields, renderData));
    }
  }

  // 3. CSS
  const componentCss = collectComponentCSS(components);
  files.set('styles.css', `${BASE_CSS}\n\n/* Component Styles */\n${componentCss}`);

  // 4. Sitemap
  files.set('sitemap.xml', generateSitemap(pages, collections, collectionItems, settings));

  // 5. robots.txt
  const siteUrl = getSetting(settings, 'site_url', 'https://nostackapps-blog.pages.dev');
  files.set('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);

  return files;
}
