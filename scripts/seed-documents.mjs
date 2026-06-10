#!/usr/bin/env node
// Migrate every static PDF into Azure Blob via the Strapi upload provider so
// documents live in the CMS Media Library, mirror the site IA, and are served
// first-party from <site>/uploads/... (the removeCN domain mapping) instead of
// being baked into the SPA bundle under /documents and /menus.
//
// Sources (canonical asset home under media/, clean lowercase-hyphen names):
//   media/documents/**                    → blob  uploads/documents/<rel>
//   media/dining/<venue>/<venue>-menu.pdf → blob  uploads/dining/<venue>
//
// Output: scripts/data/document-urls.json — a manifest mapping the OLD static
// href (e.g. "/documents/membership/forms/giro-payment-form.pdf" or
// "/menus/central-menu.pdf") to the NEW blob URL. Content seed scripts and the
// frontend fallbacks repoint their hrefs through this manifest, so the hashed
// blob filenames never have to be hand-written.
//
// Idempotent: uploadFile() finds existing assets by filename and skips them
// unless --replace is passed.
//
// Usage:
//   SEED_ENV=dev node scripts/seed-documents.mjs --dry-run
//   SEED_ENV=dev node scripts/seed-documents.mjs
//   SEED_ENV=dev node scripts/seed-documents.mjs --replace

import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, uploadFile, isDryRun, isReplace } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY = isDryRun();
const ctx = initEnv();

const DOCS_DIR = join(ROOT, 'media', 'documents');
const DINING_DIR = join(ROOT, 'media', 'dining');
const MANIFEST = join(__dirname, 'data', 'document-urls.json');

// Store host-agnostic relative paths in the manifest (e.g. /uploads/documents/
// foo.pdf). The site serves these same-origin via nginx's /uploads → blob
// proxy on every environment, so no env-specific host is baked into references.
function toRelative(url) {
  return String(url).replace(/^https?:\/\/[^/]+/, '');
}

// Walk every file under a dir (all types — PDFs, plus jpg/jpeg/docx etc. that
// also live under /documents). Skips dotfiles.
function walkFiles(dir) {
  const out = [];
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

(async () => {
  console.log(`Seed target: ${ctx.BASE}${DRY ? ' (dry-run)' : ''}${isReplace() ? ' (replace)' : ''}`);
  const manifest = {};

  // ── documents/** ──────────────────────────────────────────────
  for (const abs of walkFiles(DOCS_DIR)) {
    const rel = relative(DOCS_DIR, abs).split(/[\\/]/); // [subdir..., file]
    const file = rel[rel.length - 1];
    const subDir = rel.slice(0, -1).join('/'); // '' for top-level
    const blobPath = subDir ? `documents/${subDir}` : 'documents';
    const oldHref = `/documents/${rel.join('/')}`;
    if (DRY) {
      console.log(`  [dry] ${oldHref}  →  uploads/${blobPath}/${file}`);
      manifest[oldHref] = `(dry)/uploads/${blobPath}/${file}`;
      continue;
    }
    const media = await uploadFile(ctx, abs, { path: blobPath });
    manifest[oldHref] = toRelative(media.url);
    console.log(`  ✓ ${oldHref}  →  ${manifest[oldHref]}`);
  }

  // ── media/dining/<venue>/<venue>-menu.pdf → dining/<venue> ─────
  // The old static home was frontend/public/menus/<venue>-menu.pdf, so the
  // manifest key stays /menus/<file> for reference repointing.
  for (const abs of walkFiles(DINING_DIR)) {
    const file = abs.split(/[\\/]/).pop();
    if (!/-menu\.pdf$/i.test(file)) continue; // only menu PDFs, not venue images
    const venue = relative(DINING_DIR, abs).split(/[\\/]/)[0];
    const blobPath = `dining/${venue}`;
    const oldHref = `/menus/${file}`;
    if (DRY) {
      console.log(`  [dry] ${oldHref}  →  uploads/${blobPath}/${file}`);
      manifest[oldHref] = `(dry)/uploads/${blobPath}/${file}`;
      continue;
    }
    const media = await uploadFile(ctx, abs, { path: blobPath });
    manifest[oldHref] = toRelative(media.url);
    console.log(`  ✓ ${oldHref}  →  ${manifest[oldHref]}`);
  }

  if (DRY) {
    console.log(`\n[dry] would write ${Object.keys(manifest).length} entries to ${relative(ROOT, MANIFEST)} (manifest not modified)`);
    return;
  }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\n✓ Wrote ${Object.keys(manifest).length} entries to ${relative(ROOT, MANIFEST)}`);
})().catch((err) => { console.error(err); process.exit(1); });
