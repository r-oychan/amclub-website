import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::contact-us-page.contact-us-page', ({ strapi }) => ({
  async find() {
    const entity = await strapi.documents('api::contact-us-page.contact-us-page').findFirst({
      populate: {
        heroImage: true,
        talkToUsCta: { populate: { ctas: true } },
        seo: { populate: { metaImage: true } },
      },
      status: 'published',
    });
    return { data: entity, meta: {} };
  },
}));
