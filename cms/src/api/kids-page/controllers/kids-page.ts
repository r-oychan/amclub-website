import { factories } from '@strapi/strapi';

const POPULATE = {
  hero: {
    populate: {
      backgroundImage: true,
      cta: true,
      slides: { populate: { backgroundImage: true, cta: true } },
    },
  },
  hangout: { populate: { image: true, textBgImage: true, ctas: true } },
  parties: { populate: { image: true, textBgImage: true, ctas: true } },
  learning: {
    populate: { items: { populate: { image: true, cta: true } } },
  },
  safety: {
    populate: { features: { populate: { image: true, cta: true } }, cta: true },
  },
  finalCta: { populate: { ctas: true } },
  seo: { populate: { metaImage: true } },
};

export default factories.createCoreController('api::kids-page.kids-page', ({ strapi }) => ({
  async find() {
    const entity = await strapi.documents('api::kids-page.kids-page').findFirst({
      populate: POPULATE,
      status: 'published',
    });
    return { data: entity, meta: {} };
  },
}));
