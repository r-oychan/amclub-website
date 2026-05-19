import { factories } from '@strapi/strapi';

const POPULATE = {
  image: true,
  ctas: true,
  locationContact: true,
  operatingHoursSections: { populate: { rows: true } },
};

export default factories.createCoreController('api::venue.venue', ({ strapi }) => ({
  async find(ctx) {
    const q = (ctx.query ?? {}) as Record<string, unknown>;
    const entries = await strapi.documents('api::venue.venue').findMany({
      filters: q.filters as Record<string, unknown> | undefined,
      sort: q.sort as never,
      populate: POPULATE,
    });
    return { data: entries, meta: {} };
  },
  async findOne(ctx) {
    const { id } = ctx.params;
    const entry = await strapi.documents('api::venue.venue').findOne({
      documentId: id,
      populate: POPULATE,
    });
    return { data: entry, meta: {} };
  },
}));
