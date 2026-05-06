// Seed event-category entries for /whats-on filters.
// - Ensures all 5 categories exist (Dining, Kids, Thinkspace, Fitness & Wellness, Member Engagement)
// - Sets displayOrder so they render in the Framer order
//
// Run: node scripts/seed-event-categories.mjs
// Idempotent. Reads cms/.env.seed for STRAPI_BASE_URL + STRAPI_API_TOKEN.

import { initEnv, api, findOneBySlug, isDryRun, slugify } from './seed-helpers.mjs';

const CATEGORIES = [
  { name: 'Dining', displayOrder: 1 },
  { name: 'Kids', displayOrder: 2 },
  { name: 'Thinkspace', displayOrder: 3 },
  { name: 'Fitness & Wellness', displayOrder: 4 },
  { name: 'Member Engagement', displayOrder: 5 },
];

(async () => {
  const ctx = initEnv();
  const dry = isDryRun();
  console.log(`[seed-event-categories] BASE=${ctx.BASE} dry=${dry}`);

  // Probe whether deployed Strapi knows the `displayOrder` field. It may not, if the
  // CMS hasn't been rebuilt+redeployed since the schema change.
  let supportsDisplayOrder = true;
  try {
    const sample = await findOneBySlug(ctx, 'event-categories', 'dining');
    if (sample) {
      const probe = await fetch(`${ctx.BASE}/api/event-categories/${sample.documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...ctx.auth },
        body: JSON.stringify({ data: { displayOrder: sample.displayOrder ?? 1 } }),
      });
      if (probe.status === 400) {
        const t = await probe.text();
        if (t.includes('displayOrder')) supportsDisplayOrder = false;
      }
    }
  } catch (_) {
    supportsDisplayOrder = false;
  }
  if (!supportsDisplayOrder) {
    console.log('  ⚠ deployed Strapi does not yet expose `displayOrder`; will only create missing categories.');
    console.log('     Rebuild + redeploy the CMS image to enable displayOrder updates.');
  }

  for (const cat of CATEGORIES) {
    const slug = slugify(cat.name).replace('and', '');
    // Special-case: "Fitness & Wellness" → "fitness-wellness"
    const targetSlug = cat.name === 'Fitness & Wellness' ? 'fitness-wellness' : slug;
    const existing = await findOneBySlug(ctx, 'event-categories', targetSlug);
    if (existing) {
      if (!supportsDisplayOrder) {
        console.log(`  • ${cat.name.padEnd(22)} exists (skipping update — schema not deployed)`);
        continue;
      }
      if (existing.displayOrder === cat.displayOrder) {
        console.log(`  • ${cat.name.padEnd(22)} exists (displayOrder=${existing.displayOrder})`);
        continue;
      }
      if (dry) {
        console.log(`  [dry] update ${cat.name} → displayOrder=${cat.displayOrder}`);
        continue;
      }
      await api(ctx, `/event-categories/${existing.documentId}`, {
        method: 'PUT',
        body: { data: { displayOrder: cat.displayOrder } },
      });
      console.log(`  ✓ ${cat.name.padEnd(22)} updated (displayOrder=${cat.displayOrder})`);
    } else {
      if (dry) {
        console.log(`  [dry] create ${cat.name}`);
        continue;
      }
      const body = supportsDisplayOrder
        ? { data: { name: cat.name, slug: targetSlug, displayOrder: cat.displayOrder } }
        : { data: { name: cat.name, slug: targetSlug } };
      await api(ctx, `/event-categories`, { method: 'POST', body });
      console.log(`  ✓ ${cat.name.padEnd(22)} created`);
    }
  }
  console.log('[seed-event-categories] done');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
