// 2026-06-01 follow-up — attach the 14 hero images user dropped in
// media/unsorted/, now relocated to media/events/event-<slug>.jpg.
// Also reclassifies Sip & Serve from fitness-wellness → dining per the
// new category mapping.
//
// Idempotent:
//   - if event already has the correctly-named image, skip.
//   - if event has a different image, the old media is DELETED first.
//   - the same image filename is then uploaded (or re-used if it
//     already exists in the Strapi media library under the same name).
//
// Run:  SEED_ENV=prod node scripts/patch-2026-06-01-event-images.mjs
//       node scripts/patch-2026-06-01-event-images.mjs --env=dev --dry-run

import { resolve, dirname, join } from 'node:path';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initEnv, api, uploadFile, findOneBySlug } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const ctx = initEnv();
const DRY = process.argv.includes('--dry-run');

// slug → filename (filename always equals event-<slug>.jpg, so we derive)
const SLUGS = [
  'sip-and-serve-french-open-2026',
  'football-fever-night-union-bar-2026',
  'basketball-finals-live-screening-union-bar-2026',
  'tiny-art-explorers-program-37',
  'camp-eagle-explorers-summer-2026',
  'heroes-and-sidekicks-fathers-day-2026',
  'a-delicious-spread-for-dad-the-2nd-floor',
  'smokin-sundays-grillhouse-2026-06',
  'celebrate-dad-this-fathers-day-grillhouse',
  'a-treat-for-dad-this-fathers-day-central',
  'celebrate-dad-this-fathers-day-tradewinds',
  'celebrate-dad-this-fathers-day-union-bar',
  'sundays-served-right-the-2nd-floor',
  'fourth-of-july-celebration-2026',
];

async function findMediaByName(name) {
  const url = `${ctx.BASE}/api/upload/files?filters[name][$eq]=${encodeURIComponent(name)}`;
  const res = await fetch(url, { headers: ctx.auth });
  if (!res.ok) return null;
  const arr = await res.json();
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}

async function deleteMedia(id) {
  const res = await fetch(`${ctx.BASE}/api/upload/files/${id}`, { method: 'DELETE', headers: ctx.auth });
  return res.ok;
}

async function patchOneEvent(slug) {
  const filename = `event-${slug}.jpg`;
  const localPath = join(ROOT, 'media/events', filename);

  const r = await api(ctx, `/events?filters[slug][$eq]=${slug}&populate[image]=true&publicationState=preview&pagination[limit]=1`);
  const e = r?.data?.[0];
  if (!e) { console.log(`  ✗ ${slug} — event not found, skip`); return; }

  // Strapi stores `size` in KB (number). Compare against local file size
  // (bytes / 1024, rounded to 2dp) — if they match within 1 KB, the bytes
  // are effectively identical and we can skip re-upload. If different, fall
  // through to the delete-and-replace path. This makes the script truly
  // idempotent across re-runs while still replacing artwork when the local
  // file changes.
  if (e.image?.name === filename) {
    const localBytes = statSync(localPath).size;
    const localKB = localBytes / 1024;
    const remoteKB = e.image.size ?? 0;
    if (Math.abs(localKB - remoteKB) < 1) {
      console.log(`  = ${slug} — already has ${filename} (${remoteKB.toFixed(2)} KB)`);
      return;
    }
    console.log(`  ↻ ${slug} — same filename but different bytes (local=${localKB.toFixed(2)} KB, remote=${remoteKB.toFixed(2)} KB), will replace`);
  }

  if (DRY) {
    const action = e.image ? `replace (current=${e.image.name})` : 'attach (no prior image)';
    console.log(`  [dry] ${slug} — ${action} with ${filename}`);
    return;
  }

  // 1) Detach + delete old image media (if any)
  if (e.image?.id) {
    await deleteMedia(e.image.id).then((ok) => console.log(`    ${ok ? '✓' : '⚠'} deleted old media id=${e.image.id} (${e.image.name})`));
  }

  // 2) Upload the new file (seed-helpers' uploadFile dedupes by name —
  //    so if the same filename was previously uploaded for a different
  //    event and detached, this returns that media. Find-and-delete
  //    ensures we always upload fresh bytes.)
  const stale = await findMediaByName(filename);
  if (stale && stale.id !== e.image?.id) {
    await deleteMedia(stale.id);
    console.log(`    ✓ deleted stale duplicate media id=${stale.id} (${filename})`);
  }
  const uploaded = await uploadFile(ctx, localPath);

  // 3) Attach
  await api(ctx, `/events/${e.documentId}`, { method: 'PUT', body: { data: { image: uploaded.id } } });
  console.log(`  ✓ ${slug} — attached id=${uploaded.id} (${filename})`);
}

async function fixSipAndServeCategory() {
  console.log('\n[category] sip-and-serve-french-open-2026 → dining');
  const r = await api(ctx, '/events?filters[slug][$eq]=sip-and-serve-french-open-2026&populate[category]=true&publicationState=preview&pagination[limit]=1');
  const e = r?.data?.[0];
  if (!e) { console.log('  ✗ event not found'); return; }
  if (e.category?.slug === 'dining') { console.log('  = already dining'); return; }
  const cat = await findOneBySlug(ctx, 'event-categories', 'dining');
  if (!cat) { console.log('  ✗ category dining not found'); return; }
  if (DRY) { console.log(`  [dry] PUT category dining`); return; }
  await api(ctx, `/events/${e.documentId}`, { method: 'PUT', body: { data: { category: cat.documentId } } });
  console.log(`  ✓ updated category → dining`);
}

async function main() {
  console.log(`[patch-2026-06-01-event-images] target=${ctx.BASE} dry=${DRY}`);

  await fixSipAndServeCategory();

  console.log('\n[images] attach 14 hero images');
  for (const s of SLUGS) await patchOneEvent(s);

  console.log('\n— done —');
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
