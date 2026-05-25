// Apply About page committee-member batch from 2026-05-25.
//   1. Replace Michelle Reeb → Christopher Ellis (same role, new photo).
//   2. Remove Rachael Gartman.
//
// Run: SEED_ENV=prod node scripts/patch-about-committee-2026-05-25.mjs
//      node scripts/patch-about-committee-2026-05-25.mjs --env=dev --dry-run
//      node scripts/patch-about-committee-2026-05-25.mjs --env=prod --only=1
//
// Idempotent:
//   - Op 1: if "christopher-ellis" slug already exists, only patches missing fields.
//   - Op 2: if "rachael-gartman" already missing, op is a no-op.
//
// Strapi committee-member has draftAndPublish=false, so no publish step needed.

import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, findOneBySlug, uploadFile, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const ctx = initEnv();
const DRY = isDryRun();
const onlyFlag = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyFlag ? Number(onlyFlag.slice('--only='.length)) : null;

const NEW_PHOTO_PATH = join(ROOT, 'media/about/gc-christopher-ellis.png');

const OPS = {
  // ---------------- 1 — Replace Michelle Reeb with Christopher Ellis ----------------
  1: async () => {
    console.log('\n[1] Replace Michelle Reeb → Christopher Ellis');

    // Find the source record (Michelle) — and check if Christopher already exists
    // (rerun safety).
    const christopher = await findOneBySlug(ctx, 'committee-members', 'christopher-ellis');
    const michelle = await findOneBySlug(ctx, 'committee-members', 'michelle-reeb');

    if (christopher && !michelle) {
      console.log('  = already replaced (christopher-ellis exists, michelle-reeb gone) — skipping');
      return;
    }
    if (!michelle && !christopher) {
      throw new Error('Neither michelle-reeb nor christopher-ellis exist — cannot replace');
    }
    const target = michelle || christopher;
    console.log(`  target: documentId=${target.documentId}  current name=${target.name}  order=${target.order}`);

    // Upload new photo (idempotent — findUploadedByName check is in seed-helpers).
    let photoId;
    if (DRY) {
      console.log(`  [dry] would upload ${NEW_PHOTO_PATH}`);
      photoId = 0;
    } else {
      const uploaded = await uploadFile(ctx, NEW_PHOTO_PATH);
      photoId = uploaded.id;
      console.log(`  ✓ photo upload  id=${photoId}  name=${uploaded.name}`);
    }

    const payload = {
      name: 'Christopher Ellis',
      slug: 'christopher-ellis',
      role: target.role,             // preserve role: "American Association of Singapore Representative"
      memberType: target.memberType || 'general-committee',
      order: target.order,
      ...(photoId ? { photo: photoId } : {}),
    };

    if (DRY) {
      console.log('  [dry] would PUT', JSON.stringify(payload));
      return;
    }
    await api(ctx, `/committee-members/${target.documentId}`, {
      method: 'PUT',
      body: { data: payload },
    });
    console.log(`  ✓ updated  ${target.documentId}  name=Christopher Ellis  slug=christopher-ellis`);
  },

  // ---------------- 2 — Remove Rachael Gartman ----------------
  2: async () => {
    console.log('\n[2] Remove Rachael Gartman');
    const rg = await findOneBySlug(ctx, 'committee-members', 'rachael-gartman');
    if (!rg) {
      console.log('  = already removed — skipping');
      return;
    }
    if (DRY) {
      console.log(`  [dry] would DELETE /committee-members/${rg.documentId}`);
      return;
    }
    await api(ctx, `/committee-members/${rg.documentId}`, { method: 'DELETE' });
    console.log(`  ✓ deleted committee-member rachael-gartman (documentId=${rg.documentId})`);
  },
};

async function main() {
  console.log(`[patch-about-committee-2026-05-25] target=${ctx.BASE} dry=${DRY} only=${ONLY ?? 'all'}`);
  const ids = ONLY ? [ONLY] : Object.keys(OPS).map(Number).sort((a, b) => a - b);
  for (const id of ids) {
    try { await OPS[id](); }
    catch (e) { console.error(`  ✗ [${id}] ${e.message}`); }
  }
  console.log('\n— done —');
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
