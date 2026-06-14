#!/usr/bin/env node
// Seed the `site-config` single type (Global: Site Configuration).
// Creates and publishes the entry so the public `/api/site-config`
// endpoint resolves. `googleAnalyticsId` is intentionally left blank —
// each environment's GA4 Measurement ID is entered in /admin by the
// client (analytics stays off until a valid G-XXXX id is set).
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
    googleAnalyticsId: '',
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
