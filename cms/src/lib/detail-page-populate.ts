/**
 * Shared POPULATE map for the `body` dynamiczone used by every detail-page
 * content type (fitness-facility, kids-experience, event-space, and the
 * membership singletons). Centralised so when a block component gains a
 * nested field we only update one file instead of 7+ controllers.
 *
 * Strapi v5.46 rejects `populate=*` and unknown keys, so each component
 * needs its nested fields enumerated explicitly.
 */
export const BODY_POPULATE = {
  on: {
    'blocks.text-block': true,
    'blocks.card-grid': {
      populate: {
        cards: { populate: { image: true, icon: true, cta: true } },
        cta: true,
      },
    },
    'blocks.feature-grid': {
      populate: {
        features: { populate: { image: true, icon: true, cta: true } },
        asideImage: true,
        cta: true,
      },
    },
    'blocks.three-col-grid': {
      populate: { items: { populate: { image: true, cta: true } } },
    },
    'blocks.cta-banner': {
      populate: { ctas: true, image: true, images: true },
    },
    'blocks.faq-section': {
      populate: { items: true, ctas: true },
    },
    'blocks.downloads-section': {
      populate: { items: true },
    },
    'blocks.tabs-section': {
      populate: { tabs: { populate: { image: true } }, collageImages: true },
    },
    'blocks.party-packages': {
      populate: { items: { populate: { image: true, cta: true } } },
    },
    'blocks.team-grid': true,
    'blocks.image-panel-slideshow': {
      populate: { slides: { populate: { image: true } } },
    },
    'blocks.priced-card-grid': {
      populate: {
        items: {
          populate: { image: true, cta: true, secondaryCta: true, bullets: true },
        },
      },
    },
    'blocks.quotes-block': {
      populate: { items: { populate: { image: true } } },
    },
    'blocks.collage-gallery': {
      populate: { images: true },
    },
    'blocks.operating-hours-section': {
      populate: { rows: true },
    },
    'blocks.location-contact': true,
  },
} as const;

/**
 * Skeleton POPULATE for the standard detail-page "header" fields (hero,
 * ctas, contact, hours, seo). Combined with `BODY_POPULATE` per content type.
 */
export const HEADER_POPULATE = {
  heroImage: true,
  ctas: true,
  bottomCtas: true,
  locationContact: true,
  operatingHoursSections: { populate: { rows: true } },
  seo: { populate: { image: true } },
} as const;
