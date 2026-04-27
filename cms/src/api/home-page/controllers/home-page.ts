import { factories } from '@strapi/strapi';

const POPULATE = {
  hero: {
    populate: {
      backgroundImage: true,
      cta: true,
      slides: { populate: { backgroundImage: true, cta: true } },
    },
  },
  aboutSection: {
    populate: { stats: true, cta: true, images: true },
  },
  events: {
    populate: { cta: true, filterByCategory: true },
  },
  services: {
    populate: { features: { populate: { image: true } }, cta: true },
  },
  experience: {
    populate: { tabs: { populate: { image: true } } },
  },
  moments: {
    populate: {
      cta: true,
      testimonials: { populate: { photo: true } },
    },
  },
  faq: {
    populate: { ctas: true, items: true },
  },
  seo: { populate: { metaImage: true } },
};

export default factories.createCoreController('api::home-page.home-page', ({ strapi }) => ({
  async find() {
    const entity = await strapi.documents('api::home-page.home-page').findFirst({
      populate: POPULATE,
      status: 'published',
    });
    return { data: entity, meta: {} };
  },
}));
