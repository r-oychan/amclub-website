import { factories } from '@strapi/strapi';
import { BODY_POPULATE, HEADER_POPULATE } from '../../../lib/detail-page-populate';

const POPULATE = {
  ...HEADER_POPULATE,
  body: BODY_POPULATE,
};

export default factories.createCoreController(
  'api::reciprocal-clubs-page.reciprocal-clubs-page',
  ({ strapi }) => ({
    async find(ctx) {
      const entry = await strapi
        .documents('api::reciprocal-clubs-page.reciprocal-clubs-page')
        .findFirst({ populate: POPULATE });
      return { data: entry, meta: {} };
    },
  })
);
