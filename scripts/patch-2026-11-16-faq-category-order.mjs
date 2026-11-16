// 2026-11-16 — List "TAC Connect" above "General" on /faq, matching prod
// (TAC Connect 6, General 7). The seeds carry the same values for fresh envs.
//
// Run: node scripts/patch-2026-11-16-faq-category-order.mjs --env=dev [--dry-run]
//
// Only `displayOrder` is sent; categories already in place are left alone.

import { initEnv, api, isDryRun, findOneBySlug } from './seed-helpers.mjs';

const ctx = initEnv();
const DRY = isDryRun();
const ORDER = { 'tac-connect': 6, general: 7 };

for (const [slug, displayOrder] of Object.entries(ORDER)) {
  const cat = await findOneBySlug(ctx, 'faq-categories', slug);
  if (!cat) { console.warn(`  ! no "${slug}" category — skipped`); continue; }
  if (cat.displayOrder === displayOrder) { console.log(`  = ${cat.name}: already ${displayOrder}`); continue; }
  console.log(`  ~ ${cat.name}: ${cat.displayOrder} → ${displayOrder}`);
  if (DRY) continue;
  // Strapi v5 REST writes publish by default.
  await api(ctx, `/faq-categories/${cat.documentId}`, { method: 'PUT', body: { data: { displayOrder } } });
}
console.log(DRY ? '[dry] done' : '✓ done');
