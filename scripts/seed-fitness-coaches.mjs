#!/usr/bin/env node
// Seed the 4 per-discipline coach collections introduced in Section 2:
//   - aquatics-coach (12)
//   - tennis-coach (9)
//   - pilates-instructor (7)
//   - gym-trainer (20)
//
// Source of truth: scripts/data/fitness-team-data.json, extracted from
// frontend/src/data/subpages.ts. Photos resolve against
// media/fitness/team-{aquatics,pilates,pt,/}.
//
// Each person becomes one collection entry with photo + optional bioImage,
// plus the display tuning fields (imageOffsetX/Y, imageZoom) that used to
// live on the inline `shared.team-member` component. `bioDocument` and
// `bioHtml` are left empty — they exist in the schema so editors can attach
// detailed PDFs / rich HTML modal content later without code changes.
//
// Run against dev:
//   SEED_ENV=dev node scripts/seed-fitness-coaches.mjs --dry-run
//   SEED_ENV=dev node scripts/seed-fitness-coaches.mjs

import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { initEnv, api, findOneBySlug, uploadFile, isDryRun, slugify } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY = isDryRun();
const ctx = initEnv();

const TEAM_DATA = JSON.parse(
  readFileSync(join(ROOT, 'scripts', 'data', 'fitness-team-data.json'), 'utf8'),
);

// Each facility slug maps to its collection and the local-disk directory
// that holds the team photos. The `image` paths in subpages.ts use
// /images/fitness/team-*/* (which the frontend serves out of
// public/images/...), so swap that prefix for media/fitness/team-*/.
const FACILITY_MAP = {
  aquatics: { plural: 'aquatics-coaches', mediaDir: 'media/fitness/team-aquatics' },
  tennis:   { plural: 'tennis-coaches',   mediaDir: 'media/fitness/team' },
  pilates:  { plural: 'pilates-instructors', mediaDir: 'media/fitness/team-pilates' },
  gym:      { plural: 'gym-trainers',     mediaDir: 'media/fitness/team-pt' },
};

function localPathFor(webPath) {
  if (!webPath) return null;
  // webPath examples:
  //   /images/fitness/team-aquatics/greg.jpg
  //   /images/fitness/team/azhar-zainudin.jpg
  //   /images/fitness/team-pilates/annie-agoncillo-bio.png
  const stripped = webPath.replace(/^\/(images|uploads)\//, '');
  // Try media/<stripped> first
  const direct = join(ROOT, 'media', stripped);
  if (existsSync(direct)) return direct;
  return null;
}

async function uploadIfPresent(webPath) {
  const local = localPathFor(webPath);
  if (!local) return null;
  if (DRY) {
    console.log(`    [dry] upload ${basename(local)}`);
    return { id: -1, name: basename(local) };
  }
  const m = await uploadFile(ctx, local);
  return m;
}

async function upsertCoach(plural, person) {
  const slug = slugify(person.name);
  const photo = await uploadIfPresent(person.image);
  const bioImage = await uploadIfPresent(person.bioImage);
  const payload = {
    name: person.name,
    slug,
    role: person.role || '—',
    order: person.order ?? 0,
    photo: photo?.id ?? null,
    bioImage: bioImage?.id ?? null,
    imageOffsetX: person.imageOffsetX ?? 50,
    imageOffsetY: person.imageOffsetY ?? 50,
    imageZoom: person.imageZoom ?? 1,
    publishedAt: new Date().toISOString(),
  };
  if (DRY) {
    console.log(`  [dry] upsert ${plural}/${slug} (photo=${!!photo} bioImage=${!!bioImage})`);
    return;
  }
  const existing = await findOneBySlug(ctx, plural, slug);
  if (existing?.documentId) {
    await api(ctx, `/${plural}/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    console.log(`  ↻ updated ${plural}/${slug}`);
  } else {
    await api(ctx, `/${plural}`, { method: 'POST', body: { data: payload } });
    console.log(`  + created ${plural}/${slug}`);
  }
}

async function seedFacility(facilitySlug) {
  const cfg = FACILITY_MAP[facilitySlug];
  if (!cfg) {
    console.warn(`  ! no FACILITY_MAP entry for ${facilitySlug}`);
    return;
  }
  const people = TEAM_DATA[facilitySlug] ?? [];
  console.log(`\n─── ${facilitySlug} → ${cfg.plural} (${people.length} people) ───`);
  for (let i = 0; i < people.length; i++) {
    const person = { ...people[i], order: i };
    await upsertCoach(cfg.plural, person);
  }
}

(async () => {
  console.log(`Seed target: ${ctx.BASE}`);
  console.log(`Dry run: ${DRY}`);
  for (const slug of Object.keys(FACILITY_MAP)) {
    await seedFacility(slug);
  }
  console.log('\n✓ Done.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
