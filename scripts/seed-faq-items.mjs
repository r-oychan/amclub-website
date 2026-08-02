// Seed the FAQ page from the Master FAQ Repository.
// Source of truth: scripts/data/faq-master.json (generated from
// agent/faq-kb.md, itself built from reference/TAC_Master_FAQ_Repository.xlsx
// — regenerate the JSON when the xlsx / KB doc changes).
//
// Upserts every faq-item by slug (published), links the faq-category
// relation, and deletes items that are no longer in the master list.
//
// Usage: node scripts/seed-faq-items.mjs <dev|uat|prod>
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = process.argv[2];
if (!['dev', 'uat', 'prod'].includes(env ?? '')) {
  console.error('usage: node scripts/seed-faq-items.mjs <dev|uat|prod>');
  process.exit(1);
}
const envFile = readFileSync(join(ROOT, `cms/.env.seed.${env}`), 'utf8');
const get = (k) => envFile.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim();
const BASE = get('STRAPI_BASE_URL');
const TOKEN = get('STRAPI_API_TOKEN');
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

const master = JSON.parse(readFileSync(join(ROOT, 'scripts/data/faq-master.json'), 'utf8'));

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}/api${path}`, { headers: H, ...opts });
  if (!res.ok) throw new Error(`${opts.method ?? 'GET'} ${path} → ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.status === 204 ? null : res.json();
}

// ── plain text → Strapi blocks ───────────────────────────────────────
const URL_RE = /(https?:\/\/[^\s)]+|mailto:[^\s)]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;

function inlineNodes(text) {
  const nodes = [];
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    if (m.index > last) nodes.push(...boldNodes(text.slice(last, m.index)));
    const raw = m[0];
    const url = raw.includes('@') && !raw.startsWith('mailto:') && !raw.startsWith('http') ? `mailto:${raw}` : raw;
    nodes.push({ type: 'link', url, children: [{ type: 'text', text: raw.replace(/^mailto:/, '') }] });
    last = m.index + raw.length;
  }
  if (last < text.length) nodes.push(...boldNodes(text.slice(last)));
  return nodes.length > 0 ? nodes : [{ type: 'text', text: '' }];
}

function boldNodes(text) {
  const nodes = [];
  const parts = text.split(/\*\*([^*]+)\*\*/);
  parts.forEach((part, i) => {
    if (part === '') return;
    nodes.push(i % 2 === 1 ? { type: 'text', text: part, bold: true } : { type: 'text', text: part });
  });
  return nodes;
}

function toBlocks(answer) {
  const blocks = [];
  let list = null;
  for (const rawLine of answer.split('\n')) {
    const line = rawLine.trim();
    if (line === '') { list = null; continue; }
    const bullet = line.match(/^[*\-•]\s+(.*)$/);
    if (bullet) {
      if (!list) {
        list = { type: 'list', format: 'unordered', children: [] };
        blocks.push(list);
      }
      list.children.push({ type: 'list-item', children: inlineNodes(bullet[1]) });
    } else {
      list = null;
      blocks.push({ type: 'paragraph', children: inlineNodes(line) });
    }
  }
  return blocks.length > 0 ? blocks : [{ type: 'paragraph', children: [{ type: 'text', text: answer }] }];
}

// ── main ─────────────────────────────────────────────────────────────
const cats = (await api('/faq-categories?pagination[pageSize]=50')).data;
const catByEnum = {};
for (const c of cats) catByEnum[c.name.toLowerCase()] = c.documentId;
for (const item of master) {
  if (!catByEnum[item.category]) throw new Error(`no faq-category for "${item.category}"`);
}

const existing = (await api('/faq-items?pagination[pageSize]=200')).data;
const existingBySlug = new Map(existing.map((e) => [e.slug, e]));
const masterSlugs = new Set(master.map((m) => m.slug));

let created = 0, updated = 0, deleted = 0;
for (const item of master) {
  const data = {
    question: item.question,
    slug: item.slug,
    answer: toBlocks(item.answer),
    category: item.category,
    faqCategory: catByEnum[item.category],
    order: item.order,
  };
  const prior = existingBySlug.get(item.slug);
  if (prior) {
    await api(`/faq-items/${prior.documentId}?status=published`, { method: 'PUT', body: JSON.stringify({ data }) });
    updated += 1;
  } else {
    await api('/faq-items?status=published', { method: 'POST', body: JSON.stringify({ data }) });
    created += 1;
  }
}
for (const e of existing) {
  if (masterSlugs.has(e.slug)) continue;
  await api(`/faq-items/${e.documentId}`, { method: 'DELETE' });
  deleted += 1;
  console.log(`  deleted stale: ${e.slug}`);
}
console.log(`[${env}] faq-items: created=${created} updated=${updated} deleted=${deleted} (master=${master.length})`);
