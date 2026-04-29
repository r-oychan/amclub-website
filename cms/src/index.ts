// import type { Core } from '@strapi/strapi';

const PUBLIC_FIND_TYPES = [
  'api::home-page.home-page',
  'api::about-page.about-page',
  'api::dining-page.dining-page',
  'api::fitness-page.fitness-page',
  'api::kids-page.kids-page',
  'api::membership-page.membership-page',
  'api::event-spaces-page.event-spaces-page',
  'api::whats-on-page.whats-on-page',
  'api::header.header',
  'api::footer.footer',
  'api::event.event',
  'api::event-category.event-category',
  'api::testimonial.testimonial',
  'api::faq-item.faq-item',
  'api::venue.venue',
  'api::restaurant.restaurant',
  'api::facility.facility',
  'api::committee-member.committee-member',
  'api::gallery-album.gallery-album',
  'api::gallery-page.gallery-page',
  'api::news-article.news-article',
  'api::news-page.news-page',
  'api::contact-us-page.contact-us-page',
];

async function grantPublicReadAccess(strapi: any) {
  const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });
  if (!publicRole) {
    strapi.log.warn('[bootstrap] public role not found, skipping permission setup');
    return;
  }

  const desiredActions: string[] = [];
  for (const uid of PUBLIC_FIND_TYPES) {
    desiredActions.push(`${uid}.find`, `${uid}.findOne`);
  }
  // upload plugin: allow finding files (so media URLs resolve when populated)
  desiredActions.push('plugin::upload.content-api.find', 'plugin::upload.content-api.findOne');

  let added = 0;
  for (const action of desiredActions) {
    const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
      where: { action, role: publicRole.id },
    });
    if (existing) continue;
    await strapi.db.query('plugin::users-permissions.permission').create({
      data: { action, role: publicRole.id },
    });
    added += 1;
  }
  if (added > 0) {
    strapi.log.info(`[bootstrap] granted public read access for ${added} action(s)`);
  }
}

// Diagnostic + auto-fix: if the hero-slide schema knows about backgroundVideo
// and a hero-video.mp4 media exists in the library but slide 0 has no video
// set, attach it. Idempotent — no-ops once set.
async function ensureHeroSlide0Video(strapi: any) {
  const heroSlideSchema = strapi.components?.['shared.hero-slide'];
  const attrs = heroSlideSchema?.attributes;
  const attrKeys = attrs ? Object.keys(attrs) : [];
  strapi.log.info(`[bootstrap] hero-slide loaded attrs: ${attrKeys.join(',') || '<none>'}`);
  if (!attrs || !('backgroundVideo' in attrs)) {
    strapi.log.warn('[bootstrap] hero-slide.backgroundVideo missing from in-memory schema; skipping video seed');
    return;
  }

  const videoFile = await strapi.db.query('plugin::upload.file').findOne({
    where: { name: 'hero-video.mp4' },
  });
  if (!videoFile) {
    strapi.log.warn('[bootstrap] hero-video.mp4 not in media library; skipping');
    return;
  }

  const homepage = await strapi.documents('api::home-page.home-page').findFirst({
    populate: { hero: { populate: { slides: { populate: '*' } } } },
  });
  if (!homepage) {
    strapi.log.warn('[bootstrap] home-page entry not found');
    return;
  }
  const slides = homepage.hero?.slides ?? [];
  if (slides.length === 0) {
    strapi.log.warn('[bootstrap] hero has no slides yet');
    return;
  }
  if (slides[0].backgroundVideo) {
    return;
  }

  const updatedSlides = slides.map((s: any, i: number) => {
    const { id: _id, ...rest } = s;
    return i === 0 ? { ...rest, backgroundVideo: videoFile.id } : rest;
  });

  await strapi.documents('api::home-page.home-page').update({
    documentId: homepage.documentId,
    data: { hero: { ...homepage.hero, slides: updatedSlides } },
  });
  strapi.log.info(`[bootstrap] attached hero-video.mp4 (id ${videoFile.id}) to slide 0`);
}

export default {
  register() {},
  async bootstrap({ strapi }: { strapi: any }) {
    try {
      await grantPublicReadAccess(strapi);
    } catch (e) {
      strapi.log.error('[bootstrap] failed to grant public read access', e);
    }
    try {
      await ensureHeroSlide0Video(strapi);
    } catch (e) {
      strapi.log.error('[bootstrap] failed to seed hero slide video', e);
    }
  },
};
