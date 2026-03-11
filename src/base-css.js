export const BASE_CSS = `/* ── Variables ── */

:root {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --bg-hover: #475569;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --border: #334155;
  --accent: #22c55e;
  --accent-hover: #16a34a;
  --accent-subtle: rgba(34, 197, 94, 0.1);
  --danger: #ef4444;
  --warning: #f59e0b;
  --info: #3b82f6;
  --radius: 8px;
  --radius-lg: 12px;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
  --max-width: 1200px;
  --content-width: 720px;
  --transition: 0.2s ease;
}

/* ── Reset ── */

*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: var(--font-sans);
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.7;
  font-size: 16px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

a {
  color: var(--accent);
  text-decoration: none;
  transition: color var(--transition);
}

a:hover {
  color: var(--accent-hover);
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* ── Layout ── */

.container {
  width: 100%;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 1.5rem;
}

.container--narrow {
  max-width: var(--content-width);
}

.main-content {
  flex: 1;
  padding: 3rem 0;
}

/* ── Header ── */

.site-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
  background: rgba(30, 41, 59, 0.92);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.site-logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: -0.02em;
}

.site-logo:hover {
  color: var(--accent-hover);
}

.site-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.site-nav a {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  transition: color var(--transition);
  position: relative;
}

.site-nav a:hover {
  color: var(--text-primary);
}

.site-nav a::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--accent);
  transition: width var(--transition);
}

.site-nav a:hover::after {
  width: 100%;
}

/* ── Footer ── */

.site-footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  padding: 2.5rem 0;
  margin-top: auto;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-brand {
  font-weight: 600;
  color: var(--accent);
  font-size: 1rem;
}

.footer-copy {
  color: var(--text-muted);
  font-size: 0.85rem;
}

/* ── Breadcrumb ── */

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.breadcrumb a {
  color: var(--text-muted);
}

.breadcrumb a:hover {
  color: var(--accent);
}

.breadcrumb__sep {
  color: var(--text-muted);
  opacity: 0.5;
}

/* ── Blog Post ── */

.blog-post {
  padding: 1rem 0;
}

.post-header {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border);
}

.post-title {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.03em;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.post-date {
  color: var(--text-muted);
}

.post-body {
  margin-bottom: 3rem;
}

.post-footer {
  padding-top: 2rem;
  border-top: 1px solid var(--border);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.back-link:hover {
  color: var(--accent);
}

.post-image {
  border-radius: var(--radius-lg);
  margin: 1.5rem 0;
}

/* ── Prose (Rendered Markdown) ── */

.prose h1 {
  font-size: 2rem;
  font-weight: 800;
  margin: 2.5rem 0 1rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.prose h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 2rem 0 0.75rem;
  line-height: 1.3;
  letter-spacing: -0.01em;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.prose h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.75rem 0 0.5rem;
  line-height: 1.4;
}

.prose h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1.5rem 0 0.5rem;
  color: var(--text-secondary);
}

.prose p {
  margin-bottom: 1.25rem;
  color: var(--text-secondary);
  line-height: 1.8;
}

.prose strong {
  color: var(--text-primary);
  font-weight: 600;
}

.prose em {
  font-style: italic;
}

.prose a {
  color: var(--accent);
  text-decoration: underline;
  text-decoration-color: rgba(34, 197, 94, 0.3);
  text-underline-offset: 3px;
  transition: text-decoration-color var(--transition);
}

.prose a:hover {
  text-decoration-color: var(--accent);
}

.prose ul,
.prose ol {
  margin: 0 0 1.25rem 1.5rem;
  color: var(--text-secondary);
}

.prose ul {
  list-style-type: disc;
}

.prose ol {
  list-style-type: decimal;
}

.prose li {
  margin-bottom: 0.5rem;
  line-height: 1.7;
}

.prose li::marker {
  color: var(--accent);
}

.prose blockquote {
  border-left: 3px solid var(--accent);
  padding: 0.75rem 1.25rem;
  margin: 1.5rem 0;
  background: var(--accent-subtle);
  border-radius: 0 var(--radius) var(--radius) 0;
  color: var(--text-secondary);
}

.prose blockquote p {
  margin-bottom: 0;
}

.prose code {
  background: var(--bg-tertiary);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.875em;
  color: var(--accent);
}

.prose pre {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  padding: 1.25rem;
  border-radius: var(--radius);
  overflow-x: auto;
  margin: 1.5rem 0;
  line-height: 1.6;
}

.prose pre code {
  background: none;
  padding: 0;
  border-radius: 0;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.prose hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 2.5rem 0;
}

.prose img {
  border-radius: var(--radius-lg);
  margin: 1.5rem 0;
}

.prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.9rem;
}

.prose th,
.prose td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.prose th {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.prose td {
  color: var(--text-secondary);
}

.prose tr:hover td {
  background: rgba(51, 65, 85, 0.3);
}

/* ── Collection / Blog Index ── */

.collection-header {
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.collection-title {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
}

.collection-count {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.5rem;
}

/* ── Post Card ── */

.post-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color var(--transition), transform var(--transition);
}

.post-card:hover {
  border-color: var(--bg-hover);
  transform: translateY(-2px);
}

.post-card__image {
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.post-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition);
}

.post-card:hover .post-card__image img {
  transform: scale(1.03);
}

.post-card__content {
  padding: 1.25rem 1.5rem 1.5rem;
}

.post-card__category {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
  background: var(--accent-subtle);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  margin-bottom: 0.75rem;
}

.post-card__title {
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 0.5rem;
}

.post-card__title a {
  color: var(--text-primary);
  transition: color var(--transition);
}

.post-card__title a:hover {
  color: var(--accent);
}

.post-card__excerpt {
  color: var(--text-muted);
  font-size: 0.875rem;
  line-height: 1.6;
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-card__meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--text-muted);
  font-size: 0.8rem;
}

/* ── Page Sections ── */

.page-section {
  margin-bottom: 3rem;
}

.page-section:last-child {
  margin-bottom: 0;
}

/* ── Responsive ── */

@media (max-width: 768px) {
  .header-inner {
    height: 56px;
  }

  .site-nav {
    gap: 1.25rem;
  }

  .site-nav a {
    font-size: 0.85rem;
  }

  .post-title {
    font-size: 1.75rem;
  }

  .prose h1 {
    font-size: 1.5rem;
  }

  .prose h2 {
    font-size: 1.25rem;
  }

  .post-grid {
    grid-template-columns: 1fr;
  }

  .collection-title {
    font-size: 1.5rem;
  }

  .footer-inner {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }

  .container {
    padding: 0 1rem;
  }

  .main-content {
    padding: 2rem 0;
  }
}

@media (max-width: 480px) {
  .site-nav {
    gap: 0.75rem;
  }

  .post-title {
    font-size: 1.5rem;
  }

  .post-card__content {
    padding: 1rem 1.25rem 1.25rem;
  }
}
`;
