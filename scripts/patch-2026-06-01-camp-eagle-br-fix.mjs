// 2026-06-01 follow-up — remove the literal "<br />" text from Camp Eagle
// body. react-markdown doesn't parse inline HTML without rehype-raw, so the
// tag was rendering as visible text. Use a plain paragraph break (\n\n)
// between the two age groups instead.

import { initEnv, api } from './seed-helpers.mjs';

const ctx = initEnv();
const DRY = process.argv.includes('--dry-run');

const SLUG = 'camp-eagle-explorers-summer-2026';
const NEW_BODY =
  'Members: $140 per day | $700 per week\n' +
  'Guests: $160 per day | $800 per week\n\n' +
  '4-7 years old\n' +
  'Time: 9:00 AM – 3:00 PM\n\n' +
  '8 years old and above\n' +
  'Time: 8:30 AM – 3:00 PM';

async function main() {
  console.log(`[patch-2026-06-01-camp-eagle-br-fix] target=${ctx.BASE} dry=${DRY}`);
  const r = await api(ctx, `/events?filters[slug][$eq]=${SLUG}&publicationState=preview&pagination[limit]=1`);
  const e = r?.data?.[0];
  if (!e) { console.log('  ✗ event not found, skip'); return; }
  if ((e.longDescription || '') === NEW_BODY) { console.log('  = already clean — skip'); return; }
  if (DRY) { console.log('  [dry] PUT new body length=' + NEW_BODY.length); return; }
  await api(ctx, `/events/${e.documentId}`, { method: 'PUT', body: { data: { longDescription: NEW_BODY } } });
  console.log('  ✓ updated — removed literal <br /> text');
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
