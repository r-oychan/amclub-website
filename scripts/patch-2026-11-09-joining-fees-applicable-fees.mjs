// 2026-11-09 — Client copy change on the joining-fees individual cards:
//   - breakdown heading "Application Fees" → "Applicable Fees (w/ GST)"
//   - Transferable Membership line "Transfer Fee: $33,655" → "Transfer Fee: $39,240"
// seed-joining-fees-page.mjs carries the same values for fresh envs.
//
// Run: node scripts/patch-2026-11-09-joining-fees-applicable-fees.mjs --env=dev [--dry-run]
//
// Only `individualCards` is sent, so every other field edited in /admin is
// left untouched. Only the exact old values are replaced; anything an editor
// has since changed is kept as is.

import { initEnv, api, isDryRun } from './seed-helpers.mjs';

const ctx = initEnv();
const DRY = isDryRun();
const OLD_LABEL = 'Application Fees';
const NEW_LABEL = 'Applicable Fees (w/ GST)';
const OLD_TRANSFER = 'Transfer Fee: $33,655';
const NEW_TRANSFER = 'Transfer Fee: $39,240';

const page = (await api(ctx, '/joining-fees-page'))?.data;
if (!page) throw new Error('No joining-fees-page entry — run seed-joining-fees-page.mjs first');

let changed = 0;
const cards = (page.individualCards ?? []).map(({ id: _id, ...card }) => {
  const next = { ...card };
  if (!card.breakdownLabel || card.breakdownLabel === OLD_LABEL) next.breakdownLabel = NEW_LABEL;
  if (card.name === 'Transferable Membership' && card.breakdown) {
    next.breakdown = card.breakdown
      .split('\n')
      .map((line) => (line.trim() === OLD_TRANSFER ? NEW_TRANSFER : line))
      .join('\n');
  }
  if (next.breakdownLabel !== card.breakdownLabel || next.breakdown !== card.breakdown) {
    changed += 1;
    console.log(`  ${card.name}: label "${next.breakdownLabel}"${next.breakdown !== card.breakdown ? `, breakdown → ${JSON.stringify(next.breakdown)}` : ''}`);
  }
  return next;
});
console.log(`${changed} of ${cards.length} individual cards to update`);
if (!changed) process.exit(0);
if (DRY) { console.log('[dry] PUT /joining-fees-page (individualCards)'); process.exit(0); }

// Strapi v5 REST writes publish by default.
await api(ctx, '/joining-fees-page', { method: 'PUT', body: { data: { individualCards: cards } } });
console.log('✓ published');
