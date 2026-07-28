import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::privacy-statement-page.privacy-statement-page',
  ({ strapi }) => ({
    async find() {
      const entity = await strapi
        .documents('api::privacy-statement-page.privacy-statement-page')
        .findFirst({
          populate: { seo: { populate: { metaImage: true } } },
          status: 'published',
        });
      return { data: entity, meta: {} };
    },
  })
);
