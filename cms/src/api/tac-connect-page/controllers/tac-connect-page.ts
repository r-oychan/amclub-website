import { factories } from '@strapi/strapi';

// Strapi v5 rejects `populate=*` on nested components, so every component
// (and its media / nested links) is enumerated here — the frontend passes no
// populate params of its own.
const POPULATE = {
  heroImage: true,
  ctas: true,
  appDownload: { populate: { links: true } },
  helpContacts: { populate: { items: true } },
  features: { populate: { cards: { populate: { image: true, cta: true } } } },
  steps: { populate: { items: { populate: { icon: true, cta: true } } } },
  faqCategory: { fields: ['name', 'slug'] },
  seo: { populate: { metaImage: true } },
};

export default factories.createCoreController(
  'api::tac-connect-page.tac-connect-page',
  ({ strapi }) => ({
    async find() {
      const entry = await strapi
        .documents('api::tac-connect-page.tac-connect-page')
        .findFirst({ populate: POPULATE, status: 'published' } as never);
      return { data: entry, meta: {} };
    },
  })
);
