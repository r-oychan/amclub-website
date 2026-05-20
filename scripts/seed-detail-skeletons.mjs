#!/usr/bin/env node
// Skeleton seeds for the four detail-page collection types and the four
// membership singletons introduced in Phase A. Each entry gets:
//   - name / slug
//   - shortDescription (one paragraph)
//   - parentLabel + parentHref (breadcrumb)
//   - locationLevel / phone / email when known
//
// What's NOT seeded here:
//   - heroImage uploads (do these in a follow-up media-bound seed)
//   - body dynamiczone (rich CMS blocks)
//   - operatingHoursSections (the rich shape)
//   - ctas
//
// The intent is to land the routing pipeline first: every page resolves
// to a CMS entry rather than the legacy subpages.ts fallback. Richer
// content is layered on next.
//
// Run against UAT:
//   SEED_ENV=uat node scripts/seed-detail-skeletons.mjs --dry-run
//   SEED_ENV=uat node scripts/seed-detail-skeletons.mjs

import { initEnv, api, findOneBySlug, isDryRun } from './seed-helpers.mjs';

const DRY = isDryRun();
const ctx = initEnv();

/** Helper — upsert an entry on a collection by slug. */
async function upsertBySlug(plural, payload) {
  const slug = payload.slug;
  if (!slug) throw new Error(`Entry missing slug: ${JSON.stringify(payload).slice(0, 80)}`);
  const existing = await findOneBySlug(ctx, plural, slug);
  const body = {
    data: { ...payload, publishedAt: new Date().toISOString() },
  };
  if (existing?.documentId) {
    if (DRY) {
      console.log(`  [dry] PUT /${plural}/${existing.documentId} (${slug})`);
      return;
    }
    await api(ctx, `/${plural}/${existing.documentId}`, {
      method: 'PUT',
      body,
    });
    console.log(`  ↻ updated ${plural}/${slug}`);
  } else {
    if (DRY) {
      console.log(`  [dry] POST /${plural} (${slug})`);
      return;
    }
    await api(ctx, `/${plural}`, { method: 'POST', body });
    console.log(`  + created ${plural}/${slug}`);
  }
}

/** Helper — upsert a single-type page (no slug; just one entry). */
async function upsertSingleton(slug, payload) {
  const body = {
    data: { ...payload, publishedAt: new Date().toISOString() },
  };
  if (DRY) {
    console.log(`  [dry] PUT /${slug}`);
    return;
  }
  await api(ctx, `/${slug}`, { method: 'PUT', body });
  console.log(`  ↻ upserted singleton ${slug}`);
}

// =====================================================================
// Fitness facilities — 12 entries (incl. nested aquatics sub-programs)
// =====================================================================

const FITNESS_FACILITIES = [
  {
    name: 'sên Spa', slug: 'sen-spa',
    shortDescription: 'A holistic wellness sanctuary offering massages, facials, and body treatments.',
    locationLevel: 'Level 3', phone: '6739 4423', email: 'spa@amclub.org.sg',
  },
  {
    name: 'Aquatics', slug: 'aquatics',
    shortDescription: 'Four pools and a full aquatics program from learn-to-swim through Masters squads.',
    locationLevel: 'Pool Deck', phone: '6739 4413', email: 'aquatics@amclub.org.sg',
  },
  {
    name: 'Gym', slug: 'gym',
    shortDescription: 'A purpose-built fitness floor with strength, cardio, and functional zones.',
    locationLevel: 'Level 2', phone: '6739 4426', email: 'gym@amclub.org.sg',
  },
  {
    name: 'Tennis', slug: 'tennis',
    shortDescription: 'Four artificial-grass courts with coaching and recreational play.',
    locationLevel: 'Basement 2', phone: '6739 4312', email: 'sportscounter@amclub.org.sg',
  },
  {
    name: 'Squash', slug: 'squash',
    shortDescription: 'Three glass-backed squash courts hosting recreational play and league matches.',
    locationLevel: 'Basement 2', phone: '6739 4312', email: 'sportscounter@amclub.org.sg',
  },
  {
    name: 'Pilates', slug: 'pilates',
    shortDescription: 'Reformer, mat and barre Pilates in a dedicated studio with certified instructors.',
    locationLevel: 'Level 2', phone: '6739 4426', email: 'fitness@amclub.org.sg',
  },
];

// Aquatics sub-pages — children of the `aquatics` parent. Seeded in a
// second pass so the parent relation can resolve.
const FITNESS_AQUATICS_CHILDREN = [
  { name: 'SwimAmerica', slug: 'aquatics-swimamerica', shortDescription: 'Award-winning learn-to-swim program for ages 3+.' },
  { name: 'Swim Team', slug: 'aquatics-swim-team', shortDescription: 'Competitive swim squads training year-round.' },
  { name: 'Masters Swimming', slug: 'aquatics-masters-swimming', shortDescription: 'Adult swim squads structured for fitness and competition.' },
  { name: 'Group Fitness Classes', slug: 'aquatics-group-fitness-classes', shortDescription: 'Aqua-based group fitness in the lap pool.' },
  { name: 'Infants & Toddlers', slug: 'aquatics-infants-toddlers', shortDescription: 'Parent-and-child water familiarization for ages 6 months+.' },
];

async function seedFitness() {
  console.log('\n─── Fitness Facilities ───');
  for (const e of FITNESS_FACILITIES) {
    await upsertBySlug('fitness-facilities', {
      ...e,
      parentLabel: 'Fitness & Wellness',
      parentHref: '/fitness',
    });
  }
  // Now seed children with parent relation.
  const parent = await findOneBySlug(ctx, 'fitness-facilities', 'aquatics');
  if (!parent?.documentId && !DRY) {
    console.warn('  ! aquatics parent not found — skipping nested children');
    return;
  }
  for (const e of FITNESS_AQUATICS_CHILDREN) {
    await upsertBySlug('fitness-facilities', {
      ...e,
      parentLabel: 'Aquatics',
      parentHref: '/fitness/aquatics',
      parent: parent?.documentId ?? undefined,
    });
  }
}

// =====================================================================
// Kids experiences — 8 entries
// =====================================================================

const KIDS_EXPERIENCES = [
  { name: 'Bowling Alley', slug: 'bowling-alley', shortDescription: 'Six-lane bowling alley for kids parties and league play.', locationLevel: 'Level 4', phone: '6739 4421', email: 'bowling@amclub.org.sg' },
  { name: 'The Quad Poolside', slug: 'the-quad-poolside', shortDescription: 'Poolside hangout for families with a kids pool and shaded seating.' },
  { name: 'The Quad', slug: 'the-quad', shortDescription: 'The Club\'s flagship kids hub: play space, library, and party packages.' },
  { name: 'The Quad Studios', slug: 'the-quad-studios', shortDescription: 'Dedicated studios for recreational classes and birthday parties.' },
  { name: 'The Hangout', slug: 'the-hangout', shortDescription: 'Teen hangout with games, snacks, and after-school activities.' },
  { name: 'Recreational Classes', slug: 'recreational-classes', shortDescription: 'Weekly classes spanning art, music, dance, and skills development.' },
  { name: 'Camps', slug: 'camps', shortDescription: 'School-holiday camps with themed weekly programs for ages 4–12.' },
  { name: 'Kids Parties', slug: 'kids-parties', shortDescription: 'Turnkey kids party packages with venue, F&B, and entertainment.' },
];

async function seedKids() {
  console.log('\n─── Kids Experiences ───');
  for (const e of KIDS_EXPERIENCES) {
    await upsertBySlug('kids-experiences', {
      ...e,
      parentLabel: 'Kids',
      parentHref: '/kids',
    });
  }
}

// =====================================================================
// Event spaces — 8 entries
// =====================================================================

const EVENT_SPACES = [
  { name: 'Wedding Celebrations', slug: 'wedding-celebration', shortDescription: 'Pillar-less ballroom and intimate venues for ceremonies, banquets, and receptions.' },
  { name: 'Corporate Functions', slug: 'corporate-functions', shortDescription: 'Conferences, meetings, and corporate celebrations across flexible layouts.' },
  { name: 'Parties', shortDescription: 'Birthday, anniversary, and milestone celebrations.', slug: 'parties' },
  { name: 'The Galbraith Ballroom', slug: 'the-gallbrainth-ballroom', shortDescription: 'A grand pillar-less ballroom for up to 220 guests.', capacity: 'Up to 220 pax' },
  { name: 'Thinkspace', slug: 'thinkspace', shortDescription: 'Modern meeting space for boardroom-style sessions.', capacity: 'Up to 40 pax' },
  { name: 'Bowling Alley (Events)', slug: 'bowling-alley', shortDescription: 'Six-lane bowling alley reservable for private functions.' },
  { name: 'Library', slug: 'library', shortDescription: 'Intimate library room for receptions and small gatherings.' },
  { name: 'Meeting Rooms', slug: 'meeting-rooms', shortDescription: 'Configurable meeting rooms for hourly hire.' },
];

async function seedEventSpaces() {
  console.log('\n─── Event Spaces ───');
  for (const e of EVENT_SPACES) {
    await upsertBySlug('event-spaces', {
      ...e,
      parentLabel: 'Private Events & Catering',
      parentHref: '/event-spaces',
    });
  }
}

// =====================================================================
// Membership singletons — 4 pages
// =====================================================================

async function seedMembershipSingletons() {
  console.log('\n─── Membership Singletons ───');

  await upsertSingleton('reciprocal-clubs-page', {
    title: 'Reciprocal Clubs',
    parentLabel: 'Membership',
    parentHref: '/membership',
    heading: 'A Global Network of Reciprocal Clubs',
    intro:
      'As a Member of The American Club, you and your family enjoy reciprocal access to over 200 private clubs around the world. Use your Letter of Introduction to access dining, fitness, and social spaces at our partner clubs.',
    ctas: [
      { label: 'Download Reciprocal Club List', href: '/documents/membership/reciprocal-club-list.pdf', isExternal: false },
      { label: 'Request Letter of Introduction', href: 'https://amclub.jotform.com/form/tac-reciprocal-club-LOI', isExternal: true },
    ],
    body: [
      {
        __component: 'blocks.text-block',
        heading: 'How It Works',
        body:
          'Before visiting a reciprocal club, contact our Member Services team to request a Letter of Introduction. The Letter identifies you as a Member in good standing of The American Club and grants access according to the host club\'s reciprocal policy.',
      },
      {
        __component: 'blocks.cta-banner',
        heading: 'Planning a trip?',
        body: 'Browse the full list of reciprocal clubs or contact our team for help choosing the right one for your destination.',
        variant: 'dark',
        ctas: [
          { label: 'Contact Member Services', href: 'mailto:membership@amclub.org.sg', isExternal: true },
        ],
      },
    ],
  });

  await upsertSingleton('start-application-page', {
    title: 'Start an Application',
    parentLabel: 'Membership',
    parentHref: '/membership',
    heading: 'Start Your Membership Journey',
    intro:
      'Our Membership Team will guide you through the application, tour, and onboarding. Begin by completing the interest form below — we will be in touch within 2 business days.',
    ctas: [
      { label: 'Start an Application', href: 'https://amclub.jotform.com/260813837273966', isExternal: true },
      { label: 'Book a Club Tour', href: 'https://amclub.jotform.com/260813837273966?type=tour', isExternal: true },
    ],
  });

  await upsertSingleton('niche-group-membership-page', {
    title: 'Niche Group Membership',
    parentLabel: 'Membership',
    parentHref: '/membership',
    heading: 'The Niche Group Membership',
    intro:
      'A rewards-based recognition program for Members who actively enjoy the Club. Members move through tiers based on annual spending — each tier brings additional benefits.',
  });

  await upsertSingleton('advertise-with-us-page', {
    title: 'Advertise With Us',
    parentLabel: 'Membership',
    parentHref: '/membership',
    heading: 'Reach Our Engaged Member Community',
    intro:
      'The Club\'s Member-only publications and digital channels reach an affluent, professional community of expat families in Singapore. Download the rate card for advertising opportunities.',
  });
}

// =====================================================================

(async () => {
  console.log(`Seed target: ${ctx.BASE}`);
  console.log(`Dry run: ${DRY}`);
  await seedFitness();
  await seedKids();
  await seedEventSpaces();
  await seedMembershipSingletons();
  console.log('\n✓ Done.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
