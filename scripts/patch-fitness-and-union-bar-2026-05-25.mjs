// Apply 2026-05-25 batch — Union Bar (restaurant) + fitness-page gym CTA.
//
// Run:  SEED_ENV=prod node scripts/patch-fitness-and-union-bar-2026-05-25.mjs
//       node scripts/patch-fitness-and-union-bar-2026-05-25.mjs --env=dev
//       node scripts/patch-fitness-and-union-bar-2026-05-25.mjs --env=prod --only=1
//       node scripts/patch-fitness-and-union-bar-2026-05-25.mjs --env=prod --dry-run
//
// Idempotent: reads current state, skips PUT if already correct.
//
// Strapi v5 component-update quirk learned from earlier patches:
//   - Do NOT send the existing component `id` in the PUT payload — Strapi
//     400s with "Some of the provided components in <field> are not related
//     to the entity". Send full component objects without `id` and Strapi
//     replaces them in place.

import { initEnv, api } from './seed-helpers.mjs';

const ctx = initEnv();
const DRY = process.argv.includes('--dry-run');
const onlyFlag = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyFlag ? Number(onlyFlag.slice('--only='.length)) : null;

const SPORTS_SCREENING_URL =
  'https://docs.google.com/presentation/d/1Ruk_oS8bijGO1Osuuuc4cL3aGc7DknzVmMRqsyN7gZ8/edit?slide=id.g36c0dd5bddb_0_2#slide=id.g36c0dd5bddb_0_2';

const NEW_GYM_RATES_HREF = '/documents/fitness/personal-training-group-fitness-rates-2026.pdf';
const NEW_GYM_RATES_LABEL = 'Personal Training & Group Fitness Rates 2026';

const OPS = {
  // ---------------- 1 — Union Bar: add Sports Screening CTA + operating hours ----------------
  1: async () => {
    console.log('\n[1] Union Bar — Sports Screening CTA + operating hours');
    const r = await api(ctx, '/restaurants?filters[slug][$eq]=union-bar&populate=*&pagination[limit]=1');
    const u = r?.data?.[0];
    if (!u) throw new Error('union-bar restaurant not found');

    // Build new ctas: preserve existing, add Sports Screening Schedule if not present.
    const existingCtas = u.ctas || [];
    const hasSports = existingCtas.some((c) => /sports screening/i.test(c.label || ''));
    const newCtas = existingCtas.map((c) => ({
      label: c.label, href: c.href, caption: c.caption ?? null,
      isExternal: c.isExternal, bordered: c.bordered, variant: c.variant, icon: c.icon,
    }));
    if (!hasSports) {
      newCtas.push({
        label: 'Sports Screening Schedule',
        href: SPORTS_SCREENING_URL,
        caption: null,
        isExternal: true,
        bordered: false,
        variant: 'primary',
        icon: 'arrow',
      });
    }

    // Operating hours: 2 rows.
    const desiredSections = [{
      title: 'Opening Hours',
      rows: [
        { dayRange: 'Sunday to Thursday', time: '12:00 PM – 11:00 PM', lastOrder: 'Last beverage order at 10:30 PM' },
        { dayRange: 'Friday, Saturday & Eve of PH', time: '12:00 PM – 12:00 AM', lastOrder: 'Last beverage order at 11:30 PM' },
      ],
    }];

    // Idempotency check
    const currentSections = u.operatingHoursSections || [];
    const sectionsMatch =
      currentSections.length === 1 &&
      currentSections[0]?.title === 'Opening Hours' &&
      Array.isArray(currentSections[0]?.rows) &&
      currentSections[0].rows.length === 2 &&
      currentSections[0].rows[0]?.time === '12:00 PM – 11:00 PM' &&
      currentSections[0].rows[1]?.time === '12:00 PM – 12:00 AM';

    if (hasSports && sectionsMatch) {
      console.log('  = already up-to-date — skipping');
      return;
    }

    const payload = { ctas: newCtas, operatingHoursSections: desiredSections };
    if (DRY) { console.log('  [dry] PUT', JSON.stringify(payload, null, 2)); return; }
    await api(ctx, `/restaurants/${u.documentId}`, { method: 'PUT', body: { data: payload } });
    // Ensure published (restaurant has draftAndPublish)
    if (!u.publishedAt) {
      await api(ctx, `/restaurants/${u.documentId}/actions/publish`, { method: 'POST' });
    }
    console.log(`  ✓ updated  ${u.documentId}  ctas=${newCtas.length}  rows=${desiredSections[0].rows.length}`);
  },

  // ---------------- 2 — fitness-page.gym.ctas[0] → new rates 2026 file ----------------
  2: async () => {
    console.log('\n[2] fitness-page gym CTA → new rates 2026 file');
    const fp = await api(ctx, '/fitness-page?populate=deep');
    const gym = fp?.data?.gym;
    if (!gym) throw new Error('fitness-page.gym component not found');

    const ctas = gym.ctas || [];
    const firstCta = ctas[0];
    if (firstCta?.href === NEW_GYM_RATES_HREF && firstCta?.label === NEW_GYM_RATES_LABEL) {
      console.log('  = already up-to-date — skipping');
      return;
    }

    // Rebuild gym component without component ids (Strapi v5 quirk).
    const stripId = (c) => ({
      label: c.label, href: c.href, caption: c.caption ?? null,
      isExternal: c.isExternal, bordered: c.bordered, variant: c.variant, icon: c.icon,
    });
    const newCtas = ctas.map((c, i) =>
      i === 0
        ? { ...stripId(c), label: NEW_GYM_RATES_LABEL, href: NEW_GYM_RATES_HREF }
        : stripId(c)
    );

    // Rebuild the whole gym component. blocks.overlay-section fields are
    // unknown statically — copy every non-id, non-relation key from current.
    // Media field 'image' (if present) needs to be sent as id.
    const gymPayload = {};
    for (const [k, v] of Object.entries(gym)) {
      if (k === 'id') continue;
      if (k === 'ctas') { gymPayload.ctas = newCtas; continue; }
      // Media single → send id
      if (v && typeof v === 'object' && !Array.isArray(v) && 'mime' in v && 'url' in v) {
        gymPayload[k] = v.id;
        continue;
      }
      gymPayload[k] = v;
    }

    if (DRY) {
      console.log('  [dry] PUT data.gym keys:', Object.keys(gymPayload).join(', '));
      console.log('  [dry] new ctas:', JSON.stringify(newCtas, null, 2));
      return;
    }
    await api(ctx, '/fitness-page', { method: 'PUT', body: { data: { gym: gymPayload } } });
    console.log(`  ✓ updated  fitness-page.gym.ctas[0] → ${NEW_GYM_RATES_LABEL}`);
  },
};

async function main() {
  console.log(`[patch-fitness-and-union-bar-2026-05-25] target=${ctx.BASE} dry=${DRY} only=${ONLY ?? 'all'}`);
  const ids = ONLY ? [ONLY] : Object.keys(OPS).map(Number).sort((a, b) => a - b);
  for (const id of ids) {
    try { await OPS[id](); }
    catch (e) { console.error(`  ✗ [${id}] ${e.message}`); }
  }
  console.log('\n— done —');
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
