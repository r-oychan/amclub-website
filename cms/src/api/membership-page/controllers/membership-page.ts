import { factories } from '@strapi/strapi';

const POPULATE = {
  hero: {
    populate: {
      backgroundImage: true,
      cta: true,
      slides: { populate: { backgroundImage: true, cta: true } },
    },
  },
  joinCta: { populate: { ctas: true } },
  intro: { populate: { cta: true } },
  benefits: {
    populate: {
      features: { populate: { image: true, cta: true } },
      cta: true,
    },
  },
  findRightCta: { populate: { ctas: true } },
  programs: {
    populate: {
      cards: { populate: { image: true, cta: true } },
      cta: true,
    },
  },
  faq: { populate: { ctas: true, items: true } },
  beginJourneyCta: { populate: { ctas: true } },
  seo: { populate: { metaImage: true } },
};

export default factories.createCoreController('api::membership-page.membership-page', ({ strapi }) => ({
  async find() {
    const entity = await strapi.documents('api::membership-page.membership-page').findFirst({
      populate: POPULATE,
      status: 'published',
    });
    return { data: entity, meta: {} };
  },
}));
