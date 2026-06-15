#!/usr/bin/env node
// Migrate the Tennis page's imagePanels (Tennis Programs + Tennis Etiquette) out
// of the subpages.ts fallback into the CMS. The fitness-facility schema gained an
// `imagePanels` repeatable component field (shared.image-text-panel). Bullets and
// operatingHours.rows are stored as shared.text-line ({ text }) components.
// Images uploaded from media/fitness/detail/.
//
// SET-ONLY-IF-EMPTY: skips when the entry already has imagePanels, so re-runs and
// later admin edits are preserved.
//
// Usage:
//   node scripts/patch-2026-06-15-tennis-imagepanels.mjs --env=dev [--dry-run]
//   node scripts/patch-2026-06-15-tennis-imagepanels.mjs --env=uat

import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, uploadFile, findOneBySlug, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY = isDryRun();
const ctx = initEnv();
const SLUG = 'tennis';
const IMG_DIR = join(ROOT, 'media', 'fitness', 'detail');
const lines = (...xs) => xs.map((text) => ({ text }));

(async () => {
  console.log(`Patch target: ${ctx.BASE}`);
  const existing = await findOneBySlug(ctx, 'fitness-facilities', SLUG);
  if (!existing) { console.log(`  ! ${SLUG} not found`); return; }
  if (Array.isArray(existing.imagePanels) && existing.imagePanels.length) {
    console.log(`  ✓ ${SLUG} already has imagePanels — set-only-if-empty, skipping`);
    return;
  }
  if (DRY) { console.log('  [dry] upload 2 panel images; PUT imagePanels onto tennis'); return; }

  const program = await uploadFile(ctx, join(IMG_DIR, 'tennis-program.jpeg'), { path: 'fitness/detail' });
  const etiquette = await uploadFile(ctx, join(IMG_DIR, 'tennis-etiquette.jpeg'), { path: 'fitness/detail' });

  const imagePanels = [
    {
      image: program?.id ?? null,
      imageAlt: 'Tennis Programs at The American Club',
      imagePosition: 'left',
      heading: 'Tennis Programs',
      cta: { label: 'Summer Term 2026 Schedule', href: '/uploads/documents/fitness/tennis_summer_term_schedule_2026.pdf', isExternal: true },
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

  // ?status=published is the explicit Strapi v5 publish semantic — publishedAt
  // in the body alone updates only the draft (the /actions/publish route 405s on
  // the content API).
  await api(ctx, `/fitness-facilities/${existing.documentId}?status=published`, {
    method: 'PUT',
    body: { data: { imagePanels, publishedAt: new Date().toISOString() } },
  });
  console.log(`  ✓ imagePanels set+published on ${SLUG} (program=${program?.id}, etiquette=${etiquette?.id})`);
  console.log('\n✓ Done.');
})().catch((e) => { console.error(e); process.exit(1); });
