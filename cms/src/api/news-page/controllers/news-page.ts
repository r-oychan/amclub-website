import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::news-page.news-page', ({ strapi }) => ({
  async find() {
    const entity = await strapi.documents('api::news-page.news-page').findFirst({
      populate: { heroImage: true, seo: { populate: { metaImage: true } } },
      status: 'published',
    });
    return { data: entity, meta: {} };
  },
}));
