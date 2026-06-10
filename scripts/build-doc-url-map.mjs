#!/usr/bin/env node
// Build a SOURCE→DEST document-URL map for the clone script's --doc-map flag.
//
// seed-documents.mjs writes scripts/data/document-urls.json mapping each OLD
// static href (e.g. /documents/club-bylaws.pdf) to the env-specific hashed
// blob path (e.g. /uploads/documents/club_bylaws_<hash>.pdf). The hash differs
// per environment, so content cloned from one env carries hrefs that 404 on
// another. Given a saved copy of each env's manifest, this joins them on the
// static-href key and emits { "<srcUrl>": "<destUrl>", ... }.
//
// Usage:
//   node scripts/build-doc-url-map.mjs <src-manifest.json> <dest-manifest.json> <out-map.json>
//
// Typical flow (dev → uat):
//   cp scripts/data/document-urls.json /tmp/doc-manifest.dev.json   # before re-running seed-documents
//   SEED_ENV=uat node scripts/seed-documents.mjs                    # uploads to uat, rewrites the manifest
//   node scripts/build-doc-url-map.mjs /tmp/doc-manifest.dev.json scripts/data/document-urls.json /tmp/doc-map.json
//   node scripts/clone-dev-to-uat-collections.mjs --doc-map=/tmp/doc-map.json

import { readFileSync, writeFileSync } from 'node:fs';

const [src, dest, out] = process.argv.slice(2);
if (!src || !dest || !out) {
  console.error('Usage: build-doc-url-map.mjs <src-manifest.json> <dest-manifest.json> <out-map.json>');
  process.exit(1);
}

const srcMap = JSON.parse(readFileSync(src, 'utf8'));
const destMap = JSON.parse(readFileSync(dest, 'utf8'));

const map = {};
let missing = 0;
for (const [staticHref, srcUrl] of Object.entries(srcMap)) {
  const destUrl = destMap[staticHref];
  if (!destUrl) { console.warn(`  ! no dest for ${staticHref}`); missing++; continue; }
  if (srcUrl !== destUrl) map[srcUrl] = destUrl;
}

writeFileSync(out, JSON.stringify(map, null, 2));
console.log(`✓ wrote ${Object.keys(map).length} mappings to ${out}${missing ? ` (${missing} missing on dest)` : ''}`);
