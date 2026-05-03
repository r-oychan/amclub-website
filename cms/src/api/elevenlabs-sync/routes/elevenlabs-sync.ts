/**
 * Custom admin-scoped routes for triggering KB sync from the Strapi admin UI.
 * All routes require an authenticated admin (verified via the admin JWT
 * strategy + admin::isAuthenticatedAdmin policy).
 */

// auth: false bypasses the route-type strategy lookup (which doesn't
// know about 'admin' on /api/* routes); the global::is-admin policy
// then validates the admin session token manually.
const adminAuth = {
  auth: false,
  policies: ['global::is-admin'],
};

export default {
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
