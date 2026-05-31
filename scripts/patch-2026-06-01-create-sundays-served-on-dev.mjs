// 2026-06-01 follow-up — Sundays Served Right has been the long-standing
// "n/a on dev" row in the log because the event never made it into dev's
// Strapi during the inter-batch reseed. Create it directly in its final
// (post-05-30 relaunch + 06-01 trim) state so all the prior dev:n/a rows
// can flip to applied.

import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, findOneBySlug, uploadFile } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const ctx = initEnv();
const DRY = process.argv.includes('--dry-run');

const SLUG = 'sundays-served-right-the-2nd-floor';
const IMAGE_LOCAL = join(ROOT, 'media/events/event-sundays-served-right-the-2nd-floor.jpg');

const FINAL_BODY =
  'Unwind on Sunday with a relaxed semi-buffet lunch at The 2nd Floor. ' +
  'Enjoy a curated spread of starters, mains, and desserts crafted for a leisurely afternoon with family and friends.\n\n' +
  'For reservations and enquiries, contact The 2nd Floor at 6739 4329 or [2ndfloor@amclub.org.sg](mailto:2ndfloor@amclub.org.sg).';

const CTAS = [
  { label: 'Email The 2nd Floor', href: 'mailto:2ndfloor@amclub.org.sg', caption: null, isExternal: true, bordered: false, variant: 'primary', icon: 'mail' },
];

async function main() {
  console.log(`[patch-2026-06-01-create-sundays-served-on-dev] target=${ctx.BASE} dry=${DRY}`);

  const existing = await findOneBySlug(ctx, 'events', SLUG);
  if (existing) {
    console.log(`  = ${SLUG} already exists (docId=${existing.documentId}) — script not needed here`);
    return;
  }

  const cat = await findOneBySlug(ctx, 'event-categories', 'dining');
  if (!cat) throw new Error('event-category dining not found');

  if (DRY) {
    console.log('  [dry] would upload image + POST event with final state');
    return;
  }

  // Upload image (seed-helpers handles "already uploaded" dedupe)
  const uploaded = await uploadFile(ctx, IMAGE_LOCAL);
  console.log(`  ✓ image  id=${uploaded.id}  (${uploaded.name})`);

  const data = {
    title: 'Sundays Served Right @ The 2nd Floor',
    slug: SLUG,
    description: 'Unwind on Sunday with a relaxed semi-buffet lunch at The 2nd Floor featuring a curated spread of starters, mains, and desserts.',
    longDescription: FINAL_BODY,
    date: '2026-06-28',
    time: '11:30 AM – 2:30 PM',
    location: 'The 2nd Floor',
    category: cat.documentId,
    image: uploaded.id,
    ctas: CTAS,
    publishedAt: new Date().toISOString(),
  };

  const res = await api(ctx, '/events', { method: 'POST', body: { data } });
  console.log(`  ✓ created  documentId=${res.data?.documentId}  title="${data.title}"  date=${data.date}`);
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
