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

// The PUBLIC host that media URLs are actually rewritten to (STORAGE_CDN_URL /
// PUBLIC_SITE_URL, e.g. amclub.org.sg). The upload provider stores absolute URLs
// on this host, NOT the raw blob host — so the admin loads thumbnails from here.
// The admin itself may be served from a different host (e.g. www.amclub.org.sg),
// in which case 'self' does NOT cover the apex media host and the browser blocks
// every thumbnail under CSP. Add it explicitly. Per-env, so dev/uat/prod each get
// their own apex.
const CDN_HOST = (() => {
  const url = process.env.STORAGE_CDN_URL || process.env.PUBLIC_SITE_URL;
  if (!url) return undefined;
  try { return new URL(url).host; } catch { return undefined; }
})();

const IMG_HOSTS = ["'self'", 'data:', 'blob:', 'market-assets.strapi.io', STORAGE_HOST, CDN_HOST].filter(Boolean);
const MEDIA_HOSTS = ["'self'", 'data:', 'blob:', STORAGE_HOST, CDN_HOST].filter(Boolean);

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
          'img-src': IMG_HOSTS,
          'media-src': MEDIA_HOSTS,
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
  // Converts `path` on POST /api/upload into a real Media Library folder
  // (Strapi v5's upload_folder table). Without this, files uploaded with
  // a blob path still show flat under "API Uploads" in the admin UI even
  // though the blob itself lives at uploads/<section>/<page>/...
  // See cms/src/middlewares/upload-path-to-folder.ts.
  { name: 'global::upload-path-to-folder' },
];

export default config;
