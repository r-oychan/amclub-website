// 2026-11-10 — Add "TAC Connect" to the footer's Member column, right after
// Login. Also back-fills "Talk2Us!" at the end of About Us on envs that lack
// it (it was added to prod in /admin). seed-footer.mjs carries both links
// for fresh envs.
//
// Run: node scripts/patch-2026-11-10-footer-tac-connect.mjs --env=dev [--dry-run]
//
// Only `columns` is sent; every other footer field is left untouched.
// Links that already exist (matched by href) are not added again.

import { initEnv, api, isDryRun } from './seed-helpers.mjs';

const ctx = initEnv();
const DRY = isDryRun();
const ADDITIONS = [
  { column: 'Member', after: 'Login', link: { label: 'TAC Connect', href: '/membership/tac-connect', isExternal: false } },
  { column: 'About Us', after: null, link: { label: 'Talk2Us!', href: 'https://amclub.jotform.com/form/talk2us', isExternal: true } },
];

const footer = (await api(ctx, '/footer?populate[columns][populate]=links'))?.data;
if (!footer) throw new Error('No footer entry — run seed-footer.mjs first');

const strip = ({ id: _id, ...rest }) => rest;
const columns = footer.columns.map((c) => ({ ...strip(c), links: c.links.map(strip) }));

let changed = 0;
for (const { column, after, link } of ADDITIONS) {
  const col = columns.find((c) => c.title === column);
  if (!col) { console.warn(`  ! no "${column}" column — skipped ${link.label}`); continue; }
  if (col.links.some((l) => l.href === link.href)) { console.log(`  = ${column}: ${link.label} already present`); continue; }
  const at = after ? col.links.findIndex((l) => l.label === after) + 1 : col.links.length;
  col.links.splice(at > 0 ? at : col.links.length, 0, link);
  changed += 1;
  console.log(`  + ${column}: ${col.links.map((l) => l.label).join(' | ')}`);
}
if (!changed) { console.log('Nothing to do'); process.exit(0); }
if (DRY) { console.log('[dry] PUT /footer (columns)'); process.exit(0); }

// Strapi v5 REST writes publish by default.
await api(ctx, '/footer', { method: 'PUT', body: { data: { columns } } });
console.log('✓ published');
