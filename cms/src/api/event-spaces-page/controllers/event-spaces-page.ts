import { factories } from '@strapi/strapi';

const POPULATE = {
  hero: {
    populate: {
      backgroundImage: true,
      cta: true,
      slides: { populate: { backgroundImage: true, cta: true } },
    },
  },
  privatePackages: {
    populate: {
      enquireCta: true,
      items: { populate: { image: true, cta: true } },
    },
  },
  distinctiveSpaces: {
    populate: { items: { populate: { image: true, cta: true } } },
  },
  offsiteCatering: {
    populate: {
      ctas: true,
      pillars: { populate: { image: true } },
      subBanner: { populate: { image: true, cta: true } },
    },
  },
  finalCta: { populate: { ctas: true } },
  seo: { populate: { metaImage: true } },
};

export default factories.createCoreController('api::event-spaces-page.event-spaces-page', ({ strapi }) => ({
  async find() {
    const entity = await strapi.documents('api::event-spaces-page.event-spaces-page').findFirst({
      populate: POPULATE,
      status: 'published',
    });
    return { data: entity, meta: {} };
  },
}));
