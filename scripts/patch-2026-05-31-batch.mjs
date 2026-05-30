// 2026-05-31 batch — event body cleanups + sundays mailto CTA + camp-eagle image
// + event-spaces "Learn More" hrefs.
//
// Run:  SEED_ENV=prod node scripts/patch-2026-05-31-batch.mjs
//       node scripts/patch-2026-05-31-batch.mjs --env=dev --dry-run
//       node scripts/patch-2026-05-31-batch.mjs --env=prod --only=4
//
// Idempotent: each op compares current state and skips if matching.
//
// Body-rendering note: EventDetailPage renders longDescription paragraphs as
// plain text in <p> (no markdown). Action items (Register, mailto) live as
// CTAs, not inline links. Body keeps "Register here" / email mentions as
// descriptive plain text.

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

// ---------------- Event content table — slug → desired { longDescription, ctas?, date? } ----------------
const HEROES_REG_URL =
  'https://forms.office.com/Pages/ResponsePage.aspx?id=tNI3gQWbQ0ue5Ad0V1MxKig5SVI1jCxHmIfXpkheevZUQkg1M0FEWU83SjBGRlg4NjlTOVc4SjdTVyQlQCN0PWcu';
const CAMP_EAGLE_REG_URL_4_7 =
  'https://forms.office.com/pages/responsepage.aspx?id=tNI3gQWbQ0ue5Ad0V1MxKig5SVI1jCxHmIfXpkheevZUQVhSUTFDVlY2QzEyREJDTVpVVTg3OE44TSQlQCN0PWcu&route=shorturl';
const CAMP_EAGLE_REG_URL_8_PLUS =
  'https://forms.office.com/pages/responsepage.aspx?id=tNI3gQWbQ0ue5Ad0V1MxKig5SVI1jCxHmIfXpkheevZUQVBNREpQRUc1TUdIR1RYUk1IRUFPRDMyUyQlQCN0PWcu&route=shorturl';

const EVENT_PATCHES = [
  // ---------------- 1 — Basketball Finals ----------------
  {
    slug: 'basketball-finals-live-screening-union-bar-2026',
    longDescription:
      'Catch the Basketball Finals 2026 live at Union Bar and enjoy the excitement of the game with fellow fans, great food, and drinks.\n\n' +
      'View the schedule here.',
  },

  // ---------------- 2 — Football Fever ----------------
  {
    slug: 'football-fever-night-union-bar-2026',
    longDescription:
      'Catch the European Club football finals live at Union Bar as Paris Saint-Germain takes on Arsenal. Gather with fellow football fans and enjoy the excitement of the match live on screen.\n\n' +
      'Predict the final score correctly and get a free burger on your next visit. Submit your entry by 12:00AM to qualify. T&Cs apply.\n\n\n' +
      'Beverage Specials\n\n' +
      'All Draft Beers Pint $10',
  },

  // ---------------- 3 — Smokin' Sundays ----------------
  {
    slug: 'smokin-sundays-grillhouse-2026-06',
    longDescription:
      'Food Specials\n\n' +
      'Alabama White Sauce Half Baby Chicken with Roasted Potatoes $20\n\n' +
      'Cajun Grilled Salmon with Alabama White Sauce $22\n\n' +
      'Smokey Three Baked Beans with Corn Bread $14\n\n\n' +
      'Beverage Specials\n\n' +
      'Mint Julep Swizzle $12\n\n' +
      'Coconut Lime Cooler $6',
  },

  // ---------------- 4 — Sip & Serve ----------------
  {
    slug: 'sip-and-serve-french-open-2026',
    longDescription:
      '$38 per person\n\n' +
      'Register via the TAC Book app:\n' +
      'Log into the TAC Book app > Click on Explore > Session > Tennis > Event',
  },

  // ---------------- 5 — Tiny Art Explorers (program-37) ----------------
  {
    slug: 'tiny-art-explorers-program-37',
    longDescription:
      'The Quad Poolside\n\n\n' +
      'For kids aged 3-6 years old\n' +
      'Member: $3 | Guest: $5\n\n\n' +
      "Theme for June 2026: Father's Day\n\n\n" +
      'June 4, 2026: Summer Foam Sunglasses\n' +
      'June 11, 2026: Make A Star Tie\n' +
      'June 18, 2026: Daddy Rocks Card\n' +
      'June 25, 2026: World Cup Soccer Art\n\n\n' +
      'Registration required via the TAC Book app at least one day in advance: Click on Sessions > Quad > Tiny Art Explorer',
  },

  // ---------------- 6 — Heroes & Sidekicks ----------------
  {
    slug: 'heroes-and-sidekicks-fathers-day-2026',
    longDescription:
      'Session 1: 1:00 PM – 2:30 PM\n' +
      'Session 2: 3:00 PM – 4:30 PM\n' +
      'The Quad Studios\n\n\n' +
      "Step inside the Hero Training Grounds for a playful Father's Day adventure filled with creative crafts, fun challenges, and superhero moments. Kids will create personalized gifts, complete hero missions, and celebrate the everyday heroes they call Dad.\n\n\n" +
      'Member: $40 for dad & child\n' +
      'Guest: $45 for dad & child\n\n\n' +
      'Additional $10 for Sidekick Lounge Access\n' +
      'Relax with refreshments and a casual lounge space while the little heroes complete their missions.\n\n\n' +
      'Register here.\n\n\n' +
      'Terms and Conditions:\n' +
      'A 48-hour cancellation policy applies. Members will be charged for the full event fee for no-shows or cancellations made less than 48 hours before the event.',
    ctas: [
      { label: 'Register', href: HEROES_REG_URL, isExternal: true, bordered: false, variant: 'primary', icon: 'calendar', caption: null },
    ],
  },

  // ---------------- 7 — Camp Eagle Explorers ----------------
  {
    slug: 'camp-eagle-explorers-summer-2026',
    longDescription:
      'Members: $140 per day | $700 per week\n' +
      'Guests: $160 per day | $800 per week\n\n\n' +
      '4-7 years old\n' +
      'Time: 9:00 AM – 3:00 PM\n' +
      'Venue: The American Club & various locations around Singapore\n\n\n' +
      'Register here\n\n\n' +
      '8 years old and above\n' +
      'Time: 8:30 AM – 3:00 PM\n' +
      'Venue: The American Club & various locations around Singapore\n\n\n' +
      'Register here',
    ctas: [
      { label: 'Register (4-7 yo)',         href: CAMP_EAGLE_REG_URL_4_7,   isExternal: true, bordered: false, variant: 'primary', icon: 'calendar', caption: null },
      { label: 'Register (8 yo and above)', href: CAMP_EAGLE_REG_URL_8_PLUS, isExternal: true, bordered: false, variant: 'primary', icon: 'calendar', caption: null },
    ],
  },

  // ---------------- 9 — Celebrate Dad Union Bar — drop date prefix only ----------------
  {
    slug: 'celebrate-dad-this-fathers-day-union-bar',
    longDescriptionTransform: (current) => current.replace(/^Sunday,\s*June\s*21,\s*2026\s*\n+/i, ''),
  },

  // ---------------- 10 — Sundays Served Right — add mailto CTA ----------------
  {
    slug: 'sundays-served-right-the-2nd-floor',
    ctas: [
      { label: 'Email The 2nd Floor', href: 'mailto:2ndfloor@amclub.org.sg', isExternal: true, bordered: false, variant: 'primary', icon: 'mail', caption: null },
    ],
    // longDescription untouched (already starts with "Unwind"); inline email
    // remains plain text — CTA handles the clickable mailto.
  },
];

const OPS = {
  // ---------------- 1 — Apply 10 event content patches ----------------
  1: async () => {
    console.log('\n[1] Event content cleanups + ctas');
    for (const p of EVENT_PATCHES) {
      const r = await api(
        ctx,
        `/events?filters[slug][$eq]=${encodeURIComponent(p.slug)}&populate=*&publicationState=preview&pagination[limit]=1`,
      );
      const e = r?.data?.[0];
      if (!e) { console.log(`  ✗ ${p.slug} — not found, skip`); continue; }

      const desiredLong = p.longDescription
        ?? (p.longDescriptionTransform ? p.longDescriptionTransform(e.longDescription || '') : e.longDescription);
      const longSame = (e.longDescription || '') === (desiredLong || '');
      const ctasSame = p.ctas
        ? JSON.stringify((e.ctas || []).map(stripId)) === JSON.stringify(p.ctas)
        : true;
      if (longSame && ctasSame) { console.log(`  = ${p.slug} — already up-to-date`); continue; }

      const payload = {};
      if (!longSame) payload.longDescription = desiredLong;
      if (!ctasSame) payload.ctas = p.ctas;

      if (DRY) { console.log(`  [dry] PUT ${p.slug} fields: ${Object.keys(payload).join(',')}`); continue; }
      await api(ctx, `/events/${e.documentId}`, { method: 'PUT', body: { data: payload } });
      console.log(`  ✓ updated ${p.slug} — ${Object.keys(payload).join(', ')}`);
    }
  },

  // ---------------- 2 — Upload + attach camp-eagle hero image ----------------
  2: async () => {
    console.log('\n[2] Camp Eagle Explorers — upload + attach hero image');
    const SLUG = 'camp-eagle-explorers-summer-2026';
    const r = await api(ctx, `/events?filters[slug][$eq]=${SLUG}&populate=*&publicationState=preview&pagination[limit]=1`);
    const e = r?.data?.[0];
    if (!e) { console.log('  ✗ event not found — skip'); return; }
    if (e.image?.name === 'event-camp-eagle-explorers-summer-2026.jpg') {
      console.log('  = image already attached — skip');
      return;
    }
    const localPath = join(ROOT, 'media/events/event-camp-eagle-explorers-summer-2026.jpg');
    if (DRY) { console.log(`  [dry] upload ${localPath} + PUT image`); return; }
    const uploaded = await uploadFile(ctx, localPath);
    await api(ctx, `/events/${e.documentId}`, { method: 'PUT', body: { data: { image: uploaded.id } } });
    console.log(`  ✓ image uploaded id=${uploaded.id} + attached to ${SLUG}`);
  },

  // ---------------- 3 — event-spaces-page distinctiveSpaces "Learn More" hrefs ----------------
  3: async () => {
    console.log('\n[3] event-spaces-page distinctiveSpaces — Learn More hrefs');
    const r = await api(ctx, '/event-spaces-page?populate=deep');
    const ds = r.data?.distinctiveSpaces;
    if (!ds) { console.log('  ✗ distinctiveSpaces not found'); return; }

    // name → /event-spaces/<slug> (or /kids/the-quad-studios since it's a kids subpage)
    const HREFS = {
      'The Galbraith Ballroom': '/event-spaces/the-gallbrainth-ballroom',  // typo preserved per existing slug
      'Thinkspace':             '/event-spaces/thinkspace',
      'The Bowling Alley':      '/event-spaces/bowling-alley',
      'The Quad Studios':       '/kids/the-quad-studios',
    };

    let touched = false;
    const newItems = (ds.items || []).map((it) => {
      const desiredHref = HREFS[it.name];
      const currentHref = it.cta?.href;
      const ctaSame = desiredHref ? currentHref === desiredHref : !it.cta;
      if (!ctaSame) touched = true;
      return {
        name: it.name,
        capacity: it.capacity,
        description: it.description,
        ...(it.image?.id ? { image: it.image.id } : {}),
        ...(desiredHref ? {
          cta: { label: 'Learn More', href: desiredHref, isExternal: false, bordered: false, variant: 'primary', icon: 'arrow', caption: null },
        } : {}),
      };
    });

    if (!touched) { console.log('  = already up-to-date — skip'); return; }
    if (DRY) {
      console.log('  [dry] PUT distinctiveSpaces with Learn More ctas');
      for (const it of newItems) console.log(`     ${it.name} → ${it.cta?.href || '(none)'}`);
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
};

async function main() {
  console.log(`[patch-2026-05-31-batch] target=${ctx.BASE} dry=${DRY} only=${ONLY ?? 'all'}`);
  const ids = ONLY ? [ONLY] : Object.keys(OPS).map(Number).sort((a, b) => a - b);
  for (const id of ids) {
    try { await OPS[id](); }
    catch (e) { console.error(`  ✗ [${id}] ${e.message}`); }
  }
  console.log('\n— done —');
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
