import { factories } from '@strapi/strapi';

// Explicit POPULATE map — same pattern as fitness-facility. Every nested
// component the frontend reads is enumerated so Strapi 5.46's stricter
// validator doesn't reject the request.
const POPULATE = {
  heroImage: true,
  gallery: true,
  ctas: true,
  bottomCtas: true,
  locationContact: true,
  operatingHoursSections: { populate: { rows: true } },
  extraSections: true,
  downloads: { populate: { items: true } },
  faq: true,
  quotes: { populate: { items: { populate: { image: true } } } },
  partyPackages: { populate: { items: { populate: { image: true, cta: true } } } },
  parent: true,
  children: true,
  seo: { populate: { metaImage: true } },
};

export default factories.createCoreController(
  'api::kids-experience.kids-experience',
  ({ strapi }) => ({
    async find(ctx) {
      const q = (ctx.query ?? {}) as Record<string, unknown>;
      const entries = await strapi.documents('api::kids-experience.kids-experience').findMany({
        filters: q.filters as Record<string, unknown> | undefined,
        sort: (q.sort as never) ?? 'order:asc',
        populate: POPULATE,
        status: 'published',
      });
      return { data: entries, meta: {} };
    },
    async findOne(ctx) {
      const { id } = ctx.params;
      const entry = await strapi.documents('api::kids-experience.kids-experience').findOne({
        documentId: id,
        populate: POPULATE,
        status: 'published',
      });
      return { data: entry, meta: {} };
    },
  })
);
