// import type { Core } from '@strapi/strapi';
import { registerLifecycleHooks } from './services/elevenlabs-sync/lifecycle';

const PUBLIC_FIND_TYPES = [
  'api::home-page.home-page',
  'api::about-page.about-page',
  'api::dining-page.dining-page',
  'api::fitness-page.fitness-page',
  'api::kids-page.kids-page',
  'api::membership-page.membership-page',
  'api::joining-fees-page.joining-fees-page',
  'api::referral-page.referral-page',
  'api::event-spaces-page.event-spaces-page',
  'api::whats-on-page.whats-on-page',
  'api::header.header',
  'api::footer.footer',
  'api::event.event',
  'api::event-category.event-category',
  'api::testimonial.testimonial',
  'api::faq-item.faq-item',
  'api::faq-category.faq-category',
  'api::faq-page.faq-page',
  'api::venue.venue',
  'api::restaurant.restaurant',
  'api::facility.facility',
  'api::coach.coach',
  'api::committee-member.committee-member',
  'api::gallery-album.gallery-album',
  'api::gallery-page.gallery-page',
  'api::news-article.news-article',
  'api::news-page.news-page',
  'api::contact-us-page.contact-us-page',
  'api::dining-promotion.dining-promotion',
  'api::dining-promotions-page.dining-promotions-page',
  'api::site-settings.site-settings',
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

// One-time backfill: existing media files seeded by the content migration
// script were uploaded with a default Blob (no type), so their mime ended up
// as 'application/octet-stream'. The Strapi admin Media Library filters by
// mime category and hides those rows, even though the public site still
// renders them via URL. This step re-detects the mime from the filename and
// updates each affected row. Self-disabling: once all rows are fixed, the
// query returns nothing and the function is a no-op.
const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  pdf: 'application/pdf',
};

function mimeFromFilename(filename: string): string | null {
  const dot = filename.lastIndexOf('.');
  if (dot < 0) return null;
  const ext = filename.slice(dot + 1).toLowerCase();
  return MIME_BY_EXT[ext] ?? null;
}

// Strapi v5 singleTypes 404 on `find` until a row exists. site-settings is
// a global feature-flag store that the frontend hits on every page load, so
// create a sensible default row on first boot if one isn't already there.
async function ensureSiteSettings(strapi: any) {
  const existing = await strapi.documents('api::site-settings.site-settings').findFirst();
  if (existing) return;
  await strapi.documents('api::site-settings.site-settings').create({
    data: { chatbotEnabled: true },
    status: 'published',
  });
  strapi.log.info('[bootstrap] created default site-settings entry');
}

async function backfillUploadMimes(strapi: any) {
  const stale = await strapi.db.query('plugin::upload.file').findMany({
    where: { mime: 'application/octet-stream' },
    select: ['id', 'name', 'ext'],
  });
  if (stale.length === 0) return;

  let fixed = 0;
  for (const f of stale) {
    const mime = mimeFromFilename(f.name) ?? mimeFromFilename(f.ext ?? '');
    if (!mime) continue;
    await strapi.db.query('plugin::upload.file').update({
      where: { id: f.id },
      data: { mime },
    });
    fixed += 1;
  }
  strapi.log.info(`[bootstrap] backfilled mime on ${fixed}/${stale.length} upload row(s)`);
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
      await ensureSiteSettings(strapi);
    } catch (e) {
      strapi.log.error('[bootstrap] failed to ensure site-settings entry', e);
    }
    try {
      await backfillUploadMimes(strapi);
    } catch (e) {
      strapi.log.error('[bootstrap] failed to backfill upload mimes', e);
    }
    try {
      registerLifecycleHooks(strapi);
    } catch (e) {
      strapi.log.error('[bootstrap] failed to register elevenlabs sync hooks', e);
    }
  },
};
