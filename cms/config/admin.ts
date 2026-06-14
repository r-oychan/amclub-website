import type { Core } from '@strapi/strapi';

// Single types → their fixed frontend path.
const SINGLE_TYPE_PATHS: Record<string, string> = {
  'api::home-page.home-page': '/home',
  'api::about-page.about-page': '/about',
  'api::dining-page.dining-page': '/dining',
  'api::dining-promotions-page.dining-promotions-page': '/dining/dining-promotion',
  'api::fitness-page.fitness-page': '/fitness',
  'api::kids-page.kids-page': '/kids',
  'api::event-spaces-page.event-spaces-page': '/event-spaces',
  'api::membership-page.membership-page': '/membership',
  'api::joining-fees-page.joining-fees-page': '/membership/joining-fees',
  'api::referral-page.referral-page': '/membership/referal',
  'api::reciprocal-clubs-page.reciprocal-clubs-page': '/membership/reciprocal-clubs',
  'api::niche-group-membership-page.niche-group-membership-page': '/membership/niche-group-membership',
  'api::start-application-page.start-application-page': '/membership/start-application',
  'api::whats-on-page.whats-on-page': '/whats-on',
  'api::news-page.news-page': '/home-sub/news',
  'api::gallery-page.gallery-page': '/home-sub/gallery',
  'api::contact-us-page.contact-us-page': '/home-sub/contact-us',
  'api::advertise-with-us-page.advertise-with-us-page': '/home-sub/advertise-with-us',
  'api::faq-page.faq-page': '/faq',
};

// Collection types → frontend path built from the entry's slug.
const COLLECTION_TYPE_PATHS: Record<string, (slug: string) => string> = {
  'api::event.event': (s) => `/whats-on/${s}`,
  'api::restaurant.restaurant': (s) => `/dining/${s}`,
  'api::fitness-facility.fitness-facility': (s) => `/fitness/${s}`,
  'api::event-space.event-space': (s) => `/event-spaces/${s}`,
  'api::kids-experience.kids-experience': (s) => `/kids/${s}`,
  'api::news-article.news-article': (s) => `/home-sub/club-news/${s}`,
};

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  // Live Preview: opens the matching frontend page inside the admin. The handler
  // returns a URL carrying the read-only PREVIEW_TOKEN + status so the SPA can
  // fetch drafts (see frontend/src/lib/api.ts). allowedOrigins lets the admin
  // embed that origin in the preview iframe.
  preview: {
    enabled: true,
    config: {
      allowedOrigins: [env('PUBLIC_SITE_URL', 'http://localhost:5173'), 'http://localhost:5173'],
      async handler(
        uid: string,
        { documentId, status }: { documentId: string; status?: string },
      ): Promise<string | null> {
        const site = env('PUBLIC_SITE_URL', 'http://localhost:5173').replace(/\/$/, '');
        const token = env('PREVIEW_TOKEN', '');

        let path: string | null = SINGLE_TYPE_PATHS[uid] ?? null;
        if (!path && COLLECTION_TYPE_PATHS[uid]) {
          const doc = await strapi
            .documents(uid as never)
            .findOne({ documentId, fields: ['slug'], status: 'draft' });
          const slug = (doc as { slug?: string } | null)?.slug;
          if (slug) path = COLLECTION_TYPE_PATHS[uid](slug);
        }
        if (!path) return null; // no public page for this type → no preview button

        const url = new URL(site + path);
        url.searchParams.set('status', status === 'published' ? 'published' : 'draft');
        if (token) url.searchParams.set('preview', token);
        return url.toString();
      },
    },
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});

export default config;
