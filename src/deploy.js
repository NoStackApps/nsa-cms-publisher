// Deploy to Cloudflare Pages via Direct Upload API.
// No wrangler CLI needed — pure HTTP, Workers compatible.
//
// API format: multipart/form-data with:
//   - "manifest" field: JSON mapping "/<path>" → "<sha256-hash>"
//   - one blob per file, keyed by its hash

const CF_API = 'https://api.cloudflare.com/client/v4';

export async function deployToPages(files, env) {
  const accountId = env.CF_ACCOUNT_ID;
  const projectName = env.CF_PAGES_PROJECT || 'nostackapps-blog';
  const apiToken = env.CF_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error('CF_ACCOUNT_ID and CF_API_TOKEN are required');
  }

  // Hash all files and build manifest
  const manifest = {};
  const blobs = new Map(); // hash → { content, mime }

  for (const [path, content] of files) {
    const hash = await sha256(content);
    const key = path.startsWith('/') ? path : `/${path}`;
    manifest[key] = hash;
    if (!blobs.has(hash)) {
      blobs.set(hash, { content, mime: getMimeType(path) });
    }
  }

  // Build multipart form data
  const formData = new FormData();
  formData.append('manifest', JSON.stringify(manifest));

  for (const [hash, { content, mime }] of blobs) {
    formData.append(hash, new Blob([content], { type: mime }));
  }

  const url = `${CF_API}/accounts/${accountId}/pages/projects/${projectName}/deployments`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
    },
    body: formData,
  });

  const data = await res.json();

  if (!data.success) {
    const errors = (data.errors || []).map(e => e.message).join(', ');
    throw new Error(`Pages deploy failed: ${errors || res.status}`);
  }

  const deployUrl = data.result?.url || `https://${projectName}.pages.dev`;
  return { url: deployUrl, id: data.result?.id };
}

async function sha256(content) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getMimeType(path) {
  if (path.endsWith('.html')) return 'text/html';
  if (path.endsWith('.css')) return 'text/css';
  if (path.endsWith('.js')) return 'application/javascript';
  if (path.endsWith('.xml')) return 'application/xml';
  if (path.endsWith('.txt')) return 'text/plain';
  if (path.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}
