// 2026-06-01 follow-up batch — event body formatting + dining promo subtitle +
// Strapi event-spaces-page Bowling Alley capacity.
//
// Run:  SEED_ENV=prod node scripts/patch-2026-06-01-content-batch-2.mjs
//       node scripts/patch-2026-06-01-content-batch-2.mjs --env=dev --dry-run

import { initEnv, api } from './seed-helpers.mjs';

const ctx = initEnv();
const DRY = process.argv.includes('--dry-run');

const EVENT_PATCHES = [
  // 1) Football Fever — tighten Beverage Specials block (heading flush with items)
  {
    slug: 'football-fever-night-union-bar-2026',
    longDescription:
      'Catch the European Club football finals live at Union Bar as Paris Saint-Germain takes on Arsenal. Gather with fellow football fans and enjoy the excitement of the match live on screen.\n\n' +
      'Predict the final score correctly and get a free burger on your next visit. Submit your entry by 12:00AM to qualify. T&Cs apply.\n\n\n' +
      '**Beverage Specials**\n' +
      'All Draft Beers Pint $10',
  },

  // 2) Smokin' Sundays — bold the two title lines, items as br (\n) underneath
  {
    slug: 'smokin-sundays-grillhouse-2026-06',
    longDescription:
      '**Food Specials**\n' +
      'Alabama White Sauce Half Baby Chicken with Roasted Potatoes $20\n' +
      'Cajun Grilled Salmon with Alabama White Sauce $22\n' +
      'Smokey Three Baked Beans with Corn Bread $14\n\n' +
      '**Beverage Specials**\n' +
      'Mint Julep Swizzle $12\n' +
      'Coconut Lime Cooler $6',
  },

  // 3) Camp Eagle — extra blank line between the two age-group blocks. The
  //    inline `<br />` after the time gives the visible line gap the user
  //    asked for ("add new line here") even with markdown's whitespace-
  //    collapsing rules.
  {
    slug: 'camp-eagle-explorers-summer-2026',
    longDescription:
      'Members: $140 per day | $700 per week\n' +
      'Guests: $160 per day | $800 per week\n\n' +
      '4-7 years old\n' +
      'Time: 9:00 AM – 3:00 PM\n<br />\n\n' +
      '8 years old and above\n' +
      'Time: 8:30 AM – 3:00 PM',
  },
];

async function patchEvent(p) {
  const r = await api(
    ctx,
    `/events?filters[slug][$eq]=${p.slug}&publicationState=preview&pagination[limit]=1`,
  );
  const e = r?.data?.[0];
  if (!e) { console.log(`  ✗ ${p.slug} — not found, skip`); return; }
  if ((e.longDescription || '') === p.longDescription) {
    console.log(`  = ${p.slug} — already clean`);
    return;
  }
  if (DRY) {
    console.log(`  [dry] PUT ${p.slug} longDescription len=${p.longDescription.length}`);
    return;
  }
  await api(ctx, `/events/${e.documentId}`, { method: 'PUT', body: { data: { longDescription: p.longDescription } } });
  console.log(`  ✓ updated ${p.slug}`);
}

async function main() {
  console.log(`[patch-2026-06-01-content-batch-2] target=${ctx.BASE} dry=${DRY}`);

  // -------- 1, 2, 3 — event bodies --------
  console.log('\n[events] body formatting');
  for (const p of EVENT_PATCHES) await patchEvent(p);

  // -------- 4 — dining-promotions-page subtitle --------
  console.log('\n[dining-promotions-page] subtitle');
  const dpp = await api(ctx, '/dining-promotions-page?populate=*');
  if (!dpp?.data) {
    console.log('  ✗ singleton not initialised on this env');
  } else {
    const current = dpp.data.subtitle || '';
    const updated = current.replace(/\bMay 2026\b/g, 'June 2026');
    if (current === updated) {
      console.log('  = already updated — skip');
    } else if (DRY) {
      console.log(`  [dry] PUT subtitle "${current}" → "${updated}"`);
    } else {
      await api(ctx, '/dining-promotions-page', { method: 'PUT', body: { data: { subtitle: updated } } });
      console.log(`  ✓ updated subtitle → "${updated}"`);
    }
  }

  // -------- 5 — event-spaces-page Bowling capacity "30 pax" → "Up to 30 pax" --------
  console.log('\n[event-spaces-page] Bowling capacity → "Up to 30 pax"');
  const es = await api(ctx, '/event-spaces-page?populate=deep');
  const ds = es.data?.distinctiveSpaces;
  if (!ds) {
    console.log('  ✗ distinctiveSpaces not found');
  } else {
    const want = ['Up to 30 pax'];
    let touched = false;
    const newItems = (ds.items || []).map((it) => {
      const isBowling = it.name === 'The Bowling Alley';
      const same = Array.isArray(it.capacity) && it.capacity.length === want.length && it.capacity[0] === want[0];
      if (isBowling && !same) touched = true;
      return {
        name: it.name,
        capacity: isBowling ? want : it.capacity,
        description: it.description,
        ...(it.image?.id ? { image: it.image.id } : {}),
        ...(it.cta
          ? {
              cta: {
                label: it.cta.label, href: it.cta.href, caption: it.cta.caption ?? null,
                isExternal: it.cta.isExternal, bordered: it.cta.bordered, variant: it.cta.variant, icon: it.cta.icon,
              },
            }
          : {}),
      };
    });
    if (!touched) {
      console.log('  = already correct — skip');
    } else if (DRY) {
      console.log('  [dry] PUT distinctiveSpaces with Bowling = Up to 30 pax');
    } else {
      const dsPayload = {
        heading: ds.heading,
        subheading: ds.subheading ?? null,
        panelBgColor: ds.panelBgColor,
        items: newItems,
      };
      await api(ctx, '/event-spaces-page', { method: 'PUT', body: { data: { distinctiveSpaces: dsPayload } } });
      console.log('  ✓ updated Bowling capacity');
    }
  }

  console.log('\n— done —');
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
