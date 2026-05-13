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

// Promotions to seed. `imageFiles` (or legacy `imageFile`) resolves against
// `media/dining/promotions/`. A single promotion may have multiple pages —
// the page renders them as a slider. Filenames follow
// `<restaurant-slug>-<promo-name>[-<page>].<ext>` so the auto-discovery
// fallback can tag and group them when this list falls out of date.
const PROMOTIONS = [
  {
    title: 'November Food & Beverage Specials',
    slug: 'november-food-and-beverage-specials',
    summary: 'A delicious lineup of classics and creative twists across The 2nd Floor, Grillhouse, Union Bar, Tradewinds and Central.',
    restaurantTag: 'club-wide',
    imageFiles: ['club-wide-november-food-and-beverage-specials.jpg'],
    ctas: [],
    order: 1,
  },
  {
    title: '12 Days of Christmas Special',
    slug: 'central-12-days-of-christmas-special',
    summary: 'Twelve days of festive treats, exclusive offers and a daily dose of surprises at Central.',
    restaurantTag: 'central',
    imageFiles: ['central-12-days-of-christmas-special.jpg'],
    ctas: [],
    order: 2,
  },
  {
    title: 'Central Daily Specials',
    slug: 'central-daily-specials',
    summary: 'Daily promotions on coffee, bagels, smoothies, wraps and weekend treats at Central.',
    restaurantTag: 'central',
    imageFiles: ['central-daily-specials.jpg'],
    ctas: [],
    order: 3,
  },
  {
    title: "Smokin' Sundays",
    slug: 'grillhouse-smokin-sundays',
    summary: 'A specially curated selection of grilled mains, hearty sides and BBQ flavors to wind down your Sunday at Grillhouse.',
    restaurantTag: 'grillhouse',
    imageFiles: ['grillhouse-smokin-sundays.jpg'],
    ctas: [],
    order: 4,
  },
  {
    title: 'Seasonal Brews',
    slug: 'grillhouse-seasonal-brews',
    summary: 'A curated rotation of craft beers, paired with Grillhouse classics.',
    restaurantTag: 'grillhouse',
    imageFiles: ['grillhouse-seasonal-brews.jpg'],
    ctas: [],
    order: 5,
  },
  {
    title: 'The Ultimate Happy Hour',
    slug: 'the-2nd-floor-ultimate-happy-hour',
    summary: '1-for-1 drinks by the glass on Tuesdays to Fridays, 5:30 – 7:00 PM. Free wine corkage every Tuesday.',
    restaurantTag: 'the-2nd-floor',
    imageFiles: ['the-2nd-floor-ultimate-happy-hour.jpg'],
    ctas: [],
    order: 6,
  },
  {
    title: 'Salad Bar Buffet',
    slug: 'tradewinds-salad-bar-buffet',
    summary: 'All-you-can-eat salad bar every Monday to Wednesday, 11:00 AM – 2:30 PM, with beverage specials.',
    restaurantTag: 'tradewinds',
    imageFiles: ['tradewinds-salad-bar-buffet.jpg'],
    ctas: [],
    order: 7,
  },
];

function imageFilesOf(p) {
  if (Array.isArray(p.imageFiles) && p.imageFiles.length) return p.imageFiles;
  if (p.imageFile) return [p.imageFile];
  return [];
}

async function ensurePromotion(p, mediaByFile) {
  const files = imageFilesOf(p);
  const ids = files.map((f) => mediaByFile[f]?.id).filter((x) => x != null);
  if (DRY) { console.log(`  [dry] upsert promotion: ${p.title} (${ids.length} page(s))`); return; }
  const existing = await findOneBySlug(ctx, 'dining-promotions', p.slug);
  const payload = {
    title: p.title,
    slug: p.slug,
    summary: p.summary,
    restaurantTag: p.restaurantTag,
    validFrom: p.validFrom,
    validTo: p.validTo,
    image: ids[0] ?? null,
    images: ids,
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
  // Convention: `<restaurant>-<title>[-<page>].<ext>` (page is a trailing
  // numeric suffix). Files sharing the same `<restaurant>-<title>` group into
  // a single promotion with multiple pages, ordered numerically.
  const discovered = readdirSync(PROMO_DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  const knownFiles = new Set(PROMOTIONS.flatMap((p) => imageFilesOf(p)));
  const TAG_RE = /^(club-wide|central|grillhouse|the-2nd-floor|tradewinds|union-bar|the-gourmet-pantry)[-_](.+?)(?:[-_](\d+))?$/;
  const newGroups = new Map(); // baseSlug → { tag, files: [{file, page}] }
  for (const f of discovered) if (!knownFiles.has(f)) {
    const base = f.replace(/\.[^.]+$/, '');
    const m = base.match(TAG_RE);
    const tag = m ? m[1] : 'club-wide';
    const titlePart = m ? m[2] : base;
    const page = m && m[3] ? parseInt(m[3], 10) : 1;
    const groupKey = `${tag}-${titlePart}`;
    if (!newGroups.has(groupKey)) newGroups.set(groupKey, { tag, titlePart, files: [] });
    newGroups.get(groupKey).files.push({ file: f, page });
  }
  for (const [groupKey, g] of newGroups) {
    g.files.sort((a, b) => a.page - b.page);
    PROMOTIONS.push({
      title: g.titlePart.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      slug: groupKey, summary: '', restaurantTag: g.tag,
      imageFiles: g.files.map((x) => x.file),
      validFrom: null, validTo: null, ctas: [], order: 99,
    });
  }

  console.log('\n[1/3] Uploading promotion flyers…');
  const allFiles = Array.from(new Set(PROMOTIONS.flatMap((p) => imageFilesOf(p))));
  const media = await uploadAll(ctx, PROMO_DIR, allFiles, { dry: DRY });

  console.log('\n[2/3] Upserting promotion entries…');
  for (const p of PROMOTIONS) {
    await ensurePromotion(p, media);
    console.log(`  ✓ ${p.title}`);
  }

  console.log('\n[3/3] Upserting dining-promotions-page single type…');
  await upsertDiningPromotionsPage();
  console.log('  ✓ dining-promotions-page upserted');

  console.log('\nDone.');
}
main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
