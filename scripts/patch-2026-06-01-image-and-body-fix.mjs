// 2026-06-01 follow-up — Camp Eagle's hero image actually belonged to
// 4th of July Celebration. Move it.
//
// Run:  SEED_ENV=prod node scripts/patch-2026-06-01-image-and-body-fix.mjs
//       node scripts/patch-2026-06-01-image-and-body-fix.mjs --env=dev --dry-run
//
// Ops:
//   1. Camp Eagle Explorers Summer 2026 — detach image (revert to no image).
//   2. Camp Eagle Explorers Summer 2026 — remove the two "[Register here](…)"
//      lines from longDescription (CTAs already cover the action).
//   3. Replace the misnamed media file in Strapi (the file currently lives
//      under `event-camp-eagle-explorers-summer-2026.jpg` but its content is
//      the 4th of July artwork). Delete the old upload, re-upload from the
//      renamed local path, attach to 4th of July.
//
// Idempotent: each op verifies first and skips if already in the desired state.

import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, findOneBySlug, uploadFile } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const ctx = initEnv();
const DRY = process.argv.includes('--dry-run');

const CAMP_EAGLE_NEW_BODY =
  'Members: $140 per day | $700 per week\n' +
  'Guests: $160 per day | $800 per week\n\n\n' +
  '4-7 years old\n' +
  'Time: 9:00 AM – 3:00 PM\n' +
  'Venue: The American Club & various locations around Singapore\n\n\n' +
  '8 years old and above\n' +
  'Time: 8:30 AM – 3:00 PM\n' +
  'Venue: The American Club & various locations around Singapore';

const NEW_IMAGE_NAME = 'event-fourth-of-july-celebration-2026.jpg';
const NEW_IMAGE_PATH = join(ROOT, 'media/events/event-fourth-of-july-celebration-2026.jpg');

async function main() {
  console.log(`[patch-2026-06-01-image-and-body-fix] target=${ctx.BASE} dry=${DRY}`);

  // ---- Op 1+2: Camp Eagle — detach image + rewrite body ----
  console.log('\n[1+2] Camp Eagle Explorers Summer 2026 — detach image + remove Register here lines');
  const ce = await findOneBySlug(ctx, 'events', 'camp-eagle-explorers-summer-2026');
  if (!ce) {
    console.log('  ✗ camp-eagle event not found — skip');
  } else {
    // Need image + longDescription
    const ceFull = await api(
      ctx,
      `/events?filters[slug][$eq]=camp-eagle-explorers-summer-2026&populate=*&publicationState=preview&pagination[limit]=1`,
    );
    const e = ceFull.data[0];
    const wantImage = null;
    const bodyMatches = (e.longDescription || '') === CAMP_EAGLE_NEW_BODY;
    const imageMatches = e.image == null;
    if (bodyMatches && imageMatches) {
      console.log('  = already done — skip');
    } else {
      const payload = {};
      if (!bodyMatches) payload.longDescription = CAMP_EAGLE_NEW_BODY;
      if (!imageMatches) payload.image = wantImage;
      if (DRY) {
        console.log('  [dry] PUT camp-eagle fields:', Object.keys(payload).join(','));
      } else {
        await api(ctx, `/events/${e.documentId}`, { method: 'PUT', body: { data: payload } });
        console.log('  ✓ updated camp-eagle:', Object.keys(payload).join(', '));
      }
    }
  }

  // ---- Op 3: delete misnamed media, re-upload, attach to 4th of July ----
  console.log('\n[3] 4th of July Celebration — upload renamed file + attach');
  const foj = await findOneBySlug(ctx, 'events', 'fourth-of-july-celebration-2026');
  if (!foj) {
    console.log('  ✗ 4th of July event not found on this env — skip');
  } else {
    const fojFull = await api(
      ctx,
      `/events?filters[slug][$eq]=fourth-of-july-celebration-2026&populate=*&publicationState=preview&pagination[limit]=1`,
    );
    const e = fojFull.data[0];
    if (e.image?.name === NEW_IMAGE_NAME) {
      console.log('  = 4th of July already has correctly-named image — skip');
    } else {
      // Delete the misnamed media (id 366 on prod). Look it up by exact name
      // rather than hardcoding the id, so the same op replays cleanly on dev.
      const misnamed = await fetch(
        `${ctx.BASE}/api/upload/files?filters[name][$eq]=${encodeURIComponent('event-camp-eagle-explorers-summer-2026.jpg')}`,
        { headers: ctx.auth },
      ).then((r) => r.json()).catch(() => []);
      const old = Array.isArray(misnamed) && misnamed[0];
      if (old && !DRY) {
        const delRes = await fetch(`${ctx.BASE}/api/upload/files/${old.id}`, { method: 'DELETE', headers: ctx.auth });
        if (delRes.ok) console.log(`  ✓ deleted misnamed media id=${old.id}`);
        else console.log(`  ⚠ delete misnamed media id=${old.id} returned ${delRes.status}`);
      } else if (old) {
        console.log(`  [dry] would DELETE misnamed media id=${old.id}`);
      }

      if (DRY) {
        console.log(`  [dry] upload ${NEW_IMAGE_PATH} + attach to 4th of July`);
      } else {
        const uploaded = await uploadFile(ctx, NEW_IMAGE_PATH);
        await api(ctx, `/events/${e.documentId}`, { method: 'PUT', body: { data: { image: uploaded.id } } });
        console.log(`  ✓ uploaded ${NEW_IMAGE_NAME} (id=${uploaded.id}) + attached to 4th of July`);
      }
    }
  }

  console.log('\n— done —');
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
