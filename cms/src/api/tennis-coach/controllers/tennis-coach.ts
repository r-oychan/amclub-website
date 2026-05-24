import { factories } from '@strapi/strapi';

const POPULATE = {
  photo: true,
  bioImage: true,
  bioDocument: true,
  seo: { populate: { metaImage: true } },
};

export default factories.createCoreController('api::tennis-coach.tennis-coach', ({ strapi }) => ({
  async find(ctx) {
    const q = (ctx.query ?? {}) as Record<string, unknown>;
    const entries = await strapi.documents('api::tennis-coach.tennis-coach').findMany({
      filters: q.filters as Record<string, unknown> | undefined,
      sort: (q.sort as never) ?? 'order:asc',
      populate: POPULATE,
      status: 'published',
    });
    return { data: entries, meta: {} };
  },
  async findOne(ctx) {
    const { id } = ctx.params;
    const entry = await strapi.documents('api::tennis-coach.tennis-coach').findOne({
      documentId: id,
      populate: POPULATE,
      status: 'published',
    });
    return { data: entry, meta: {} };
  },
}));
