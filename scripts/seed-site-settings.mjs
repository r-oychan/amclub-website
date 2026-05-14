#!/usr/bin/env node
// Upsert the site-settings single-type. The bootstrap in cms/src/index.ts
// already creates a default row on first boot; run this script when you
// want to flip a flag explicitly (e.g. disable the chatbot in production).
//
//   node scripts/seed-site-settings.mjs --dry-run
//   node scripts/seed-site-settings.mjs
//   CHATBOT_ENABLED=false node scripts/seed-site-settings.mjs

import { initEnv, api, isDryRun } from './seed-helpers.mjs';

const DRY = isDryRun();
const ctx = initEnv();

function parseBool(v, fallback) {
  if (v == null) return fallback;
  const s = String(v).trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return fallback;
}

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);

  const data = {
    chatbotEnabled: parseBool(process.env.CHATBOT_ENABLED, true),
  };
  console.log('\nPayload:', data);

  if (DRY) {
    console.log('  [dry] PUT /site-settings');
    return;
  }
  const r = await api(ctx, '/site-settings', { method: 'PUT', body: { data } });
  console.log('  ✓ site-settings upserted', r?.data ?? r);
}

main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
