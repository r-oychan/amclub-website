#!/usr/bin/env node
import { readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, findOneBySlug, uploadAll, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MEDIA_DIR = join(ROOT, 'media', 'gallery');
const DRY = isDryRun();
const ctx = initEnv();

// Each album is either:
//   { ..., cover: 'single-file.jpg' }                     — legacy single-cover album
//   { ..., folder: 'album-slug' }                         — folder under media/gallery/<folder>
//                                                            All images uploaded; first (alphabetically) is cover.
const ALBUMS = [
  { title: 'Club-wide Chinese New Year Celebration 2026',      slug: 'club-wide-cny-2026',                 date: 'FEB 2026', folder: 'club-wide-cny-2026',                 order: 1 },
  { title: 'Super Sunday Funday: Texas Takeover',              slug: 'super-sunday-funday-texas-takeover', date: 'APR 2026', folder: 'super-sunday-funday-texas-takeover', order: 2 },
  { title: 'Tree Lighting Evening 2025',                       slug: 'tree-lighting-evening-2025',         date: 'DEC 2025', cover: 'album-tree-lighting.jpg',     photoCount: 42, order: 3 },
  { title: 'Annual VIP Party 2025',                            slug: 'annual-vip-party-2025',              date: 'NOV 2025', cover: 'album-vip-party.jpg',         photoCount: 58, order: 4 },
  { title: 'Wonder of Women 2025',                             slug: 'wonder-of-women-2025',               date: 'MAR 2025', cover: 'album-wonder-of-women.jpg',   photoCount: 36, order: 5 },
  { title: 'Elite Party 2025',                                 slug: 'elite-party-2025',                   date: 'FEB 2025', cover: 'album-elite-party.jpg',       photoCount: 47, order: 6 },
  { title: 'Super Bowl LIX Finals Live Screening',             slug: 'super-bowl-lix-finals',              date: 'FEB 2025', cover: 'album-super-bowl.jpg',        photoCount: 29, order: 7 },
  { title: 'Club-wide Chinese New Year Celebration 2025',      slug: 'club-wide-cny-2025',                 date: 'JAN 2025', cover: 'album-cny-club.jpg',          photoCount: 64, order: 8 },
  { title: 'Team Members’ Chinese New Year Celebration 2025',  slug: 'team-members-cny-2025',              date: 'JAN 2025', cover: 'album-cny-team.jpg',          photoCount: 22, order: 9 },
  { title: 'Shop Treasures & One-of-a-Kind Finds @ The American Club', slug: 'shop-treasures',             date: 'DEC 2024', cover: 'album-shop-treasures.jpg',    photoCount: 18, order: 10 },
];

const IMG_RE = /\.(jpe?g|png|webp)$/i;

function listAlbumFolder(folder) {
  return readdirSync(join(MEDIA_DIR, folder)).filter((n) => IMG_RE.test(n)).sort();
}

async function ensureAlbum({ title, slug, date, photoCount, order }, coverId, imageIds) {
  if (DRY) { console.log(`  [dry] upsert album: ${title} (${imageIds.length} photos)`); return { documentId: `dry-${slug}`, slug }; }
  const existing = await findOneBySlug(ctx, 'gallery-albums', slug);
  const payload = {
    title,
    slug,
    date,
    photoCount: photoCount ?? imageIds.length,
    coverImage: coverId,
    images: imageIds,
    order,
    publishedAt: new Date().toISOString(),
  };
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

  // Plan upload set: union of every cover file and every file inside every album folder.
  console.log('\n[1/3] Uploading album media…');
  const singleCovers = ALBUMS.filter((a) => a.cover).map((a) => a.cover);
  const flatMedia = await uploadAll(ctx, MEDIA_DIR, singleCovers, { dry: DRY });

  const folderMedia = {}; // slug -> { fileName -> mediaObj }
  for (const album of ALBUMS) {
    if (!album.folder) continue;
    const files = listAlbumFolder(album.folder);
    if (files.length === 0) {
      console.log(`  (skip empty folder ${album.folder})`);
      folderMedia[album.slug] = {};
      continue;
    }
    folderMedia[album.slug] = await uploadAll(ctx, join(MEDIA_DIR, album.folder), files, { dry: DRY });
  }

  console.log('\n[2/3] Albums…');
  for (const album of ALBUMS) {
    let coverId = null;
    let imageIds = [];
    if (album.folder) {
      const map = folderMedia[album.slug] || {};
      const sortedNames = Object.keys(map).sort();
      imageIds = sortedNames.map((n) => map[n]?.id).filter((id) => id !== undefined && id !== null);
      coverId = imageIds[0] ?? null;
    } else if (album.cover) {
      const m = flatMedia[album.cover];
      coverId = m?.id ?? null;
      imageIds = coverId ? [coverId] : [];
    }
    await ensureAlbum(album, coverId, imageIds);
    console.log(`  ✓ ${album.title} (${imageIds.length} photos)`);
  }

  console.log('\n[3/3] Gallery Page single type…');
  await upsertGalleryPage();
  console.log('  ✓ gallery-page upserted');
  console.log('\nDone.');
}
main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
