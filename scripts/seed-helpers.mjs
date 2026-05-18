// Shared helpers for Strapi seed scripts. Each script reads an env file
// from cms/.env.seed[.<env>] for STRAPI_BASE_URL + STRAPI_API_TOKEN.
//
// Pick the env by either:
//   --env=prod                       (CLI flag)
//   SEED_ENV=prod node seed-X.mjs    (environment variable)
//
// File resolution:
//   --env=prod  → cms/.env.seed.prod
//   --env=uat   → cms/.env.seed.uat
//   --env=dev   → cms/.env.seed.dev
//   (no flag)   → cms/.env.seed             (legacy single-env workflow)
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

export const isDryRun = () => process.argv.includes('--dry-run');

function pickEnvName() {
  const flag = process.argv.find((a) => a.startsWith('--env='));
  if (flag) return flag.slice('--env='.length);
  if (process.env.SEED_ENV) return process.env.SEED_ENV;
  return null;
}

function envPath() {
  const name = pickEnvName();
  const file = name ? `.env.seed.${name}` : '.env.seed';
  return join(ROOT, 'cms', file);
}

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
    const envName = pickEnvName();
    console.error(`Missing env file: ${path}`);
    if (envName) {
      console.error(`(--env=${envName} resolves to cms/.env.seed.${envName})`);
    }
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
  const path = envPath();
  const envName = pickEnvName() ?? '(default)';
  const env = loadEnv(path);
  const BASE = (env.STRAPI_BASE_URL || '').replace(/\/$/, '');
  const TOKEN = env.STRAPI_API_TOKEN;
  if (!BASE || !TOKEN) {
    console.error(`STRAPI_BASE_URL and STRAPI_API_TOKEN must be set in ${path}`);
    process.exit(1);
  }
  console.log(`▸ Seed target [${envName}]: ${BASE}`);
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

// Filename extension → mime, used so the FormData blob carries the right
// Content-Type. Without this, Strapi's Azure upload provider stores the blob
// as `application/octet-stream` and browsers won't render the file as an
// image (the SVG icons + JPGs go missing in the live UI even though the
// upload "succeeds").
const MIME_BY_EXT = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function mimeForFile(name) {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return 'application/octet-stream';
  return MIME_BY_EXT[name.slice(dot + 1).toLowerCase()] ?? 'application/octet-stream';
}

/**
 * Upload a file to Strapi. By default, if a file with the same name already
 * exists in the media library, returns it (dedup). Pass `{ replace: true }`
 * to PUT-replace the existing file with the local one — useful for fixing
 * incorrectly-uploaded files (e.g. wrong Content-Type on the underlying blob).
 */
export async function uploadFile(ctx, localPath, { replace = isReplace() } = {}) {
  const name = basename(localPath);
  const existing = await findUploadedByName(ctx, name);
  if (existing && !replace) return existing;
  const buf = readFileSync(localPath);
  const mime = mimeForFile(name);
  const fd = new FormData();
  const blob = new Blob([buf], { type: mime });
  fd.append('files', blob, name);
  let url;
  let method;
  if (existing && replace) {
    fd.append('fileInfo', JSON.stringify({ name, alternativeText: existing.alternativeText ?? '', caption: existing.caption ?? '' }));
    url = `${ctx.BASE}/api/upload?id=${existing.id}`;
    method = 'POST';
  } else {
    url = `${ctx.BASE}/api/upload`;
    method = 'POST';
  }
  const res = await fetch(url, { method, headers: ctx.auth, body: fd });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`upload ${name} → ${res.status}: ${err}`);
  }
  const arr = await res.json();
  return Array.isArray(arr) ? arr[0] : arr;
}

/**
 * Upload every file in `names` from `dir`. Returns a map of name → media object.
 * Logs progress; honors dry-run.
 */
export async function uploadAll(ctx, dir, names, { dry = false, replace = isReplace() } = {}) {
  const map = {};
  for (const name of names) {
    const path = join(dir, name);
    statSync(path); // throws if missing
    if (dry) {
      map[name] = { id: 0, name };
      console.log(`  [dry] upload ${name}`);
      continue;
    }
    const m = await uploadFile(ctx, path, { replace });
    map[name] = m;
    console.log(`  ✓ ${name.padEnd(40)} → id=${m.id}`);
  }
  return map;
}

export const isReplace = () => process.argv.includes('--replace');
