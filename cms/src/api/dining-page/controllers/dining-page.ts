import { factories } from '@strapi/strapi';

const POPULATE = {
  hero: {
    populate: {
      backgroundImage: true,
      cta: true,
      slides: { populate: { backgroundImage: true, cta: true } },
    },
  },
  clubFavorites: {
    populate: { cards: { populate: { image: true, cta: true } }, cta: true },
  },
  essentials: {
    populate: { image: true, textBgImage: true, ctas: true, logo: true },
  },
  finalCta: { populate: { ctas: true } },
  seo: { populate: { metaImage: true } },
};

export default factories.createCoreController('api::dining-page.dining-page', ({ strapi }) => ({
  async find() {
    const entity = await strapi.documents('api::dining-page.dining-page').findFirst({
      populate: POPULATE,
      status: 'published',
    });
    return { data: entity, meta: {} };
  },
}));
