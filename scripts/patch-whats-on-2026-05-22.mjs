// Apply What's On batch from 2026-05-22 (content-updates batch 1 items 3-13).
//
// Run:   SEED_ENV=prod node scripts/patch-whats-on-2026-05-22.mjs
//        node scripts/patch-whats-on-2026-05-22.mjs --env=dev
//        node scripts/patch-whats-on-2026-05-22.mjs --env=prod --only=11
//        node scripts/patch-whats-on-2026-05-22.mjs --env=prod --dry-run
//
// Idempotent:
//   - new events:    looked up by slug. PUT if exists, POST if not.
//   - body updates:  read current value, skip PUT if already correct.
//   - unpublish:     no-op if already a draft.
//
// All events are created PUBLISHED (publishedAt = now). Hero images are NOT
// uploaded by this script — they must be added in /admin or in a follow-up.

import { initEnv, api, findOneBySlug, isDryRun } from './seed-helpers.mjs';

const ctx = initEnv();
const DRY = isDryRun();
const onlyFlag = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyFlag ? Number(onlyFlag.slice('--only='.length)) : null;

// ---------------------------------------------------------------------------
// Event categories — documentIds resolved at runtime (different per env).
const CATEGORY_SLUG = {
  DINING: 'dining',
  KIDS: 'kids',
  FITNESS: 'fitness-wellness',
  ENGAGEMENT: 'member-engagement',
};
const categoryCache = new Map();
async function catId(slug) {
  if (categoryCache.has(slug)) return categoryCache.get(slug);
  const c = await findOneBySlug(ctx, 'event-categories', slug);
  if (!c) throw new Error(`event-category slug=${slug} not found in CMS`);
  categoryCache.set(slug, c.documentId);
  return c.documentId;
}

// ---------------------------------------------------------------------------
// Helpers

const PUBLISH_NOW = () => new Date().toISOString();

async function createEvent(data) {
  const existing = await findOneBySlug(ctx, 'events', data.slug);
  if (existing) {
    if (DRY) { console.log(`  [dry] update ${data.slug}`); return; }
    await api(ctx, `/events/${existing.documentId}`, { method: 'PUT', body: { data } });
    if (!existing.publishedAt) {
      await api(ctx, `/events/${existing.documentId}/actions/publish`, { method: 'POST' });
    }
    console.log(`  ✓ updated  ${data.slug}`);
    return;
  }
  if (DRY) { console.log(`  [dry] create ${data.slug}`); return; }
  await api(ctx, '/events', { method: 'POST', body: { data: { ...data, publishedAt: PUBLISH_NOW() } } });
  console.log(`  ✓ created  ${data.slug}`);
}

async function findBySlug(slug) {
  // includes drafts
  const r = await api(ctx, `/events?filters[slug][$eq]=${encodeURIComponent(slug)}&publicationState=preview&populate=*&pagination[limit]=1`);
  return r?.data?.[0] || null;
}

async function findByTitleContains(q) {
  const r = await api(ctx, `/events?filters[title][$containsi]=${encodeURIComponent(q)}&publicationState=preview&populate=*&pagination[limit]=5`);
  return r?.data || [];
}

// ---------------------------------------------------------------------------
// 11 operations. Each returns a promise.

const OPS = {
  // ---------------- 3 — Basketball Finals Live Screening @ Union Bar ----------------
  3: async () => {
    console.log('\n[3] Basketball Finals Live Screening @ Union Bar');
    const data = {
      title: 'Basketball Finals Live Screening @ Union Bar',
      slug: 'basketball-finals-live-screening-union-bar-2026',
      description: 'Catch the Basketball Finals 2026 live at Union Bar — enjoy the game with fellow fans, great food, and drinks.',
      longDescription:
        `June 3 – 19, 2026\n\n` +
        `Catch the Basketball Finals 2026 live at Union Bar and enjoy the excitement of the game with fellow fans, great food, and drinks.\n\n` +
        `View the schedule here.`,
      date: '2026-06-03',
      location: 'Union Bar',
      category: await catId(CATEGORY_SLUG.ENGAGEMENT),
      ctas: [{
        label: 'View Schedule',
        href: 'https://docs.google.com/presentation/d/1Ruk_oS8bijGO1Osuuuc4cL3aGc7DknzVmMRqsyN7gZ8/edit?slide=id.g36c0dd5bddb_0_2#slide=id.g36c0dd5bddb_0_2',
        isExternal: true,
        variant: 'primary',
        icon: 'arrow',
      }],
    };
    await createEvent(data);
  },

  // ---------------- 4 — Football Fever Night @ Union Bar ----------------
  4: async () => {
    console.log('\n[4] Football Fever Night @ Union Bar');
    const data = {
      title: 'Football Fever Night @ Union Bar',
      slug: 'football-fever-night-union-bar-2026',
      description: 'Catch the European Club football finals live at Union Bar as Paris Saint-Germain takes on Arsenal.',
      longDescription:
        `Sunday, May 31, 2026 | 12:00AM\n\n` +
        `Catch the European Club football finals live at Union Bar as Paris Saint-Germain takes on Arsenal. Gather with fellow football fans and enjoy the excitement of the match live on screen.\n\n` +
        `Predict the final score correctly and get a free burger on your next visit. Submit your entry by 12:00AM to qualify. T&Cs apply.\n\n` +
        `Beverage Specials\n` +
        `All Draft Beers Pint $10`,
      date: '2026-05-31',
      time: '12:00 AM',
      location: 'Union Bar',
      category: await catId(CATEGORY_SLUG.ENGAGEMENT),
    };
    await createEvent(data);
  },

  // ---------------- 5 — Smokin' Sundays @ Grillhouse (Jun 21) ----------------
  5: async () => {
    console.log("\n[5] Smokin' Sundays @ Grillhouse (2026-06-21)");
    const data = {
      title: "Smokin' Sundays @ Grillhouse",
      slug: 'smokin-sundays-grillhouse-2026-06',
      description: "Sunday smokehouse specials at Grillhouse — Alabama white sauce chicken, Cajun salmon, and more.",
      longDescription:
        `Sunday, June 21, 2026\n\n` +
        `Food Specials\n` +
        `Alabama White Sauce Half Baby Chicken with Roasted Potatoes $20\n` +
        `Cajun Grilled Salmon with Alabama White Sauce $22\n` +
        `Smokey Three Baked Beans with Corn Bread $14\n\n` +
        `Beverage Specials\n` +
        `Mint Julep Swizzle $12\n` +
        `Coconut Lime Cooler $6`,
      date: '2026-06-21',
      location: 'Grillhouse',
      category: await catId(CATEGORY_SLUG.DINING),
    };
    await createEvent(data);
  },

  // ---------------- 6 — Sip & Serve: French Open Edition ----------------
  6: async () => {
    console.log('\n[6] Sip & Serve: French Open Edition');
    const data = {
      title: 'Sip & Serve: French Open Edition',
      slug: 'sip-and-serve-french-open-2026',
      description: 'Friday tennis social on the courts — $38 per person. Register via the TAC Book app.',
      longDescription:
        `Friday, May 29, 2026\n` +
        `7:00PM – 9:30PM\n` +
        `Tennis Courts\n\n` +
        `$38 per person\n\n` +
        `Register via the TAC Book app:\n` +
        `Log into the TAC Book app > Click on Explore > Session > Tennis > Event`,
      date: '2026-05-29',
      time: '7:00 PM – 9:30 PM',
      location: 'Tennis Courts',
      category: await catId(CATEGORY_SLUG.FITNESS),
    };
    await createEvent(data);
  },

  // ---------------- 7 — Tiny Art Explorers June 2026 ----------------
  7: async () => {
    console.log('\n[7] Tiny Art Explorers June 2026');
    const data = {
      title: 'Tiny Art Explorers June 2026',
      slug: 'tiny-art-explorers-2026-06',
      description: 'Weekly Thursday art sessions for ages 3-6 — Father\'s Day theme for June.',
      longDescription:
        `Thursdays, 3:00 PM – 3:45 PM\n` +
        `The Quad Poolside\n\n` +
        `For kids aged 3-6 years old\n` +
        `Member: $3 | Guest: $5\n\n` +
        `Theme for June 2026: Father's Day\n\n` +
        `June 4, 2026: Summer Foam Sunglasses\n` +
        `June 11, 2026: Make A Star Tie\n` +
        `June 18, 2026: Daddy Rocks Card\n` +
        `June 25, 2026: World Cup Soccer Art\n\n` +
        `Registration required via the TAC Book app at least one day in advance: Click on Sessions > Quad > Tiny Art Explorer`,
      date: '2026-06-04',
      time: '3:00 PM – 3:45 PM',
      location: 'The Quad Poolside',
      category: await catId(CATEGORY_SLUG.KIDS),
    };
    await createEvent(data);
  },

  // ---------------- 8 — Heroes & Sidekicks: Kids' Father's Day ----------------
  8: async () => {
    console.log("\n[8] Heroes & Sidekicks: Kids' Father's Day Activity");
    const data = {
      title: "Heroes & Sidekicks: Kids' Father's Day Activity",
      slug: 'heroes-and-sidekicks-fathers-day-2026',
      description: 'A playful Father\'s Day adventure at The Quad Studios — creative crafts, hero missions, and celebratory moments.',
      longDescription:
        `Sunday, June 21, 2026\n` +
        `Session 1: 1:00 PM – 2:30 PM\n` +
        `Session 2: 3:00 PM – 4:30 PM\n` +
        `The Quad Studios\n\n` +
        `Step inside the Hero Training Grounds for a playful Father's Day adventure filled with creative crafts, fun challenges, and superhero moments. Kids will create personalized gifts, complete hero missions, and celebrate the everyday heroes they call Dad.\n\n` +
        `Member: $40 for dad & child\n` +
        `Guest: $45 for dad & child\n\n` +
        `Additional $10 for Sidekick Lounge Access\n` +
        `Relax with refreshments and a casual lounge space while the little heroes complete their missions.\n\n` +
        `Terms and Conditions:\n` +
        `A 48-hour cancellation policy applies. Members will be charged for the full event fee for no-shows or cancellations made less than 48 hours before the event.`,
      date: '2026-06-21',
      time: 'Session 1: 1:00 PM – 2:30 PM · Session 2: 3:00 PM – 4:30 PM',
      location: 'The Quad Studios',
      category: await catId(CATEGORY_SLUG.KIDS),
      // NOTE: registration "Register here" CTA — URL not provided in batch 1.
      // Add via /admin once URL is supplied.
    };
    await createEvent(data);
  },

  // ---------------- 9 — Camp Eagle Explorers Summer 2026 ----------------
  9: async () => {
    console.log('\n[9] Camp Eagle Explorers Summer 2026');
    const REG_URL =
      'https://forms.office.com/pages/responsepage.aspx?id=tNI3gQWbQ0ue5Ad0V1MxKig5SVI1jCxHmIfXpkheevZUQVBNREpQRUc1TUdIR1RYUk1IRUFPRDMyUyQlQCN0PWcu&route=shorturl';
    const data = {
      title: 'Camp Eagle Explorers Summer 2026',
      slug: 'camp-eagle-explorers-summer-2026',
      description: 'Two-month summer camp for ages 4 and up — daily and weekly rates available. Runs June 8 – Aug 7.',
      longDescription:
        `June 8 – August 7, 2026\n` +
        `Members: $140 per day | $700 per week\n` +
        `Guests: $160 per day | $800 per week\n\n` +
        `4-7 years old\n` +
        `Time: 9:00 AM – 3:00 PM\n` +
        `Venue: The American Club & various locations around Singapore\n\n` +
        `Register here\n\n` +
        `8 years old and above\n` +
        `Time: 8:30 AM – 3:00 PM\n` +
        `Venue: The American Club & various locations around Singapore\n\n` +
        `Register here`,
      date: '2026-06-08',
      location: 'The American Club & various locations around Singapore',
      category: await catId(CATEGORY_SLUG.KIDS),
      ctas: [{
        label: 'Register',
        href: REG_URL,
        isExternal: true,
        variant: 'primary',
        icon: 'calendar',
      }],
    };
    await createEvent(data);
  },

  // ---------------- 10 — 4th of July Celebration @ the Club ----------------
  10: async () => {
    console.log('\n[10] 4th of July Celebration @ the Club');
    const data = {
      title: '4th of July Celebration @ the Club',
      slug: 'fourth-of-july-celebration-2026',
      description: 'Saturday afternoon celebration at The American Club — $29 per person, $10 of F&B/activity tickets included.',
      longDescription:
        `Saturday, July 4, 2026\n` +
        `4:00PM – 9:00PM\n\n` +
        `$29 per person\n` +
        `(enter code FOJ250TAC upon checkout to enjoy $10 off entry fee)\n\n` +
        `The prices listed above are inclusive of $10 worth of F&B and activity* tickets.\n\n` +
        `Get your tickets here.`,
      date: '2026-07-04',
      time: '4:00 PM – 9:00 PM',
      location: 'The American Club',
      category: await catId(CATEGORY_SLUG.ENGAGEMENT),
      ctas: [{
        label: 'Get Tickets',
        href: 'https://www.aasingapore.com/events-1/americas-250th-birthday-bash',
        isExternal: true,
        variant: 'primary',
        icon: 'calendar',
      }],
    };
    await createEvent(data);
  },

  // ---------------- 11 — Shaken, Not Sorry 2.0 — body update ----------------
  11: async () => {
    console.log('\n[11] Shaken, Not Sorry 2.0 — Bespoke → Signature Cocktails');
    const candidates = await findByTitleContains('Shaken');
    const target = candidates.find((c) => /shaken[, ]+not sorry/i.test(c.title));
    if (!target) throw new Error('Could not find "Shaken, Not Sorry 2.0" event on this env');

    const current = target.longDescription || '';
    // Replace from "Bespoke Cocktails" heading onward.
    const splitIdx = current.indexOf('Bespoke Cocktails');
    if (splitIdx === -1 && current.includes('Signature Cocktails')) {
      console.log('  = already updated (Signature Cocktails present, no Bespoke heading) — skipping');
      return;
    }
    if (splitIdx === -1) throw new Error('Could not locate "Bespoke Cocktails" heading in longDescription — manual review needed');

    const intro = current.slice(0, splitIdx).replace(/\s+$/, '');
    const newBody =
      `Signature Cocktails\n\n` +
      `Happy Hour (8:00PM – 9:00PM)\n\n` +
      `Old Fashioned — Buffalo Trace™ bourbon whiskey, demerara syrup & Angostura® aromatic bitters\n` +
      `Classic Lime Margarita on the Rocks — Código 1530® Reposado Tequila, orange liqueur, fresh lime juice & agave nectar\n` +
      `Ladies Night Negroni — Aperol®, Gin Mare®, sweet vermouth & grapefruit juice\n` +
      `Barrel-Aged Negroni — Tanqueray® London Dry Gin, sweet vermouth & Campari®\n` +
      `G&T — Tanqueray® London Dry Gin & premium tonic water\n` +
      `Kumartini — Grey Goose® Vodka & dry vermouth\n\n` +
      `French 75 à la Mode — Tanqueray® London Dry Gin, fresh lemon juice & champagne\n` +
      `Paloma — Código 1530® Blanco Tequila, grapefruit juice, fresh lime juice & soda water\n\n` +
      `Bar Snacks\n` +
      `8:00PM – 11:15PM (last orders at 11:00PM)\n\n` +
      `Stuffed Dates — Pt Reyes blue cheese, prosciutto & hot honey drizzle\n` +
      `S&P Fish Street Taco — Tajin mangonada salsa, sunny-side-up quail egg & lime\n` +
      `Ultimate Black Truffle Grilled Cheese Bites* — Griddled sourdough, aged cheddar, candied thick-cut bacon, goat cheese & tomato bisque dip\n` +
      `*Vegetarian version available upon request\n` +
      `Truffle House Fries — With umami aioli\n` +
      `Bite-sized Spicy Fried Steak Fingers — Buttermilk batter, sriracha honey syrup, toasted sesame & spiked remoulade\n` +
      `Baked Brie en Croûte — Honey drizzle & house sourdough crostini\n` +
      `House Hummus — Grilled naan & crisp vegetable sticks`;
    const newLong = `${intro}\n\n${newBody}`;

    if (DRY) { console.log('  [dry] would PUT new longDescription'); return; }
    await api(ctx, `/events/${target.documentId}`, { method: 'PUT', body: { data: { longDescription: newLong } } });
    if (!target.publishedAt) {
      await api(ctx, `/events/${target.documentId}/actions/publish`, { method: 'POST' });
    }
    console.log('  ✓ longDescription updated');
  },

  // ---------------- 12 — Sundays Served Right — unpublish ----------------
  12: async () => {
    console.log('\n[12] Sundays Served Right @ The 2nd Floor — unpublish');
    const candidates = await findByTitleContains('Sundays Served');
    const target = candidates.find((c) => /sundays served right/i.test(c.title));
    if (!target) throw new Error('Could not find "Sundays Served Right" event');
    if (!target.publishedAt) {
      console.log('  = already unpublished — skipping');
      return;
    }
    if (DRY) { console.log('  [dry] would POST unpublish'); return; }
    await api(ctx, `/events/${target.documentId}/actions/unpublish`, { method: 'POST' });
    console.log('  ✓ unpublished');
  },

  // ---------------- 13 — A Delicious Spread — registration link update ----------------
  13: async () => {
    console.log('\n[13] A Delicious Spread @ The 2nd Floor — registration link');
    const NEW_HREF = 'https://forms.office.com/r/yDrPtgvgbF';
    const candidates = await findByTitleContains('Delicious Spread');
    const target = candidates.find((c) => /delicious spread/i.test(c.title));
    if (!target) throw new Error('Could not find "A Delicious Spread" event');
    const existing = (target.ctas || []).find((c) => /register/i.test(c.label || ''));
    if (existing?.href === NEW_HREF) {
      console.log('  = link already correct — skipping');
      return;
    }
    // Send updated ctas list. Strapi v5 replaces the array.
    const newCtas = (target.ctas || []).map((c) => /register/i.test(c.label || '')
      ? { label: c.label, href: NEW_HREF, isExternal: true, bordered: c.bordered, variant: c.variant, icon: c.icon, caption: c.caption ?? null }
      : { label: c.label, href: c.href, isExternal: c.isExternal, bordered: c.bordered, variant: c.variant, icon: c.icon, caption: c.caption ?? null }
    );
    // If no Register CTA existed, add one.
    if (!existing) {
      newCtas.push({ label: 'Register Here', href: NEW_HREF, isExternal: true, variant: 'primary', icon: 'calendar' });
    }
    if (DRY) { console.log('  [dry] would PUT ctas with new href'); return; }
    await api(ctx, `/events/${target.documentId}`, { method: 'PUT', body: { data: { ctas: newCtas } } });
    if (!target.publishedAt) {
      await api(ctx, `/events/${target.documentId}/actions/publish`, { method: 'POST' });
    }
    console.log(`  ✓ ctas updated → ${NEW_HREF}`);
  },
};

// ---------------------------------------------------------------------------
async function main() {
  console.log(`[patch-whats-on-2026-05-22] target=${ctx.BASE} dry=${DRY} only=${ONLY ?? 'all'}`);
  const ids = ONLY ? [ONLY] : Object.keys(OPS).map(Number).sort((a, b) => a - b);
  for (const id of ids) {
    const fn = OPS[id];
    if (!fn) { console.warn(`  (no op for ${id})`); continue; }
    try { await fn(); }
    catch (e) { console.error(`  ✗ [${id}] ${e.message}`); }
  }
  console.log('\n— done —');
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
