const adminAuth = {
  auth: false,
  policies: ['plugin::clone-entry.is-admin'],
};

export default {
  type: 'content-api',
  routes: [
    { method: 'POST', path: '/clone', handler: 'clone.clone', config: adminAuth },
  ],
};
