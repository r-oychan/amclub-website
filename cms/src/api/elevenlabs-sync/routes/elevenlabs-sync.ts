/**
 * Custom admin-scoped routes for triggering KB sync from the Strapi admin UI.
 * All routes require an authenticated admin (verified via the admin JWT
 * strategy + admin::isAuthenticatedAdmin policy).
 */

const adminAuth = {
  auth: { strategies: ['admin'] as string[] },
  policies: ['admin::isAuthenticatedAdmin'],
};

export default {
  type: 'admin',
  routes: [
    {
      method: 'POST',
      path: '/elevenlabs-sync/sync-entry',
      handler: 'elevenlabs-sync.syncEntry',
      config: adminAuth,
    },
    {
      method: 'POST',
      path: '/elevenlabs-sync/sync-all',
      handler: 'elevenlabs-sync.syncAll',
      config: adminAuth,
    },
    {
      method: 'POST',
      path: '/elevenlabs-sync/clear-all',
      handler: 'elevenlabs-sync.clearAll',
      config: adminAuth,
    },
    {
      method: 'GET',
      path: '/elevenlabs-sync/status',
      handler: 'elevenlabs-sync.status',
      config: adminAuth,
    },
  ],
};
