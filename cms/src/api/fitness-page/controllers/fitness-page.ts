import { factories } from '@strapi/strapi';

const overlay = { populate: { image: true, textBgImage: true, ctas: true, logo: true } };

const POPULATE = {
  hero: {
    populate: {
      backgroundImage: true,
      cta: true,
      slides: { populate: { backgroundImage: true, cta: true } },
    },
  },
  senSpa: overlay,
  aquatics: overlay,
  connectDiscover: overlay,
  gym: overlay,
  tennis: overlay,
  moreActivities: { populate: { items: { populate: { image: true, cta: true } } } },
  bowling: overlay,
  finalCta: { populate: { ctas: true } },
  seo: { populate: { metaImage: true } },
};

export default factories.createCoreController('api::fitness-page.fitness-page', ({ strapi }) => ({
  async find() {
    const entity = await strapi.documents('api::fitness-page.fitness-page').findFirst({
      populate: POPULATE,
      status: 'published',
    });
    return { data: entity, meta: {} };
  },
}));
