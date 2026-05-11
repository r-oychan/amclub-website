#!/usr/bin/env node
// Seed Club News content into Strapi. Articles live in
// scripts/data/news-articles.json; the body field is converted into
// Strapi v5 "blocks" (paragraph nodes) before upsert.
//
// Articles are upserted by slug. Any existing news-article whose slug
// is NOT in the JSON list is removed so the live News page reflects
// the canonical list exactly.

import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, findOneBySlug, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_FILE = join(ROOT, 'scripts', 'data', 'news-articles.json');
const DRY = isDryRun();
const ctx = initEnv();

const ARTICLES = JSON.parse(readFileSync(DATA_FILE, 'utf8'));

/** Convert a plain-text body into Strapi v5 blocks (paragraph nodes, blank lines split paragraphs). */
function toBlocks(text) {
  if (!text) return [];
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({ type: 'paragraph', children: [{ type: 'text', text: p }] }));
}

async function listAllArticles() {
  const out = [];
  let page = 1;
  for (;;) {
    const r = await api(ctx, `/news-articles?fields[0]=slug&pagination[page]=${page}&pagination[pageSize]=100`);
    const data = r?.data ?? [];
    out.push(...data);
    const total = r?.meta?.pagination?.pageCount ?? 1;
    if (page >= total) break;
    page += 1;
  }
  return out;
}

async function deleteArticle(documentId, slug) {
  if (DRY) { console.log(`  [dry] delete article slug=${slug}`); return; }
  await api(ctx, `/news-articles/${documentId}`, { method: 'DELETE' });
}

async function upsertArticle(a) {
  const payload = {
    title: a.title,
    slug: a.slug,
    date: a.date ?? '',
    excerpt: a.excerpt ?? '',
    category: a.category ?? '',
    order: a.order ?? 0,
    body: toBlocks(a.body),
    publishedAt: new Date().toISOString(),
  };
  if (DRY) { console.log(`  [dry] upsert article: ${a.title}`); return; }
  const existing = await findOneBySlug(ctx, 'news-articles', a.slug);
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
    introBody: 'Stay up to date with the latest stories, awards, and announcements from The American Club.',
  };
  if (DRY) { console.log('  [dry] PUT /news-page'); return; }
  const r = await api(ctx, '/news-page', { method: 'PUT', body: { data } });
  return r.data;
}

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);
  console.log(`Articles:    ${ARTICLES.length}`);

  console.log('\n[1/3] Upserting articles…');
  for (const a of ARTICLES) {
    await upsertArticle(a);
    console.log(`  ✓ ${a.title}`);
  }

  console.log('\n[2/3] Removing stale articles (slugs not in JSON)…');
  const keep = new Set(ARTICLES.map((a) => a.slug));
  const existing = DRY ? [] : await listAllArticles();
  let removed = 0;
  for (const row of existing) {
    if (keep.has(row.slug)) continue;
    await deleteArticle(row.documentId, row.slug);
    console.log(`  ✗ removed ${row.slug}`);
    removed += 1;
  }
  if (removed === 0) console.log('  (none)');

  console.log('\n[3/3] News Page single type…');
  await upsertNewsPage();
  console.log('  ✓ news-page upserted');

  console.log('\nDone.');
}
main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
