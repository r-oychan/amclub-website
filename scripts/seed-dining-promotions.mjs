#!/usr/bin/env node
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
import { initEnv, api, findOneBySlug, uploadAll, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY = isDryRun();
const ctx = initEnv();

const PROMO_DIR = join(ROOT, 'media', 'dining', 'promotions');

// Promotions to seed. `imageFile` resolves against media/dining/promotions/.
// Use absolute kebab-case filenames so paths stay portable across environments.
const PROMOTIONS = [
  {
    title: 'Grillhouse Seasonal Brews',
    slug: 'grillhouse-seasonal-brews',
    summary: 'A curated rotation of craft beers, paired with Grillhouse classics.',
    restaurantTag: 'grillhouse',
    validFrom: '2026-05-01',
    validTo: '2026-05-31',
    imageFile: 'grillhouse-seasonal-brews.jpg',
    ctas: [{ label: 'Reserve a Table', icon: 'arrow' }],
    order: 1,
  },
];

async function ensurePromotion(p, imageId) {
  if (DRY) { console.log(`  [dry] upsert promotion: ${p.title}`); return; }
  const existing = await findOneBySlug(ctx, 'dining-promotions', p.slug);
  const payload = {
    title: p.title,
    slug: p.slug,
    summary: p.summary,
    restaurantTag: p.restaurantTag,
    validFrom: p.validFrom,
    validTo: p.validTo,
    image: imageId,
    order: p.order ?? 0,
    ctas: (p.ctas ?? []).slice(0, 2).map((c) => ({
      label: c.label,
      href: c.href ?? '#',
      variant: c.variant ?? 'primary',
      icon: c.icon ?? 'arrow',
    })),
    publishedAt: new Date().toISOString(),
  };
  if (existing) {
    const resp = await api(ctx, `/dining-promotions/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    return resp.data;
  }
  const resp = await api(ctx, '/dining-promotions', { method: 'POST', body: { data: payload } });
  return resp.data;
}

async function upsertDiningPromotionsPage() {
  const data = {
    title: 'Monthly Dining Deals',
    subtitle: `${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })} Dining Promotions`,
    hero: {
      heading: 'Monthly Dining Deals',
      variant: 'compact',
      titlePosition: 'bottom-left',
    },
    promotionsHeading: 'Available Promotions',
    promotionsIntro: 'Browse this month\'s dining promotions across the Club, filtered by venue.',
    finalCta: {
      heading: 'Savor the Experience',
      body: 'Become a Member to explore our restaurants, where a variety of cuisines and thoughtfully crafted dining experiences await to delight every palate.',
      variant: 'light',
      ctas: [
        { label: 'Explore Membership', href: '/membership', variant: 'primary', icon: 'arrow' },
        { label: 'Book a Club Tour',   href: '#',           variant: 'outline', icon: 'arrow' },
      ],
    },
  };
  if (DRY) { console.log('  [dry] PUT /dining-promotions-page payload size:', JSON.stringify(data).length, 'chars'); return; }
  const r = await api(ctx, '/dining-promotions-page', { method: 'PUT', body: { data } });
  return r.data;
}

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);

  // Auto-discover any extra flyers dropped into media/dining/promotions/.
  // Filename → slug + restaurantTag inferred from "<restaurant>_<title>.<ext>"
  // ie "grillhouse-seasonal-brews.jpg" → tag='grillhouse'. Anything that doesn't
  // start with a known prefix is treated as "club-wide".
  const discovered = readdirSync(PROMO_DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  const known = new Set(PROMOTIONS.map((p) => p.imageFile));
  for (const f of discovered) if (!known.has(f)) {
    const base = f.replace(/\.[^.]+$/, '');
    const tagMatch = base.match(/^(club-wide|central|grillhouse|the-2nd-floor|tradewinds|union-bar|the-gourmet-pantry)[-_](.+)$/);
    const tag = tagMatch ? tagMatch[1] : 'club-wide';
    const slug = base;
    PROMOTIONS.push({
      title: base.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      slug, summary: '', restaurantTag: tag, imageFile: f,
      validFrom: null, validTo: null, ctas: [], order: 99,
    });
  }

  console.log('\n[1/3] Uploading promotion flyers…');
  const media = await uploadAll(ctx, PROMO_DIR, PROMOTIONS.map((p) => p.imageFile), { dry: DRY });

  console.log('\n[2/3] Upserting promotion entries…');
  for (const p of PROMOTIONS) {
    await ensurePromotion(p, media[p.imageFile]?.id ?? null);
    console.log(`  ✓ ${p.title}`);
  }

  console.log('\n[3/3] Upserting dining-promotions-page single type…');
  await upsertDiningPromotionsPage();
  console.log('  ✓ dining-promotions-page upserted');

  console.log('\nDone.');
}
main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
