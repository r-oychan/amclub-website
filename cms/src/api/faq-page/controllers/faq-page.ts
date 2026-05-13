import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::faq-page.faq-page', ({ strapi }) => ({
  async find() {
    const entity = await strapi.documents('api::faq-page.faq-page').findFirst({
      populate: { heroImage: true, seo: { populate: { metaImage: true } } },
      status: 'published',
    });
    return { data: entity, meta: {} };
  },
}));
