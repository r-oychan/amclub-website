#!/usr/bin/env node
// One-shot uploader for event-spaces assets onto the deployed Strapi.
// Idempotent — the helper skips files that already exist on the server.
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, uploadFile } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const TARGETS = [
  // event-spaces folder
  { dir: 'media/event-spaces', files: [
    'venue-galbraith-wedding.jpg',
    'venue-2nd-floor-wedding.jpg',
    'venue-thinkspace-adult-library.jpg',
    'venue-bowling-4120.jpg',
    'bowling-alley-rates.jpg',
    'bowling-alley-party-package.pdf',
    'capacity-chart.pdf',
  ]},
  { dir: 'media/event-spaces/wedding', files: [
    'wedding-package-classic.jpg',
    'wedding-package-signature.jpg',
    'wedding-package-prestige.jpg',
  ]},
  { dir: 'media/kids/kids-party', files: [
    'quad-studios-1457.jpg',
  ]},
];

const ctx = initEnv();
console.log(`Strapi base: ${ctx.BASE}`);
for (const { dir, files } of TARGETS) {
  for (const name of files) {
    const m = await uploadFile(ctx, join(ROOT, dir, name));
    console.log(`  ✓ ${name.padEnd(40)} → id=${m.id}  url=${m.url}`);
  }
}
console.log('Done.');
