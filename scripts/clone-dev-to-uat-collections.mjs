// Clone all COLLECTION-type content from dev → uat over the content API
// (HTTPS), re-uploading media into uat's own blob storage and remapping
// simple relations by slug. Used to rebuild UAT after a DB+media wipe so it
// matches dev exactly. Singletons/pages are handled separately via the
// seed-*-page scripts (their nested component trees need page-specific deep
// populate that the public API doesn't return generically).
//
// Source  = cms/.env.seed.dev   (STRAPI_BASE_URL + STRAPI_API_TOKEN)
// Dest    = cms/.env.seed.uat
//
// Order matters: relation targets are created before their dependents, and
// self-referential trees are created first, then their `parent` is patched.
//
// Usage:
//   node scripts/clone-dev-to-uat-collections.mjs --dry-run   # reads dev only
//   node scripts/clone-dev-to-uat-collections.mjs             # writes to uat

import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY = process.argv.includes('--dry-run');

function loadEnv(name) {
  const text = readFileSync(join(ROOT, 'cms', `.env.seed.${name}`), 'utf8');
  const env = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  const BASE = (env.STRAPI_BASE_URL || '').replace(/\/$/, '');
  const TOKEN = env.STRAPI_API_TOKEN;
  if (!BASE || !TOKEN) throw new Error(`.env.seed.${name} missing BASE/TOKEN`);
  return { BASE, auth: { Authorization: `Bearer ${TOKEN}` } };
}

const SRC = loadEnv('dev');
const DST = loadEnv('uat');

async function api({ BASE, auth }, path, opts = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...auth, ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path} → ${res.status}: ${typeof json === 'string' ? json : JSON.stringify(json)}`);
  return json;
}

// Fetch every page of a collection from dev with one-level populate.
async function fetchAll(plural) {
  const out = [];
  let page = 1;
  for (;;) {
    // filters[id][$gt]=0 matches everything but, by carrying an `id` filter,
    // bypasses the event/dining-promotion expiry filter so PAST entries are
    // included in the clone (shouldApplyExpiryFilter skips when id is present).
    const r = await api(SRC, `/${plural}?populate=*&filters[id][$gt]=0&pagination[page]=${page}&pagination[pageSize]=100&status=draft`);
    out.push(...(r.data || []));
    const pg = r.meta?.pagination;
    if (!pg || page >= pg.pageCount || !pg.pageCount) break;
    page++;
  }
  return out;
}

// Derive the blob sub-folder path from a dev file's URL so the re-upload lands
// in the same section hierarchy on uat. Dev blobs live at
// `.../media/uploads/<section>/<page>/<hash>.<ext>` (the seed scripts route
// them there via the `path` form field). We recover `<section>/<page>` by
// taking everything between `uploads/` and the filename. Returns '' for files
// that were flat on dev (nothing to mirror). Without this, the re-upload omits
// `path`, so uat's upload-azure-folders provider + upload-path-to-folder
// middleware never fire and every asset ends up flat under "API Uploads".
function blobPathFromUrl(url) {
  if (!url) return '';
  let pathname;
  try { pathname = url.startsWith('http') ? new URL(url).pathname : url; }
  catch { pathname = url; }
  const marker = '/uploads/';
  const i = pathname.indexOf(marker);
  if (i === -1) return '';
  const after = pathname.slice(i + marker.length); // <section>/<page>/<file>
  return after.split('/').slice(0, -1).join('/'); // drop filename
}

// Media re-upload: download from dev's (public) blob URL, upload to uat.
// Cache by file name so repeated references reuse the uploaded asset.
const mediaCache = new Map();
async function reuploadMedia(file) {
  if (!file || !file.url) return null;
  const key = file.hash || file.name;
  if (mediaCache.has(key)) return mediaCache.get(key);
  if (DRY) { mediaCache.set(key, `dev:${file.name}`); return mediaCache.get(key); }
  // already on uat? (dedupe across re-runs)
  const existing = await fetch(`${DST.BASE}/api/upload/files?filters[hash][$eq]=${encodeURIComponent(file.hash || '')}`, { headers: DST.auth })
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);
  if (Array.isArray(existing) && existing.length) {
    mediaCache.set(key, existing[0].id);
    return existing[0].id;
  }
  const srcUrl = file.url.startsWith('http') ? file.url : `${SRC.BASE}${file.url}`;
  const buf = Buffer.from(await (await fetch(srcUrl)).arrayBuffer());
  const fd = new FormData();
  fd.append('files', new Blob([buf], { type: file.mime || 'application/octet-stream' }), file.name);
  const fileInfo = { name: file.name, alternativeText: file.alternativeText ?? null, caption: file.caption ?? null };
  fd.append('fileInfo', JSON.stringify(fileInfo));
  // Mirror dev's section folder on uat (blob path + Media Library folder).
  const path = blobPathFromUrl(file.url);
  if (path) fd.append('path', path);
  const res = await fetch(`${DST.BASE}/api/upload`, { method: 'POST', headers: DST.auth, body: fd });
  if (!res.ok) throw new Error(`upload ${file.name} → ${res.status}: ${await res.text()}`);
  const arr = await res.json();
  mediaCache.set(key, arr[0].id);
  return arr[0].id;
}

const isMedia = (v) => v && typeof v === 'object' && typeof v.mime === 'string' && typeof v.url === 'string';
const isRelation = (v) => v && typeof v === 'object' && typeof v.documentId === 'string' && !isMedia(v);
const SYSTEM = new Set(['id', 'documentId', 'createdAt', 'updatedAt', 'publishedAt', 'locale', 'createdBy', 'updatedBy']);

// Optional dev→uat document-URL rewrite map (build with
// scripts/build-doc-url-map.mjs). Dev content embeds hashed document hrefs as
// PLAIN STRINGS (e.g. /uploads/documents/fitness/pilates_price_list_<devhash>
// .docx) — those aren't media relations, so reuploadMedia never sees them and
// the dev hash 404s on uat. With --doc-map=<file>, any string value exactly
// matching a dev URL is rewritten to its uat equivalent.
const DOC_MAP_PATH = (process.argv.find((a) => a.startsWith('--doc-map=')) || '').slice('--doc-map='.length);
const DOC_MAP = DOC_MAP_PATH ? JSON.parse(readFileSync(DOC_MAP_PATH, 'utf8')) : {};

// Deep-remap an attribute value: re-upload media → id(s); strip component
// ids and recurse; leave scalars (rewriting mapped document hrefs). Relations
// are handled by the caller via the per-type config (this drops stray
// relation objects it encounters).
async function remap(value) {
  if (Array.isArray(value)) {
    if (value.length && isMedia(value[0])) {
      const ids = [];
      for (const f of value) { const id = await reuploadMedia(f); if (id) ids.push(id); }
      return ids;
    }
    const out = [];
    for (const v of value) out.push(await remap(v));
    return out;
  }
  if (isMedia(value)) return await reuploadMedia(value);
  if (isRelation(value)) return undefined; // handled explicitly per-type
  if (value && typeof value === 'object') {
    const out = {};
    // Strapi 5.46's input validator is KEY-ORDER sensitive for dynamic-zone
    // items: __component must precede nested component fields (e.g. `items`),
    // else PUT fails with "Invalid key __component at body". GET responses can
    // emit __component last, so pin it first when rebuilding the object.
    if (typeof value.__component === 'string') out.__component = value.__component;
    for (const [k, v] of Object.entries(value)) {
      if (k === 'id' || k === '__component') continue; // Strapi assigns new component ids
      const rv = await remap(v);
      if (rv !== undefined) out[k] = rv;
    }
    return out;
  }
  if (typeof value === 'string' && DOC_MAP[value]) return DOC_MAP[value];
  return value;
}

// Build a slug→uat-documentId index for a relation target after it's cloned.
const destIndex = {}; // plural -> { slug: documentId }
async function indexDest(plural) {
  if (DRY) return {};
  if (destIndex[plural]) return destIndex[plural];
  const map = {};
  let page = 1;
  for (;;) {
    const r = await api(DST, `/${plural}?pagination[page]=${page}&pagination[pageSize]=100&status=draft`);
    for (const e of r.data || []) if (e.slug) map[e.slug] = e.documentId;
    const pg = r.meta?.pagination;
    if (!pg || page >= pg.pageCount || !pg.pageCount) break;
    page++;
  }
  destIndex[plural] = map;
  return map;
}

// [plural, { relations: {field: targetPlural}, self: ['parent'] }]
const COLLECTIONS = [
  ['event-categories', {}],
  ['faq-categories', {}],
  ['restaurants', {}],
  // 'coaches' removed — legacy api::coach type was deleted (superseded by the
  // per-discipline collections below); querying it now 404s and aborts the run.
  ['aquatics-coaches', {}],
  ['gym-trainers', {}],
  ['tennis-coaches', {}],
  ['pilates-instructors', {}],
  ['committee-members', {}],
  ['testimonials', {}],
  ['gallery-albums', {}],
  ['news-articles', {}],
  ['event-spaces', {}],
  ['events', { relations: { category: 'event-categories' } }],
  ['faq-items', { relations: { faqCategory: 'faq-categories' } }],
  ['dining-promotions', { relations: { restaurant: 'restaurants' } }],
  ['fitness-facilities', { self: ['parent'] }],
  ['kids-experiences', { self: ['parent'] }],
];

async function cloneType(plural, cfg) {
  const rows = await fetchAll(plural);
  let created = 0, skipped = 0;
  const seen = new Set();                  // dedupe source by slug (dev can hold a stale draft + published sharing a slug)
  const deferredSelf = []; // {destDocId, parentSlug} for self-relations
  for (const e of rows) {
    if (e.slug) {
      if (seen.has(e.slug)) { skipped++; continue; }   // duplicate slug in source
      seen.add(e.slug);
      if (!DRY) {
        const dup = await api(DST, `/${plural}?filters[slug][$eq]=${encodeURIComponent(e.slug)}&pagination[limit]=1&status=draft`);
        if (dup.data && dup.data.length) { skipped++; continue; }  // already on uat — idempotent resume
      }
    }
    const data = {};
    for (const [k, v] of Object.entries(e)) {
      if (SYSTEM.has(k)) continue;
      if (cfg.relations && cfg.relations[k]) continue;       // set below
      if (cfg.self && cfg.self.includes(k)) continue;        // patched in 2nd pass
      // skip inverse relation arrays (e.g. event-category.events)
      if (isRelation(v) || (Array.isArray(v) && v.length && isRelation(v[0]))) continue;
      const rv = await remap(v);
      if (rv !== undefined) data[k] = rv;
    }
    // explicit relations by slug
    if (cfg.relations) {
      for (const [field, target] of Object.entries(cfg.relations)) {
        const rel = e[field];
        if (rel && rel.slug) {
          const idx = await indexDest(target);
          data[field] = idx[rel.slug] ?? null;
        }
      }
    }
    // Preserve the source's draft/published split: only published dev entries
    // arrive published on uat. Omitting publishedAt keeps a POSTed entry as a
    // draft — previously `|| now()` force-published dev's unfinished drafts.
    if (e.publishedAt) data.publishedAt = e.publishedAt;

    if (DRY) {
      created++;
      continue;
    }
    const res = await api(DST, `/${plural}`, { method: 'POST', body: { data } });
    created++;
    if (cfg.self) {
      for (const field of cfg.self) {
        const rel = e[field];
        if (rel && rel.slug) deferredSelf.push({ docId: res.data.documentId, field, parentSlug: rel.slug });
      }
    }
  }
  // 2nd pass: patch self-referential parent now that all exist
  if (!DRY && deferredSelf.length) {
    const idx = await indexDest(plural);
    for (const d of deferredSelf) {
      const parentDoc = idx[d.parentSlug];
      if (parentDoc) await api(DST, `/${plural}/${d.docId}`, { method: 'PUT', body: { data: { [d.field]: parentDoc } } });
    }
  }
  console.log(`  ${plural.padEnd(22)} ${DRY ? 'would create' : 'created'} ${created} skipped ${skipped}  (media cached: ${mediaCache.size})`);
  return created;
}

// Single types: API path == singular name. They carry no relations (only
// media + nested components), so a GET (controllers deep-populate) → remap
// media → PUT round-trips them exactly. PUT on a single type is idempotent.
const SINGLETONS = [
  'home-page', 'about-page', 'dining-page', 'dining-promotions-page', 'fitness-page',
  'kids-page', 'membership-page', 'event-spaces-page', 'contact-us-page', 'faq-page',
  'gallery-page', 'news-page', 'joining-fees-page', 'niche-group-membership-page',
  'reciprocal-clubs-page', 'referral-page', 'start-application-page',
  'advertise-with-us-page', 'whats-on-page', 'header', 'footer', 'site-config',
];

async function cloneSingleton(path) {
  let src;
  try { src = await api(SRC, `/${path}`); }
  catch (e) { console.log(`  ${path.padEnd(26)} src GET failed: ${e.message.slice(0, 60)}`); return 0; }
  const entry = src?.data;
  if (!entry) { console.log(`  ${path.padEnd(26)} (empty on dev — skip)`); return 0; }
  const data = {};
  for (const [k, v] of Object.entries(entry)) {
    if (SYSTEM.has(k)) continue;
    const rv = await remap(v);
    if (rv !== undefined) data[k] = rv;
  }
  data.publishedAt = entry.publishedAt || new Date().toISOString();
  if (DRY) { console.log(`  ${path.padEnd(26)} would PUT (${Object.keys(data).length} fields)`); return 1; }
  // ?status=published is the explicit Strapi v5 publish semantic — publishedAt
  // in the body alone doesn't reliably publish a never-before-published doc.
  await api(DST, `/${path}?status=published`, { method: 'PUT', body: { data } });
  console.log(`  ${path.padEnd(26)} PUT ✓ (${Object.keys(data).length} fields, media cached ${mediaCache.size})`);
  return 1;
}

// --only=a,b limits which entries run; --singletons runs single types instead of collections
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').slice('--only='.length).split(',').filter(Boolean);
const SINGLES_MODE = process.argv.includes('--singletons');

async function main() {
  console.log(`[clone-dev-to-uat] dry=${DRY} mode=${SINGLES_MODE ? 'singletons' : 'collections'}${ONLY.length ? ` only=${ONLY.join(',')}` : ''}`);
  console.log(`  src=${SRC.BASE}`);
  console.log(`  dst=${DST.BASE}`);
  let total = 0;
  if (SINGLES_MODE) {
    for (const path of SINGLETONS) {
      if (ONLY.length && !ONLY.includes(path)) continue;
      total += await cloneSingleton(path);
    }
  } else {
    for (const [plural, cfg] of COLLECTIONS) {
      if (ONLY.length && !ONLY.includes(plural)) continue;
      total += await cloneType(plural, cfg);
    }
  }
  console.log(`\nDone. ${DRY ? 'would write' : 'wrote'} ${total} ${SINGLES_MODE ? 'singletons' : 'entries'}.`);
}

// Only run when executed directly (`node scripts/clone-…mjs`), never on import.
import { realpathSync } from 'node:fs';
const runDirectly = process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
if (runDirectly) main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
