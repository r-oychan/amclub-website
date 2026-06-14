import { factories } from '@strapi/strapi';

// Explicit POPULATE map — same pattern as fitness-facility +
// kids-experience. venueCards / packageCards populate down to each card's
// image + downloadLink so the package pages render fully.
const POPULATE = {
  heroImage: true,
  gallery: true,
  ctas: true,
  bottomCtas: true,
  locationContact: true,
  operatingHoursSections: { populate: { rows: true } },
  extraSections: true,
  downloads: { populate: { items: true } },
  venueCards: {
    populate: { cards: { populate: { image: true, downloadLink: true } } },
  },
  packageCards: {
    populate: { cards: { populate: { image: true, downloadLink: true } } },
  },
  seo: { populate: { metaImage: true } },
};

export default factories.createCoreController('api::event-space.event-space', ({ strapi }) => ({
  async find(ctx) {
    const q = (ctx.query ?? {}) as Record<string, unknown>;
    const entries = await strapi.documents('api::event-space.event-space').findMany({
      filters: q.filters as Record<string, unknown> | undefined,
      sort: (q.sort as never) ?? 'order:asc',
      populate: POPULATE,
      status: 'published',
    });
    return { data: entries, meta: {} };
  },
  async findOne(ctx) {
    const { id } = ctx.params;
    const entry = await strapi.documents('api::event-space.event-space').findOne({
      documentId: id,
      populate: POPULATE,
      status: 'published',
    });
    return { data: entry, meta: {} };
  },
}));
