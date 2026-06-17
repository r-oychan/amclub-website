#!/usr/bin/env node
// Insert the missing /dining/essentials page as a `restaurants` entry. Essentials
// is a retail/services outlet; it was never added to the dining seed's RESTAURANTS
// array, so no CMS entry existed and the page fell through to the hardcoded
// frontend/src/data/subpages.ts fallback. seed-dining-page.mjs now includes it for
// fresh instances; this targeted CREATE-ONLY insert backfills the existing
// dev/uat/prod envs without re-PUTting the other restaurants.
//
// Content mirrors the subpages.ts essentials block. Image reuses the already-
// uploaded media/services/essentials.jpeg (shared with the dining-page Essentials
// promo section) — uploadFile dedupes by name, so no duplicate blob.
//
// CREATE-ONLY: skips when the slug already exists, so it can never overwrite
// content editors may have entered since.
//
// Usage:
//   node scripts/patch-2026-06-15-essentials-page.mjs --env=dev [--dry-run]
//   node scripts/patch-2026-06-15-essentials-page.mjs --env=uat
//   node scripts/patch-2026-06-15-essentials-page.mjs --env=prod

import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, uploadFile, findOneBySlug, publishDocument, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY = isDryRun();
const ctx = initEnv();

const ESSENTIALS = {
  name: 'Essentials',
  slug: 'essentials',
  cuisineType: 'Retail',
  cuisineIconSlug: null,
  menuUrl: null,
  description:
    'Essentials is your convenient one-stop shop for everyday needs – featuring exclusive items imported directly from the US, as well as pantry staples, seasonal treats, premium beverages, baking supplies, and laundry services.\n\nEssentials2Go!, our online platform, makes shopping effortless – available for home delivery or self-collection at Essentials, whichever suits you best.',
  logo: null,
  dressCode: null,
  order: 7,
  ctas: [
    { label: 'Essentials2Go!', href: 'https://amclub.jotform.com/253312807189965', isExternal: true, variant: 'primary', icon: 'arrow' },
  ],
  operatingHoursSections: [
    { title: 'Opening Hours', rows: [{ dayRange: 'Daily', time: '8:00 AM - 8:00 PM' }] },
  ],
  locationContact: { locationLevel: 'Level 1', phone: '6739 4332', email: 'essentials@amclub.org.sg' },
  extraSections: [],
};

(async () => {
  console.log(`Patch target: ${ctx.BASE}`);

  const existing = await findOneBySlug(ctx, 'restaurants', ESSENTIALS.slug);
  if (existing) {
    console.log(`  ✓ ${ESSENTIALS.slug} already exists (documentId=${existing.documentId}) — create-only, skipping`);
    return;
  }

  if (DRY) {
    console.log('  [dry] upload essentials.jpeg; POST /restaurants (published)');
    return;
  }

  const up = await uploadFile(ctx, join(ROOT, 'media', 'services', 'essentials.jpeg'));
  const image = up?.id ?? null;
  console.log(`  ✓ image resolved (id=${image})`);

  const resp = await api(ctx, '/restaurants', {
    method: 'POST',
    body: { data: { ...ESSENTIALS, image, publishedAt: new Date().toISOString() } },
  });
  const documentId = resp.data?.documentId;
  if (documentId) await publishDocument(ctx, 'restaurants', documentId);
  console.log(`  ✓ created ${ESSENTIALS.slug} (documentId=${documentId}), published`);
  console.log('\n✓ Done.');
})().catch((e) => { console.error(e); process.exit(1); });
