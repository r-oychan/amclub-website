#!/usr/bin/env node
// Migrate The Gourmet Pantry's "From Our Cellar to Your Home" promo section out
// of the subpages.ts fallback into the CMS. The restaurant schema gained a
// `promoCards` component field (blocks.promo-card-grid); this fills it for the
// the-gourmet-pantry entry. Images (previously external Framer URLs) are uploaded
// from media/dining/the-gourmet-pantry/ so content stays env-agnostic.
//
// SET-ONLY-IF-EMPTY: skips when the entry already has promoCards, so re-runs and
// any later admin edits are preserved.
//
// Usage:
//   node scripts/patch-2026-06-15-gourmet-promocards.mjs --env=dev [--dry-run]
//   node scripts/patch-2026-06-15-gourmet-promocards.mjs --env=uat

import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, uploadFile, findOneBySlug, publishDocument, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY = isDryRun();
const ctx = initEnv();
const SLUG = 'the-gourmet-pantry';
const IMG_DIR = join(ROOT, 'media', 'dining', 'the-gourmet-pantry');

(async () => {
  console.log(`Patch target: ${ctx.BASE}`);
  const existing = await findOneBySlug(ctx, 'restaurants', SLUG);
  if (!existing) { console.log(`  ! ${SLUG} not found — run the dining seed first`); return; }
  if (existing.promoCards) {
    console.log(`  ✓ ${SLUG} already has promoCards — set-only-if-empty, skipping`);
    return;
  }
  if (DRY) { console.log('  [dry] upload 2 promo images; PUT promoCards onto the-gourmet-pantry'); return; }

  const uncorked = await uploadFile(ctx, join(IMG_DIR, 'uncorked-promo.jpg'), { path: 'dining/the-gourmet-pantry' });
  const bottles = await uploadFile(ctx, join(IMG_DIR, 'bottles2go-promo.jpg'), { path: 'dining/the-gourmet-pantry' });

  const promoCards = {
    heading: 'From Our Cellar to Your Home',
    description:
      'Shop a curated selection of wines, available for convenient delivery or takeaway. Become an UNCORKED Member for first access to exclusive wine offers and privileges.',
    variant: 'card',
    cards: [
      {
        title: 'UNCORKED',
        subtitle: 'An exclusive world for wine lovers.',
        image: uncorked?.id ?? null,
        cta: { label: 'Learn More', href: '/dining/uncorked', variant: 'text', icon: 'arrow' },
      },
      {
        title: 'Bottles2Go!',
        subtitle: "Bringing the Club's cellar to your home with a curated range of premium wines.",
        image: bottles?.id ?? null,
        cta: { label: 'Order Now', href: 'https://amclub.jotform.com/252638314015956', isExternal: true, variant: 'text', icon: 'arrow' },
      },
    ],
  };

  const resp = await api(ctx, `/restaurants/${existing.documentId}`, {
    method: 'PUT',
    body: { data: { promoCards, publishedAt: new Date().toISOString() } },
  });
  await publishDocument(ctx, 'restaurants', resp?.data?.documentId ?? existing.documentId);
  console.log(`  ✓ promoCards set on ${SLUG} (uncorked=${uncorked?.id}, bottles2go=${bottles?.id})`);
  console.log('\n✓ Done.');
})().catch((e) => { console.error(e); process.exit(1); });
