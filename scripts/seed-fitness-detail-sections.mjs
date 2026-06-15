#!/usr/bin/env node
// Seeds the remaining hardcoded fitness detail sections out of subpages.ts into
// the CMS so they stop falling back to hardcoded copy:
//   Aquatics   → faq + promoCards
//   Gym        → cardSections
//   Pilates    → cardSections
//   Bowling    → faq
//
// Content is read DIRECTLY from frontend/src/data/subpages.ts via Node 22
// type-stripping (no transcription drift). Card/promo images are uploaded from
// frontend/public/images/. SET-ONLY-IF-EMPTY per field; safe to re-run.
//
// Usage:
//   node --experimental-strip-types scripts/seed-fitness-detail-sections.mjs --env=dev [--dry-run]
//   node --experimental-strip-types scripts/seed-fitness-detail-sections.mjs --env=uat

import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { initEnv, api, uploadFile, findOneBySlug, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PUB = join(ROOT, 'frontend', 'public');
const DRY = isDryRun();
const ctx = initEnv();

const { fitnessSubpages } = await import(join(ROOT, 'frontend/src/data/subpages.ts'));
const bySlug = Object.fromEntries(fitnessSubpages.map((s) => [s.slug, s]));

const upCache = new Map();
async function up(imgPath) {
  if (!imgPath) return null;
  if (upCache.has(imgPath)) return upCache.get(imgPath);
  const abs = join(PUB, imgPath.replace(/^\//, ''));
  if (!existsSync(abs)) {
    console.log(`    ! image not found, leaving null: ${imgPath}`);
    upCache.set(imgPath, null);
    return null;
  }
  const f = await uploadFile(ctx, abs, { path: 'fitness/sections' });
  upCache.set(imgPath, f?.id ?? null);
  return f?.id ?? null;
}

const link = (c, extra = {}) =>
  c ? { label: c.label, href: c.href, isExternal: !!c.isExternal, icon: 'arrow', ...extra } : undefined;

const mapFaq = (faq) => (faq || []).map((f) => ({ question: f.question, answer: f.answer }));

async function mapPromo(pc) {
  if (!pc) return undefined;
  const cards = [];
  for (const c of pc.cards || []) {
    cards.push({
      title: c.title,
      subtitle: c.subtitle ?? null,
      image: await up(c.image),
      cta: link(c.cta, { variant: 'text' }),
    });
  }
  return {
    heading: pc.heading,
    description: pc.description,
    variant: pc.variant === 'overlay' ? 'overlay' : 'card',
    ...(pc.columns ? { columns: pc.columns } : {}),
    cards,
  };
}

async function mapCardSections(css) {
  const out = [];
  for (const cs of css || []) {
    const cards = [];
    for (const c of cs.cards || []) {
      cards.push({
        heading: c.heading,
        description: c.description,
        image: await up(c.image),
        imageAlt: c.imageAlt ?? null,
        cta: link(c.cta),
      });
    }
    out.push({ heading: cs.heading ?? null, subheading: cs.subheading ?? null, cards });
  }
  return out;
}

const TARGETS = [
  { slug: 'aquatics', fields: ['faq', 'promoCards'] },
  { slug: 'gym', fields: ['cardSections'] },
  { slug: 'pilates', fields: ['cardSections'] },
  { slug: 'bowling-alley', fields: ['faq'] },
];

(async () => {
  console.log(`Seed target: ${ctx.BASE}`);
  for (const t of TARGETS) {
    const sp = bySlug[t.slug];
    if (!sp) { console.log(`  ! ${t.slug} not in subpages.ts`); continue; }
    const existing = await findOneBySlug(ctx, 'fitness-facilities', t.slug);
    if (!existing) { console.log(`  ! ${t.slug} not found in CMS`); continue; }

    const data = {};
    for (const field of t.fields) {
      const cur = existing[field];
      const has = Array.isArray(cur) ? cur.length > 0 : !!cur;
      if (has) { console.log(`  ✓ ${t.slug}.${field} already set — skip`); continue; }
      if (field === 'faq') data.faq = mapFaq(sp.faq);
      if (field === 'promoCards') data.promoCards = await mapPromo(sp.promoCards);
      if (field === 'cardSections') data.cardSections = await mapCardSections(sp.cardSections);
    }
    const setFields = Object.keys(data);
    if (setFields.length === 0) continue;
    if (DRY) { console.log(`  [dry] would set ${setFields.join(', ')} on ${t.slug}`); continue; }

    data.publishedAt = new Date().toISOString();
    await api(ctx, `/fitness-facilities/${existing.documentId}?status=published`, {
      method: 'PUT',
      body: { data },
    });
    console.log(`  ✓ ${t.slug}: set ${setFields.join(', ')}`);
  }
  console.log('\n✓ Done.');
})().catch((e) => { console.error(e); process.exit(1); });
