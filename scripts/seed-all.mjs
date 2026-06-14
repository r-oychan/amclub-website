#!/usr/bin/env node
// Run the full seed suite against one environment, in dependency order, so a
// freshly-wiped (or brand-new) Strapi instance is rebuilt to match the
// signed-off content captured in the seed scripts. Used as Phase 2 of the
// prod cutover (after `wipe-env-content` + `reset-env-uploads`), and any time
// an env needs a clean rebuild from code.
//
// Each child runs as `node scripts/<name>.mjs <passthrough-flags>` and inherits
// stdout/stderr. Flags forwarded verbatim: --env=<env>, --dry-run, --replace.
//
// Order = relation targets before their dependents:
//   0. config + media library (documents)   — no relations
//   1. taxonomies + standalone collections   — referenced by pages/details
//   2. singleton pages                       — reference entities, docs, uploads
//   3. detail skeletons                      — reference many entities + pages
//
// The individual seed scripts are idempotent upserts, so re-running is safe and
// exact ordering inside a tier is not critical; the tiers are what matter.
//
// Usage:
//   node scripts/seed-all.mjs --env=prod --dry-run     # list what would run
//   node scripts/seed-all.mjs --env=prod               # seed for real
//   node scripts/seed-all.mjs --env=prod --replace     # re-upload media (overwrite)
//   node scripts/seed-all.mjs --env=prod --only=seed-home-page,seed-footer
//   node scripts/seed-all.mjs --env=prod --continue    # don't stop on first failure

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ORDER = [
  // ── Tier 0: config + media library (no relations) ──────────────
  'seed-site-settings',
  'seed-site-config',
  'seed-documents', // uploads every PDF/doc into the Media Library first

  // ── Tier 1: taxonomies + standalone collections ────────────────
  'seed-event-categories', // before seed-events (events connect to category)
  'seed-fitness-facilities', // before fitness-page + detail-skeletons
  'seed-fitness-coaches',
  'seed-event-spaces', // before event-spaces-page + detail-skeletons
  'seed-kids-experiences', // before kids-page
  'seed-events', // after event-categories
  'seed-news',
  'seed-news-html',
  'seed-gallery',
  'seed-dining-promotions',
  'seed-membership-forms',

  // ── Tier 2: singleton pages (reference the above) ──────────────
  'seed-header',
  'seed-footer',
  'seed-home-page',
  'seed-about-page',
  'seed-contact-us-page',
  'seed-dining-page',
  'seed-fitness-page',
  'seed-kids-page',
  'seed-membership-page',
  'seed-membership-subpages',
  'seed-event-spaces-page',
  'seed-whats-on-page',
  'seed-faq-page',
  'seed-joining-fees-page',
  'seed-referral-page',

  // ── Tier 3: detail skeletons (reference many entities + pages) ──
  'seed-detail-skeletons',
];

const argv = process.argv.slice(2);
const envFlag = argv.find((a) => a.startsWith('--env='));
const env = envFlag ? envFlag.slice('--env='.length) : process.env.SEED_ENV;
if (!env) {
  console.error('Refusing: pass --env=<dev|uat|prod> (or set SEED_ENV).');
  process.exit(1);
}

const onlyFlag = argv.find((a) => a.startsWith('--only='));
const only = onlyFlag ? onlyFlag.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean) : null;
const CONTINUE = argv.includes('--continue');

// Flags forwarded to each child (everything except seed-all's own --only/--continue).
const passthrough = argv.filter((a) => !a.startsWith('--only=') && a !== '--continue');

const scripts = only ? ORDER.filter((s) => only.includes(s)) : ORDER;
if (only) {
  const unknown = only.filter((s) => !ORDER.includes(s));
  if (unknown.length) {
    console.error(`Unknown --only entries (not in ORDER): ${unknown.join(', ')}`);
    process.exit(1);
  }
}

console.log(`[seed-all] env=${env}  scripts=${scripts.length}  flags="${passthrough.join(' ')}"`);
console.log('');

const results = [];
for (const name of scripts) {
  const file = join(__dirname, `${name}.mjs`);
  process.stdout.write(`\n━━ ${name} ${'━'.repeat(Math.max(0, 48 - name.length))}\n`);
  const r = spawnSync('node', [file, ...passthrough], { stdio: 'inherit' });
  const ok = r.status === 0;
  results.push({ name, ok, code: r.status });
  if (!ok && !CONTINUE) {
    console.error(`\n[seed-all] ✗ ${name} exited ${r.status}. Stopping (pass --continue to keep going).`);
    summary(results);
    process.exit(1);
  }
}

summary(results);
const failed = results.filter((r) => !r.ok);
process.exit(failed.length ? 1 : 0);

function summary(rs) {
  console.log(`\n${'='.repeat(56)}\n[seed-all] summary (env=${env})`);
  for (const r of rs) console.log(`  ${r.ok ? '✓' : '✗'} ${r.name}${r.ok ? '' : ` (exit ${r.code})`}`);
  const failed = rs.filter((r) => !r.ok);
  console.log(`  ${rs.length - failed.length}/${rs.length} ok${failed.length ? `, ${failed.length} FAILED` : ''}`);
}
