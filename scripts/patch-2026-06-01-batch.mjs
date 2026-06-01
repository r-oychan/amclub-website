// 2026-06-01 batch — fitness-page moreActivities reorder (Pilates to 3rd box).
//
// Run:  SEED_ENV=prod node scripts/patch-2026-06-01-batch.mjs
//       node scripts/patch-2026-06-01-batch.mjs --env=dev
//       node scripts/patch-2026-06-01-batch.mjs --env=prod --dry-run
//
// Idempotent: skips if items already in the desired order.

import { initEnv, api } from './seed-helpers.mjs';

const ctx = initEnv();
const DRY = process.argv.includes('--dry-run');

const stripId = (o, keys) => Object.fromEntries(keys.map((k) => [k, o?.[k]]).filter(([, v]) => v !== undefined));

const DESIRED_ORDER = ['Golf Activities', 'Multi-Purpose Court', 'Pilates', 'Squash'];

async function main() {
  console.log(`[patch-2026-06-01-batch] target=${ctx.BASE} dry=${DRY}`);
  console.log('\n[1] fitness-page moreActivities — reorder Pilates to 3rd');

  const r = await api(ctx, '/fitness-page?populate[moreActivities][populate][items][populate]=*');
  const ma = r.data?.moreActivities;
  if (!ma) { console.log('  ✗ moreActivities not found'); return; }

  const currentNames = (ma.items || []).map((it) => it.heading);
  const currentOrder = JSON.stringify(currentNames);
  const targetOrder = JSON.stringify(DESIRED_ORDER);
  console.log('  current:', currentOrder);
  console.log('  desired:', targetOrder);
  if (currentOrder === targetOrder) { console.log('  = already in desired order — skip'); return; }

  const byName = new Map((ma.items || []).map((it) => [it.heading, it]));
  const newItems = DESIRED_ORDER.map((name) => {
    const it = byName.get(name);
    if (!it) throw new Error(`item heading="${name}" not found in moreActivities — aborting (manual check)`);
    return {
      heading: it.heading,
      description: it.description,
      imageAlt: it.imageAlt ?? null,
      accentColor: it.accentColor ?? null,
      ...(it.image?.id ? { image: it.image.id } : {}),
      ...(it.cta
        ? {
            cta: {
              label: it.cta.label,
              href: it.cta.href,
              caption: it.cta.caption ?? null,
              isExternal: it.cta.isExternal,
              bordered: it.cta.bordered,
              variant: it.cta.variant,
              icon: it.cta.icon,
            },
          }
        : {}),
    };
  });

  const payload = {
    moreActivities: {
      heading: ma.heading ?? null,
      subheading: ma.subheading ?? null,
      columns: ma.columns ?? null,
      items: newItems,
    },
  };
  if (DRY) {
    console.log('  [dry] PUT moreActivities with', newItems.length, 'items in order:', newItems.map((i) => i.heading));
    return;
  }
  await api(ctx, '/fitness-page', { method: 'PUT', body: { data: payload } });
  console.log(`  ✓ updated  items=${newItems.length}  order=[${DESIRED_ORDER.join(' | ')}]`);
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
