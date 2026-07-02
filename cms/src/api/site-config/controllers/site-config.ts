import { factories } from '@strapi/strapi';

// Always populate the defaultSeo component (incl. its media) so the public
// /api/site-config response carries the site-wide SEO fallbacks without the
// frontend needing populate params.
export default factories.createCoreController('api::site-config.site-config', ({ strapi }) => ({
  async find() {
    const entity = await strapi.documents('api::site-config.site-config').findFirst({
      populate: { defaultSeo: { populate: { metaImage: true } } },
      status: 'published',
    });
    return { data: entity, meta: {} };
  },
}));
