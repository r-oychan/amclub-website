import { factories } from '@strapi/strapi';

const POPULATE = {
  individualCtas: true,
  individualCards: true,
  corporateCtas: true,
  corporateCards: true,
  // Added with the Supplementary Membership Categories section — without it
  // this controller (which ignores inbound populate) never returned the cards,
  // so the page silently fell back to its built-in defaults and CMS edits had
  // no effect.
  supplementaryCards: { populate: { bullets: true, cta: true, secondaryCta: true, image: true } },
  additionalNotes: true,
  seo: { populate: { metaImage: true } },
};

export default factories.createCoreController(
  'api::joining-fees-page.joining-fees-page',
  ({ strapi }) => ({
    async find() {
      const entity = await strapi.documents('api::joining-fees-page.joining-fees-page').findFirst({
        populate: POPULATE,
        status: 'published',
      });
      return { data: entity, meta: {} };
    },
  })
);
