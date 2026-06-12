#!/usr/bin/env node
// Migrate the niche-group tier cards' benefits from the repeatable `bullets`
// component (one admin row per line — tedious at 5–10 bullets per card) to the
// new `benefitsText` single text field (one benefit per line). The renderer
// prefers benefitsText, so the page output is identical; the old bullet rows
// are cleared so editors see exactly one populated field.
//
// Requires the benefitsText schema field to be DEPLOYED on the target env.
// Idempotent. Usage:
//   node scripts/patch-2026-06-12-benefits-text.mjs --env=dev [--dry-run]
//   node scripts/patch-2026-06-12-benefits-text.mjs --env=uat

import { initEnv, api, isDryRun } from './seed-helpers.mjs';

const DRY = isDryRun();
const ctx = initEnv();

// Rebuild for PUT: media → id, component ids stripped, __component pinned
// first (Strapi 5.46 key-order validation for dynamic zones).
function clean(v) {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === 'object') {
    if (typeof v.mime === 'string' && typeof v.url === 'string') return v.id;
    const out = {};
    if (typeof v.__component === 'string') out.__component = v.__component;
    for (const [k, val] of Object.entries(v)) {
      if (k === 'id' || k === '__component') continue;
      const c = clean(val);
      if (c !== undefined) out[k] = c;
    }
    return out;
  }
  return v;
}

(async () => {
  console.log(`Patch target: ${ctx.BASE}`);
  const { data } = await api(ctx, '/niche-group-membership-page');
  if (!data) throw new Error('singleton not found / not published');

  let migrated = 0;
  const body = (data.body ?? []).map((block) => {
    const b = clean(block);
    if (b.__component === 'blocks.priced-card-grid') {
      b.items = (b.items ?? []).map((it) => {
        if (it.benefitsText || !it.bullets?.length) return it; // already migrated / nothing to do
        migrated += 1;
        return {
          ...it,
          benefitsText: it.bullets.map((x) => x.text).filter(Boolean).join('\n'),
          bullets: [],
        };
      });
    }
    return b;
  });

  if (DRY) { console.log(`  [dry] would migrate ${migrated} card(s) to benefitsText`); return; }
  if (!migrated) { console.log('  nothing to migrate (already done)'); return; }
  await api(ctx, '/niche-group-membership-page?status=published', { method: 'PUT', body: { data: { body } } });
  console.log(`  ↻ migrated ${migrated} tier card(s) to benefitsText, published`);
  console.log('\n✓ Done.');
})().catch((e) => { console.error(e); process.exit(1); });
