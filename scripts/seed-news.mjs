#!/usr/bin/env node
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, findOneBySlug, uploadAll, slugify, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MEDIA_DIR = join(ROOT, 'media', 'news');
const DRY = isDryRun();
const ctx = initEnv();

const IMAGES = [
  'news-essentials.jpeg', 'news-cny-hours.jpg', 'news-expat-living.jpg',
  'news-whatsapp.jpg', 'news-club-closure.png', 'news-uncorked.jpg',
];

const ARTICLES = [
  ['Essentials Renovation',                                              'essentials-renovation',           'OCT 11, 2025', 'Essentials is getting a fresh new look. Discover the refreshed layout, new product selections, and enhanced shopping experience.', 'Announcement', 'news-essentials.jpeg',  1],
  ['Chinese New Year 2025 Operating Hours',                              'chinese-new-year-2025-hours',     'OCT 11, 2025', 'Take note of updated outlet hours across the Club for the Chinese New Year festive period.',                                  'Operations',   'news-cny-hours.jpg',   2],
  ['Expat Living Reader’s Choice Award 2025',                       'expat-living-readers-choice-2025','OCT 11, 2025', 'The American Club is honoured to be recognised in the Expat Living Reader’s Choice Awards — thank you to our community.', 'Awards',     'news-expat-living.jpg', 3],
  ['Join our WhatsApp Channels & Stay Connected with Us!',               'whatsapp-channels',               'OCT 11, 2025', 'Follow The American Club’s WhatsApp Channels for real-time updates on dining, events, and exclusive Member news.',         'Community',  'news-whatsapp.jpg',     4],
  ['Club Closure for Switchgear Replacement',                            'club-closure-switchgear',         'OCT 11, 2025', 'Scheduled maintenance will temporarily affect Club operations. Please review the notice for details on outlet hours.',        'Operations', 'news-club-closure.png', 5],
  ['UNCORKED: An Exclusive World for Wine Lovers',                       'uncorked-wine-society',           'SEP 20, 2025', 'Connect with fellow vinophiles through UNCORKED — enjoy curated wine events, flash sales, and priority access.',         'Dining',     'news-uncorked.jpg',     6],
];

async function ensureArticle(title, slug, date, excerpt, category, imageId, order) {
  if (DRY) { console.log(`  [dry] upsert article: ${title}`); return { documentId: `dry-${slug}`, slug }; }
  const existing = await findOneBySlug(ctx, 'news-articles', slug);
  const payload = { title, slug, date, excerpt, category, image: imageId, order, publishedAt: new Date().toISOString() };
  if (existing) {
    const r = await api(ctx, `/news-articles/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    return r.data;
  }
  const r = await api(ctx, '/news-articles', { method: 'POST', body: { data: payload } });
  return r.data;
}

async function upsertNewsPage() {
  const data = {
    title: 'Club News',
    introHeading: 'Club News',
    introBody: 'Stay up to date with the latest announcements and stories from The American Club.',
  };
  if (DRY) { console.log('  [dry] PUT /news-page'); return; }
  const r = await api(ctx, '/news-page', { method: 'PUT', body: { data } });
  return r.data;
}

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);
  console.log('\n[1/3] Uploading news images…');
  const media = await uploadAll(ctx, MEDIA_DIR, IMAGES, { dry: DRY });
  console.log('\n[2/3] Articles…');
  for (const [title, slug, date, excerpt, cat, img, order] of ARTICLES) {
    await ensureArticle(title, slug, date, excerpt, cat, media[img]?.id ?? null, order);
    console.log(`  ✓ ${title}`);
  }
  console.log('\n[3/3] News Page single type…');
  await upsertNewsPage();
  console.log('  ✓ news-page upserted');
  console.log('\nDone.');
}
main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
