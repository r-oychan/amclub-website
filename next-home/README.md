# Next.js SSR website

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

Local `npm run start` launches the standalone server and copies static/branding assets into its output. It serves every website page plus API/upload rewrites. Deployed nginx serves Next for all frontend routes when the dev rollout switch is enabled.

See `../SPECS.md` for routing, request-time freshness, preview isolation and rollback. The migration intentionally uses uncached SSR. CMS downtime produces an error instead of static marketing/price fallbacks.

After deployment: `npm run verify:ssr -- https://dev.amclub.org.sg`. The fixture-backed SSR test verifies request-time freshness and authenticated draft isolation without writing to a CMS.

## Routing and rollback

All existing website pages now render CMS content on the server, including nested details and collection pages. Unknown content returns 404; the legacy Eagles Rewards URL redirects to Niche Group Membership. Typed initial data keeps hydration from replacing server content with a second fetch. Interactions remain client-side.

The `NEXT_HOME_ENABLED` switch remains dev-only. Disabling it returns nginx to Vite. Uat/prod continue using Vite until promotion is explicitly authorized. The CMS document middleware supports authenticated draft preview; configure the target environment's `PREVIEW_TOKEN`. Preview navigation retains the URL parameters.

Stop the production preview before rebuilding, then restart it after the build
finishes so standalone code and static chunks match. Use `npm run dev` while
editing; see `docs/troubleshooting.md` for stale-chunk symptoms.
