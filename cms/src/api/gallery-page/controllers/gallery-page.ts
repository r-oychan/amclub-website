import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::gallery-page.gallery-page', ({ strapi }) => ({
  async find() {
    const entity = await strapi.documents('api::gallery-page.gallery-page').findFirst({
      populate: { heroImage: true, seo: { populate: { metaImage: true } } },
      status: 'published',
    });
    return { data: entity, meta: {} };
  },
}));
