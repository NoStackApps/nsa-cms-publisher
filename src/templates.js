// Inlined templates — Workers have no filesystem access.
// These are the contents of test/cms-publisher/src/templates/

export const DOCUMENT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }}</title>
  <meta name="description" content="{{ description }}">
  <meta property="og:title" content="{{ title }}">
  <meta property="og:description" content="{{ description }}">
  <meta property="og:site_name" content="{{ siteName }}">
  <meta property="og:type" content="website">
  {{ ogImageTag }}
  {{ canonicalTag }}
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>&#x1f4e6;</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  {{ cssContent }}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark-dimmed.min.css">
  {{ headLinks }}
  {{ headCss }}
</head>
<body>
{{ bodyContent }}
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script>hljs.highlightAll();</script>
{{ bodyJs }}
</body>
</html>`;

export const BLOG_POST_HTML = `<header class="site-header">
  <div class="container header-inner">
    <a href="/" class="site-logo">{{ siteName }}</a>
    <nav class="site-nav">
      <a href="/">Home</a>
      <a href="/blog/">Blog</a>
      <a href="{{ githubUrl }}">GitHub</a>
    </nav>
  </div>
</header>

<main class="main-content">
  <article class="blog-post">
    <div class="container container--narrow">
      <div class="post-header">
        <nav class="breadcrumb">
          <a href="/">Home</a>
          <span class="breadcrumb__sep">/</span>
          <a href="/{{ collectionSlug }}/">{{ collectionName }}</a>
          <span class="breadcrumb__sep">/</span>
          <span>{{ title }}</span>
        </nav>
        <h1 class="post-title">{{ title }}</h1>
        <div class="post-meta">
          <time class="post-date">{{ date }}</time>
        </div>
      </div>

      <div class="post-body prose">
        {{ fieldsHtml }}
      </div>

      <div class="post-footer">
        <a href="/{{ collectionSlug }}/" class="back-link">&larr; Back to {{ collectionName }}</a>
      </div>
    </div>
  </article>
</main>

<footer class="site-footer">
  <div class="container">
    <div class="footer-inner">
      <p class="footer-brand">{{ siteName }}</p>
      <p class="footer-copy">&copy; {{ year }} {{ siteName }}. Built with free tools.</p>
    </div>
  </div>
</footer>`;

export const BLOG_INDEX_HTML = `<header class="site-header">
  <div class="container header-inner">
    <a href="/" class="site-logo">{{ siteName }}</a>
    <nav class="site-nav">
      <a href="/">Home</a>
      <a href="/blog/">Blog</a>
      <a href="{{ githubUrl }}">GitHub</a>
    </nav>
  </div>
</header>

<main class="main-content">
  <div class="container">
    <div class="collection-header">
      <h1 class="collection-title">{{ collectionName }}</h1>
      <p class="collection-count">{{ itemCount }} posts</p>
    </div>

    <div class="post-grid">
      {{ cardsHtml }}
    </div>
  </div>
</main>

<footer class="site-footer">
  <div class="container">
    <div class="footer-inner">
      <p class="footer-brand">{{ siteName }}</p>
      <p class="footer-copy">&copy; {{ year }} {{ siteName }}. Built with free tools.</p>
    </div>
  </div>
</footer>`;
