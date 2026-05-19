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
  // Override default `secure: process.env.NODE_ENV === 'production'`. The
  // strapi-plugin-sso OAuth flow writes to ctx.session (codeVerifier, state)
  // and then triggers a session cookie flush. Koa refuses to set Secure-flag
  // cookies when ctx.secure is false, and ctx.secure depends on the
  // X-Forwarded-Proto chain (Azure ingress → nginx → Strapi) being trusted
  // end-to-end. Forcing secure: false bypasses the chain — the cookie is
  // still httpOnly + signed, and HTTPS is enforced by Azure at the public
  // edge for amclub.org.sg / dev.amclub.org.sg / uat.amclub.org.sg
  // regardless.
  {
    name: 'strapi::session',
    config: {
      secure: false,
      sameSite: 'lax',
    },
  },
  'strapi::favicon',
  'strapi::public',
];

export default config;
