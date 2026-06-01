import { factories } from '@strapi/strapi';
import { BODY_POPULATE, HEADER_POPULATE } from '../../../lib/detail-page-populate';

const POPULATE = {
  ...HEADER_POPULATE,
  body: BODY_POPULATE,
};

export default factories.createCoreController(
  'api::start-application-page.start-application-page',
  ({ strapi }) => ({
    async find(ctx) {
      const entry = await strapi
        .documents('api::start-application-page.start-application-page')
        .findFirst({ populate: POPULATE });
      return { data: entry, meta: {} };
    },
  })
);
