#!/usr/bin/env node
// Make "Fall Term 2026 Schedule" the sole CTA on the Tennis Programs image
// panel, replacing the superseded Summer Term schedule.
//
// Two paths, picked automatically so the same script covers prod (where the
// panels were never seeded) and dev/uat (where they already exist):
//
//   a) imagePanels EMPTY  → seed both tennis panels (Programs + Etiquette) with
//      the Fall CTA. This was prod's case: the entry had `imagePanels: []`, so
//      the page fell through to the hardcoded fallback in
//      frontend/src/data/subpages.ts and no admin edit could ever show up.
//   b) imagePanels PRESENT → set the Tennis Programs panel's CTA list to exactly
//      [Fall], preserving every other field. This is dev/uat's case on replay,
//      and also re-running against prod after the initial seed.
//
// Idempotent either way: converges on the same CTA list, so re-runs are no-ops.
//
// Usage:
//   node scripts/patch-2026-08-13-tennis-fall-schedule.mjs --env=prod --dry-run
//   node scripts/patch-2026-08-13-tennis-fall-schedule.mjs --env=prod

import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, uploadFile, findOneBySlug, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY = isDryRun();
const ctx = initEnv();
const SLUG = 'tennis';
const PANEL_HEADING = 'Tennis Programs';
const IMG_DIR = join(ROOT, 'media', 'fitness', 'detail');
const lines = (...xs) => xs.map((text) => ({ text }));

// The Summer Term schedule is superseded and is removed from the panel. The PDF
// itself is left in the media library — only the button is dropped.
const SUPERSEDED_HREFS = ['/uploads/documents/fitness/tennis_summer_term_schedule_2026.pdf'];
// NOTE: hash-suffixed href — this blob exists on PROD only (uploaded via
// /admin). On a dev/uat replay the file must be re-uploaded there and this
// href swapped for that environment's path, or moved under
// documents/fitness/ with a stable hash-less name like the Summer one.
const FALL_CTA = {
  label: 'Fall Term 2026 Schedule',
  href: '/uploads/Tennis_Fall_Programs_2026_f423abe4c6.pdf',
  isExternal: true,
};

/** Strapi returns media as an object but accepts only an id on write. */
const toMediaId = (m) => (m && typeof m === 'object' ? (m.id ?? null) : (m ?? null));

/**
 * Deep-strip component `id`/`documentId` keys from a write payload.
 *
 * Strapi v5 keys components to a specific document version. Reading components
 * off the published entry and PUTting them back with `?status=published` fails
 * with "Some of the provided components in imagePanels are not related to the
 * entity", because the ids belong to the other version. Dropping the ids makes
 * Strapi recreate the components, which is what we want anyway.
 *
 * Media relations must survive this: convert them to a bare numeric id BEFORE
 * calling, so they are numbers here rather than objects with an `id`.
 */
function stripComponentIds(value) {
  if (Array.isArray(value)) return value.map(stripComponentIds);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === 'id' || k === 'documentId') continue;
      out[k] = stripComponentIds(v);
    }
    return out;
  }
  return value;
}

async function buildFreshPanels() {
  const program = await uploadFile(ctx, join(IMG_DIR, 'tennis-program.jpeg'), { path: 'fitness/detail' });
  const etiquette = await uploadFile(ctx, join(IMG_DIR, 'tennis-etiquette.jpeg'), { path: 'fitness/detail' });
  return [
    {
      image: program?.id ?? null,
      imageAlt: 'Tennis Programs at The American Club',
      imagePosition: 'left',
      heading: PANEL_HEADING,
      ctas: [FALL_CTA],
      subheading: 'Tennis Socials',
      body:
        'Join our Tennis Socials and keep fit while making new friends! Socials are open to players of all levels and played in 30-minute intervals. Participants may arrive anytime during the duration of the socials.',
      operatingHours: [
        { title: "Men's Social", rows: lines('Every Monday, 6:30 PM – 9:00 PM') },
        { title: "Ladies' Social", rows: lines('Every Wednesday, 9:00 AM – 11:30 AM') },
        { title: 'Stroke of The Week', rows: lines('Every Tuesday, 10:00 AM – 11:00 AM', 'Every Wednesday, 6:00 PM – 7:00 PM') },
        { title: 'Friday Night Mixed Social', rows: lines('Every last Friday of the month, 7:00 PM – 9:30 PM') },
      ],
      footnote: 'Registration is available on the TAC Book app 48 hours in advance.',
    },
    {
      image: etiquette?.id ?? null,
      imageAlt: 'Tennis etiquette at The American Club',
      imagePosition: 'right',
      heading: 'Tennis Etiquette',
      subheading: 'Punctuality & Cancellation Policy',
      bullets: lines(
        'Please arrive 5 minutes early and sign up at the Sports Counter before you head up to the Tennis Courts.',
        'Arriving late will limit the time of your game. Should you be late, please call in advance at 6739-4312 / 6739-4451.',
        'Reservations will be held for a maximum of 15 minutes. Failure to show will incur a "No show" charge and the court will be released to other Members.',
        'Cancellations must be made at least 4 hours in advance.',
      ),
    },
  ];
}

/**
 * Set the Programs panel's CTA list to exactly [Fall] — dropping any superseded
 * schedule buttons — while leaving every other field on every panel intact.
 * Returns null when the panel already matches (no write needed).
 */
function setProgramsCtas(panels) {
  const idx = panels.findIndex((p) => p.heading === PANEL_HEADING);
  if (idx < 0) throw new Error(`No "${PANEL_HEADING}" panel found — refusing to guess which panel to patch.`);
  const existing = panels[idx].ctas ?? [];
  const kept = existing.filter((c) => !SUPERSEDED_HREFS.includes(c.href) && c.href !== FALL_CTA.href);
  const next = [...kept, FALL_CTA];
  const same =
    existing.length === next.length &&
    existing.every((c, i) => c.href === next[i].href && c.label === next[i].label);
  if (same) return null;
  if (next.length > 5) throw new Error('Programs panel would exceed the 5-CTA schema max.');
  return panels.map((p, i) =>
    stripComponentIds({
      ...p,
      image: toMediaId(p.image),
      ...(i === idx ? { ctas: next } : {}),
    }),
  );
}

(async () => {
  console.log(`Patch target: ${ctx.BASE}`);
  const entry = await findOneBySlug(ctx, 'fitness-facilities', SLUG);
  if (!entry) { console.log(`  ! ${SLUG} not found`); process.exit(1); }

  // Read the panels back with components populated — findOneBySlug does not populate.
  const full = await api(
    ctx,
    `/fitness-facilities/${entry.documentId}?populate[imagePanels][populate]=*`,
  );
  const panels = Array.isArray(full?.data?.imagePanels) ? full.data.imagePanels : [];
  console.log(`  current imagePanels: ${panels.length}`);

  let imagePanels;
  if (panels.length === 0) {
    console.log('  → empty: seeding both panels with the Fall CTA');
    if (DRY) { console.log('  [dry] would upload 2 panel images and PUT 2 panels'); return; }
    imagePanels = await buildFreshPanels();
  } else {
    const next = setProgramsCtas(panels);
    if (!next) { console.log('  ✓ Programs panel CTAs already correct — nothing to do'); return; }
    console.log('  → setting Tennis Programs CTAs to [Fall] (dropping superseded Summer)');
    if (DRY) {
      const t = next.find((p) => p.heading === PANEL_HEADING);
      console.log(`  [dry] ctas would become: ${JSON.stringify(t.ctas.map((c) => c.label))}`);
      return;
    }
    imagePanels = next;
  }

  // ?status=published is the explicit Strapi v5 publish semantic — publishedAt
  // in the body alone updates only the draft.
  await api(ctx, `/fitness-facilities/${entry.documentId}?status=published`, {
    method: 'PUT',
    body: { data: { imagePanels, publishedAt: new Date().toISOString() } },
  });
  console.log('  ✓ imagePanels set + published');
  console.log('\n✓ Done.');
})().catch((e) => { console.error(e); process.exit(1); });
