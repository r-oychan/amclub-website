/**
 * Public + admin-protected routes for the chatbot plugin, all served from
 * /api/elevenlabs-chatbot/*.
 *
 * - Public config endpoint is unauthenticated so the on-site widget can
 *   bootstrap without an API token.
 * - Admin endpoints use `auth: false` to bypass the route-type strategy
 *   pool (which doesn't know 'admin' on /api/* routes) and the plugin's
 *   is-admin policy to manually validate the admin session token.
 */

/**
 * Session-only. Reserved for the destructive endpoints: a leaked API token must
 * not be able to wipe the knowledge base or change settings.
 */
const adminAuth = {
  auth: false,
  policies: ['plugin::elevenlabs-chatbot.is-admin'],
};

/**
 * Admin session OR Strapi API token — this is what makes the plugin drivable
 * from curl/CI, not just the settings page.
 *
 *   readAuth  — any valid token (read-only included)
 *   writeAuth — FULL-ACCESS token required; read-only/custom get 403
 */
const readAuth = {
  auth: false,
  policies: [{ name: 'plugin::elevenlabs-chatbot.is-admin-or-token', config: {} }],
};

const writeAuth = {
  auth: false,
  policies: [{ name: 'plugin::elevenlabs-chatbot.is-admin-or-token', config: { write: true } }],
};

const publicAuth = {
  auth: false,
  policies: [] as string[],
};

// Paths here are RELATIVE to the plugin's auto-injected prefix. Strapi mounts
// content-api plugin routes at /api/<pluginName>/<router.prefix>/<route.path>,
// and pluginName already supplies `/elevenlabs-chatbot`. So /config below
// becomes /api/elevenlabs-chatbot/config externally.
export default {
  type: 'content-api',
  routes: [
    { method: 'GET', path: '/config', handler: 'public-config.find', config: publicAuth },

    { method: 'POST', path: '/sync-entry', handler: 'sync.syncEntry', config: writeAuth },
    { method: 'POST', path: '/sync-all',   handler: 'sync.syncAll',   config: writeAuth },
    // clear-all wipes the KB — session only, never a token.
    { method: 'POST', path: '/clear-all',  handler: 'sync.clearAll',  config: adminAuth },
    { method: 'POST', path: '/index-all',  handler: 'sync.indexAll',  config: writeAuth },
    { method: 'GET',  path: '/status',     handler: 'sync.status',    config: readAuth },
    { method: 'GET',  path: '/settings',   handler: 'settings.find',  config: readAuth },
    // Settings changes gate the sync itself — session only.
    { method: 'PUT',  path: '/settings',   handler: 'settings.update', config: adminAuth },

    { method: 'GET',  path: '/teamup/subcalendars', handler: 'teamup.subcalendars', config: readAuth },
    { method: 'GET',  path: '/teamup/preview',      handler: 'teamup.preview',      config: readAuth },
    { method: 'POST', path: '/teamup/sync',         handler: 'teamup.sync',         config: writeAuth },
  ],
};
