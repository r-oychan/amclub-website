#!/usr/bin/env node
// One-shot uploader for the two new wedding-celebration venue images.
// Idempotent — the helper skips files that already exist on the server.
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, uploadFile } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MEDIA_DIR = join(ROOT, 'media', 'event-spaces');

const FILES = [
  'venue-galbraith-wedding.jpg',
  'venue-2nd-floor-wedding.jpg',
  'venue-thinkspace-adult-library.jpg',
  'venue-bowling-4120.jpg',
];

const ctx = initEnv();
console.log(`Strapi base: ${ctx.BASE}`);
for (const name of FILES) {
  const m = await uploadFile(ctx, join(MEDIA_DIR, name));
  console.log(`  ✓ ${name.padEnd(40)} → id=${m.id}  url=${m.url}`);
}
console.log('Done.');
