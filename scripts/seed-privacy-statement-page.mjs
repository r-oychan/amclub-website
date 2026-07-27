#!/usr/bin/env node
/**
 * Seed the Privacy Statement page single type (/privacy-statement).
 *
 * The body is one markdown document (scripts/data/privacy-statement-body.md)
 * rendered by the frontend's legal-page markdown map. Idempotent: PUT
 * overwrites the singleton with the canonical copy.
 *
 * Usage: node scripts/seed-privacy-statement-page.mjs --env=dev [--dry-run]
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, isDryRun } from './seed-helpers.mjs';

const DRY = isDryRun();
const ctx = initEnv();
const HERE = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);

  const body = readFileSync(join(HERE, 'data', 'privacy-statement-body.md'), 'utf8');
  const data = {
    label: 'Data Protection Policy',
    title: 'Privacy Statement',
    lastRevision: 'Monday, September 1, 2025',
    body,
  };

  console.log('\n[1/1] Privacy Statement Page single type…');
  if (DRY) {
    console.log(`  [dry] PUT /privacy-statement-page — body ${body.length} chars`);
    return;
  }
  // Strapi v5: PUT with ?status=published upserts AND publishes the singleton.
  await api(ctx, '/privacy-statement-page?status=published', {
    method: 'PUT',
    body: { data },
  });
  console.log('  ✓ privacy-statement-page upserted + published');
}

main().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});
