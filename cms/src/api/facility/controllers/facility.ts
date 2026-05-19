import { factories } from '@strapi/strapi';

const POPULATE = {
  image: true,
  ctas: true,
  locationContact: true,
  operatingHoursSections: { populate: { rows: true } },
  teamMembers: { populate: { image: true, bioImage: true } },
  downloads: { populate: { items: true } },
  gallery: true,
};

export default factories.createCoreController('api::facility.facility', ({ strapi }) => ({
  async find(ctx) {
    const q = (ctx.query ?? {}) as Record<string, unknown>;
    const entries = await strapi.documents('api::facility.facility').findMany({
      filters: q.filters as Record<string, unknown> | undefined,
      sort: q.sort as never,
      populate: POPULATE,
    });
    return { data: entries, meta: {} };
  },
  async findOne(ctx) {
    const { id } = ctx.params;
    const entry = await strapi.documents('api::facility.facility').findOne({
      documentId: id,
      populate: POPULATE,
    });
    return { data: entry, meta: {} };
  },
}));
