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
  'api::venue.venue',
  'api::facility.facility',
  'api::committee-member.committee-member',
  'api::faq-item.faq-item',
  'api::testimonial.testimonial',
  'api::gallery-album.gallery-album',
];

// Plugin config — values flow from process.env (set by Pulumi → Container App
// for deployed envs, or by `cms/.env` locally). Upload routes media to Azure
// Blob Storage when STORAGE_ACCOUNT is set; SSO exposes a "Microsoft" button
// on /admin login when the three AZUREAD_* keys are populated. Both plugins
// gracefully no-op when their env vars are absent (e.g. local dev without
// the optional Azure setup).
const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  const plugins: Core.Config.Plugin = {};

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

  // Upload — Azure Blob provider (only when STORAGE_ACCOUNT is set)
  if (env('STORAGE_ACCOUNT')) {
    plugins.upload = {
      config: {
        provider: 'strapi-provider-upload-azure-storage',
        providerOptions: {
          authType: 'default',
          account: env('STORAGE_ACCOUNT'),
          accountKey: env('STORAGE_ACCOUNT_KEY'),
          serviceBaseURL: env('STORAGE_URL'),
          containerName: env('STORAGE_CONTAINER_NAME', 'media'),
          defaultPath: 'uploads',
          cdnBaseURL: env('STORAGE_CDN_URL') || undefined,
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
