import { factories } from '@strapi/strapi';
import { BODY_POPULATE } from '../../../lib/detail-page-populate';

// Server-side POPULATE map — frontend doesn't need to pass populate params.
// Strapi 5.46's stricter populate-validator rejects `populate[x]=*` and
// unknown keys, so we centralise the resolution here.
const POPULATE = {
  image: true,
  logo: true,
  ctas: true,
  bottomCtas: true,
  locationContact: true,
  operatingHoursSections: { populate: { rows: true } },
  gallery: true,
  body: BODY_POPULATE,
  seo: { populate: { image: true } },
};

export default factories.createCoreController('api::restaurant.restaurant', ({ strapi }) => ({
  async find(ctx) {
    const q = (ctx.query ?? {}) as Record<string, unknown>;
    const entries = await strapi.documents('api::restaurant.restaurant').findMany({
      filters: q.filters as Record<string, unknown> | undefined,
      sort: q.sort as never,
      populate: POPULATE,
    });
    return { data: entries, meta: {} };
  },
  async findOne(ctx) {
    const { id } = ctx.params;
    const entry = await strapi.documents('api::restaurant.restaurant').findOne({
      documentId: id,
      populate: POPULATE,
    });
    return { data: entry, meta: {} };
  },
}));
