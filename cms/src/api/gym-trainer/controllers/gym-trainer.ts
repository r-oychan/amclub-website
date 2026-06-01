import { factories } from '@strapi/strapi';

const POPULATE = {
  photo: true,
  bioImage: true,
  bioDocument: true,
  seo: { populate: { metaImage: true } },
};

export default factories.createCoreController('api::gym-trainer.gym-trainer', ({ strapi }) => ({
  async find(ctx) {
    const q = (ctx.query ?? {}) as Record<string, unknown>;
    const entries = await strapi.documents('api::gym-trainer.gym-trainer').findMany({
      filters: q.filters as Record<string, unknown> | undefined,
      sort: (q.sort as never) ?? 'order:asc',
      populate: POPULATE,
      status: 'published',
    });
    return { data: entries, meta: {} };
  },
  async findOne(ctx) {
    const { id } = ctx.params;
    const entry = await strapi.documents('api::gym-trainer.gym-trainer').findOne({
      documentId: id,
      populate: POPULATE,
      status: 'published',
    });
    return { data: entry, meta: {} };
  },
}));
