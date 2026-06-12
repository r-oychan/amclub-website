#!/usr/bin/env node
// Insert the missing /fitness/multi-purpose-court page as a fitness-facility
// entry. The MPC content was seeded into the LEGACY `facility` collection
// (f30fe15) — prod still serves it from there — but it never made it into the
// `fitness-facilities` collection that the rewired fitness pages read, and its
// subpages.ts fallback was removed in the same commit, so dev/uat 404.
//
// Content recovered from scripts/seed-facilities.mjs @ f30fe15 (the source of
// prod's page). CREATE-ONLY: skips when the slug already exists, so it can
// never overwrite content editors may have entered since.
//
// Usage:
//   node scripts/patch-2026-06-12-mpc-page.mjs --env=dev [--dry-run]
//   node scripts/patch-2026-06-12-mpc-page.mjs --env=uat

import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, uploadFile, findOneBySlug, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY = isDryRun();
const ctx = initEnv();

const MPC = {
  name: 'Multi-Purpose Court',
  slug: 'multi-purpose-court',
  description:
    "Elevate your game at the Club's Multi-purpose Court (MPC), conveniently located beside the Scotts Road entrance. Whether you enjoy basketball, badminton, or pickleball, the MPC offers a versatile space for fitness, fun, and friendly competition.",
  parentLabel: 'Fitness & Wellness',
  parentHref: '/fitness',
  locationLevel: 'Basement 3',
  phone: '6739 4312',
  email: 'sportscounter@amclub.org.sg',
  locationContact: { locationLevel: 'Basement 3', phone: '6739 4312', email: 'sportscounter@amclub.org.sg' },
  operatingHoursSections: [
    { title: 'Operating Hours', rows: [{ dayRange: 'Daily', time: '7:00 AM – 9:00 PM' }] },
  ],
  order: 110, // after Golf (100) — matches the header nav's Activities order
};

(async () => {
  console.log(`Patch target: ${ctx.BASE}`);

  const existing = await findOneBySlug(ctx, 'fitness-facilities', MPC.slug);
  if (existing) {
    console.log(`  ✓ ${MPC.slug} already exists (documentId=${existing.documentId}) — create-only, skipping`);
    return;
  }

  let heroImage = null;
  const heroPath = join(ROOT, 'media', 'fitness', 'multi-purpose-court.jpeg');
  if (DRY) {
    console.log('  [dry] upload multi-purpose-court.jpeg; POST fitness-facilities (published)');
    return;
  }
  const up = await uploadFile(ctx, heroPath);
  heroImage = up?.id ?? null;
  console.log(`  ✓ hero uploaded (id=${heroImage})`);

  const resp = await api(ctx, '/fitness-facilities', {
    method: 'POST',
    body: { data: { ...MPC, heroImage, publishedAt: new Date().toISOString() } },
  });
  console.log(`  ✓ created ${MPC.slug} (documentId=${resp.data?.documentId}), published`);
  console.log('\n✓ Done.');
})().catch((e) => { console.error(e); process.exit(1); });
