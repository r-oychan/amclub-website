// 2026-06-01 follow-up — there were two Tiny Art Explorers June programs:
//   - tiny-art-explorers-program-37 — dated 2026-05-28, has the June hero
//     image but a stale May 28 date.
//   - tiny-art-explorers-2026-06 — dated 2026-06-04 (correct June date),
//     no hero image.
//
// User asked to remove the May 28 entry and put the hero image on the
// June 4 entry. This script:
//   1. Deletes program-37 (and its old hero-image media — keep the Strapi
//      library tidy).
//   2. Uploads the renamed local file event-tiny-art-explorers-2026-06.jpg
//      and attaches it to tiny-art-explorers-2026-06.

import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, findOneBySlug, uploadFile } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const ctx = initEnv();
const DRY = process.argv.includes('--dry-run');

const TO_DELETE_SLUG = 'tiny-art-explorers-program-37';
const TO_KEEP_SLUG = 'tiny-art-explorers-2026-06';
const NEW_IMAGE_NAME = 'event-tiny-art-explorers-2026-06.jpg';
const NEW_IMAGE_PATH = join(ROOT, 'media/events/event-tiny-art-explorers-2026-06.jpg');

async function deleteMedia(id) {
  const r = await fetch(`${ctx.BASE}/api/upload/files/${id}`, { method: 'DELETE', headers: ctx.auth });
  return r.ok;
}

async function findMediaByName(name) {
  const r = await fetch(`${ctx.BASE}/api/upload/files?filters[name][$eq]=${encodeURIComponent(name)}`, { headers: ctx.auth });
  if (!r.ok) return null;
  const arr = await r.json();
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}

async function main() {
  console.log(`[patch-2026-06-01-tiny-art-may28-cleanup] target=${ctx.BASE} dry=${DRY}`);

  // ---- 1) Delete the May 28 event + its media ----
  console.log(`\n[1] Delete ${TO_DELETE_SLUG} (May 28 duplicate)`);
  const r1 = await api(
    ctx,
    `/events?filters[slug][$eq]=${TO_DELETE_SLUG}&populate[image]=true&publicationState=preview&pagination[limit]=1`,
  );
  const stale = r1?.data?.[0];
  if (!stale) {
    console.log('  = already gone — skip');
  } else {
    const oldImageId = stale.image?.id;
    if (DRY) {
      console.log(`  [dry] DELETE event docId=${stale.documentId}` + (oldImageId ? ` + DELETE media id=${oldImageId}` : ''));
    } else {
      await api(ctx, `/events/${stale.documentId}`, { method: 'DELETE' });
      console.log(`  ✓ deleted event docId=${stale.documentId}`);
      if (oldImageId) {
        const ok = await deleteMedia(oldImageId);
        console.log(`  ${ok ? '✓' : '⚠'} deleted media id=${oldImageId} (${stale.image?.name})`);
      }
    }
  }

  // Also sweep any orphan media with the old name (left over from prior runs)
  const oldNamed = await findMediaByName('event-tiny-art-explorers-program-37.jpg');
  if (oldNamed) {
    if (DRY) console.log(`  [dry] would DELETE orphan media id=${oldNamed.id} (event-tiny-art-explorers-program-37.jpg)`);
    else {
      await deleteMedia(oldNamed.id);
      console.log(`  ✓ deleted orphan media id=${oldNamed.id} (event-tiny-art-explorers-program-37.jpg)`);
    }
  }

  // ---- 2) Attach hero image to the surviving June 4 event ----
  console.log(`\n[2] Upload + attach ${NEW_IMAGE_NAME} to ${TO_KEEP_SLUG}`);
  const r2 = await api(
    ctx,
    `/events?filters[slug][$eq]=${TO_KEEP_SLUG}&populate[image]=true&publicationState=preview&pagination[limit]=1`,
  );
  const keep = r2?.data?.[0];
  if (!keep) {
    console.log(`  ✗ ${TO_KEEP_SLUG} not found — skip`);
    return;
  }
  if (keep.image?.name === NEW_IMAGE_NAME) {
    console.log(`  = image already attached — skip`);
    return;
  }
  // Strip any stale media in the library using the new name (defensive)
  const stale2 = await findMediaByName(NEW_IMAGE_NAME);
  if (stale2) {
    if (!DRY) await deleteMedia(stale2.id);
    console.log(`  ✓ cleared stale media id=${stale2.id} (${NEW_IMAGE_NAME})`);
  }
  if (DRY) {
    console.log(`  [dry] would upload ${NEW_IMAGE_PATH} + PUT image`);
    return;
  }
  const uploaded = await uploadFile(ctx, NEW_IMAGE_PATH);
  await api(ctx, `/events/${keep.documentId}`, { method: 'PUT', body: { data: { image: uploaded.id } } });
  console.log(`  ✓ uploaded ${NEW_IMAGE_NAME} (id=${uploaded.id}) + attached to ${TO_KEEP_SLUG}`);
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
