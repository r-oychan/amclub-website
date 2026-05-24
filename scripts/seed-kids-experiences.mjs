#!/usr/bin/env node
// Seed the `kids-experience` collection from the legacy `subpages.ts`
// kids data (extracted to scripts/data/kids-data.json by /tmp helper).
// Each entry becomes one row in kids-experiences. Sub-structure
// (operatingHoursSections, extraSections, faq, quotes, partyPackages)
// flows through unchanged.
//
// Run against dev:
//   SEED_ENV=dev node scripts/seed-kids-experiences.mjs --dry-run
//   SEED_ENV=dev node scripts/seed-kids-experiences.mjs

import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { initEnv, api, findOneBySlug, uploadFile, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY = isDryRun();
const ctx = initEnv();

const DATA = JSON.parse(readFileSync(join(ROOT, 'scripts', 'data', 'kids-data.json'), 'utf8'));

const ORDER = [
  'the-quad-poolside', 'the-quad', 'the-quad-studios',
  'the-hangout', 'recreational-classes', 'camps', 'kids-parties',
];

function localImagePath(webPath) {
  if (!webPath) return null;
  const stripped = webPath.replace(/^\/(images|uploads)\//, '');
  const candidates = [
    join(ROOT, 'media', stripped),
    join(ROOT, 'media', 'kids', basename(webPath)),
    join(ROOT, 'media', 'kids', stripped),
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

function normDownloads(d) {
  if (!d) return undefined;
  const items = (d.items ?? []).map((i) => ({
    label: i.label, href: i.href, isExternal: i.isExternal,
  }));
  return items.length ? { heading: d.heading ?? "Forms You'll Need", items } : undefined;
}

async function normPartyPackages(p) {
  if (!p?.items?.length) return undefined;
  const items = [];
  for (const it of p.items) {
    const image = await uploadIfPresent(it.image);
    items.push({
      name: it.name,
      image: image?.id ?? null,
      imageAlt: it.imageAlt,
      cta: it.cta ? { label: it.cta.label, href: it.cta.href, isExternal: it.cta.isExternal } : null,
    });
  }
  return { heading: p.heading, subheading: p.subheading, items };
}

async function upsertKids(slug, entry, idx, parentDocId) {
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
  const faq = (entry.faq ?? []).map((f) => ({ question: f.question, answer: f.answer }));
  // Source uses { text, attribution, role } per quote; schema uses
  // { quote, author, role } (matching shared.quote-item).
  const quotes = entry.quotes?.items?.length
    ? {
        heading: entry.quotes.heading,
        items: entry.quotes.items
          .filter((q) => q.text || q.quote)
          .map((q) => ({
            quote: q.quote ?? q.text ?? '',
            author: q.author ?? q.attribution ?? null,
            role: q.role ?? null,
          })),
      }
    : undefined;
  const partyPackages = await normPartyPackages(entry.partyPackages);

  const payload = {
    name: entry.name,
    slug,
    description: entry.description,
    parentLabel: entry.parentSection,
    parentHref: entry.parentHref,
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
    downloads: normDownloads(entry.downloads),
    faq,
    quotes,
    partyPackages,
    order: idx,
    parent: parentDocId ?? null,
    publishedAt: new Date().toISOString(),
  };
  if (DRY) {
    console.log(`  [dry] upsert ${slug} (faq=${faq.length}, extras=${extraSections.length}, packages=${partyPackages?.items?.length ?? 0})`);
    return null;
  }
  if (process.env.DEBUG_PAYLOAD) {
    console.log(`payload for ${slug}:`, JSON.stringify(payload, null, 2).slice(0, 3000));
  }
  const existing = await findOneBySlug(ctx, 'kids-experiences', slug);
  let resp;
  if (existing?.documentId) {
    resp = await api(ctx, `/kids-experiences/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    console.log(`  ↻ updated ${slug}`);
  } else {
    resp = await api(ctx, '/kids-experiences', { method: 'POST', body: { data: payload } });
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
    await upsertKids(slug, entry, idx, null);
    idx++;
  }
  console.log('\n✓ Done.');
})().catch((err) => { console.error(err); process.exit(1); });
