import { factories } from '@strapi/strapi';

const POPULATE = {
  hero: {
    populate: {
      backgroundImage: true,
      cta: true,
      slides: { populate: { backgroundImage: true, cta: true } },
    },
  },
  heritage: {
    populate: {
      backgroundImage: true,
      slides: { populate: { image: true } },
    },
  },
  statsToday: {
    populate: { stats: true },
  },
  visionMission: {
    populate: { image: true },
  },
  governance: {
    populate: { links: true },
  },
  generalCommittee: true,
  advocacy: {
    populate: {
      features: { populate: { image: true } },
      asideImage: true,
      cta: true,
    },
  },
  management: {
    populate: { watermark: true },
  },
  partners: {
    populate: { groups: { populate: { logos: { populate: { image: true } } } } },
  },
  awards: {
    populate: { items: { populate: { image: true } } },
  },
  ctaBanner: {
    populate: { ctas: true },
  },
  seo: { populate: { metaImage: true } },
};

export default factories.createCoreController('api::about-page.about-page', ({ strapi }) => ({
  async find() {
    const entity = await strapi.documents('api::about-page.about-page').findFirst({
      populate: POPULATE,
      status: 'published',
    });
    return { data: entity, meta: {} };
  },
}));
