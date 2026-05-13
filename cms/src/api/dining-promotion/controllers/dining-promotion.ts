import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::dining-promotion.dining-promotion',
  () => ({
    async find(ctx) {
      ctx.query = {
        ...ctx.query,
        populate: { image: true, images: true, ctas: true, seo: { populate: '*' } },
      };
      return await super.find(ctx);
    },
    async findOne(ctx) {
      ctx.query = {
        ...ctx.query,
        populate: { image: true, images: true, ctas: true, seo: { populate: '*' } },
      };
      return await super.findOne(ctx);
    },
  }),
);
