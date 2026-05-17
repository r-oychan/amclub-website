#!/usr/bin/env node
// Populate news-article.htmlBody by pulling each article's HTML from
// amclub.org.sg, re-hosting every <img> on the Strapi media library,
// and PATCHing the article. Idempotent — re-running re-uploads only
// images Strapi hasn't seen.
//
// For posts of type "post" (URL /articles/<slug>/) we use the WP REST
// API, which returns clean HTML. The "news" custom post type does not
// expose content via REST, so we fall back to scraping the
// Elementor-rendered HTML page and extracting the
// .elementor-widget-theme-post-content widget.
//
// Each entry in scripts/data/news-articles.json must have a "source"
// URL. Slugs not in the JSON are skipped.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, findOneBySlug, isDryRun, uploadFile } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_FILE = join(ROOT, 'scripts', 'data', 'news-articles.json');
const CACHE_DIR = join(ROOT, '.news-image-cache');
const DRY = isDryRun();
const ONLY = process.argv.find((a) => a.startsWith('--slug='))?.split('=')[1];

const ctx = initEnv();
const ARTICLES = JSON.parse(readFileSync(DATA_FILE, 'utf8'));

if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decodeEntities(s) {
  return String(s ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'amclub-seed/1.0' } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.text();
}

async function fetchArticleHtmlViaRest(slug) {
  // The legacy WP install at amclub.org.sg has been replaced by this new
  // SPA, so /wp-json now returns the SPA's index.html (HTTP 200,
  // content-type: text/html). Treat any non-JSON or non-array response as
  // "not available" and let fetchSourceHtml fall through to the body-text
  // fallback.
  const url = `https://amclub.org.sg/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}`;
  let res;
  try { res = await fetch(url); } catch { return null; }
  if (!res.ok) return null;
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('json')) return null;
  let arr;
  try { arr = await res.json(); } catch { return null; }
  if (!Array.isArray(arr) || !arr.length) return null;
  return arr[0]?.content?.rendered ?? null;
}

function extractElementorContent(html) {
  // Find the post-content widget body. The widget div tag's class string
  // contains "elementor-widget-theme-post-content" — match it and slice
  // until the balanced closing tag.
  const startMatch = html.match(/<div[^>]*class="[^"]*elementor-widget-theme-post-content[^"]*"[^>]*>/);
  if (!startMatch) return null;
  const openIdx = startMatch.index + startMatch[0].length;
  // Find the inner ".elementor-widget-container" body, which is what we
  // actually want.
  const containerStart = html.indexOf('<div class="elementor-widget-container">', openIdx);
  if (containerStart < 0) return null;
  const innerStart = containerStart + '<div class="elementor-widget-container">'.length;
  let depth = 1;
  let i = innerStart;
  while (i < html.length && depth > 0) {
    const nextOpen = html.indexOf('<div', i);
    const nextClose = html.indexOf('</div>', i);
    if (nextClose < 0) break;
    if (nextOpen >= 0 && nextOpen < nextClose) { depth += 1; i = nextOpen + 4; }
    else { depth -= 1; i = nextClose + 6; }
  }
  // i points just past the </div> that closes the container.
  return html.slice(innerStart, i - 6);
}

function sanitiseHtml(html) {
  let out = String(html ?? '');
  // Strip Rank Math TOC blocks
  out = out.replace(/<div\s+class="wp-block-rank-math-toc-block"[\s\S]*?<\/div>/g, '');
  out = out.replace(/<nav>[\s\S]*?<\/nav>/g, '');
  // Strip noscript fallbacks (lazy-load duplicates)
  out = out.replace(/<noscript>[\s\S]*?<\/noscript>/g, '');
  // Strip <script> and <style>
  out = out.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<style\b[\s\S]*?<\/style>/gi, '');
  // Drop wp-block / rank-math wrappers but keep inner content
  out = out.replace(/\s*class="[^"]*"/g, ''); // remove all class attrs — we restyle via .article-html
  out = out.replace(/\s*id="[^"]*"/g, '');
  out = out.replace(/\s*style="[^"]*"/g, '');
  out = out.replace(/\s*data-[\w-]+="[^"]*"/g, '');
  out = out.replace(/\s*(srcset|sizes|loading|decoding|fetchpriority)="[^"]*"/gi, '');
  // Collapse blank lines
  out = out.replace(/\n{3,}/g, '\n\n').trim();
  return out;
}

function extractImgUrls(html) {
  const urls = new Set();
  const re = /<img[^>]*\bsrc="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) urls.add(m[1]);
  // Also handle src='...'
  const re2 = /<img[^>]*\bsrc='([^']+)'/g;
  while ((m = re2.exec(html))) urls.add(m[1]);
  return [...urls];
}

function safeFilename(url) {
  // Strip query, take last segment, lowercase. Replace anything weird.
  let name = url.split('?')[0].split('#')[0].split('/').pop() || 'image';
  name = decodeURIComponent(name);
  name = name.replace(/[^a-zA-Z0-9._-]/g, '-');
  if (!extname(name)) name += '.jpg';
  return name;
}

async function downloadImage(url) {
  const name = safeFilename(url);
  const cachePath = join(CACHE_DIR, name);
  if (existsSync(cachePath)) return { name, path: cachePath };
  const res = await fetch(url, { headers: { 'User-Agent': 'amclub-seed/1.0', Referer: 'https://amclub.org.sg/' } });
  if (!res.ok) throw new Error(`download ${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(cachePath, buf);
  return { name, path: cachePath };
}

async function rehostImages(html) {
  const urls = extractImgUrls(html);
  if (!urls.length) return { html, count: 0 };
  let out = html;
  let count = 0;
  for (const url of urls) {
    try {
      const { path } = await downloadImage(url);
      const uploaded = DRY ? { url: '/uploads/dryrun.jpg' } : await uploadFile(ctx, path);
      const newUrl = uploaded.url.startsWith('http')
        ? uploaded.url
        : `${ctx.BASE}${uploaded.url}`;
      // Replace every occurrence of the original URL (escape regex)
      const esc = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp(esc, 'g'), newUrl);
      count += 1;
    } catch (e) {
      console.warn(`    ! image skip ${url}: ${e.message}`);
    }
  }
  return { html: out, count };
}

function plainBodyToHtml(body) {
  if (!body) return '';
  return String(body)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, '<br />')}</p>`)
    .join('\n');
}

async function fetchSourceHtml(source, slug, fallbackBody) {
  if (source.includes('/articles/')) {
    const html = await fetchArticleHtmlViaRest(slug);
    if (html) return decodeEntities(html);
  }
  // Try scraping the rendered page (works for posts; news pages render
  // the body via Jet Engine and we can't always extract it).
  try {
    const pageHtml = await fetchText(source);
    const inner = extractElementorContent(pageHtml);
    if (inner) return decodeEntities(inner);
  } catch { /* fall through */ }
  // Final fallback: wrap the canonical body text we already have in JSON
  // into <p> tags. This keeps /news/* articles populated even though the
  // WP custom post type doesn't expose content via REST.
  if (fallbackBody) {
    console.log('  (fallback: wrapping plain-text body)');
    return plainBodyToHtml(fallbackBody);
  }
  throw new Error(`no HTML available for ${source}`);
}

async function processArticle(a) {
  if (!a.source) { console.log(`  skip ${a.slug}: no source URL`); return; }
  if (ONLY && a.slug !== ONLY) return;

  console.log(`\n→ ${a.slug}`);
  console.log(`  source: ${a.source}`);

  const raw = await fetchSourceHtml(a.source, a.slug, a.body);
  console.log(`  fetched: ${raw.length} chars`);

  const cleaned = sanitiseHtml(raw);
  console.log(`  cleaned: ${cleaned.length} chars`);

  const { html: rehosted, count } = await rehostImages(cleaned);
  console.log(`  images re-hosted: ${count}`);

  if (DRY) { console.log(`  [dry] would PATCH ${a.slug}`); return; }

  const existing = await findOneBySlug(ctx, 'news-articles', a.slug);
  if (!existing) { console.log(`  ! no Strapi entry for ${a.slug}`); return; }

  await api(ctx, `/news-articles/${existing.documentId}`, {
    method: 'PUT',
    body: { data: { htmlBody: { html: rehosted } } },
  });
  console.log(`  ✓ patched htmlBody`);
}

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);
  console.log(`Articles:    ${ARTICLES.length}${ONLY ? ` (filter: ${ONLY})` : ''}`);

  for (const a of ARTICLES) {
    try {
      await processArticle(a);
      await sleep(200);
    } catch (e) {
      console.error(`  ! ERROR on ${a.slug}: ${e.message}`);
    }
  }
  console.log('\nDone.');
}
main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
