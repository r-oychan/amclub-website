import type { Core } from '@strapi/strapi';

// Plugin config — values flow from process.env (set by Pulumi → Container App
// for deployed envs, or by `cms/.env` locally). Upload routes media to Azure
// Blob Storage when STORAGE_ACCOUNT is set; SSO exposes a "Microsoft" button
// on /admin login when the three AZUREAD_* keys are populated. Both plugins
// gracefully no-op when their env vars are absent (e.g. local dev without
// the optional Azure setup).
const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  const plugins: Core.Config.Plugin = {};

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
