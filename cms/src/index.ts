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

export default {
  register() {},
  async bootstrap({ strapi }: { strapi: any }) {
    try {
      await grantPublicReadAccess(strapi);
    } catch (e) {
      strapi.log.error('[bootstrap] failed to grant public read access', e);
    }
  },
};
