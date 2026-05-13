#!/usr/bin/env node
/**
 * One-off patch: replace the "View All FAQ" CTA href on the deployed
 * home-page entry so it points at /faq (was '#').
 *
 * Reads `cms/.env.seed` for STRAPI_BASE_URL + STRAPI_API_TOKEN.
 *
 * Usage:
 *   node scripts/patch-home-faq-cta.mjs            # apply
 *   node scripts/patch-home-faq-cta.mjs --dry-run  # print intended change
 *
 * Safe to re-run: idempotent. It re-sends the existing faq component with
 * only the ctas array swapped; faqItem relations are preserved by id.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ENV_PATH = join(ROOT, 'cms', '.env.seed');
const DRY = process.argv.includes('--dry-run');

function loadEnv(path) {
  const text = readFileSync(path, 'utf8');
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

async function api(path, opts = {}) {
  const url = `${BASE}/api${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
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

async function main() {
  console.log(`Patching home-page FAQ CTAs → ${BASE}${DRY ? ' (dry-run)' : ''}\n`);

  const r = await api('/home-page?populate[faq][populate][ctas]=true&populate[faq][populate][items]=true');
  const home = r?.data;
  if (!home) throw new Error('home-page entry not found');

  const faq = home.faq;
  if (!faq) throw new Error('home-page has no faq component');

  const existingCtas = Array.isArray(faq.ctas) ? faq.ctas : [];
  const newCtas = existingCtas.map((c) => {
    if (c?.label && /view all faq/i.test(c.label)) {
      return { label: c.label, href: '/faq', isExternal: c.isExternal ?? false, variant: c.variant ?? 'primary' };
    }
    return {
      label: c.label,
      href: c.href,
      isExternal: c.isExternal ?? false,
      variant: c.variant ?? 'text',
    };
  });

  console.log('Existing ctas:');
  for (const c of existingCtas) console.log(`  - "${c.label}" → ${c.href}`);
  console.log('\nReplacement ctas:');
  for (const c of newCtas) console.log(`  - "${c.label}" → ${c.href}`);

  if (DRY) return;

  // Preserve faqItem relations by passing them as documentIds.
  const itemIds = Array.isArray(faq.items)
    ? faq.items.map((i) => i.documentId).filter(Boolean)
    : undefined;

  const payload = {
    faq: {
      label: faq.label,
      heading: faq.heading,
      ctas: newCtas,
      ...(itemIds ? { items: itemIds } : {}),
    },
  };

  await api('/home-page', { method: 'PUT', body: { data: payload } });
  console.log('\n✓ home-page faq.ctas updated');
}

main().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});
