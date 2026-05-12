#!/usr/bin/env node
/**
 * Seed the 7 membership application form PDFs into Strapi.
 * Usage: node scripts/seed-membership-forms.mjs [--dry-run]
 *
 * Sources: amclub.org.sg/membership-page/application-checklist
 * Local copies live in `media/membership/forms/` (Strapi upload source) and
 * `frontend/public/documents/membership/forms/` (served directly by the
 * frontend, which is what /membership/start-application currently links to).
 */
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, uploadAll, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FORMS_DIR = join(ROOT, 'media', 'membership', 'forms');
const DRY = isDryRun();
const ctx = initEnv();

const FILES = [
  'application-checklist.pdf',
  'membership-application-form.pdf',
  'endorsement-form.pdf',
  'junior-membership-application-form.pdf',
  'pdpa-acknowledgement-form.pdf',
  'giro-payment-form.pdf',
  'car-registration-form.pdf',
];

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);
  console.log(`\nUploading ${FILES.length} membership form(s) from ${FORMS_DIR}…`);
  const media = await uploadAll(ctx, FORMS_DIR, FILES, { dry: DRY });
  if (DRY) return;
  console.log('\nDone. Upload IDs:');
  for (const name of FILES) {
    const m = media[name];
    console.log(`  ${name.padEnd(40)} → id=${m.id}  url=${m.url}`);
  }
}

main().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});
