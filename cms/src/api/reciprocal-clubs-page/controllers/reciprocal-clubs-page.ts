import { factories } from '@strapi/strapi';
import { BODY_POPULATE, HEADER_POPULATE } from '../../../lib/detail-page-populate';

const POPULATE = {
  ...HEADER_POPULATE,
  secondaryImage: true,
  secondaryCta: true,
  // Alternating image+text panels (e.g. "Local Reciprocity"). Without the
  // explicit nested populate the field is stored but never returned, so the
  // frontend renders nothing. Mirrors the fitness-facility imagePanels map.
  imagePanels: {
    populate: {
      image: true,
      ctas: true,
      bullets: true,
      operatingHours: { populate: { rows: true } },
      extraSections: true,
    },
  },
  body: BODY_POPULATE,
};

export default factories.createCoreController(
  'api::reciprocal-clubs-page.reciprocal-clubs-page',
  ({ strapi }) => ({
    async find(ctx) {
      const entry = await strapi
        .documents('api::reciprocal-clubs-page.reciprocal-clubs-page')
        .findFirst({ populate: POPULATE, status: 'published' });
      return { data: entry, meta: {} };
    },
  })
);
