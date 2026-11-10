// 2026-11-09 — Client copy change on the joining-fees individual cards:
//   - breakdown heading "Application Fees" → "Applicable Fees (w/ GST)"
//   - Transferable Membership card → the values the client entered on prod:
//     fee $44,825, "Transfer Fee (w/GST): $39,240", "Operations Surcharge (w/ GST): $5,585"
// seed-joining-fees-page.mjs carries the same values for fresh envs.
//
// Run: node scripts/patch-2026-11-09-joining-fees-applicable-fees.mjs --env=dev [--dry-run]
//
// Only `individualCards` is sent, so every other field edited in /admin is
// left untouched. Only known old values are replaced; anything an editor has
// since changed is kept as is.

import { initEnv, api, isDryRun } from './seed-helpers.mjs';

const ctx = initEnv();
const DRY = isDryRun();
const OLD_LABEL = 'Application Fees';
const NEW_LABEL = 'Applicable Fees (w/ GST)';
const OLD_TRANSFER_BREAKDOWNS = [
  'Transfer Fee: $33,655\nOperations Surcharge: $5,585',
  'Transfer Fee: $39,240\nOperations Surcharge: $5,585',
];
const NEW_TRANSFER_BREAKDOWN = 'Transfer Fee (w/GST): $39,240\nOperations Surcharge (w/ GST): $5,585';
const NEW_TRANSFER_FEE = '$44,825';

const page = (await api(ctx, '/joining-fees-page'))?.data;
if (!page) throw new Error('No joining-fees-page entry — run seed-joining-fees-page.mjs first');

let changed = 0;
const cards = (page.individualCards ?? []).map(({ id: _id, ...card }) => {
  const next = { ...card };
  if (!card.breakdownLabel || card.breakdownLabel === OLD_LABEL) next.breakdownLabel = NEW_LABEL;
  if (card.name === 'Transferable Membership' && OLD_TRANSFER_BREAKDOWNS.includes(card.breakdown?.trim())) {
    next.breakdown = NEW_TRANSFER_BREAKDOWN;
    next.feeAmount = NEW_TRANSFER_FEE;
  }
  if (['breakdownLabel', 'breakdown', 'feeAmount'].some((k) => next[k] !== card[k])) {
    changed += 1;
    console.log(`  ${card.name}: label "${next.breakdownLabel}"${next.breakdown !== card.breakdown ? `, fee ${next.feeAmount}, breakdown → ${JSON.stringify(next.breakdown)}` : ''}`);
  }
  return next;
});
console.log(`${changed} of ${cards.length} individual cards to update`);
if (!changed) process.exit(0);
if (DRY) { console.log('[dry] PUT /joining-fees-page (individualCards)'); process.exit(0); }

// Strapi v5 REST writes publish by default.
await api(ctx, '/joining-fees-page', { method: 'PUT', body: { data: { individualCards: cards } } });
console.log('✓ published');
