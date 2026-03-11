// Render module — adapted from Node.js version for Workers runtime.
// Uses inlined templates instead of filesystem reads.

import { marked } from 'marked';
import { DOCUMENT_HTML, BLOG_POST_HTML, BLOG_INDEX_HTML } from './templates.js';

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeJsonParse(val, fallback = {}) {
  if (!val) return fallback;
  if (typeof val !== 'string') return val || fallback;
  let str = val.startsWith("'") ? val.slice(1) : val;
  try { return JSON.parse(str); } catch { return fallback; }
}

function interpolateValue(val, tag = 'li') {
  if (val === undefined || val === null || val === '') return '';
  if (Array.isArray(val)) return val.filter(v => v).map(v => `<${tag}>${v}</${tag}>`).join('');
  if (typeof val === 'boolean') return val ? 'true' : '';
  return String(val);
}

function interpolate(template, vars) {
  if (!template) return '';
  let t = template.startsWith("'") ? template.slice(1) : template;

  t = t.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, slotKey, itemTmpl) => {
    const items = vars[slotKey];
    if (!Array.isArray(items) || !items.length) return '';
    return items.map(item => {
      let rendered = itemTmpl.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (__, k, block) => {
        const v = item[k];
        return (v && v !== '' && v !== false) ? block : '';
      });
      rendered = rendered.replace(/\{\{\s*(\w+)(?::(\w+))?\s*\}\}/g, (__, k, tag) => interpolateValue(item[k], tag || 'li'));
      return rendered;
    }).join('\n');
  });

  t = t.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, block) => {
    const v = vars[key];
    return (v && v !== '' && v !== false) ? block : '';
  });

  t = t.replace(/\{\{\s*(\w+)(?::(\w+))?\s*\}\}/g, (_, key, tag) => {
    const val = vars[key];
    if (val === undefined || val === null) return '';
    if (Array.isArray(val)) return val.filter(v => v).map(v => { const el = tag || 'li'; return `<${el}>${v}</${el}>`; }).join('');
    return String(val);
  });
  return t;
}

function getSetting(settings, key, fallback = '') {
  const s = settings.find(s => s.key === key);
  if (!s) return fallback;
  let val = s.value || fallback;
  if (typeof val === 'string' && val.startsWith("'")) val = val.slice(1);
  return val;
}

function buildHeadLinks(settings, page) {
  const globalLinks = getSetting(settings, 'global_css_links', '');
  const pageLinks = page?.custom_css_links || '';
  const all = [globalLinks, pageLinks].filter(Boolean).join('\n');
  return all.split('\n').map(u => u.trim()).filter(Boolean)
    .map(url => `<link rel="stylesheet" href="${escapeHtml(url)}">`).join('\n');
}

function buildHeadCss(settings, page) {
  const globalCss = getSetting(settings, 'global_css', '');
  const pageCss = page?.custom_css || '';
  const all = [globalCss, pageCss].filter(Boolean).join('\n');
  return all ? `<style>${all}</style>` : '';
}

function buildBodyJs(settings, page) {
  const globalJsLinks = getSetting(settings, 'global_js_links', '');
  const pageJsLinks = page?.custom_js_links || '';
  const allLinks = [globalJsLinks, pageJsLinks].filter(Boolean).join('\n');
  const scriptTags = allLinks.split('\n').map(u => u.trim()).filter(Boolean)
    .map(url => `<script src="${escapeHtml(url)}"></script>`).join('\n');

  const globalJs = getSetting(settings, 'global_js', '');
  const pageJs = page?.custom_js || '';
  const allInline = [globalJs, pageJs].filter(Boolean).join('\n');
  const inlineTag = allInline ? `<script>${allInline}</script>` : '';

  return [scriptTags, inlineTag].filter(Boolean).join('\n');
}

function wrapDocument({ title, description, cssFiles, bodyContent, settings, canonicalUrl, page }) {
  const siteName = getSetting(settings, 'site_name', 'NoStackApps');
  const ogImage = getSetting(settings, 'og_image', '');

  const ogImageTag = ogImage
    ? `<meta property="og:image" content="${escapeHtml(ogImage)}">`
    : '';
  const canonicalTag = canonicalUrl
    ? `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`
    : '';

  return interpolate(DOCUMENT_HTML, {
    title: escapeHtml(title || siteName),
    description: escapeHtml(description || ''),
    siteName: escapeHtml(siteName),
    ogImageTag,
    canonicalTag,
    cssContent: cssFiles || '',
    headLinks: buildHeadLinks(settings, page),
    headCss: buildHeadCss(settings, page),
    bodyContent: bodyContent || '',
    bodyJs: buildBodyJs(settings, page),
  });
}

function resolveMenuBlocks(propsData, { menus, menuItems, pages }) {
  if (!menus || !menuItems) return propsData;
  const result = { ...propsData };
  for (const [key, val] of Object.entries(result)) {
    if (!Array.isArray(val)) continue;
    const expanded = [];
    for (const item of val) {
      if (item.block_type === 'menu' && item.menu_slug) {
        const menu = menus.find(m => m.slug === item.menu_slug);
        if (!menu) continue;
        const items = menuItems
          .filter(mi => mi.menu_id === menu.id && !mi.__archived)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        for (const mi of items) {
          let url = mi.url || '#';
          if (mi.page_id && pages) {
            const page = pages.find(p => p.id === mi.page_id);
            if (page) url = page.slug === 'index' ? '/' : `/${page.slug}.html`;
          }
          expanded.push({ block_type: 'link', text: mi.label, url });
        }
      } else {
        expanded.push(item);
      }
    }
    result[key] = expanded;
  }
  return result;
}

function renderComponentSection(section, { components, collectionFields, collectionItems, collections, menus, menuItems, pages }) {
  const component = components.find(c => c.id === section.component_id);
  if (!component) return `<!-- component not found: ${section.component_id} -->`;

  let template = component.template || component.html_template || '';
  if (template.startsWith("'")) template = template.slice(1);

  let propsData = safeJsonParse(section.props_data, {});
  propsData = resolveMenuBlocks(propsData, { menus, menuItems, pages });

  let fieldMap = safeJsonParse(section.collection_field_map, null);
  if (fieldMap && !fieldMap._collection) fieldMap = null;

  if (fieldMap && fieldMap._collection) {
    const collectionSlug = fieldMap._collection;
    const collection = collections.find(c => c.slug === collectionSlug || c.id === collectionSlug);
    if (!collection) return `<!-- collection not found: ${collectionSlug} -->`;

    const items = collectionItems
      .filter(i => i.collection_id === collection.id && i.status === 'published' && !i.__archived);
    const fields = collectionFields.filter(f => f.collection_id === collection.id);

    let itemTemplate = template;
    if (fieldMap._itemComponent) {
      const itemComp = components.find(c => c.slug === fieldMap._itemComponent);
      if (itemComp) {
        itemTemplate = itemComp.html_template || '';
        if (itemTemplate.startsWith("'")) itemTemplate = itemTemplate.slice(1);
      }
    }

    const rendered = items.map(item => {
      const itemFieldData = safeJsonParse(item.field_data, {});
      const mappedProps = { ...propsData };
      for (const [propName, fieldSlug] of Object.entries(fieldMap)) {
        if (propName === '_collection' || propName === '_itemComponent') continue;
        if (fieldSlug === '_name') {
          mappedProps[propName] = item.name || '';
        } else if (fieldSlug === '_slug') {
          mappedProps[propName] = item.slug || '';
        } else if (fieldSlug === '_published_at') {
          mappedProps[propName] = item.published_at
            ? new Date(item.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : '';
        } else {
          const field = fields.find(f => f.slug === fieldSlug || f.name === fieldSlug);
          if (field) {
            let value = itemFieldData[field.slug] || itemFieldData[field.name] || '';
            if (field.field_type === 'formattedText' && value) {
              value = marked(String(value));
            }
            mappedProps[propName] = value;
          } else {
            mappedProps[propName] = itemFieldData[fieldSlug] || '';
          }
        }
      }
      mappedProps.itemUrl = `/${collection.slug}/${item.slug}.html`;
      mappedProps.itemSlug = item.slug;
      return interpolate(itemTemplate, mappedProps);
    });

    if (fieldMap._itemComponent) {
      const wrapperProps = { ...propsData, items: rendered.join('\n') };
      return interpolate(template, wrapperProps);
    }
    return rendered.join('\n');
  }

  const propsSchema = safeJsonParse(component.props_schema, {});
  for (const [key, def] of Object.entries(propsSchema)) {
    if (def.format === 'markdown' && propsData[key]) {
      propsData[key] = marked(String(propsData[key]));
    }
  }

  let html = interpolate(template, propsData);
  html = html.replace(/<slot[^>]*><\/slot>/g, '');
  return html;
}

export function renderPage(page, data) {
  const { layouts, components, pageSections, settings, collections, collectionFields, collectionItems, menus, menuItems, pages } = data;

  const layout = layouts.find(l => l.id === page.layout_id);
  const headerHtml = layout?.header_html || '';
  const footerHtml = layout?.footer_html || '';
  const layoutCss = layout?.css || '';

  const sections = pageSections
    .filter(s => s.page_id === page.id && !s.__archived)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const sectionsHtml = sections.map(section => {
    const html = renderComponentSection(section, { components, collectionFields, collectionItems, collections, menus, menuItems, pages });
    return `<section class="page-section">${html}</section>`;
  }).join('\n');

  const usedComponentIds = new Set(sections.map(s => s.component_id));
  for (const s of sections) {
    const fm = safeJsonParse(s.collection_field_map, {});
    if (fm._itemComponent) {
      const ic = components.find(c => c.slug === fm._itemComponent);
      if (ic) usedComponentIds.add(ic.id);
    }
  }
  const componentCss = components
    .filter(c => usedComponentIds.has(c.id) && (c.style || c.css))
    .map(c => { let css = c.style || c.css; return css.startsWith("'") ? css.slice(1) : css; })
    .join('\n');

  const siteName = getSetting(settings, 'site_name', 'NoStackApps');
  const seoTitle = page.seo_title || page.title || siteName;
  const seoDesc = page.seo_description || '';

  const bodyContent = `
${interpolate(headerHtml, { siteName, ...page })}
<main class="main-content">
<div class="container">
${sectionsHtml}
</div>
</main>
${interpolate(footerHtml, { siteName, year: new Date().getFullYear(), ...page })}
`;

  const cssContent = `<link rel="stylesheet" href="/styles.css">
${layoutCss ? `<style>${layoutCss}</style>` : ''}
${componentCss ? `<style>${componentCss}</style>` : ''}`;

  return wrapDocument({
    title: seoTitle,
    description: seoDesc,
    cssFiles: cssContent,
    bodyContent,
    settings,
    canonicalUrl: `${getSetting(settings, 'site_url', '')}/${page.slug === 'index' ? '' : page.slug + '.html'}`,
    page,
  });
}

export function renderCollectionItemPage(item, collection, fields, data) {
  const { settings } = data;
  const siteName = getSetting(settings, 'site_name', 'NoStackApps');
  const siteTagline = getSetting(settings, 'tagline', '');
  const githubUrl = getSetting(settings, 'github_url', '');

  const fieldData = safeJsonParse(item.field_data, {});
  const sortedFields = [...fields].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const metadataSlugs = new Set(['title', 'slug', 'excerpt', 'summary', 'description', 'category', 'tags', 'author', 'read_time']);

  const fieldsHtml = sortedFields
    .filter(field => !metadataSlugs.has(field.slug))
    .map(field => {
      let value = fieldData[field.slug] || fieldData[field.name] || '';
      if (!value) return '';

      if (field.field_type === 'formattedText') {
        let html = marked(String(value));
        html = html.replace(/^\s*<h1[^>]*>.*?<\/h1>\s*/i, '');
        return `<div class="post-field post-field--${field.slug}">${html}</div>`;
      }
      if (field.field_type === 'image') {
        return `<div class="post-field post-field--${field.slug}"><img src="${escapeHtml(value)}" alt="${escapeHtml(field.name)}" class="post-image"></div>`;
      }
      if (field.field_type === 'richText') {
        return `<div class="post-field post-field--${field.slug}">${value}</div>`;
      }
      if (field.field_type === 'url') {
        return `<div class="post-field post-field--${field.slug}"><a href="${escapeHtml(value)}">${escapeHtml(value)}</a></div>`;
      }
      return `<div class="post-field post-field--${field.slug}"><p>${escapeHtml(String(value))}</p></div>`;
    }).filter(Boolean).join('\n');

  const publishedDate = item.published_at
    ? new Date(item.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const bodyContent = interpolate(BLOG_POST_HTML, {
    siteName, siteTagline, githubUrl,
    title: escapeHtml(item.name),
    date: publishedDate,
    collectionName: escapeHtml(collection.name),
    collectionSlug: collection.slug,
    fieldsHtml,
    year: new Date().getFullYear(),
  });

  return wrapDocument({
    title: `${item.name} | ${siteName}`,
    description: fieldData.excerpt || fieldData.summary || fieldData.description || '',
    cssFiles: '<link rel="stylesheet" href="/styles.css">',
    bodyContent,
    settings,
    canonicalUrl: `${getSetting(settings, 'site_url', '')}/${collection.slug}/${item.slug}.html`,
  });
}

export function renderIndexPage(items, collection, fields, data) {
  const { settings } = data;
  const siteName = getSetting(settings, 'site_name', 'NoStackApps');
  const siteTagline = getSetting(settings, 'tagline', '');
  const githubUrl = getSetting(settings, 'github_url', '');

  const sortedItems = [...items]
    .filter(i => i.status === 'published' && !i.__archived)
    .sort((a, b) => {
      const dateA = a.published_at ? new Date(a.published_at) : new Date(0);
      const dateB = b.published_at ? new Date(b.published_at) : new Date(0);
      return dateB - dateA;
    });

  const cardsHtml = sortedItems.map(item => {
    const fieldData = safeJsonParse(item.field_data, {});
    const excerpt = fieldData.excerpt || fieldData.summary || fieldData.description || '';
    const thumbnail = fieldData.thumbnail || fieldData.image || fieldData.cover_image || '';
    const publishedDate = item.published_at
      ? new Date(item.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : '';
    const category = fieldData.category || '';

    return `
    <article class="post-card">
      ${thumbnail ? `<div class="post-card__image"><img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(item.name)}" loading="lazy"></div>` : ''}
      <div class="post-card__content">
        ${category ? `<span class="post-card__category">${escapeHtml(category)}</span>` : ''}
        <h2 class="post-card__title">
          <a href="/${collection.slug}/${item.slug}.html">${escapeHtml(item.name)}</a>
        </h2>
        ${excerpt ? `<p class="post-card__excerpt">${escapeHtml(excerpt)}</p>` : ''}
        <div class="post-card__meta">
          ${publishedDate ? `<time>${publishedDate}</time>` : ''}
        </div>
      </div>
    </article>`;
  }).join('\n');

  const bodyContent = interpolate(BLOG_INDEX_HTML, {
    siteName, siteTagline, githubUrl,
    collectionName: escapeHtml(collection.name),
    collectionNamePlural: escapeHtml(collection.item_name_plural || collection.name),
    itemCount: sortedItems.length,
    cardsHtml,
    year: new Date().getFullYear(),
  });

  return wrapDocument({
    title: `${collection.name} | ${siteName}`,
    description: `Browse all ${collection.item_name_plural || collection.name} on ${siteName}`,
    cssFiles: '<link rel="stylesheet" href="/styles.css">',
    bodyContent,
    settings,
    canonicalUrl: `${getSetting(settings, 'site_url', '')}/${collection.slug}/`,
  });
}
