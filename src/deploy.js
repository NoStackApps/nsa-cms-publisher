// Deploy to Cloudflare Pages via Direct Upload API.
// No wrangler CLI needed — pure HTTP, Workers compatible.

const CF_API = 'https://api.cloudflare.com/client/v4';

export async function deployToPages(files, env) {
  const accountId = env.CF_ACCOUNT_ID;
  const projectName = env.CF_PAGES_PROJECT || 'nostackapps-blog';
  const apiToken = env.CF_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error('CF_ACCOUNT_ID and CF_API_TOKEN are required');
  }

  // Build multipart form data with all files
  const formData = new FormData();
  for (const [path, content] of files) {
    // Pages Direct Upload expects files as Blob entries with path as the key
    formData.append(path, new Blob([content], { type: getMimeType(path) }), path);
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

function getMimeType(path) {
  if (path.endsWith('.html')) return 'text/html';
  if (path.endsWith('.css')) return 'text/css';
  if (path.endsWith('.js')) return 'application/javascript';
  if (path.endsWith('.xml')) return 'application/xml';
  if (path.endsWith('.txt')) return 'text/plain';
  if (path.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}
