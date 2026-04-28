import { factories } from '@strapi/strapi';

const POPULATE = {
  hero: {
    populate: {
      backgroundImage: true,
      cta: true,
      slides: { populate: { backgroundImage: true, cta: true } },
    },
  },
  eventsSection: { populate: { cta: true, filterByCategory: true } },
  finalCta: { populate: { ctas: true } },
  seo: { populate: { metaImage: true } },
};

export default factories.createCoreController('api::whats-on-page.whats-on-page', ({ strapi }) => ({
  async find() {
    const entity = await strapi.documents('api::whats-on-page.whats-on-page').findFirst({
      populate: POPULATE,
      status: 'published',
    });
    return { data: entity, meta: {} };
  },
}));
