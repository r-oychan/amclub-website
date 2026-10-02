# Next.js homepage POC

Node 24 + npm. Install dependencies in both `frontend/` and `next-home/`.

```sh
cd next-home
npm ci
STRAPI_INTERNAL_URL=https://dev.amclub.org.sg PUBLIC_SITE_URL=http://localhost:3000 npm run dev
```

`STRAPI_INTERNAL_URL` is server-only. Prefer the environment being tested; pointing it at prod performs read-only published REST requests. Set `PREVIEW_TOKEN` only when testing that CMS environment's draft preview. Never commit environment values.

```sh
npm run typecheck
npm run lint
npm run build
npm run test:ssr
STRAPI_INTERNAL_URL=https://dev.amclub.org.sg PUBLIC_SITE_URL=http://localhost:3000 npm run start
```

Local `npm run start` launches the standalone server and copies static/branding assets into its output. It serves the homepage and API/upload rewrites; other frontend routes are served by nginx in deployment. Use the deployed dev site to verify cross-app navigation.

See `../SPECS.md` for routing, request-time freshness, preview isolation and rollback. The POC intentionally uses uncached SSR. CMS downtime produces an error instead of static marketing/price fallbacks.

After deployment: `npm run verify:ssr -- https://dev.amclub.org.sg`. The fixture-backed SSR test verifies request-time freshness and authenticated draft isolation without writing to a CMS.
