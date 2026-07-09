import type { Core } from '@strapi/strapi';

// Project-level default content types pushed to the ElevenLabs KB. The
// runtime allow-list in the plugin's settings page overrides this once set.
const DEFAULT_ELEVENLABS_CONTENT_TYPES = [
  'api::home-page.home-page',
  'api::about-page.about-page',
  'api::dining-page.dining-page',
  'api::fitness-page.fitness-page',
  'api::kids-page.kids-page',
  'api::membership-page.membership-page',
  'api::event-spaces-page.event-spaces-page',
  'api::whats-on-page.whats-on-page',
  'api::contact-us-page.contact-us-page',
  'api::gallery-page.gallery-page',
  'api::news-page.news-page',
  'api::event.event',
  'api::news-article.news-article',
  'api::restaurant.restaurant',
  'api::event-space.event-space',
  'api::fitness-facility.fitness-facility',
  'api::kids-experience.kids-experience',
  'api::dining-promotion.dining-promotion',
  'api::joining-fees-page.joining-fees-page',
  'api::faq-page.faq-page',
  'api::reciprocal-clubs-page.reciprocal-clubs-page',
  'api::referral-page.referral-page',
  'api::start-application-page.start-application-page',
  'api::niche-group-membership-page.niche-group-membership-page',
  'api::committee-member.committee-member',
  'api::faq-item.faq-item',
  'api::testimonial.testimonial',
  'api::gallery-album.gallery-album',
  // Footer carries the Club Constitution + By-laws (legalLinks) plus the
  // Club's address/phone/email — none of which live on a page. Syncing it
  // harvests those PDFs into the KB and gives the chatbot contact info.
  // (Header is intentionally omitted: it links the same two PDFs, so adding
  // it would just create duplicate file docs.)
  'api::footer.footer',
];

// Plugin config — values flow from process.env (set by Pulumi → Container App
// for deployed envs, or by `cms/.env` locally). Upload routes media to Azure
// Blob Storage when STORAGE_ACCOUNT is set; SSO exposes a "Microsoft" button
// on /admin login when the three AZUREAD_* keys are populated. Both plugins
// gracefully no-op when their env vars are absent (e.g. local dev without
// the optional Azure setup).
const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  const plugins: Core.Config.Plugin = {};

  // Clone-entry — local plugin. Adds a "Clone entry" button on every
  // collection-type edit view; copies the source entry into a new draft
  // with slug -copy[-N] and title (copy). Media + relations referenced.
  plugins['clone-entry'] = {
    enabled: true,
    resolve: './src/plugins/clone-entry',
  };

  // ElevenLabs chatbot — local plugin. KB sync (publish-time + bulk),
  // admin settings page, and the public-config endpoint consumed by the
  // on-site widget all live in cms/src/plugins/elevenlabs-chatbot.
  plugins['elevenlabs-chatbot'] = {
    enabled: true,
    resolve: './src/plugins/elevenlabs-chatbot',
    config: {
      apiBaseUrl: env('ELEVENLABS_API_BASE_URL', 'https://api.elevenlabs.io'),
      agentId: env('ELEVENLABS_AGENT_ID'),
      apiKey: env('ELEVENLABS_API_KEY'),
      docNamePrefix: env('ELEVENLABS_DOC_PREFIX', 'am-club:'),
      publicSiteUrl: env('PUBLIC_SITE_URL', ''),
      autoSyncOnPublish: env.bool('ELEVENLABS_AUTOSYNC', true),
      defaultContentTypes: DEFAULT_ELEVENLABS_CONTENT_TYPES,
      mediaUrlPaths: ['cta.href', 'ctas[].href', 'hero.cta.href', 'menuUrl'],
    },
  };

  // Upload — Azure Blob provider, wrapped so per-upload `file.path` routes
  // into a subfolder under `defaultPath`. Seed scripts set `path` in the
  // upload form data (e.g. `dining/restaurants/central`) → blob lands at
  // `uploads/dining/restaurants/central/<hash>.<ext>`. Without the wrapper,
  // every blob lands in flat `uploads/` regardless of intent. Provider only
  // engages when STORAGE_ACCOUNT is set (deployed envs); local dev uses the
  // default filesystem provider.
  if (env('STORAGE_ACCOUNT')) {
    plugins.upload = {
      config: {
        provider: 'upload-azure-folders',
        providerOptions: {
          authType: 'default',
          account: env('STORAGE_ACCOUNT'),
          accountKey: env('STORAGE_ACCOUNT_KEY'),
          serviceBaseURL: env('STORAGE_URL'),
          containerName: env('STORAGE_CONTAINER_NAME', 'media'),
          defaultPath: 'uploads',
          cdnBaseURL: env('STORAGE_CDN_URL') || undefined,
          // Strip the container segment from the public URL when cdnBaseURL is
          // set, so uploads resolve as `<site>/uploads/...` (served by nginx's
          // /uploads proxy) rather than `<site>/media/uploads/...`. Without
          // this the provider keeps `/media/` and admin-uploaded images 404.
          removeCN: env('STORAGE_CDN_URL') ? 'true' : undefined,
        },
      },
    };
  }

  // SSO — Microsoft Entra ID via strapi-plugin-sso. The plugin internally
  // gates each provider on its CLIENT_ID + SECRET + TENANT_ID being all
  // present, so we always pass the keys through; empty values just hide the
  // "Microsoft" button.
  plugins['strapi-plugin-sso'] = {
    enabled: true,
    config: {
      REMEMBER_ME: false,
      AZUREAD_TENANT_ID: env('AZUREAD_TENANT_ID', ''),
      AZUREAD_OAUTH_CLIENT_ID: env('AZUREAD_OAUTH_CLIENT_ID', ''),
      AZUREAD_OAUTH_CLIENT_SECRET: env('AZUREAD_OAUTH_CLIENT_SECRET', ''),
      AZUREAD_SCOPE: env('AZUREAD_SCOPE', 'user.read'),
      AZUREAD_OAUTH_REDIRECT_URI: env(
        'AZUREAD_OAUTH_REDIRECT_URI',
        'http://localhost:1337/strapi-plugin-sso/azuread/callback',
      ),
    },
  };

  return plugins;
};

export default config;
