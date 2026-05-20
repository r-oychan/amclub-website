import { factories } from '@strapi/strapi';
import { BODY_POPULATE, HEADER_POPULATE } from '../../../lib/detail-page-populate';

const POPULATE = {
  ...HEADER_POPULATE,
  floorPlanPdf: true,
  body: BODY_POPULATE,
};

export default factories.createCoreController('api::event-space.event-space', ({ strapi }) => ({
  async find(ctx) {
    const q = (ctx.query ?? {}) as Record<string, unknown>;
    const entries = await strapi.documents('api::event-space.event-space').findMany({
      filters: q.filters as Record<string, unknown> | undefined,
      sort: q.sort as never,
      populate: POPULATE,
    });
    return { data: entries, meta: {} };
  },
  async findOne(ctx) {
    const { id } = ctx.params;
    const entry = await strapi.documents('api::event-space.event-space').findOne({
      documentId: id,
      populate: POPULATE,
    });
    return { data: entry, meta: {} };
  },
}));
