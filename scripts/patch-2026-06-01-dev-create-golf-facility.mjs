// 2026-06-01 follow-up — Golf is missing from dev's fitness-facilities
// collection. On prod it lives in the legacy `/facilities` content-type;
// dev's tree migrated to `/fitness-facilities` and `scripts/seed-fitness-
// facilities.mjs` skipped Golf. /fitness/golf 404s on dev as a result.
//
// Create the Golf fitness-facility entry on dev using prod's golf data,
// adapted to dev's schema (heroImage instead of image, etc).
//
// Run: SEED_ENV=dev node scripts/patch-2026-06-01-dev-create-golf-facility.mjs

import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, findOneBySlug, uploadFile } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const ctx = initEnv();
const DRY = process.argv.includes('--dry-run');

const SLUG = 'golf';
const IMAGE_LOCAL = join(ROOT, 'media/fitness/golf.jpg');

const PROD_DESCRIPTION =
  'For our Golf Enthusiasts, we offer off-site golf programs in collaboration with partner ' +
  'golf courses, designed for Members who enjoy hitting the greens. These programs include ' +
  'casual rounds, practice sessions, and friendly competitions, providing a great way to ' +
  'play, improve your game, and connect with fellow members.';

const CTAS = [
  {
    label: 'Stay Updated',
    href: 'https://whatsapp.com/channel/0029VbB50Ow6LwHrEWWDAh3a',
    caption: null,
    isExternal: true,
    bordered: false,
    variant: 'primary',
    icon: 'arrow',
  },
];

async function main() {
  console.log(`[patch-2026-06-01-dev-create-golf-facility] target=${ctx.BASE} dry=${DRY}`);

  const existing = await findOneBySlug(ctx, 'fitness-facilities', SLUG);
  if (existing) {
    console.log(`  = ${SLUG} already exists (docId=${existing.documentId}) — skip`);
    return;
  }

  if (DRY) {
    console.log('  [dry] would upload golf.jpg + POST fitness-facility');
    return;
  }

  const uploaded = await uploadFile(ctx, IMAGE_LOCAL);
  console.log(`  ✓ image  id=${uploaded.id}  (${uploaded.name})`);

  const data = {
    name: 'Golf',
    slug: SLUG,
    description: PROD_DESCRIPTION,
    heroImage: uploaded.id,
    parentLabel: 'Fitness & Wellness',
    parentHref: '/fitness',
    ctas: CTAS,
    order: 100,                                                    // surfaces under Activities, after the named facilities
    publishedAt: new Date().toISOString(),
  };

  const res = await api(ctx, '/fitness-facilities', { method: 'POST', body: { data } });
  console.log(`  ✓ created  documentId=${res.data?.documentId}  name=${data.name}  slug=${SLUG}`);
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
