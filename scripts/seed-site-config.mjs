#!/usr/bin/env node
// Seed the `site-config` single type (Global: Site Configuration).
// Creates and publishes the entry so the public `/api/site-config`
// endpoint resolves. `googleTagId` is intentionally left blank — each
// environment's Google Tag ID (G-/GT-/AW- gtag or GTM- container) is entered
// in /admin by the client (analytics stays off until a valid id is set).
//
// Usage:
//   SEED_ENV=dev node scripts/seed-site-config.mjs --dry-run
//   SEED_ENV=dev node scripts/seed-site-config.mjs

import { api, publishDocument, isDryRun, initEnv } from './seed-helpers.mjs';

const DRY = isDryRun();
const ctx = initEnv();

(async () => {
  console.log(`Seed target: ${ctx.BASE}`);

  const payload = {
    googleTagId: '',
    siteName: 'The American Club Singapore',
    // Site-wide SEO fallbacks — any page whose own shared.seo fields are blank
    // inherits these (per-field). metaImage is left for editors to pick in /admin.
    defaultSeo: {
      metaTitle: 'The American Club Singapore',
      metaDescription:
        'A home away from home in the heart of Singapore — dining, fitness, family and community with a unique American and Canadian culture.',
    },
    publishedAt: new Date().toISOString(),
  };

  if (DRY) {
    console.log('  [dry] PUT /site-config payload:', JSON.stringify(payload));
    return;
  }

  await api(ctx, '/site-config', { method: 'PUT', body: { data: payload } });
  await publishDocument(ctx, 'site-config');
  console.log('  ↻ upserted site-config');
  console.log('\n✓ Done.');
})().catch((err) => { console.error(err); process.exit(1); });
