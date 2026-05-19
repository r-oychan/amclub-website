import type { Core } from '@strapi/strapi';

// The Azure Blob host serving uploaded media (e.g.
// https://amclubuatdata.blob.core.windows.net). Pulled from the same env var
// the upload provider uses. Defaults to a wildcard if unset so dev/local
// boots don't crash; production stacks always have STORAGE_URL set.
const STORAGE_HOST = (() => {
  const url = process.env.STORAGE_URL;
  if (!url) return '*.blob.core.windows.net';
  try { return new URL(url).host; } catch { return url; }
})();

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  // Override default CSP so the admin can render thumbnails served by the
  // Azure Blob upload provider. Strapi's default CSP allows images only from
  // 'self' + data:, which makes every media-library row + every entry's media
  // field show a broken-image icon when the provider serves cross-origin URLs.
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io',
            STORAGE_HOST,
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            STORAGE_HOST,
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: ['http://localhost:5173', 'http://localhost:1337'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
