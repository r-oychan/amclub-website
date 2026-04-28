// Shared helpers for Strapi seed scripts. Each script reads cms/.env.seed
// for STRAPI_BASE_URL + STRAPI_API_TOKEN, then imports these helpers.
//
// Usage from a sibling script:
//   import { initEnv, api, uploadFile, slugify, isDryRun } from './seed-helpers.mjs';
//   const { BASE, auth } = initEnv();
//   await uploadFile({ BASE, auth }, '/abs/path/to/file.jpg');

import { readFileSync, statSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ENV_PATH = join(ROOT, 'cms', '.env.seed');

export const isDryRun = () => process.argv.includes('--dry-run');

export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

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

export function initEnv() {
  const env = loadEnv(ENV_PATH);
  const BASE = (env.STRAPI_BASE_URL || '').replace(/\/$/, '');
  const TOKEN = env.STRAPI_API_TOKEN;
  if (!BASE || !TOKEN) {
    console.error('STRAPI_BASE_URL and STRAPI_API_TOKEN must be set in cms/.env.seed');
    process.exit(1);
  }
  return { BASE, TOKEN, auth: { Authorization: `Bearer ${TOKEN}` }, ROOT };
}

export async function api({ BASE, auth }, path, opts = {}) {
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

export async function findOneBySlug(ctx, plural, slug) {
  const r = await api(ctx, `/${plural}?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[limit]=1`);
  return r?.data?.[0] || null;
}

export async function findUploadedByName(ctx, name) {
  const url = `${ctx.BASE}/api/upload/files?filters[name][$eq]=${encodeURIComponent(name)}`;
  const res = await fetch(url, { headers: ctx.auth });
  if (!res.ok) return null;
  const arr = await res.json();
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}

export async function uploadFile(ctx, localPath) {
  const name = basename(localPath);
  const existing = await findUploadedByName(ctx, name);
  if (existing) return existing;
  const buf = readFileSync(localPath);
  const fd = new FormData();
  const blob = new Blob([buf]);
  fd.append('files', blob, name);
  const res = await fetch(`${ctx.BASE}/api/upload`, { method: 'POST', headers: ctx.auth, body: fd });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`upload ${name} → ${res.status}: ${err}`);
  }
  const arr = await res.json();
  return arr[0];
}

/**
 * Upload every file in `names` from `dir`. Returns a map of name → media object.
 * Logs progress; honors dry-run.
 */
export async function uploadAll(ctx, dir, names, { dry = false } = {}) {
  const map = {};
  for (const name of names) {
    const path = join(dir, name);
    statSync(path); // throws if missing
    if (dry) {
      map[name] = { id: 0, name };
      console.log(`  [dry] upload ${name}`);
      continue;
    }
    const m = await uploadFile(ctx, path);
    map[name] = m;
    console.log(`  ✓ ${name.padEnd(40)} → id=${m.id}`);
  }
  return map;
}
