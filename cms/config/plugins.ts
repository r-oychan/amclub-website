import type { Core } from '@strapi/strapi';

// Upload plugin: route media uploads to Azure Blob Storage when STORAGE_ACCOUNT
// is configured (prod/staging). Falls back to Strapi's local provider for dev,
// which keeps files in cms/public/uploads.
const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  if (!env('STORAGE_ACCOUNT')) {
    return {};
  }
  return {
    upload: {
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
    },
  };
};

export default config;
