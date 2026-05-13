#!/usr/bin/env node
/**
 * Seed script: FAQ Page + FAQ Categories into Strapi.
 *
 * Reads `cms/.env.seed` for:
 *   STRAPI_BASE_URL  — e.g. https://amclub-app...azurecontainerapps.io
 *   STRAPI_API_TOKEN — Full-access admin API token
 *
 * Usage:
 *   node scripts/seed-faq-page.mjs            # seed
 *   node scripts/seed-faq-page.mjs --dry-run  # show plan, don't write
 *
 * Idempotent: re-running updates existing categories (matched by slug) and
 * the single faq-page entry.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ENV_PATH = join(ROOT, 'cms', '.env.seed');

const DRY = process.argv.includes('--dry-run');

function loadEnv(path) {
  let text;
  try { text = readFileSync(path, 'utf8'); }
  catch {
    console.error(`Missing env file: ${path}`);
    console.error(`Create it with:`);
    console.error(`  STRAPI_BASE_URL=https://your-deployed-url`);
    console.error(`  STRAPI_API_TOKEN=...`);
    process.exit(1);
  }
  const env = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const env = loadEnv(ENV_PATH);
const BASE = (env.STRAPI_BASE_URL || '').replace(/\/$/, '');
const TOKEN = env.STRAPI_API_TOKEN;
if (!BASE || !TOKEN) {
  console.error('STRAPI_BASE_URL and STRAPI_API_TOKEN must be set in cms/.env.seed');
  process.exit(1);
}
const auth = { Authorization: `Bearer ${TOKEN}` };

async function api(path, opts = {}) {
  const url = `${BASE}/api${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...auth,
      ...(opts.headers || {}),
    },
    body: opts.body ? (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body)) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!res.ok) {
    throw new Error(`${opts.method || 'GET'} ${path} → ${res.status}: ${typeof json === 'string' ? json : JSON.stringify(json)}`);
  }
  return json;
}

async function findOneBySlug(plural, slug) {
  const r = await api(`/${plural}?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[limit]=1`);
  return r?.data?.[0] || null;
}

const slugify = (s) => s.toLowerCase()
  .replace(/&/g, 'and')
  .replace(/['']/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const FAQ_CATEGORIES = [
  { name: 'Membership', description: 'Joining, categories, transfers, and member benefits.', displayOrder: 1 },
  { name: 'Facilities', description: 'Gym, pools, courts, spa, and operating hours.', displayOrder: 2 },
  { name: 'Dining', description: 'Restaurants, reservations, and dining promotions.', displayOrder: 3 },
  { name: 'Events', description: 'Private events, room bookings, and club programmes.', displayOrder: 4 },
  { name: 'General', description: 'Everything else — guests, parking, contact info.', displayOrder: 5 },
];

async function ensureFaqCategory({ name, description, displayOrder }) {
  const slug = slugify(name);
  if (DRY) { console.log(`  [dry] upsert faq-category: ${name}`); return { documentId: `dry-${slug}`, slug }; }
  const existing = await findOneBySlug('faq-categories', slug);
  const payload = { name, slug, description, displayOrder };
  if (existing) {
    const r = await api(`/faq-categories/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    return r.data;
  } else {
    const r = await api('/faq-categories', { method: 'POST', body: { data: payload } });
    return r.data;
  }
}

async function upsertFaqPage() {
  const data = {
    title: 'FAQ',
    introHeading: 'Frequently Asked Questions',
    introBody:
      'Answers to the questions our members and prospective members ask most. Can’t find what you’re looking for? Contact our Member Services team.',
    publishedAt: new Date().toISOString(),
  };
  if (DRY) { console.log(`  [dry] upsert faq-page (single type)`); return; }
  await api('/faq-page', { method: 'PUT', body: { data } });
}

async function main() {
  console.log(`Seeding FAQ Page → ${BASE}${DRY ? ' (dry-run)' : ''}\n`);

  console.log('[1/2] FAQ categories…');
  for (const cat of FAQ_CATEGORIES) {
    const c = await ensureFaqCategory(cat);
    console.log(`  ✓ ${cat.name} (${c?.slug ?? slugify(cat.name)})`);
  }

  console.log('\n[2/2] FAQ Page single type…');
  await upsertFaqPage();
  console.log('  ✓ faq-page upserted');

  console.log('\nDone.');
}

main().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});
