#!/usr/bin/env node
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, findOneBySlug, uploadAll, slugify, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MEDIA_DIR = join(ROOT, 'media', 'gallery');
const DRY = isDryRun();
const ctx = initEnv();

const IMAGES = [
  'album-tree-lighting.jpg', 'album-vip-party.jpg', 'album-wonder-of-women.jpg',
  'album-elite-party.jpg', 'album-super-bowl.jpg',
  'album-cny-club.jpg', 'album-cny-team.jpg', 'album-shop-treasures.jpg',
];

const ALBUMS = [
  ['Tree Lighting Evening 2025',                       'tree-lighting-evening-2025', 'DEC 2025', 42, 'album-tree-lighting.jpg', 1],
  ['Annual VIP Party 2025',                            'annual-vip-party-2025',      'NOV 2025', 58, 'album-vip-party.jpg',     2],
  ['Wonder of Women 2025',                             'wonder-of-women-2025',       'MAR 2025', 36, 'album-wonder-of-women.jpg', 3],
  ['Elite Party 2025',                                 'elite-party-2025',           'FEB 2025', 47, 'album-elite-party.jpg',   4],
  ['Super Bowl LIX Finals Live Screening',             'super-bowl-lix-finals',      'FEB 2025', 29, 'album-super-bowl.jpg',    5],
  ['Club-wide Chinese New Year Celebration 2025',      'club-wide-cny-2025',         'JAN 2025', 64, 'album-cny-club.jpg',      6],
  ['Team Members’ Chinese New Year Celebration 2025', 'team-members-cny-2025',   'JAN 2025', 22, 'album-cny-team.jpg',      7],
  ['Shop Treasures & One-of-a-Kind Finds @ The American Club', 'shop-treasures',     'DEC 2024', 18, 'album-shop-treasures.jpg', 8],
];

async function ensureAlbum(title, slug, date, photoCount, imageId, order) {
  if (DRY) { console.log(`  [dry] upsert album: ${title}`); return { documentId: `dry-${slug}`, slug }; }
  const existing = await findOneBySlug(ctx, 'gallery-albums', slug);
  const payload = { title, slug, date, photoCount, coverImage: imageId, order, publishedAt: new Date().toISOString() };
  if (existing) {
    const r = await api(ctx, `/gallery-albums/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    return r.data;
  }
  const r = await api(ctx, '/gallery-albums', { method: 'POST', body: { data: payload } });
  return r.data;
}

async function upsertGalleryPage() {
  const data = {
    title: 'Gallery',
    introHeading: 'Gallery',
    introBody: 'Browse photos from recent events and celebrations at The American Club.',
  };
  if (DRY) { console.log('  [dry] PUT /gallery-page'); return; }
  const r = await api(ctx, '/gallery-page', { method: 'PUT', body: { data } });
  return r.data;
}

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);
  console.log('\n[1/3] Uploading album cover images…');
  const media = await uploadAll(ctx, MEDIA_DIR, IMAGES, { dry: DRY });
  console.log('\n[2/3] Albums…');
  for (const [title, slug, date, count, img, order] of ALBUMS) {
    await ensureAlbum(title, slug, date, count, media[img]?.id ?? null, order);
    console.log(`  ✓ ${title}`);
  }
  console.log('\n[3/3] Gallery Page single type…');
  await upsertGalleryPage();
  console.log('  ✓ gallery-page upserted');
  console.log('\nDone.');
}
main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
