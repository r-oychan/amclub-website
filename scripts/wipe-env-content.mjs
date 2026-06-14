#!/usr/bin/env node
// Delete EVERY entry of the clone-managed collection types on a NON-PROD env,
// in preparation for a full re-clone (scripts/clone-dev-to-uat-collections.mjs).
// Documented recipe: docs/strapi-patterns.md → "Resetting media on a non-prod env".
//
// Safety rails:
//   - refuses to run against anything but --env=dev or --env=uat
//   - dry-run by default; pass --yes to actually delete
//   - touches only /api/* content — admin users, tokens, core store survive
//
// Usage:
//   node scripts/wipe-env-content.mjs --env=uat          # dry-run (counts only)
//   node scripts/wipe-env-content.mjs --env=uat --yes    # delete for real

import { initEnv, api } from './seed-helpers.mjs';

const envArg = (process.argv.find((a) => a.startsWith('--env=')) || '').slice('--env='.length);
if (!['dev', 'uat'].includes(envArg)) {
  console.error('Refusing: --env must be dev or uat (never prod).');
  process.exit(1);
}
const YES = process.argv.includes('--yes');
const ctx = initEnv();

// Mirror of COLLECTIONS in clone-dev-to-uat-collections.mjs (keep in sync),
// reversed so dependents are deleted before their relation targets.
const PLURALS = [
  'kids-experiences',
  'fitness-facilities',
  'dining-promotions',
  'faq-items',
  'events',
  'event-spaces',
  'news-articles',
  'gallery-albums',
  'testimonials',
  'committee-members',
  'pilates-instructors',
  'tennis-coaches',
  'gym-trainers',
  'aquatics-coaches',
  'restaurants',
  'faq-categories',
  'event-categories',
];

// `filters[id][$gt]=0` bypasses the expiry filter (events/promotions hide past
// entries from plain listings); `status=draft` includes unpublished documents.
const PAGE_QS = 'filters[id][$gt]=0&status=draft&pagination[page]=1&pagination[pageSize]=100';

(async () => {
  console.log(`[wipe-env-content] target=${ctx.BASE} mode=${YES ? 'DELETE' : 'dry-run'}`);
  let total = 0;
  for (const plural of PLURALS) {
    let deleted = 0;
    for (;;) {
      let r;
      try { r = await api(ctx, `/${plural}?${PAGE_QS}`); }
      catch (e) { console.log(`  ${plural.padEnd(22)} list failed: ${e.message.slice(0, 70)}`); break; }
      const rows = r?.data ?? [];
      if (!rows.length) break;
      if (!YES) { deleted = r.meta?.pagination?.total ?? rows.length; break; }
      for (const row of rows) {
        try { await api(ctx, `/${plural}/${row.documentId}`, { method: 'DELETE' }); deleted++; }
        catch (e) { console.log(`  ! delete ${plural}/${row.documentId}: ${e.message.slice(0, 60)}`); }
      }
    }
    total += deleted;
    console.log(`  ${plural.padEnd(22)} ${YES ? 'deleted' : 'would delete'} ${deleted}`);
  }
  console.log(`\n${YES ? 'Deleted' : 'Would delete'} ${total} entries.${YES ? '' : ' Re-run with --yes to apply.'}`);
})().catch((e) => { console.error(e); process.exit(1); });
