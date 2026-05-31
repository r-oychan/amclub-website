// 2026-06-01 follow-up — four event body trims.
//
// Run:  SEED_ENV=prod node scripts/patch-2026-06-01-event-body-trim.mjs
//       node scripts/patch-2026-06-01-event-body-trim.mjs --env=dev --dry-run

import { initEnv, api } from './seed-helpers.mjs';

const ctx = initEnv();
const DRY = process.argv.includes('--dry-run');

const PATCHES = [
  // 1) Heroes & Sidekicks — combine the two Session lines onto one line so
  //    the sessions + venue render as 2 lines instead of 3.
  {
    slug: 'heroes-and-sidekicks-fathers-day-2026',
    longDescription:
      'Session 1: 1:00 PM – 2:30 PM · Session 2: 3:00 PM – 4:30 PM\n' +
      'The Quad Studios\n\n\n' +
      "Step inside the Hero Training Grounds for a playful Father's Day adventure filled with creative crafts, fun challenges, and superhero moments. Kids will create personalized gifts, complete hero missions, and celebrate the everyday heroes they call Dad.\n\n\n" +
      'Member: $40 for dad & child\n' +
      'Guest: $45 for dad & child\n\n\n' +
      'Additional $10 for Sidekick Lounge Access\n' +
      'Relax with refreshments and a casual lounge space while the little heroes complete their missions.\n\n\n' +
      'Terms and Conditions:\n' +
      'A 48-hour cancellation policy applies. Members will be charged for the full event fee for no-shows or cancellations made less than 48 hours before the event.',
  },

  // 2) Camp Eagle — drop the duplicate "Venue: The American Club & various
  //    locations around Singapore" line from both age groups.
  {
    slug: 'camp-eagle-explorers-summer-2026',
    longDescription:
      'Members: $140 per day | $700 per week\n' +
      'Guests: $160 per day | $800 per week\n\n\n' +
      '4-7 years old\n' +
      'Time: 9:00 AM – 3:00 PM\n\n\n' +
      '8 years old and above\n' +
      'Time: 8:30 AM – 3:00 PM',
  },

  // 3) 4th of July — drop the date/time prefix (already in event.date / time)
  //    and the trailing "Get your tickets here." (CTA covers it).
  {
    slug: 'fourth-of-july-celebration-2026',
    longDescription:
      '$29 per person\n' +
      '(enter code FOJ250TAC upon checkout to enjoy $10 off entry fee)\n\n' +
      'The prices listed above are inclusive of $10 worth of F&B and activity* tickets.',
  },

  // 4) Celebrate Dad @ Union Bar — clear duplicated date out of the time
  //    field (event.date already covers it; there's no actual time-of-day).
  {
    slug: 'celebrate-dad-this-fathers-day-union-bar',
    time: null,
  },
];

async function main() {
  console.log(`[patch-2026-06-01-event-body-trim] target=${ctx.BASE} dry=${DRY}`);
  for (const p of PATCHES) {
    const r = await api(
      ctx,
      `/events?filters[slug][$eq]=${p.slug}&publicationState=preview&pagination[limit]=1`,
    );
    const e = r?.data?.[0];
    if (!e) { console.log(`  ✗ ${p.slug} — not found, skip`); continue; }

    const payload = {};
    if (p.longDescription !== undefined && (e.longDescription || '') !== p.longDescription) {
      payload.longDescription = p.longDescription;
    }
    if ('time' in p && (e.time ?? null) !== (p.time ?? null)) {
      payload.time = p.time;
    }

    if (Object.keys(payload).length === 0) {
      console.log(`  = ${p.slug} — already clean`);
      continue;
    }
    if (DRY) {
      console.log(`  [dry] PUT ${p.slug} fields: ${Object.keys(payload).join(',')}`);
      continue;
    }
    await api(ctx, `/events/${e.documentId}`, { method: 'PUT', body: { data: payload } });
    console.log(`  ✓ updated ${p.slug} — ${Object.keys(payload).join(', ')}`);
  }
  console.log('— done —');
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
