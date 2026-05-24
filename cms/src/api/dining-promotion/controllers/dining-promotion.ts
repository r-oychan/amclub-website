import { factories } from '@strapi/strapi';

// Explicit populate map — Strapi 5.46 rejects `populate=*` on leaf seo
// component fields. Including the `restaurant` relation with just the
// fields the promotions page reads (slug for anchor + grouping, name
// for the sidebar label, menuUrl for the per-promo "View Menu" CTA,
// order for sort) keeps payloads small.
const POPULATE = {
  image: true,
  images: true,
  ctas: true,
  seo: { populate: { metaImage: true } },
  restaurant: { fields: ['slug', 'name', 'menuUrl', 'order'] },
};

export default factories.createCoreController(
  'api::dining-promotion.dining-promotion',
  () => ({
    async find(ctx) {
      ctx.query = { ...ctx.query, populate: POPULATE };
      return await super.find(ctx);
    },
    async findOne(ctx) {
      ctx.query = { ...ctx.query, populate: POPULATE };
      return await super.findOne(ctx);
    },
  }),
);
