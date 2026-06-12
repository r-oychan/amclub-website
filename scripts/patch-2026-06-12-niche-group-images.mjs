#!/usr/bin/env node
// Attach real CMS media to the niche-group-membership-page singleton:
//   - heroImage            ← media/membership/niche-group/hero.jpg
//   - tier images uploaded to the Media Library but NOT attached — prod's
//     tier cards render gradient tiles; editors attach a photo per tier card
//     in /admin when they want one (the layout swaps tile→photo only then).
// These were previously hot-linked framerusercontent.com URLs in the static
// subpages.ts fallback; with the page now CMS-driven (NicheGroupMembershipPage)
// the images become editable per tier card in /admin.
//
// Idempotent: uploadFile dedupes by filename; re-running re-sets the same ids.
//
// Usage:
//   node scripts/patch-2026-06-12-niche-group-images.mjs --env=dev [--dry-run]
//   node scripts/patch-2026-06-12-niche-group-images.mjs --env=uat

import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, uploadFile, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY = isDryRun();
const ctx = initEnv();

const DIR = join(ROOT, 'media', 'membership', 'niche-group');
// tier card name (as stored in the dz items) → local image file
const TIER_IMAGES = {
  'Elite Membership': 'tier-elite.jpg',
  'VIP Gold': 'tier-vip-gold.jpg',
};

// Rebuild a value for PUT: media objects → their upload id, component ids
// stripped, and __component pinned FIRST (Strapi 5.46 validates dynamic-zone
// input in key order — __component after a nested component field 400s).
function clean(v) {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === 'object') {
    if (typeof v.mime === 'string' && typeof v.url === 'string') return v.id; // media → id
    const out = {};
    if (typeof v.__component === 'string') out.__component = v.__component;
    for (const [k, val] of Object.entries(v)) {
      if (k === 'id' || k === '__component') continue;
      const c = clean(val);
      if (c !== undefined) out[k] = c;
    }
    return out;
  }
  return v;
}

(async () => {
  console.log(`Patch target: ${ctx.BASE}`);

  // 1. Upload (or find) the three images.
  const ids = {};
  for (const f of ['niche-group-hero.jpg', ...Object.values(TIER_IMAGES)]) {
    if (DRY) { console.log(`  [dry] upload ${f}`); ids[f] = -1; continue; }
    const up = await uploadFile(ctx, join(DIR, f));
    ids[f] = up?.id ?? null;
    console.log(`  ✓ ${f} (id=${ids[f]})`);
  }

  // 2. Fetch the singleton (controller deep-populates the body) and rebuild.
  const { data } = await api(ctx, '/niche-group-membership-page');
  if (!data) throw new Error('singleton not found / not published');
  const body = (data.body ?? []).map((block) => {
    const b = clean(block);
    if (b.__component === 'blocks.priced-card-grid') {
      // Parity with prod: tier cards default to the gradient tile, so the
      // patch leaves/clears item images (editors attach photos when desired).
      b.items = (b.items ?? []).map((it) => ({ ...it, image: null }));
    }
    return b;
  });

  const payload = { heroImage: ids['niche-group-hero.jpg'], body };
  if (DRY) {
    console.log('  [dry] PUT heroImage; tier images left unattached (gradients render)');
    return;
  }
  await api(ctx, '/niche-group-membership-page?status=published', { method: 'PUT', body: { data: payload } });
  console.log('  ↻ singleton updated (heroImage set, tier images unattached), published');
  console.log('\n✓ Done.');
})().catch((e) => { console.error(e); process.exit(1); });
