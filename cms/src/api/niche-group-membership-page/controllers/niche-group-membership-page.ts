import { factories } from '@strapi/strapi';
import { BODY_POPULATE, HEADER_POPULATE } from '../../../lib/detail-page-populate';

const POPULATE = {
  ...HEADER_POPULATE,
  body: BODY_POPULATE,
};

export default factories.createCoreController(
  'api::niche-group-membership-page.niche-group-membership-page',
  ({ strapi }) => ({
    async find(ctx) {
      const entry = await strapi
        .documents('api::niche-group-membership-page.niche-group-membership-page')
        .findFirst({ populate: POPULATE });
      return { data: entry, meta: {} };
    },
  })
);
