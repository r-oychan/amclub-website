import { factories } from '@strapi/strapi';
import { BODY_POPULATE } from '../../../lib/detail-page-populate';

const POPULATE = {
  heroImage: true,
  ctas: true,
  bottomCtas: true,
  seo: { populate: { metaImage: true } },
  body: BODY_POPULATE,
};

export default factories.createCoreController(
  'api::advertise-with-us-page.advertise-with-us-page',
  ({ strapi }) => ({
    async find(ctx) {
      const entry = await strapi
        .documents('api::advertise-with-us-page.advertise-with-us-page')
        .findFirst({ populate: POPULATE });
      return { data: entry, meta: {} };
    },
  })
);
