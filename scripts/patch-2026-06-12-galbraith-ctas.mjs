#!/usr/bin/env node
// Fix The Galbraith Ballroom event-space CTAs: the CMS entry carried
// placeholder '#' hrefs (inherited from the original seed), so once
// /event-spaces/:slug reads the CMS (VenueDetailPage rewire) the buttons
// would dead-end. Set the real targets:
//   View Capacity Chart → /documents/event-spaces/capacity-chart.pdf
//     (manifest key — seed-helpers api() rewrites it to this environment's
//      hashed /uploads URL, so run AFTER seed-documents for the target env)
//   Enquire Now         → mailto:catering@amclub.org.sg
//
// Idempotent. Usage:
//   node scripts/patch-2026-06-12-galbraith-ctas.mjs --env=dev [--dry-run]
//   node scripts/patch-2026-06-12-galbraith-ctas.mjs --env=uat

import { initEnv, api, isDryRun } from './seed-helpers.mjs';

const DRY = isDryRun();
const ctx = initEnv();

const CTAS = [
  { label: 'View Capacity Chart', href: '/documents/event-spaces/capacity-chart.pdf', isExternal: true },
  { label: 'Enquire Now', href: 'mailto:catering@amclub.org.sg', isExternal: true },
];

(async () => {
  console.log(`Patch target: ${ctx.BASE}`);
  const r = await api(ctx, "/event-spaces?filters[slug][$eq]=the-gallbrainth-ballroom");
  const entry = r.data?.[0];
  if (!entry) throw new Error('the-gallbrainth-ballroom not found');
  console.log('  current ctas:', (entry.ctas ?? []).map((c) => `${c.label}→${c.href}`).join('  '));
  if (DRY) { console.log('  [dry] PUT ctas:', JSON.stringify(CTAS)); return; }
  await api(ctx, `/event-spaces/${entry.documentId}?status=published`, {
    method: 'PUT',
    body: { data: { ctas: CTAS } },
  });
  console.log('  ↻ ctas updated + published');
  console.log('\n✓ Done.');
})().catch((e) => { console.error(e); process.exit(1); });
