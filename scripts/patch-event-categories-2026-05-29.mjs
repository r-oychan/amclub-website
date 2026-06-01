// Reclassify 8 events from the 2026-05-22 batch to their final categories.
//
// Run:  SEED_ENV=prod node scripts/patch-event-categories-2026-05-29.mjs
//       node scripts/patch-event-categories-2026-05-29.mjs --env=dev
//       node scripts/patch-event-categories-2026-05-29.mjs --env=prod --dry-run
//
// Idempotent: looks up each event by slug, compares current category to
// the desired one, and only PUTs when they differ.

import { initEnv, api, findOneBySlug } from './seed-helpers.mjs';

const ctx = initEnv();
const DRY = process.argv.includes('--dry-run');

// slug → desired category slug (dining | kids | fitness-wellness | member-engagement | thinkspace)
const ASSIGNMENTS = {
  'basketball-finals-live-screening-union-bar-2026': 'dining',
  'football-fever-night-union-bar-2026':              'dining',
  'smokin-sundays-grillhouse-2026-06':                'dining',
  'sip-and-serve-french-open-2026':                   'fitness-wellness',
  'tiny-art-explorers-2026-06':                       'kids',
  'heroes-and-sidekicks-fathers-day-2026':            'kids',
  'camp-eagle-explorers-summer-2026':                 'kids',
  'fourth-of-july-celebration-2026':                  'member-engagement',
};

const catCache = new Map();
async function categoryId(slug) {
  if (catCache.has(slug)) return catCache.get(slug);
  const c = await findOneBySlug(ctx, 'event-categories', slug);
  if (!c) throw new Error(`event-category slug=${slug} not found on this env`);
  catCache.set(slug, c.documentId);
  return c.documentId;
}

async function reclassify(eventSlug, desiredCatSlug) {
  const r = await api(
    ctx,
    `/events?filters[slug][$eq]=${encodeURIComponent(eventSlug)}&populate[category]=true&publicationState=preview&pagination[limit]=1`,
  );
  const e = r?.data?.[0];
  if (!e) {
    console.log(`  ✗ ${eventSlug.padEnd(50)} (event not found on this env — skipped)`);
    return;
  }
  const currentCatSlug = e.category?.slug || '(none)';
  if (currentCatSlug === desiredCatSlug) {
    console.log(`  = ${eventSlug.padEnd(50)} already ${desiredCatSlug}`);
    return;
  }
  const catDocId = await categoryId(desiredCatSlug);
  if (DRY) {
    console.log(`  [dry] ${eventSlug.padEnd(50)} ${currentCatSlug} → ${desiredCatSlug}`);
    return;
  }
  await api(ctx, `/events/${e.documentId}`, {
    method: 'PUT',
    body: { data: { category: catDocId } },
  });
  console.log(`  ✓ ${eventSlug.padEnd(50)} ${currentCatSlug} → ${desiredCatSlug}`);
}

async function main() {
  console.log(`[patch-event-categories-2026-05-29] target=${ctx.BASE} dry=${DRY}`);
  for (const [eventSlug, desiredCatSlug] of Object.entries(ASSIGNMENTS)) {
    try { await reclassify(eventSlug, desiredCatSlug); }
    catch (e) { console.error(`  ✗ ${eventSlug}: ${e.message}`); }
  }
  console.log('— done —');
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
