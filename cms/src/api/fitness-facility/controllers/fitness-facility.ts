import { factories } from '@strapi/strapi';

// Explicit POPULATE map — Strapi 5.46 rejects `populate=*` on leaf fields
// and unknown keys. Every nested component the frontend reads is enumerated.
// Per-block populate uses the dynamiczone `on` form so each block component
// gets its own populate fragment.
const POPULATE = {
  heroImage: true,
  gallery: true,
  ctas: true,
  bottomCtas: true,
  locationContact: true,
  operatingHoursSections: { populate: { rows: true } },
  downloads: { populate: { items: true } },
  parent: { fields: ['slug', 'name'] },
  children: { fields: ['slug', 'name', 'order'] },
  seo: { populate: { metaImage: true } },
  body: {
    on: {
      'blocks.text-block': true,
      'blocks.card-grid': {
        populate: { cards: { populate: { image: true, icon: true, cta: true } }, cta: true },
      },
      'blocks.feature-grid': {
        populate: { features: { populate: { image: true, icon: true, cta: true } }, asideImage: true, cta: true },
      },
      'blocks.three-col-grid': {
        populate: { items: { populate: { image: true, cta: true } } },
      },
      'blocks.cta-banner': { populate: { ctas: true, image: true, images: true } },
      'blocks.faq-section': { populate: { items: true, ctas: true } },
      'blocks.downloads-section': { populate: { items: true } },
      'blocks.tabs-section': {
        populate: { tabs: { populate: { image: true } }, collageImages: true },
      },
      'blocks.image-panel-slideshow': {
        populate: { slides: { populate: { image: true } } },
      },
      'blocks.priced-card-grid': {
        populate: {
          items: { populate: { image: true, cta: true, secondaryCta: true, bullets: true } },
        },
      },
      'blocks.quotes-block': { populate: { items: { populate: { image: true } } } },
      'blocks.collage-gallery': { populate: { images: true } },
    },
  },
};

export default factories.createCoreController(
  'api::fitness-facility.fitness-facility',
  ({ strapi }) => ({
    async find(ctx) {
      const q = (ctx.query ?? {}) as Record<string, unknown>;
      const entries = await strapi.documents('api::fitness-facility.fitness-facility').findMany({
        filters: q.filters as Record<string, unknown> | undefined,
        sort: (q.sort as never) ?? 'order:asc',
        populate: POPULATE,
        status: 'published',
      });
      return { data: entries, meta: {} };
    },
    async findOne(ctx) {
      const { id } = ctx.params;
      const entry = await strapi.documents('api::fitness-facility.fitness-facility').findOne({
        documentId: id,
        populate: POPULATE,
        status: 'published',
      });
      return { data: entry, meta: {} };
    },
  })
);
