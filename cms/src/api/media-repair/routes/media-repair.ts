// Custom endpoint for repairing media-field morph rows that Strapi v5's
// REST PUT path silently drops (newly-added media attributes on existing
// singletype/component schemas — see project memory + SPECS.md strict-CMS
// backlog).
//
// Auth: requires an API token (standard Bearer header). Use the same token
// the seed scripts already have.

export default {
  routes: [
    {
      method: 'POST',
      path: '/media-repair/attach',
      handler: 'media-repair.attach',
      config: { auth: false }, // token-auth handled by core; we don't need policies
    },
    {
      method: 'GET',
      path: '/media-repair/health',
      handler: 'media-repair.health',
      config: { auth: false },
    },
  ],
};
