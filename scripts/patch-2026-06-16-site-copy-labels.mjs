#!/usr/bin/env node
// Seed the UI-chrome labels on the Global: Site Configuration singleton
// (loadMoreLabel / readMoreLabel / viewAlbumLabel). The frontend has code-level
// defaults, so this only makes the CMS the source of truth. SET-ONLY-IF-EMPTY.
//
// Usage: node scripts/patch-2026-06-16-site-copy-labels.mjs --env=dev [--dry-run]

import { initEnv, api, isDryRun } from './seed-helpers.mjs';

const ctx = initEnv();
const DRY = isDryRun();
const DEFAULTS = { loadMoreLabel: 'Load More', readMoreLabel: 'Read More', viewAlbumLabel: 'View Album' };

(async () => {
  console.log(`Patch target: ${ctx.BASE}`);
  const res = await api(ctx, '/site-config');
  const cfg = res?.data ?? {};
  const data = {};
  for (const [k, v] of Object.entries(DEFAULTS)) {
    if (!cfg[k]) data[k] = v;
  }
  if (Object.keys(data).length === 0) { console.log('  ✓ labels already set — skip'); return; }
  if (DRY) { console.log(`  [dry] would set ${Object.keys(data).join(', ')}`); return; }
  data.publishedAt = new Date().toISOString();
  await api(ctx, '/site-config?status=published', { method: 'PUT', body: { data } });
  console.log(`  ✓ site-config: set ${Object.keys(data).filter((k) => k !== 'publishedAt').join(', ')}`);
  console.log('\n✓ Done.');
})().catch((e) => { console.error(e); process.exit(1); });
