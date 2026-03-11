// CMS API client for Workers runtime

export function createApiClient(env) {
  async function apiCall(params) {
    const body = {
      apiKey: env.CMS_API_KEY,
      ...params,
      user: {
        email: env.CMS_USER_EMAIL,
        passphrase: env.CMS_USER_PASSPHRASE,
      },
    };

    const res = await fetch(env.CMS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
      redirect: 'follow',
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`);
    }
    if (data.error) throw new Error(`API error (${params.table || params.action}): ${data.error}`);
    return data;
  }

  return {
    apiCall,

    async fetchTable(table) {
      const result = await apiCall({ action: 'list', table });
      return result.data || [];
    },

    async fetchAll() {
      const tableMap = {
        sites: 'sites',
        pages: 'pages',
        layouts: 'layouts',
        components: 'components',
        pageSections: 'page_sections',
        collections: 'collections',
        collectionFields: 'collection_fields',
        collectionItems: 'collection_items',
        settings: 'settings',
        assets: 'assets',
        menus: 'menus',
        menuItems: 'menu_items',
      };

      const keys = Object.keys(tableMap);
      const tables = Object.values(tableMap);

      const results = await Promise.allSettled(
        tables.map(table => apiCall({ action: 'list', table }))
      );

      const data = {};
      for (let i = 0; i < keys.length; i++) {
        if (results[i].status === 'fulfilled') {
          data[keys[i]] = results[i].value.data || [];
        } else {
          console.error(`Failed to fetch ${tables[i]}: ${results[i].reason.message}`);
          data[keys[i]] = [];
        }
      }
      return data;
    },

    async fetchPending() {
      const result = await apiCall({
        action: 'list',
        table: '__publish_queue__',
        filters: { status: 'pending' },
      });
      return result.data || [];
    },

    async updateQueueItem(id, updates) {
      await apiCall({ action: 'update', table: '__publish_queue__', id, data: updates });
    },

    async deleteQueueItem(id) {
      await apiCall({ action: 'delete', table: '__publish_queue__', id });
    },
  };
}
