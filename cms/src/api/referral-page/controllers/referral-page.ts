import { factories } from '@strapi/strapi';

const POPULATE = {
  cta: true,
  columnHeadings: true,
  rows: true,
  seo: { populate: { metaImage: true } },
};

export default factories.createCoreController(
  'api::referral-page.referral-page',
  ({ strapi }) => ({
    async find() {
      const entity = await strapi.documents('api::referral-page.referral-page').findFirst({
        populate: POPULATE,
        status: 'published',
      });
      return { data: entity, meta: {} };
    },
  })
);
