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
    title: 'A Toast to Mom',
    slug: 'grillhouse-a-toast-to-mom',
    summary: 'Raise a glass and share a Mother\'s Day platter poolside at Grillhouse.',
    restaurantTag: 'grillhouse',
    imageFiles: ['grillhouse-a-toast-to-mom.jpg'],
    ctas: [],
    order: 1,
  },
  {
    title: 'A Heartwarming Mother\'s Day Feast',
    slug: 'the-2nd-floor-heartwarming-mothers-day-feast',
    summary: 'A multi-course Mother\'s Day menu featuring East-meets-West favourites at The 2nd Floor.',
    restaurantTag: 'the-2nd-floor',
    imageFiles: ['the-2nd-floor-heartwarming-mothers-day-feast.jpg'],
    ctas: [],
    order: 2,
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

  console.log('\n[1/4] Uploading promotion flyers…');
  const allFiles = Array.from(new Set(PROMOTIONS.flatMap((p) => imageFilesOf(p))));
  const media = await uploadAll(ctx, PROMO_DIR, allFiles, { dry: DRY });

  console.log('\n[2/4] Upserting promotion entries…');
  for (const p of PROMOTIONS) {
    await ensurePromotion(p, media);
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
