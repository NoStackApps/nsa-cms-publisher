// CMS Publisher Worker — Cloudflare Worker with Cron Trigger.
// Polls __publish_queue__ and runs the full publish pipeline
// (fetch CMS data → render HTML in-memory → deploy to CF Pages).

import { createApiClient } from './api.js';
import { buildInMemory } from './build.js';
import { deployToPages } from './deploy.js';

const MAX_ATTEMPTS = 3;
const CLEANUP_AGE_MS = 24 * 60 * 60 * 1000;

async function pollAndPublish(env) {
  const api = createApiClient(env);

  // 1. Check for pending items
  const pending = await api.fetchPending();
  if (pending.length === 0) return { published: false, reason: 'no pending items' };

  const batchId = crypto.randomUUID().slice(0, 8);
  console.log(`Batch ${batchId}: ${pending.length} pending item(s)`);

  // 2. Mark all as processing
  await Promise.all(
    pending.map(item => api.updateQueueItem(item.id, { status: 'processing', batch_id: batchId }))
  );

  // 3. Run publish pipeline
  try {
    // Fetch all CMS data
    const data = await api.fetchAll();

    // Build HTML in memory
    const siteId = env.CMS_SITE_ID || '';
    const files = buildInMemory(data, siteId);
    console.log(`Built ${files.size} files`);

    // Deploy to Cloudflare Pages
    const result = await deployToPages(files, env);
    console.log(`Deployed: ${result.url}`);

    // 4. Mark all as completed
    await Promise.all(
      pending.map(item => api.updateQueueItem(item.id, { status: 'completed' }))
    );

    return { published: true, batchId, files: files.size, url: result.url };

  } catch (err) {
    console.error(`Batch ${batchId} failed: ${err.message}`);

    // Handle retries and dead letters
    const deadLetterItems = [];

    await Promise.all(pending.map(async (item) => {
      const attempts = (item.attempts || 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await api.updateQueueItem(item.id, {
          status: 'dead_letter',
          attempts,
          error: err.message,
        });
        deadLetterItems.push({ ...item, attempts });
      } else {
        await api.updateQueueItem(item.id, {
          status: 'pending',
          attempts,
          error: err.message,
          batch_id: '',
        });
      }
    }));

    // Alert on dead letters (log + optional API call)
    if (deadLetterItems.length > 0) {
      const summary = deadLetterItems.map(i =>
        `${i.table_name}/${i.action} (attempts: ${i.attempts})`
      ).join(', ');
      console.error(`DEAD LETTER: ${summary}`);

      // Try to alert via CMS API
      try {
        await api.apiCall({
          action: 'sendAlert',
          subject: `[CMS Publisher] ${deadLetterItems.length} dead-letter item(s)`,
          message: summary,
        });
      } catch { /* alert is best-effort */ }
    }

    return { published: false, error: err.message, batchId };
  }
}

async function cleanup(env) {
  const api = createApiClient(env);
  try {
    const result = await api.apiCall({
      action: 'list',
      table: '__publish_queue__',
      filters: { status: 'completed' },
    });
    const items = result.data || [];
    const cutoff = Date.now() - CLEANUP_AGE_MS;

    for (const item of items) {
      const audit = item.__audit || {};
      const updatedAt = audit.updatedAt ? new Date(audit.updatedAt).getTime() : 0;
      if (updatedAt && updatedAt < cutoff) {
        await api.deleteQueueItem(item.id);
      }
    }
  } catch (err) {
    console.error(`Cleanup error: ${err.message}`);
  }
}

// ── Worker export ───────────────────────────────

export default {
  // Cron trigger handler
  async scheduled(event, env, ctx) {
    const result = await pollAndPublish(env);
    console.log('Poll result:', JSON.stringify(result));

    // Cleanup old completed items (non-blocking)
    ctx.waitUntil(cleanup(env));
  },

  // HTTP handler — manual trigger + health check
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', worker: 'cms-publisher' });
    }

    if (url.pathname === '/publish' && request.method === 'POST') {
      // Verify shared secret
      const secret = request.headers.get('X-Publish-Secret');
      if (env.PUBLISH_SECRET && secret !== env.PUBLISH_SECRET) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const result = await pollAndPublish(env);
      return Response.json(result);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  },
};
