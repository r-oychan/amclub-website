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
    title: 'May Monthly Promotions',
    slug: 'club-wide-may-monthly-promo',
    summary: 'A round-up of this month\'s dining specials across the Club.',
    restaurantSlug: 'club-wide',
    imageFiles: ['club-wide-may-monthly-promo.jpg'],
    ctas: [],
    order: 1,
  },
  {
    title: 'Central Daily Specials',
    slug: 'central-daily-specials',
    summary: 'Daily promotions on coffee, bagels, smoothies, wraps and weekend treats at Central.',
    restaurantSlug: 'central',
    imageFiles: ['central-daily-specials.jpg'],
    ctas: [],
    order: 2,
  },
  {
    title: 'A Toast to Mom',
    slug: 'grillhouse-a-toast-to-mom',
    summary: 'Raise a glass and share a Mother\'s Day platter poolside at Grillhouse.',
    restaurantSlug: 'grillhouse',
    imageFiles: ['grillhouse-a-toast-to-mom.jpg'],
    ctas: [],
    order: 3,
  },
  {
    title: 'Seasonal Brews',
    slug: 'grillhouse-seasonal-brews',
    summary: 'A curated rotation of craft beers, paired with Grillhouse classics.',
    restaurantSlug: 'grillhouse',
    imageFiles: ['grillhouse-seasonal-brews.jpg'],
    ctas: [],
    order: 4,
  },
  {
    title: 'A Heartwarming Mother\'s Day Feast',
    slug: 'the-2nd-floor-heartwarming-mothers-day-feast',
    summary: 'A multi-course Mother\'s Day menu featuring East-meets-West favourites at The 2nd Floor.',
    restaurantSlug: 'the-2nd-floor',
    imageFiles: ['the-2nd-floor-heartwarming-mothers-day-feast.jpg'],
    ctas: [],
    order: 5,
  },
  {
    title: 'The Ultimate Happy Hour',
    slug: 'the-2nd-floor-the-ultimate-happy-hour',
    summary: '1-for-1 drinks by the glass on Tuesdays to Fridays. Wine corkage waived every Tuesday.',
    restaurantSlug: 'the-2nd-floor',
    imageFiles: ['the-2nd-floor-the-ultimate-happy-hour.jpg'],
    ctas: [],
    order: 6,
  },
  {
    title: 'Four New Ways to Sip',
    slug: 'the-2nd-floor-four-new-ways-to-sip',
    summary: 'New seasonal cocktails to discover at The 2nd Floor bar.',
    restaurantSlug: 'the-2nd-floor',
    imageFiles: ['the-2nd-floor-four-new-ways-to-sip.jpg'],
    ctas: [],
    order: 7,
  },
  {
    title: 'Eggs-tra Good Mornings',
    slug: 'tradewinds-eggs-tra-good-mornings',
    summary: 'Start your day right with the new breakfast lineup at Tradewinds.',
    restaurantSlug: 'tradewinds',
    imageFiles: ['tradewinds-eggs-tra-good-mornings.jpg'],
    ctas: [],
    order: 8,
  },
  {
    title: 'Bloody Mary Specials',
    slug: 'union-bar-bloody-mary-specials',
    summary: 'Refreshed Bloody Mary creations on the Union Bar list this month.',
    restaurantSlug: 'union-bar',
    imageFiles: ['union-bar-bloody-mary-specials.jpg'],
    ctas: [],
    order: 9,
  },
];

function imageFilesOf(p) {
  if (Array.isArray(p.imageFiles) && p.imageFiles.length) return p.imageFiles;
  if (p.imageFile) return [p.imageFile];
  return [];
}

async function ensurePromotion(p, mediaByFile, restaurantsBySlug) {
  const files = imageFilesOf(p);
  const ids = files.map((f) => mediaByFile[f]?.id).filter((x) => x != null);
  const isClubWide = p.restaurantSlug === 'club-wide';
  const restaurantId = isClubWide ? null : restaurantsBySlug.get(p.restaurantSlug);
  if (!isClubWide && !restaurantId) {
    console.warn(`  ! promo ${p.slug}: no restaurant with slug=${p.restaurantSlug} — skipping relation`);
  }
  if (DRY) {
    console.log(`  [dry] upsert promotion: ${p.title} (${ids.length} page(s), restaurant=${restaurantId ?? '–'}, isClubWide=${isClubWide})`);
    return;
  }
  const existing = await findOneBySlug(ctx, 'dining-promotions', p.slug);
  const payload = {
    title: p.title,
    slug: p.slug,
    summary: p.summary,
    restaurant: restaurantId ?? null,
    isClubWide,
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
        { label: 'Explore Membership', href: '/membership',                                                                                                                  variant: 'primary', icon: 'arrow' },
        { label: 'Book a Club Tour',   href: 'https://amclub.jotform.com/260813837273966?parentURL=https%3A%2F%2Famclub.org.sg%2Fmembership-enquiry-form%2F&jsForm=true', isExternal: true, variant: 'outline', icon: 'arrow' },
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

  // Fetch all restaurants so we can resolve `restaurantSlug` → documentId for
  // the `restaurant` relation on each promo. Slug list is dynamic (driven by
  // the Restaurant collection), so adding a new restaurant in Strapi
  // automatically becomes available as a promo target.
  console.log('\n[0/4] Resolving restaurants…');
  const restaurantsResp = await api(ctx, '/restaurants?pagination[pageSize]=50&fields[0]=slug');
  const restaurantsBySlug = new Map(
    (restaurantsResp?.data ?? []).map((r) => [r.slug, r.documentId]),
  );
  const validSlugs = new Set([...restaurantsBySlug.keys(), 'club-wide']);
  console.log(`  ${restaurantsBySlug.size} restaurant(s) + club-wide`);

  // Auto-discover any extra flyers dropped into media/dining/promotions/.
  // Convention: `<restaurant-slug>-<title>[-<page>].<ext>` (page is a trailing
  // numeric suffix). Files sharing the same `<restaurant-slug>-<title>` group
  // into a single promotion with multiple pages, ordered numerically. The
  // restaurant-slug part is matched against the live Restaurant collection
  // plus `club-wide`, so the regex stays in sync as restaurants are added.
  const discovered = readdirSync(PROMO_DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  const knownFiles = new Set(PROMOTIONS.flatMap((p) => imageFilesOf(p)));
  // Sort longer slugs first so e.g. `the-gourmet-pantry-…` matches before `the-`.
  const tagAlternation = Array.from(validSlugs)
    .sort((a, b) => b.length - a.length)
    .map((s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'))
    .join('|');
  const TAG_RE = new RegExp(`^(${tagAlternation})[-_](.+?)(?:[-_](\\d+))?$`);
  const newGroups = new Map(); // baseSlug → { restaurantSlug, files: [{file, page}] }
  for (const f of discovered) if (!knownFiles.has(f)) {
    const base = f.replace(/\.[^.]+$/, '');
    const m = base.match(TAG_RE);
    const restaurantSlug = m ? m[1] : 'club-wide';
    const titlePart = m ? m[2] : base;
    const page = m && m[3] ? parseInt(m[3], 10) : 1;
    const groupKey = `${restaurantSlug}-${titlePart}`;
    if (!newGroups.has(groupKey)) newGroups.set(groupKey, { restaurantSlug, titlePart, files: [] });
    newGroups.get(groupKey).files.push({ file: f, page });
  }
  for (const [groupKey, g] of newGroups) {
    g.files.sort((a, b) => a.page - b.page);
    PROMOTIONS.push({
      title: g.titlePart.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      slug: groupKey, summary: '', restaurantSlug: g.restaurantSlug,
      imageFiles: g.files.map((x) => x.file),
      validFrom: null, validTo: null, ctas: [], order: 99,
    });
  }

  console.log('\n[1/4] Uploading promotion flyers…');
  const allFiles = Array.from(new Set(PROMOTIONS.flatMap((p) => imageFilesOf(p))));
  const media = await uploadAll(ctx, PROMO_DIR, allFiles, { dry: DRY });

  console.log('\n[2/4] Upserting promotion entries…');
  for (const p of PROMOTIONS) {
    await ensurePromotion(p, media, restaurantsBySlug);
    console.log(`  ✓ ${p.title}`);
  }

  console.log('\n[3/4] Deleting stale promotion entries…');
  // The promotion list shrinks/changes month to month, so anything still in
  // Strapi whose slug isn't in the seed's allowlist should be removed (both
  // published and draft). We fetch published and draft separately because
  // Strapi v5's default `find` only returns published entries.
  const keepSlugs = new Set(PROMOTIONS.map((p) => p.slug));
  const statuses = ['published', 'draft'];
  const stale = new Map(); // documentId → { slug, status }
  for (const status of statuses) {
    const resp = await api(ctx, `/dining-promotions?status=${status}&pagination[limit]=200&fields[0]=slug`);
    for (const entry of resp?.data ?? []) {
      if (!keepSlugs.has(entry.slug)) {
        stale.set(entry.documentId, { slug: entry.slug, status });
      }
    }
  }
  if (stale.size === 0) {
    console.log('  (no stale entries)');
  } else if (DRY) {
    for (const [documentId, info] of stale) {
      console.log(`  [dry] DELETE /dining-promotions/${documentId}  (slug=${info.slug}, status=${info.status})`);
    }
  } else {
    for (const [documentId, info] of stale) {
      try {
        await api(ctx, `/dining-promotions/${documentId}`, { method: 'DELETE' });
        console.log(`  ✗ deleted stale promo ${info.slug} (${documentId})`);
      } catch (e) {
        console.error(`  ! failed to delete ${info.slug}: ${e.message}`);
      }
    }
  }

  console.log('\n[4/4] Upserting dining-promotions-page single type…');
  await upsertDiningPromotionsPage();
  console.log('  ✓ dining-promotions-page upserted');

  console.log('\nDone.');
}
main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
