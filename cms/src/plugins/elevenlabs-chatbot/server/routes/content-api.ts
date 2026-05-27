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

const adminAuth = {
  auth: false,
  policies: ['plugin::elevenlabs-chatbot.is-admin'],
};

const publicAuth = {
  auth: false,
  policies: [] as string[],
};

export default {
  type: 'content-api',
  routes: [
    { method: 'GET', path: '/elevenlabs-chatbot/config', handler: 'public-config.find', config: publicAuth },

    { method: 'POST', path: '/elevenlabs-chatbot/sync-entry', handler: 'sync.syncEntry', config: adminAuth },
    { method: 'POST', path: '/elevenlabs-chatbot/sync-all',   handler: 'sync.syncAll',   config: adminAuth },
    { method: 'POST', path: '/elevenlabs-chatbot/clear-all',  handler: 'sync.clearAll',  config: adminAuth },
    { method: 'GET',  path: '/elevenlabs-chatbot/status',     handler: 'sync.status',    config: adminAuth },
    { method: 'GET',  path: '/elevenlabs-chatbot/settings',   handler: 'settings.find',  config: adminAuth },
    { method: 'PUT',  path: '/elevenlabs-chatbot/settings',   handler: 'settings.update', config: adminAuth },
  ],
};
