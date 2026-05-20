import { factories } from '@strapi/strapi';
import { BODY_POPULATE, HEADER_POPULATE } from '../../../lib/detail-page-populate';

const POPULATE = {
  ...HEADER_POPULATE,
  teamMembers: { populate: { image: true, bioImage: true } },
  downloads: { populate: { items: true } },
  coaches: { populate: { photo: true } },
  parent: true,
  children: true,
  body: BODY_POPULATE,
};

export default factories.createCoreController(
  'api::fitness-facility.fitness-facility',
  ({ strapi }) => ({
    async find(ctx) {
      const q = (ctx.query ?? {}) as Record<string, unknown>;
      const entries = await strapi.documents('api::fitness-facility.fitness-facility').findMany({
        filters: q.filters as Record<string, unknown> | undefined,
        sort: q.sort as never,
        populate: POPULATE,
      });
      return { data: entries, meta: {} };
    },
    async findOne(ctx) {
      const { id } = ctx.params;
      const entry = await strapi.documents('api::fitness-facility.fitness-facility').findOne({
        documentId: id,
        populate: POPULATE,
      });
      return { data: entry, meta: {} };
    },
  })
);
