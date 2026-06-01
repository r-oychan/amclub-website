// 2026-05-30 batch — six independent ops, each idempotent.
//
// Run:  SEED_ENV=prod node scripts/patch-2026-05-30-batch.mjs
//       node scripts/patch-2026-05-30-batch.mjs --env=dev --dry-run
//       node scripts/patch-2026-05-30-batch.mjs --env=prod --only=4
//
// Ops:
//   1. Delete events with date in [2026-10-01, 2026-12-31].
//   2. Sundays Served Right — date → 2026-06-28, longDescription starts with "Unwind".
//   3. Delete 3 dining-promotions: Seasonal Brews, A Toast to Mom, Heartwarming Mother's Day Feast.
//   4. Grillhouse (slug `grillhouse`) — replace operatingHoursSections with new Grillhouse + Tiki Bar rows.
//   5. Create 2 club-wide dining-promotions (June Monthly + Celebrate Dad), each with image upload.
//   6. Union Bar — idempotent verify: Sports Screening Schedule CTA + operating hours.

import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, findOneBySlug, uploadFile } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const ctx = initEnv();
const DRY = process.argv.includes('--dry-run');
const onlyFlag = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyFlag ? Number(onlyFlag.slice('--only='.length)) : null;

const stripId = (c) => ({
  label: c.label, href: c.href, caption: c.caption ?? null,
  isExternal: c.isExternal, bordered: c.bordered, variant: c.variant, icon: c.icon,
});

const SPORTS_SCREENING_URL =
  'https://docs.google.com/presentation/d/1Ruk_oS8bijGO1Osuuuc4cL3aGc7DknzVmMRqsyN7gZ8/edit?slide=id.g36c0dd5bddb_0_2#slide=id.g36c0dd5bddb_0_2';

const OPS = {
  // ---------------- 1 — Delete events in Oct-Dec 2026 ----------------
  1: async () => {
    console.log('\n[1] Delete events in 2026-10-01..2026-12-31');
    const r = await api(
      ctx,
      '/events?filters[date][$gte]=2026-10-01&filters[date][$lte]=2026-12-31&publicationState=preview&pagination[limit]=100&sort=date:asc',
    );
    const events = r?.data || [];
    if (!events.length) { console.log('  = no events in range — skip'); return; }
    for (const e of events) {
      if (DRY) { console.log(`  [dry] DELETE ${e.date}  ${e.title}`); continue; }
      try {
        await api(ctx, `/events/${e.documentId}`, { method: 'DELETE' });
        console.log(`  ✓ deleted  ${e.date}  ${e.title}`);
      } catch (err) {
        console.error(`  ✗ ${e.title}: ${err.message}`);
      }
    }
  },

  // ---------------- 2 — Sundays Served Right: date 2026-06-28, body starts with "Unwind" ----------------
  2: async () => {
    console.log('\n[2] Sundays Served Right — date + body update');
    const r = await api(
      ctx,
      '/events?filters[title][$containsi]=Sundays%20Served&publicationState=preview&pagination[limit]=5',
    );
    const target = (r?.data || []).find((e) => /sundays served right/i.test(e.title));
    if (!target) { console.log('  ✗ event not found on this env — skip'); return; }

    const NEW_DATE = '2026-06-28';
    const NEW_BODY =
      'Unwind on Sunday with a relaxed semi-buffet lunch at The 2nd Floor. ' +
      'Enjoy a curated spread of starters, mains, and desserts crafted for a leisurely afternoon with family and friends.\n\n' +
      'For reservations and enquiries, contact The 2nd Floor at 6739 4329 or 2ndfloor@amclub.org.sg.';

    if (target.date === NEW_DATE && target.longDescription === NEW_BODY) {
      console.log('  = already updated — skip');
      return;
    }
    if (DRY) {
      console.log(`  [dry] PUT  date=${NEW_DATE}  body length=${NEW_BODY.length}`);
      return;
    }
    await api(ctx, `/events/${target.documentId}`, {
      method: 'PUT',
      body: { data: { date: NEW_DATE, longDescription: NEW_BODY } },
    });
    console.log(`  ✓ updated  ${target.documentId}  date=${NEW_DATE}`);
  },

  // ---------------- 3 — Delete 3 dining-promotions ----------------
  3: async () => {
    console.log('\n[3] Delete dining-promotions');
    const titles = ['Seasonal Brews', 'A Toast to Mom', "Heartwarming Mother's Day Feast"];
    for (const q of titles) {
      const r = await api(
        ctx,
        `/dining-promotions?filters[title][$containsi]=${encodeURIComponent(q)}&publicationState=preview&pagination[limit]=5`,
      );
      const matches = (r?.data || []).filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));
      if (!matches.length) { console.log(`  = ${q} — not present, skip`); continue; }
      for (const m of matches) {
        if (DRY) { console.log(`  [dry] DELETE  ${m.title}`); continue; }
        try {
          await api(ctx, `/dining-promotions/${m.documentId}`, { method: 'DELETE' });
          console.log(`  ✓ deleted  ${m.title}`);
        } catch (err) {
          console.error(`  ✗ ${m.title}: ${err.message}`);
        }
      }
    }
  },

  // ---------------- 4 — Grillhouse operatingHoursSections (Grillhouse + Tiki Bar) ----------------
  4: async () => {
    console.log('\n[4] Grillhouse & Tiki Bar — operating hours');
    const r = await api(
      ctx,
      '/restaurants?filters[slug][$eq]=grillhouse&populate[operatingHoursSections][populate]=*&pagination[limit]=1',
    );
    const g = r?.data?.[0];
    if (!g) { console.log('  ✗ grillhouse restaurant not found'); return; }

    const desired = [
      {
        title: 'Grillhouse Operating Hours',
        rows: [
          { dayRange: 'Sunday to Thursday',     time: '11:00AM – 9:00PM', lastOrder: 'Last order 8:30PM' },
          { dayRange: 'Friday & Saturday',      time: '11:00AM – 9:30PM', lastOrder: 'Last order 9:00PM' },
        ],
      },
      {
        title: 'Tiki Bar Operating Hours',
        rows: [
          { dayRange: 'Friday to Sunday',       time: '11:30AM – 10:00PM', lastOrder: 'Last order 9:30PM' },
        ],
      },
    ];

    const matches = (current, want) =>
      current.length === want.length &&
      current.every((c, i) =>
        c.title === want[i].title &&
        c.rows?.length === want[i].rows.length &&
        c.rows.every((r, j) => r.dayRange === want[i].rows[j].dayRange && r.time === want[i].rows[j].time && r.lastOrder === want[i].rows[j].lastOrder),
      );
    if (matches(g.operatingHoursSections || [], desired)) {
      console.log('  = already correct — skip');
      return;
    }
    if (DRY) { console.log('  [dry] PUT operatingHoursSections — 2 sections, 3 rows'); return; }
    await api(ctx, `/restaurants/${g.documentId}`, {
      method: 'PUT',
      body: { data: { operatingHoursSections: desired } },
    });
    console.log(`  ✓ updated  ${g.documentId}  sections=2 rows=3`);
  },

  // ---------------- 5 — Create 2 club-wide dining-promotions ----------------
  // Env-aware: prod schema uses `restaurantTag: "club-wide"`; dev schema has
  // migrated to `isClubWide: boolean` + `restaurant: relation`. Detected
  // from a sample existing entry's fields.
  5: async () => {
    console.log('\n[5] Create 2 club-wide dining-promotions');
    const promos = [
      {
        title: 'June Monthly Promotions',
        slug: 'club-wide-june-monthly-promo',
        summary: null,                                              // user said "without title" — leaving summary blank
        imagePath: join(ROOT, 'media/promotions/june-monthly-promo-overall.jpg'),
        order: 10,
      },
      {
        title: 'Celebrate Dad This Father\'s Day',
        slug: 'club-wide-celebrate-dad-fathers-day',
        summary: 'Honor Dad with a curated selection of dining specials, great food, and good company across the Club.',
        imagePath: join(ROOT, 'media/promotions/celebrate-dad-this-fathers-day-a2.jpg'),
        order: 11,
      },
    ];
    // Detect schema shape from an existing entry.
    const sampleRes = await api(ctx, '/dining-promotions?pagination[limit]=1');
    const sample = sampleRes?.data?.[0] || {};
    const clubWideField = 'isClubWide' in sample
      ? { isClubWide: true }                  // dev (new schema)
      : { restaurantTag: 'club-wide' };       // prod (old schema)
    console.log('  schema shape:', Object.keys(clubWideField)[0]);

    for (const p of promos) {
      const existing = await findOneBySlug(ctx, 'dining-promotions', p.slug);
      if (existing) { console.log(`  = ${p.slug} already exists — skip`); continue; }
      if (DRY) { console.log(`  [dry] upload + POST ${p.slug}`); continue; }
      const uploaded = await uploadFile(ctx, p.imagePath);
      const payload = {
        title: p.title,
        slug: p.slug,
        summary: p.summary,
        ...clubWideField,
        image: uploaded.id,
        order: p.order,
        publishedAt: new Date().toISOString(),
      };
      await api(ctx, '/dining-promotions', { method: 'POST', body: { data: payload } });
      console.log(`  ✓ created  ${p.slug}  image id=${uploaded.id}`);
    }
  },

  // ---------------- 8 — event-spaces-page distinctiveSpaces capacities ----------------
  // Galbraith Ballroom: 3400 sqm → "3,400 Square Feet"
  // The Bowling Alley:  "Up to 50 pax" → "30 pax"
  8: async () => {
    console.log('\n[8] event-spaces-page — distinctiveSpaces capacity updates');
    const r = await api(ctx, '/event-spaces-page?populate=deep');
    const ds = r.data?.distinctiveSpaces;
    if (!ds) { console.log('  ✗ distinctiveSpaces not found'); return; }

    const overrides = {
      'The Galbraith Ballroom': ['3,400 Square Feet'],
      'The Bowling Alley':      ['30 pax'],
    };

    let touched = false;
    const newItems = (ds.items || []).map((it) => {
      const want = overrides[it.name];
      if (!want) {
        // Preserve unchanged items
        return {
          name: it.name,
          capacity: it.capacity,
          description: it.description,
          ...(it.image?.id ? { image: it.image.id } : {}),
        };
      }
      const same = Array.isArray(it.capacity) && it.capacity.length === want.length && it.capacity.every((c, i) => c === want[i]);
      if (!same) touched = true;
      return {
        name: it.name,
        capacity: want,
        description: it.description,
        ...(it.image?.id ? { image: it.image.id } : {}),
      };
    });

    if (!touched) { console.log('  = already up-to-date — skip'); return; }
    if (DRY) {
      console.log('  [dry] PUT distinctiveSpaces with updated capacities for Galbraith + Bowling Alley');
      return;
    }
    const dsPayload = {
      heading: ds.heading,
      subheading: ds.subheading ?? null,
      panelBgColor: ds.panelBgColor,
      items: newItems,
    };
    await api(ctx, '/event-spaces-page', { method: 'PUT', body: { data: { distinctiveSpaces: dsPayload } } });
    console.log(`  ✓ updated  items=${newItems.length}`);
  },

  // ---------------- 7 — Delete club-wide May Monthly Promotions ----------------
  7: async () => {
    console.log('\n[7] Delete club-wide-may-monthly-promo');
    const existing = await findOneBySlug(ctx, 'dining-promotions', 'club-wide-may-monthly-promo');
    if (!existing) { console.log('  = not present — skip'); return; }
    if (DRY) { console.log(`  [dry] DELETE ${existing.documentId}`); return; }
    await api(ctx, `/dining-promotions/${existing.documentId}`, { method: 'DELETE' });
    console.log(`  ✓ deleted  ${existing.documentId}  ${existing.title}`);
  },

  // ---------------- 6 — Union Bar idempotent verify ----------------
  6: async () => {
    console.log('\n[6] Union Bar — idempotent verify (Sports Screening + operating hours)');
    const r = await api(
      ctx,
      '/restaurants?filters[slug][$eq]=union-bar&populate[operatingHoursSections][populate]=*&populate[ctas]=true&pagination[limit]=1',
    );
    const u = r?.data?.[0];
    if (!u) { console.log('  ✗ union-bar not found'); return; }

    const existingCtas = u.ctas || [];
    const hasSports = existingCtas.some((c) => /sports screening/i.test(c.label || '') && c.href === SPORTS_SCREENING_URL);

    const desiredRows = [
      { dayRange: 'Sunday to Thursday',           time: '12:00 PM – 11:00 PM', lastOrder: 'Last beverage order at 10:30 PM' },
      { dayRange: 'Friday, Saturday & Eve of PH', time: '12:00 PM – 12:00 AM', lastOrder: 'Last beverage order at 11:30 PM' },
    ];
    const currentRows = u.operatingHoursSections?.[0]?.rows || [];
    const rowsMatch = currentRows.length === 2 && currentRows.every((r, i) =>
      r.dayRange === desiredRows[i].dayRange && r.time === desiredRows[i].time && r.lastOrder === desiredRows[i].lastOrder,
    );

    if (hasSports && rowsMatch) {
      console.log('  = already correct — skip');
      return;
    }

    const newCtas = existingCtas.map(stripId);
    if (!hasSports) {
      // remove any prior Sports Screening with wrong href, then append the correct one
      const filtered = newCtas.filter((c) => !/sports screening/i.test(c.label || ''));
      filtered.push({
        label: 'Sports Screening Schedule', href: SPORTS_SCREENING_URL, caption: null,
        isExternal: true, bordered: false, variant: 'primary', icon: 'arrow',
      });
      newCtas.length = 0;
      filtered.forEach((c) => newCtas.push(c));
    }

    const payload = {
      ctas: newCtas,
      operatingHoursSections: [{ title: 'Opening Hours', rows: desiredRows }],
    };
    if (DRY) { console.log(`  [dry] PUT  ctas=${newCtas.length}  rows=${desiredRows.length}`); return; }
    await api(ctx, `/restaurants/${u.documentId}`, { method: 'PUT', body: { data: payload } });
    console.log(`  ✓ updated  ${u.documentId}`);
  },
};

async function main() {
  console.log(`[patch-2026-05-30-batch] target=${ctx.BASE} dry=${DRY} only=${ONLY ?? 'all'}`);
  const ids = ONLY ? [ONLY] : Object.keys(OPS).map(Number).sort((a, b) => a - b);
  for (const id of ids) {
    try { await OPS[id](); }
    catch (e) { console.error(`  ✗ [${id}] ${e.message}`); }
  }
  console.log('\n— done —');
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
