// 2026-06-01 follow-up — strip redundant inline links/text from two event
// bodies where the CTA button already carries the action.
//
// Run:  SEED_ENV=prod node scripts/patch-2026-06-01-event-body-cleanup.mjs
//       node scripts/patch-2026-06-01-event-body-cleanup.mjs --env=dev --dry-run

import { initEnv, api } from './seed-helpers.mjs';

const ctx = initEnv();
const DRY = process.argv.includes('--dry-run');

const PATCHES = [
  {
    slug: 'basketball-finals-live-screening-union-bar-2026',
    // strip trailing "View the schedule here." (CTA "View Schedule" already
    // covers it). Keep the descriptive paragraph as-is.
    longDescription:
      'Catch the Basketball Finals 2026 live at Union Bar and enjoy the excitement of the game with fellow fans, great food, and drinks.',
  },
  {
    slug: 'heroes-and-sidekicks-fathers-day-2026',
    // strip the inline "[Register here](…)." paragraph; CTA already covers it.
    longDescription:
      'Session 1: 1:00 PM – 2:30 PM\n' +
      'Session 2: 3:00 PM – 4:30 PM\n' +
      'The Quad Studios\n\n\n' +
      "Step inside the Hero Training Grounds for a playful Father's Day adventure filled with creative crafts, fun challenges, and superhero moments. Kids will create personalized gifts, complete hero missions, and celebrate the everyday heroes they call Dad.\n\n\n" +
      'Member: $40 for dad & child\n' +
      'Guest: $45 for dad & child\n\n\n' +
      'Additional $10 for Sidekick Lounge Access\n' +
      'Relax with refreshments and a casual lounge space while the little heroes complete their missions.\n\n\n' +
      'Terms and Conditions:\n' +
      'A 48-hour cancellation policy applies. Members will be charged for the full event fee for no-shows or cancellations made less than 48 hours before the event.',
  },
];

async function main() {
  console.log(`[patch-2026-06-01-event-body-cleanup] target=${ctx.BASE} dry=${DRY}`);
  for (const p of PATCHES) {
    const r = await api(
      ctx,
      `/events?filters[slug][$eq]=${p.slug}&publicationState=preview&pagination[limit]=1`,
    );
    const e = r?.data?.[0];
    if (!e) { console.log(`  ✗ ${p.slug} — not found, skip`); continue; }
    if ((e.longDescription || '') === p.longDescription) {
      console.log(`  = ${p.slug} — already cleaned`);
      continue;
    }
    if (DRY) {
      console.log(`  [dry] PUT ${p.slug} new body length=${p.longDescription.length}`);
      continue;
    }
    await api(ctx, `/events/${e.documentId}`, { method: 'PUT', body: { data: { longDescription: p.longDescription } } });
    console.log(`  ✓ updated ${p.slug}`);
  }
  console.log('— done —');
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
