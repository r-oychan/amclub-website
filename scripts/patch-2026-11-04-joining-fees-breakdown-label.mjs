// 2026-11-04 — Rename the "Breakdown" heading on the joining-fees
// individual membership cards to "Application Fees". The heading is now
// the `breakdownLabel` field on shared.priced-card (added in the
// accompanying commit); seed-joining-fees-page.mjs sets it for fresh envs,
// this script fills it in on envs that already have content.
//
// Run: node scripts/patch-2026-11-04-joining-fees-breakdown-label.mjs --env=dev [--dry-run]
//
// Only `individualCards` is sent, so every other field edited in /admin is
// left untouched. Cards that already have a label keep it.

import { initEnv, api, isDryRun } from './seed-helpers.mjs';

const ctx = initEnv();
const DRY = isDryRun();
const LABEL = 'Application Fees';

const page = (await api(ctx, '/joining-fees-page'))?.data;
if (!page) throw new Error('No joining-fees-page entry — run seed-joining-fees-page.mjs first');

const cards = (page.individualCards ?? []).map(({ id: _id, ...card }) => ({
  ...card,
  breakdownLabel: card.breakdownLabel || LABEL,
}));
const changed = (page.individualCards ?? []).filter((c) => !c.breakdownLabel).length;
console.log(`${changed} of ${cards.length} individual cards need "${LABEL}"`);
if (!changed) process.exit(0);
if (DRY) { console.log('[dry] PUT /joining-fees-page (individualCards)'); process.exit(0); }

// Strapi v5 REST writes publish by default.
await api(ctx, '/joining-fees-page', { method: 'PUT', body: { data: { individualCards: cards } } });
console.log('✓ published');
