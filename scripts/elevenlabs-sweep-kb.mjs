// Full chatbot-KB refresh WITHOUT admin access: no-op PUT every published
// entry of every ElevenLabs-allow-listed type. Each PUT fires the plugin's
// publish lifecycle, which re-renders the entry to markdown and re-syncs it
// (and its harvested PDFs) into the agent's knowledge base. Content is not
// changed: each PUT writes back a value the entry already has.
//
// After a sweep, run scripts/elevenlabs-index-kb.py <env> — changed docs are
// NEW ElevenLabs docs and need their RAG index rebuilt.
//
// Usage: node scripts/elevenlabs-sweep-kb.mjs <dev|uat|prod>
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = process.argv[2];
// Accept the custom domain or the Azure container-app FQDN for the env.
const HOST_GUARD = {
  dev: /dev\.amclub\.org\.sg|amclub-dev-app/,
  uat: /uat\.amclub\.org\.sg|amclub-uat-app/,
  prod: /\/\/amclub\.org\.sg|amclub-prod-app/,
};
if (!HOST_GUARD[env ?? '']) {
  console.error('usage: node scripts/elevenlabs-sweep-kb.mjs <dev|uat|prod>');
  process.exit(1);
}
const envFile = readFileSync(join(ROOT, `cms/.env.seed.${env}`), 'utf8');
const get = (k) => envFile.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim();
const BASE = get('STRAPI_BASE_URL');
const TOKEN = get('STRAPI_API_TOKEN');
if (!BASE || !HOST_GUARD[env].test(BASE)) {
  console.error(`refusing: STRAPI_BASE_URL "${BASE}" does not look like the ${env} environment`);
  process.exit(1);
}
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

const SINGLETONS = [
  'home-page', 'about-page', 'dining-page', 'fitness-page', 'kids-page',
  'membership-page', 'event-spaces-page', 'whats-on-page', 'contact-us-page',
  'gallery-page', 'news-page', 'joining-fees-page', 'faq-page',
  'reciprocal-clubs-page', 'referral-page', 'start-application-page',
  'niche-group-membership-page', 'footer',
];
const COLLECTIONS = {
  events: 'event',
  'news-articles': 'news-article',
  restaurants: 'restaurant',
  'event-spaces': 'event-space',
  'fitness-facilities': 'fitness-facility',
  'kids-experiences': 'kids-experience',
  'dining-promotions': 'dining-promotion',
  'committee-members': 'committee-member',
  'faq-items': 'faq-item',
  testimonials: 'testimonial',
  'gallery-albums': 'gallery-album',
};

// A harmless scalar the entry already has, written back verbatim.
function noopField(entry) {
  for (const k of ['order', 'title', 'name', 'question', 'memberName', 'heading', 'slug']) {
    if (entry[k] !== undefined && entry[k] !== null && typeof entry[k] !== 'object') return { [k]: entry[k] };
  }
  return null;
}

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}/api${path}`, { headers: H, ...opts });
  if (!res.ok) throw new Error(`${opts.method ?? 'GET'} ${path} → ${res.status}`);
  return res.json();
}

let ok = 0, skip = 0, fail = 0;

for (const single of SINGLETONS) {
  try {
    const { data } = await api(`/${single}?status=published`);
    if (!data) { skip += 1; continue; }
    const body = noopField(data);
    if (!body) { skip += 1; continue; }
    await api(`/${single}?status=published`, { method: 'PUT', body: JSON.stringify({ data: body }) });
    ok += 1;
    console.log(`  ✓ ${single}`);
  } catch (e) {
    fail += 1;
    console.log(`  - ${single} ${e.message}`);
  }
}

for (const [plural, singular] of Object.entries(COLLECTIONS)) {
  let touched = 0;
  try {
    const { data } = await api(`/${plural}?pagination[pageSize]=200&status=published`);
    for (const entry of data) {
      const body = noopField(entry);
      if (!body) { skip += 1; continue; }
      try {
        await api(`/${plural}/${entry.documentId}?status=published`, { method: 'PUT', body: JSON.stringify({ data: body }) });
        ok += 1; touched += 1;
        console.log(`  ✓ ${singular}:${entry.slug ?? entry.documentId}`);
      } catch (e) {
        fail += 1;
        console.log(`  - ${singular}:${entry.slug ?? entry.documentId} ${e.message}`);
      }
    }
  } catch (e) {
    fail += 1;
    console.log(`  - ${plural} ${e.message}`);
  }
  console.log(`— ${plural}: ${touched} touched`);
}
console.log(`DONE ok=${ok} skip=${skip} fail=${fail}`);
