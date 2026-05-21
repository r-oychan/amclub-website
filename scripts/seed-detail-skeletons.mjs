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

  await upsertSingleton('start-application-page', {
    title: 'Start an Application',
    label: 'APPLICATION',
    heading: 'Start an Application',
    parentLabel: 'Membership',
    parentHref: '/membership',
    description:
      "Your journey to becoming a Member at The American Club starts here.\n\nGet to know the requirements to start your application.\n\nAll the items outlined in the Application Checklist must be submitted. Incomplete applications will not be accepted.",
    locationLevel: 'Level 1 Lobby (Opposite Tradewinds)',
    phone: '6737 3411',
    email: 'membership@amclub.org.sg',
    operatingHoursSections: [
      {
        title: 'Membership Office Operating Hours',
        rows: [
          { dayRange: 'Monday to Friday', time: '9:00 AM – 7:00 PM' },
          { dayRange: 'Saturday', time: '10:00 AM – 6:00 PM' },
          { dayRange: 'Sunday', time: 'Closed' },
        ],
      },
    ],
    downloads: {
      heading: "Forms You'll Need",
      items: [
        { label: 'Application Checklist', href: '/documents/membership/forms/application-checklist.pdf' },
        { label: 'Application Form', href: '/documents/membership/forms/membership-application-form.pdf' },
        { label: 'Endorsement Form', href: '/documents/membership/forms/endorsement-form.pdf' },
        { label: 'Junior Membership Application Form', href: 'https://amclub.jotform.com/253623954879979', isExternal: true },
        { label: 'PDPA Acknowledgement Form', href: '/documents/membership/forms/pdpa-acknowledgement-form.pdf' },
        { label: 'GIRO Payment Form', href: '/documents/membership/forms/giro-payment-form.pdf' },
        { label: 'Car Registration Form', href: 'https://amclub.jotform.com/250688995352877', isExternal: true },
      ],
    },
    ctas: [
      { label: 'Application Checklist', href: '/documents/membership/forms/application-checklist.pdf', icon: 'arrow' },
    ],
  });

  await upsertSingleton('reciprocal-clubs-page', {
    title: 'Reciprocal Clubs',
    label: 'PROGRAMS',
    heading: 'Membership Without Borders',
    parentLabel: 'Membership',
    parentHref: '/membership',
    description:
      'As a Member of The American Club, enjoy privileged access to over 150 distinguished clubs worldwide, extending the comfort of membership wherever you travel.\n\nSimply present a Letter of Introduction to visit your destination club, with all payments conveniently made on-site via major credit cards or cash where accepted.',
    ctas: [
      { label: 'List of Reciprocal Clubs', href: '/documents/membership/reciprocal-club-list.pdf', icon: 'arrow' },
      { label: 'Letter of Introduction Application', href: 'https://amclub.jotform.com/form/tac-reciprocal-club-LOI', isExternal: true, icon: 'arrow' },
    ],
    // Secondary block — image + Tower Club partnership detail
    secondaryImageCaption: 'Atlantic Dining Room',
    secondaryImageSubCaption: 'Tower Club Singapore',
    secondaryHeading: 'Local Reciprocity',
    secondaryBody:
      "The American Club maintains a reciprocal partnership with Tower Club, extending exclusive privileges to our Members and their guests. Enjoy complimentary access to Singapore's only premier private business club located in the heart of the Central Business District.",
    secondaryCta: { label: 'Learn More About Tower Club', href: 'https://www.tower-club.com.sg/', isExternal: true, icon: 'arrow' },
    operatingHoursSections: [
      {
        title: 'Tower Club Operating Hours',
        rows: [
          { dayRange: 'Mondays to Fridays', time: '7:30 AM – 11:00 PM' },
          { dayRange: 'Saturdays', time: '9:00 AM – 11:00 PM' },
        ],
      },
      {
        title: 'Atlantic Dining Room (Level 62)',
        rows: [
          { dayRange: 'Mondays to Fridays', time: 'Breakfast: 7:30 AM – 10:30 AM\nLunch: 11:30 AM – 2:30 PM\nDinner: 6:30 PM – 11:00 PM' },
          { dayRange: 'Saturdays', time: 'Dinner: 6:30 PM – 11:00 PM' },
        ],
      },
      {
        title: 'Ba Xian Dining Room (Level 63)',
        rows: [
          { dayRange: 'Mondays to Saturdays', time: 'Lunch: 11:30 AM – 2:30 PM\nDinner: 6:30 PM – 11:00 PM' },
        ],
      },
      {
        title: 'Straits Bar (Level 64)',
        rows: [
          { dayRange: 'Mondays to Saturdays', time: 'All day dining from 11:30 AM – 11:00 PM' },
        ],
      },
    ],
    notesHeading: 'Important things to note',
    notes:
      "The dress code is Business Attire\nDining reservations must be made directly to Tower Club in advance. Please mention your child's age, if any, when making your dining reservation.\nThe American Club membership card must be presented upon arrival at Tower Club\nThe American Club Members are subject to 10% Surcharge and 10% Service Charge in addition to the prevailing GST\nNo restrictions on the number of guests but they must be accompanied by an American Club Member at all times\nChildren aged 12 years and above, accompanied by a Member, may only dine in the Private Dining Rooms during lunch\nIn the evenings, children aged 6 years and above, accompanied by a Member, are welcome to dine in the Atlantic, Ba Xian and any of the Private Dining Rooms\nParents are requested to ensure the good behavior of their children so as not to disturb other members\nCarpark charges would be \"as charged\" and based on the Republic Plaza Building Management's prevailing carpark rates\nStrictly no access to the Fitness Centre\nAll charges must be settled at Tower Club; no inter-club billing allowed",
  });

  await upsertSingleton('niche-group-membership-page', {
    title: 'Niche Group Membership',
    label: 'Loyalty',
    heading: 'Niche Group Membership',
    parentLabel: 'Membership',
    parentHref: '/membership',
    description:
      'The American Club Niche Group Membership rewards Members for their membership tenure or spending. VIP Gold, 10K, 15K & Elite are the four tiers.',
    phone: '6739-4331',
    email: 'membership@amclub.org.sg',
    body: [
      {
        __component: 'blocks.priced-card-grid',
        heading: 'The Niche Group Membership Tiers',
        subheading: 'From your first tier to the highest level, each level brings added benefits created to enrich your time at your Club.',
        variant: 'tier',
        columns: 2,
        items: [
          {
            name: 'Elite Membership',
            description: 'A minimum of $20,000 cumulative calendar year spending, excluding monthly dues.',
            bullets: [
              { text: 'Welcome dining voucher worth $250 and $150 sên Spa voucher.' },
              { text: 'Annual welcome gift.' },
              { text: 'Wedding Anniversary Privilege.' },
              { text: 'Exclusive privileges during birthday month' },
              { text: 'Annual Elite party invites.' },
              { text: 'Up to 25% dining discounts.' },
              { text: 'Up to 20% off treatments at sên Spa.' },
              { text: 'Membership card replacement fee waiver ($10 for the first card replacement, $50 for subsequent replacements).' },
              { text: 'Ad-hoc discounts for products, events etc.' },
              { text: 'Free parking for two cars (fee waiver will be applied at the next annual billing cycle in July).' },
            ],
          },
          {
            name: 'VIP Gold',
            description: 'Members are accorded this status based on a minimum tenure of 25 years of active membership.',
            bullets: [
              { text: 'A welcome dining voucher worth $200.' },
              { text: 'Exclusive privileges during birthday month' },
              { text: 'Annual VIP party invites.' },
              { text: 'Up to 20% dining discounts.' },
              { text: 'Up to 20% off treatments at sên Spa.' },
              { text: 'Ad-hoc discounts for products, events etc.' },
            ],
          },
          {
            name: '15K Membership',
            description: 'A minimum of $15,000 cumulative calendar year spending, excluding monthly dues.',
            bullets: [
              { text: 'A welcome dining voucher worth $200.' },
              { text: 'Exclusive privileges during birthday month' },
              { text: 'Up to 20% dining discounts.' },
              { text: 'Up to 15% off treatments at sên Spa.' },
              { text: 'Membership card replacement fee waiver ($10 for the first card replacement, $50 for subsequent replacements).' },
              { text: 'Ad-hoc discounts for products, events etc.' },
              { text: 'Free parking for one car (fee waiver will be applied at the next annual billing cycle in July).' },
            ],
          },
          {
            name: '10K Membership',
            description: 'A minimum of $10,000 cumulative calendar year spending, excluding monthly dues.',
            bullets: [
              { text: 'Exclusive privileges during birthday month' },
              { text: 'Up to 15% dining discounts.' },
              { text: 'Up to 15% off treatments at sên Spa.' },
              { text: 'Membership card replacement fee waiver ($10 for the first card replacement, $50 for subsequent replacements).' },
              { text: 'Ad-hoc discounts for products, events etc.' },
            ],
          },
        ],
      },
    ],
  });

  await upsertSingleton('advertise-with-us-page', {
    title: 'Advertise With Us',
    label: '',
    heading: 'Advertise with Us',
    parentLabel: 'The American Club',
    parentHref: '/home',
    description:
      'Reach a community of over 11,000 engaged Members at The American Club.\n\nWith a suite of targeted communication channels, we provide advertising opportunities that connect your message with our Member community in a thoughtful and purposeful way.',
    ctas: [
      { label: 'View Advertising Rate Card', href: '/documents/ad-rate-card.pdf', isExternal: true, icon: 'arrow' },
      { label: 'Enquire Now', href: 'mailto:marketing@amclub.org.sg', isExternal: true, icon: 'mail' },
    ],
    body: [
      {
        __component: 'blocks.text-block',
        heading: 'Sponsorship',
        body:
          'Access a Premium Network of Affluent, International Members\n\nOur sponsors and strategic partners gain prominent brand exposure and meaningful engagement opportunities within our Club community. Reach out to schedule a discussion on the best channels to showcase your brand.\n\nPhone: 6739-4388\nEmail: marketing@amclub.org.sg',
      },
    ],
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
