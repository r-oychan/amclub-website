#!/usr/bin/env node
// DEV-ONLY DUMMY-DATA PATCH — shift every seeded event's date into the future
// so the homepage events marquee and the What's On listing have visible
// content while real 2026 H2 events are pending. Also flags the first
// EVENTS_TO_FEATURE upcoming events as featuredOnHomepage so the marquee
// (which prefers curated events) fills.
//
// The canonical dates live in scripts/event-seed-data.json — re-running
// `node scripts/seed-events.mjs --env=dev` restores them at any time.
//
// Do NOT run against uat/prod: those environments must carry real dates.
//
// Usage:
//   node scripts/patch-2026-07-07-dev-future-event-dates.mjs --env=dev --dry-run
//   node scripts/patch-2026-07-07-dev-future-event-dates.mjs --env=dev

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY = isDryRun();
const ctx = initEnv();

const EVENTS_TO_FEATURE = 8;
const SPREAD_DAYS = 45; // spread the re-dated events over the next ~6 weeks

if (!/dev/i.test(ctx.BASE)) {
  console.error(`Refusing to run against non-dev base URL: ${ctx.BASE}`);
  process.exit(1);
}

(async () => {
  console.log(`Patch target: ${ctx.BASE}`);

  // The events API applies an expiry filter to list queries (past events are
  // hidden), so a plain GET /events returns nothing here. Slug-filtered
  // lookups bypass the filter — resolve each seeded event individually via
  // the slugs in event-seed-data.json.
  const seedData = JSON.parse(
    readFileSync(join(__dirname, 'event-seed-data.json'), 'utf8'),
  );
  const seedEvents = (Array.isArray(seedData) ? seedData : seedData.events) ?? [];
  const events = [];
  for (const s of seedEvents) {
    if (!s.slug) continue;
    const res = await api(
      ctx,
      `/events?filters[slug][$eq]=${encodeURIComponent(s.slug)}&status=published`,
    );
    const found = res.data?.[0];
    if (found) events.push(found);
    else console.log(`  ! not found on target: ${s.slug}`);
  }
  events.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (!events.length) {
    console.log('No events found — run seed-events.mjs first.');
    return;
  }

  // Re-date: keep the original chronological order, spread evenly starting
  // tomorrow across SPREAD_DAYS so the listing looks natural.
  const start = new Date();
  start.setDate(start.getDate() + 1);
  const step = Math.max(1, Math.floor(SPREAD_DAYS / events.length));

  let day = 0;
  let featured = 0;
  for (const ev of events) {
    const d = new Date(start);
    d.setDate(d.getDate() + day);
    day += step;
    const date = d.toISOString().slice(0, 10);
    const feature = featured < EVENTS_TO_FEATURE;
    if (feature) featured += 1;

    if (DRY) {
      console.log(`  [dry] ${ev.slug}: ${ev.date} → ${date}${feature ? ' (featured)' : ''}`);
      continue;
    }
    await api(ctx, `/events/${ev.documentId}`, {
      method: 'PUT',
      body: { data: { date, featuredOnHomepage: feature } },
    });
    console.log(`  ↻ ${ev.slug}: ${ev.date} → ${date}${feature ? ' (featured)' : ''}`);
  }

  console.log(`\n✓ Re-dated ${events.length} events, featured ${featured}.`);
})().catch((err) => { console.error(err); process.exit(1); });
