import { factories } from '@strapi/strapi';

const POPULATE = {
  hero: {
    populate: {
      backgroundImage: true,
      cta: true,
      slides: { populate: { backgroundImage: true, cta: true } },
    },
  },
  finalCta: { populate: { ctas: true, image: true, images: true } },
  seo: { populate: { metaImage: true } },
};

export default factories.createCoreController(
  'api::dining-promotions-page.dining-promotions-page',
  ({ strapi }) => ({
    async find() {
      const entity = await strapi
        .documents('api::dining-promotions-page.dining-promotions-page')
        .findFirst({ populate: POPULATE, status: 'published' });
      return { data: entity, meta: {} };
    },
  })
);
