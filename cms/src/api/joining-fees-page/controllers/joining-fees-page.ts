import { factories } from '@strapi/strapi';

const POPULATE = {
  individualCtas: true,
  individualCards: true,
  corporateCtas: true,
  corporateCards: true,
  additionalNotes: true,
  seo: { populate: { metaImage: true } },
};

export default factories.createCoreController(
  'api::joining-fees-page.joining-fees-page',
  ({ strapi }) => ({
    async find() {
      const entity = await strapi.documents('api::joining-fees-page.joining-fees-page').findFirst({
        populate: POPULATE,
        status: 'published',
      });
      return { data: entity, meta: {} };
    },
  })
);
