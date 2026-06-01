#!/usr/bin/env node
// Seed the `event-space` collection from scripts/data/event-spaces-data.json
// (extracted from the legacy subpages.ts eventSpacesSubpages array).
// Each entry becomes one row in event-spaces. venueCards + packageCards
// flow through into their dedicated component grids.

import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { initEnv, api, findOneBySlug, uploadFile, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY = isDryRun();
const ctx = initEnv();

const DATA = JSON.parse(readFileSync(join(ROOT, 'scripts', 'data', 'event-spaces-data.json'), 'utf8'));

const ORDER = [
  'wedding-celebration', 'corporate-functions', 'parties',
  'the-gallbrainth-ballroom', 'thinkspace', 'bowling-alley',
  'library', 'meeting-rooms',
];

function localImagePath(webPath) {
  if (!webPath) return null;
  if (/^https?:/i.test(webPath)) return null; // remote (Azure Blob) — skip, schema will keep null
  const stripped = webPath.replace(/^\/(images|uploads|subpages)\//, '');
  const candidates = [
    join(ROOT, 'media', stripped),
    join(ROOT, 'media', 'event-spaces', basename(webPath)),
    join(ROOT, 'media', 'event-spaces', stripped),
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

async function normVenueCards(v) {
  if (!v?.cards?.length) return undefined;
  const cards = [];
  for (const c of v.cards) {
    const image = await uploadIfPresent(c.image);
    cards.push({
      heading: c.heading,
      capacity: c.capacity ?? null,
      description: c.description ?? null,
      image: image?.id ?? null,
      imageAlt: c.imageAlt ?? null,
      downloadLink: c.downloadLink ?? c.cta ?? null,
    });
  }
  return { heading: v.heading, subheading: v.subheading, columns: v.columns ?? 3, cards };
}

async function normPackageCards(p) {
  if (!p?.cards?.length) return undefined;
  const cards = [];
  for (const c of p.cards) {
    const image = await uploadIfPresent(c.image);
    cards.push({
      heading: c.heading,
      tagline: c.tagline ?? null,
      image: image?.id ?? null,
      imageAlt: c.imageAlt ?? null,
      benefits: Array.isArray(c.benefits) && c.benefits.length ? c.benefits : null,
      detailsLabel: c.detailsLabel ?? null,
      downloadLink: c.downloadLink ?? c.cta ?? null,
    });
  }
  return { heading: p.heading, subheading: p.subheading, columns: p.columns ?? 3, cards };
}

async function upsertEventSpace(slug, entry, idx) {
  const heroImage = await uploadIfPresent(entry.image);
  let operatingHoursSections = (entry.operatingHoursSections ?? []).map((s) => ({
    title: s.title,
    rows: (s.rows ?? []).map((r) => ({
      dayRange: r.dayRange, time: r.time, lastOrder: r.lastOrder, note: r.note,
    })),
  }));
  if (operatingHoursSections.length === 0 && typeof entry.hours === 'string') {
    const lines = entry.hours.split('\n').map((l) => l.trim()).filter(Boolean);
    const rows = [];
    for (let i = 0; i + 1 < lines.length; i += 2) {
      rows.push({ dayRange: lines[i], time: lines[i + 1] });
    }
    if (rows.length) operatingHoursSections = [{ title: 'Opening Hours', rows }];
  }
  const extraSections = (entry.extraSections ?? [])
    .filter((s) => s && s.title)
    .map((s) => ({
      title: s.title,
      content: s.content ?? null,
      bullets: Array.isArray(s.bullets) && s.bullets.length ? s.bullets : null,
    }));
  const locationContact = entry.locationContact ?? (entry.level || entry.phone || entry.email
    ? { locationLevel: entry.level, phone: entry.phone, email: entry.email }
    : null);
  const venueCards = await normVenueCards(entry.venueCards);
  const packageCards = await normPackageCards(entry.packageCards);

  const payload = {
    name: entry.name,
    slug,
    description: entry.description,
    parentLabel: entry.parentSection,
    parentHref: entry.parentHref,
    capacity: entry.capacity ?? null,
    locationLevel: entry.level ?? locationContact?.locationLevel,
    phone: entry.phone ?? locationContact?.phone,
    email: entry.email ?? locationContact?.email,
    heroImage: heroImage?.id ?? null,
    heroVideo: entry.video?.url ?? null,
    operatingHoursSections,
    extraSections,
    locationContact,
    ctas: normCtas(entry.ctas),
    bottomCtas: normCtas(entry.bottomCtas),
    venueCards,
    packageCards,
    order: idx,
    publishedAt: new Date().toISOString(),
  };
  if (DRY) {
    console.log(`  [dry] upsert ${slug} (venueCards=${venueCards?.cards?.length ?? 0}, packageCards=${packageCards?.cards?.length ?? 0})`);
    return null;
  }
  const existing = await findOneBySlug(ctx, 'event-spaces', slug);
  let resp;
  if (existing?.documentId) {
    resp = await api(ctx, `/event-spaces/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    console.log(`  ↻ updated ${slug}`);
  } else {
    resp = await api(ctx, '/event-spaces', { method: 'POST', body: { data: payload } });
    console.log(`  + created ${slug}`);
  }
  return resp?.data?.documentId ?? null;
}

(async () => {
  console.log(`Seed target: ${ctx.BASE}`);
  console.log(`Dry run: ${DRY}`);
  let idx = 0;
  for (const slug of ORDER) {
    const entry = DATA[slug];
    if (!entry) { console.warn(`  ! no data for ${slug}`); idx++; continue; }
    await upsertEventSpace(slug, entry, idx);
    idx++;
  }
  console.log('\n✓ Done.');
})().catch((err) => { console.error(err); process.exit(1); });
