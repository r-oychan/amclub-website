#!/usr/bin/env node
// Delete EVERY Media Library file (DB row + backing blob) on a NON-PROD env.
// The upload provider deletes the blob when the row is destroyed and tolerates
// already-missing blobs (BlobNotFound), so orphaned rows purge cleanly.
// Documented recipe: docs/strapi-patterns.md → "Resetting media on a non-prod env".
// Stray blobs that lost their DB row are cleaned separately:
//   az storage blob delete-batch -s media --pattern 'uploads/*' --account-name amclub<env>data
//
// Safety rails: refuses anything but --env=dev|uat; dry-run unless --yes.
//
// Usage:
//   node scripts/reset-env-uploads.mjs --env=uat          # dry-run (count only)
//   node scripts/reset-env-uploads.mjs --env=uat --yes    # delete for real

import { initEnv } from './seed-helpers.mjs';

const envArg = (process.argv.find((a) => a.startsWith('--env=')) || '').slice('--env='.length);
if (!['dev', 'uat'].includes(envArg)) {
  console.error('Refusing: --env must be dev or uat (never prod).');
  process.exit(1);
}
const YES = process.argv.includes('--yes');
const ctx = initEnv();

// The upload content-api returns a plain array (no meta), so page until empty.
async function listFiles() {
  const res = await fetch(`${ctx.BASE}/api/upload/files?pagination[pageSize]=100`, { headers: ctx.auth });
  if (!res.ok) throw new Error(`list files → ${res.status}`);
  return res.json();
}

(async () => {
  console.log(`[reset-env-uploads] target=${ctx.BASE} mode=${YES ? 'DELETE' : 'dry-run'}`);
  let deleted = 0;
  for (;;) {
    const files = await listFiles();
    if (!Array.isArray(files) || files.length === 0) break;
    if (!YES) {
      console.log(`Would delete ${files.length}+ files (first page shown). Re-run with --yes to apply.`);
      return;
    }
    for (const f of files) {
      const res = await fetch(`${ctx.BASE}/api/upload/files/${f.id}`, { method: 'DELETE', headers: ctx.auth });
      if (res.ok) deleted++;
      else console.log(`  ! delete ${f.id} (${f.name}) → ${res.status}`);
    }
    console.log(`  …${deleted} deleted so far`);
  }
  console.log(`\nDeleted ${deleted} upload files.`);
})().catch((e) => { console.error(e); process.exit(1); });
