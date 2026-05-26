/**
 * Admin-scoped routes. `auth: false` bypasses Strapi's route-type strategy
 * lookup (which doesn't know 'admin' on /api/* routes); the is-admin policy
 * then validates the session token via strapi.sessionManager('admin').
 */

const adminAuth = {
  auth: false,
  policies: ['plugin::elevenlabs-chatbot.is-admin'],
};

export default {
  type: 'content-api',
  routes: [
    { method: 'POST', path: '/elevenlabs-chatbot/sync-entry', handler: 'sync.syncEntry', config: adminAuth },
    { method: 'POST', path: '/elevenlabs-chatbot/sync-all',   handler: 'sync.syncAll',   config: adminAuth },
    { method: 'POST', path: '/elevenlabs-chatbot/clear-all',  handler: 'sync.clearAll',  config: adminAuth },
    { method: 'GET',  path: '/elevenlabs-chatbot/status',     handler: 'sync.status',    config: adminAuth },
    { method: 'GET',  path: '/elevenlabs-chatbot/settings',   handler: 'settings.find',  config: adminAuth },
    { method: 'PUT',  path: '/elevenlabs-chatbot/settings',   handler: 'settings.update', config: adminAuth },
  ],
};
