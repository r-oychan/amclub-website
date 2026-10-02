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
STRAPI_INTERNAL_URL=https://dev.amclub.org.sg PUBLIC_SITE_URL=http://localhost:3000 npm run start
```

Local `next start` serves the Next homepage and API/upload rewrites; other frontend routes and branding assets are served by nginx in deployment. Use the deployed dev site to verify cross-app navigation.

See `../SPECS.md` for routing, request-time freshness, preview isolation and rollback. The POC intentionally uses uncached SSR. CMS downtime produces an error instead of static marketing/price fallbacks.
