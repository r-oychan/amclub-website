#!/usr/bin/env node
// Seed the `fitness-facility` collection from the legacy `subpages.ts`
// fitness data extracted into scripts/data/fitness-facility-data.json.
// Each entry becomes one row in fitness-facilities with:
//   - name, slug, description, parentLabel, parentHref
//   - locationLevel/phone/email (from inline contact OR locationContact)
//   - operatingHoursSections + locationContact components
//   - ctas + bottomCtas + downloads
//   - heroImage (uploaded from media/fitness/)
//   - order based on array position
//
// Aquatics sub-pages (aquatics-swimamerica etc.) attach to the aquatics
// parent via the self-relation.
//
// Run against dev:
//   SEED_ENV=dev node scripts/seed-fitness-facilities.mjs --dry-run
//   SEED_ENV=dev node scripts/seed-fitness-facilities.mjs

import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { initEnv, api, findOneBySlug, uploadFile, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY = isDryRun();
const ctx = initEnv();

const DATA = JSON.parse(
  readFileSync(join(ROOT, 'scripts', 'data', 'fitness-facility-data.json'), 'utf8'),
);

// Order matches the original subpages.ts array — top-level fitness venues
// first, then aquatics children, then any extras. Sub-pages link back to
// their parent via the self-relation.
const ORDER = [
  'sen-spa', 'aquatics', 'gym', 'tennis', 'squash', 'pilates', 'bowling-alley',
  // aquatics children (parent='aquatics'):
  'aquatics-swimamerica', 'aquatics-swim-team', 'aquatics-masters-swimming',
  'aquatics-group-fitness-classes', 'aquatics-infants-toddlers',
];
const AQUATICS_CHILDREN = new Set([
  'aquatics-swimamerica', 'aquatics-swim-team', 'aquatics-masters-swimming',
  'aquatics-group-fitness-classes', 'aquatics-infants-toddlers',
]);

function localImagePath(webPath) {
  if (!webPath) return null;
  // subpages.ts image paths look like /uploads/restaurants/x.jpg or
  // /images/fitness/aquatics-v2.jpeg. Try a few resolution strategies
  // against media/fitness/ and media/.
  const stripped = webPath.replace(/^\/(images|uploads)\//, '');
  const candidates = [
    join(ROOT, 'media', stripped),
    join(ROOT, 'media', 'fitness', basename(webPath)),
    join(ROOT, 'media', 'fitness', stripped),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  return null;
}

async function uploadIfPresent(webPath) {
  const local = localImagePath(webPath);
  if (!local) return null;
  if (DRY) { console.log(`    [dry] upload ${basename(local)}`); return { id: -1 }; }
  return await uploadFile(ctx, local);
}

function normCtas(arr) {
  return (arr ?? []).map((c) => ({
    label: c.label,
    href: c.href ?? '#',
    isExternal: c.isExternal,
    variant: c.variant ?? 'primary',
    icon: c.icon ?? 'arrow',
  }));
}

function normLink(l) {
  return l ? { label: l.label, href: l.href, isExternal: l.isExternal } : undefined;
}

function normDownloads(d) {
  if (!d) return undefined;
  // Accept either an inline { heading, items: [...] } shape or a downloadsList
  // (subpages.ts uses `downloads` with items[] of links).
  const items = (d.items ?? []).map((i) => ({
    label: i.label,
    href: i.href,
    isExternal: i.isExternal,
  }));
  return items.length ? { heading: d.heading ?? "Forms You'll Need", items } : undefined;
}

async function upsertFacility(slug, entry, idx, parentDocId) {
  const heroImage = await uploadIfPresent(entry.image);
  let operatingHoursSections = (entry.operatingHoursSections ?? []).map((s) => ({
    title: s.title,
    rows: (s.rows ?? []).map((r) => ({
      dayRange: r.dayRange,
      time: r.time,
      lastOrder: r.lastOrder,
      note: r.note,
    })),
  }));
  // Some facilities (gym) only have a plain `hours` string in the legacy
  // data — convert pairs of lines (dayRange / time) into a single
  // operating-hours-section so the new schema still carries the data.
  if (operatingHoursSections.length === 0 && typeof entry.hours === 'string') {
    const lines = entry.hours.split('\n').map((l) => l.trim()).filter(Boolean);
    const rows = [];
    for (let i = 0; i + 1 < lines.length; i += 2) {
      rows.push({ dayRange: lines[i], time: lines[i + 1] });
    }
    if (rows.length) operatingHoursSections = [{ title: 'Opening Hours', rows }];
  }
  // Extra prose sections (Reservation Policy, Court Booking, etc.) move to
  // the new `extraSections` repeatable component on fitness-facility.
  const extraSections = (entry.extraSections ?? [])
    .filter((s) => s && s.title)
    .map((s) => ({
      title: s.title,
      content: s.content ?? null,
      bullets: Array.isArray(s.bullets) && s.bullets.length ? s.bullets : null,
    }));
  const locationContact =
    entry.locationContact ?? (entry.level || entry.phone || entry.email
      ? { locationLevel: entry.level, phone: entry.phone, email: entry.email }
      : null);
  const payload = {
    name: entry.name,
    slug,
    description: entry.description,
    parentLabel: entry.parentSection,
    parentHref: entry.parentHref,
    locationLevel: entry.level ?? locationContact?.locationLevel,
    phone: entry.phone ?? locationContact?.phone,
    email: entry.email ?? locationContact?.email,
    dressCode: entry.dressCode,
    heroImage: heroImage?.id ?? null,
    operatingHoursSections,
    extraSections,
    locationContact,
    ctas: normCtas(entry.ctas),
    bottomCtas: normCtas(entry.bottomCtas),
    downloads: normDownloads(entry.downloads),
    order: idx,
    parent: parentDocId ?? null,
    publishedAt: new Date().toISOString(),
  };
  if (DRY) {
    console.log(`  [dry] upsert ${slug} (parent=${parentDocId ?? '–'}, image=${!!heroImage})`);
    return null;
  }
  const existing = await findOneBySlug(ctx, 'fitness-facilities', slug);
  let resp;
  if (existing?.documentId) {
    resp = await api(ctx, `/fitness-facilities/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    console.log(`  ↻ updated ${slug}`);
  } else {
    resp = await api(ctx, '/fitness-facilities', { method: 'POST', body: { data: payload } });
    console.log(`  + created ${slug}`);
  }
  return resp?.data?.documentId ?? null;
}

(async () => {
  console.log(`Seed target: ${ctx.BASE}`);
  console.log(`Dry run: ${DRY}`);
  console.log('\n─── pass 1: top-level facilities ───');
  let aquaticsDocId = null;
  let idx = 0;
  for (const slug of ORDER) {
    if (AQUATICS_CHILDREN.has(slug)) continue;
    const entry = DATA[slug];
    if (!entry) { console.warn(`  ! no data for ${slug}`); idx++; continue; }
    const docId = await upsertFacility(slug, entry, idx, null);
    if (slug === 'aquatics') aquaticsDocId = docId;
    idx++;
  }
  console.log('\n─── pass 2: aquatics children ───');
  if (!aquaticsDocId && !DRY) {
    const aquatics = await findOneBySlug(ctx, 'fitness-facilities', 'aquatics');
    aquaticsDocId = aquatics?.documentId ?? null;
  }
  for (const slug of ORDER) {
    if (!AQUATICS_CHILDREN.has(slug)) continue;
    const entry = DATA[slug];
    if (!entry) { console.warn(`  ! no data for ${slug}`); idx++; continue; }
    await upsertFacility(slug, entry, idx, aquaticsDocId);
    idx++;
  }
  console.log('\n✓ Done.');
})().catch((err) => { console.error(err); process.exit(1); });
