#!/usr/bin/env node
/**
 * Seed script: FAQ Page + FAQ Categories into Strapi.
 *
 * Reads `cms/.env.seed` for:
 *   STRAPI_BASE_URL  — e.g. https://amclub-app...azurecontainerapps.io
 *   STRAPI_API_TOKEN — Full-access admin API token
 *
 * Usage:
 *   node scripts/seed-faq-page.mjs            # seed
 *   node scripts/seed-faq-page.mjs --dry-run  # show plan, don't write
 *
 * Idempotent: re-running updates existing categories (matched by slug) and
 * the single faq-page entry.
 */

import { initEnv } from './seed-helpers.mjs';

const DRY = process.argv.includes('--dry-run');

const { BASE, auth } = initEnv();

async function api(path, opts = {}) {
  const url = `${BASE}/api${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...auth,
      ...(opts.headers || {}),
    },
    body: opts.body ? (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body)) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!res.ok) {
    throw new Error(`${opts.method || 'GET'} ${path} → ${res.status}: ${typeof json === 'string' ? json : JSON.stringify(json)}`);
  }
  return json;
}

async function findOneBySlug(plural, slug) {
  const r = await api(`/${plural}?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[limit]=1`);
  return r?.data?.[0] || null;
}

const slugify = (s) => s.toLowerCase()
  .replace(/&/g, 'and')
  .replace(/['']/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const FAQ_CATEGORIES = [
  { name: 'Membership', description: 'Joining, categories, transfers, and member benefits.', displayOrder: 1 },
  { name: 'Facilities', description: 'Gym, pools, courts, spa, and operating hours.', displayOrder: 2 },
  { name: 'Dining', description: 'Restaurants, reservations, and dining promotions.', displayOrder: 3 },
  { name: 'Events', description: 'Private events, room bookings, and club programmes.', displayOrder: 4 },
  { name: 'Kids', description: 'The Quad, kids parties, camps, and youth programmes.', displayOrder: 5 },
  { name: 'General', description: 'Everything else — guests, parking, contact info.', displayOrder: 6 },
];

// Each entry: [question, categorySlug, order, plainTextAnswer]
// Answer is wrapped into Strapi v5 `blocks` format (one paragraph per non-empty line).
const FAQ_ITEMS = [
  // ── Membership ───────────────────────────────────────────────
  [
    'What types of membership do you offer?',
    'membership', 1,
    'The American Club offers several membership categories including Ordinary, Term, Corporate, and Niche Group memberships, each designed for different lifestyles and family needs. Visit our Membership page for a detailed comparison of benefits, eligibility, and fees.',
  ],
  [
    'How do I apply for membership?',
    'membership', 2,
    'You can begin your application online via the Membership section of our website, or contact our Membership Services team to arrange a personal Club tour. Applications are reviewed by the Membership Committee and you will be notified once a decision has been made.',
  ],
  [
    'What are the joining fees and monthly subscriptions?',
    'membership', 3,
    'Joining fees and monthly subscriptions vary by membership category. The latest fee schedule is published on our Joining Fees page. Please contact Membership Services for the most up-to-date pricing and any current promotions.',
  ],
  [
    'Is membership transferable?',
    'membership', 4,
    'Certain categories of membership allow for transfer, subject to Club rules and approval by the Membership Committee. Transfers typically involve a transfer fee. Please contact Membership Services for the current transfer policy.',
  ],
  [
    'Can I upgrade or change my membership type?',
    'membership', 5,
    'Yes — members may request a change of membership category at any time, subject to eligibility and Committee approval. Differences in joining fees may apply when upgrading.',
  ],
  [
    'Do you offer reciprocal access to other clubs?',
    'membership', 6,
    'Yes, members enjoy reciprocal privileges at a network of partner clubs around the world. See our Reciprocal Clubs page for the current list and access guidelines.',
  ],

  // ── Facilities ───────────────────────────────────────────────
  [
    'What facilities and services are included?',
    'facilities', 1,
    'Membership grants access to our full slate of facilities including the fitness centre, swimming pools, tennis and squash courts, spa and wellness centre, kids zones, business centre, and multiple dining venues.',
  ],
  [
    'What are the Club operating hours?',
    'facilities', 2,
    'The Club is open daily, with individual facility hours varying by venue. Up-to-date opening times for the gym, pools, dining outlets, and other facilities are listed on each facility page.',
  ],
  [
    'Can I bring guests to the Club?',
    'facilities', 3,
    'Members may bring guests in line with Club guest policies. Guest fees and per-day limits may apply depending on the facility. Please check at the front desk or with Member Services before your visit.',
  ],
  [
    'Is there parking available?',
    'facilities', 4,
    'Complimentary member parking is available on-site, subject to capacity. Valet service is also available during peak periods.',
  ],

  // ── Dining ───────────────────────────────────────────────────
  [
    'Do I need to make a reservation for dining?',
    'dining', 1,
    'Reservations are recommended for all our restaurants, especially during peak hours and weekends. You can book via our website, the AMClub app, or by contacting the venue directly.',
  ],
  [
    'Are there dining promotions for members?',
    'dining', 2,
    'Yes — we run rotating monthly promotions across our F&B venues, including themed nights, family deals, and seasonal menus. Check our Dining Promotions page for current offers.',
  ],
  [
    'Can members host private dining or events?',
    'dining', 3,
    'Absolutely. Several of our venues offer private dining rooms and event spaces for member-hosted gatherings. Contact our Events team to discuss menus, capacity, and availability.',
  ],

  // ── Events ───────────────────────────────────────────────────
  [
    'How do I book a private event space?',
    'events', 1,
    'Private event spaces — including ballrooms, function rooms, and outdoor venues — can be booked through our Events team. Submit an enquiry via the Event Spaces page and we will follow up with availability and pricing.',
  ],
  [
    'What kinds of Club events are open to members?',
    'events', 2,
    'We host a year-round calendar of social, cultural, family, and sporting events including signature American holidays, kids programmes, wine dinners, and fitness challenges. Visit What\'s On for the current calendar.',
  ],
  [
    'Can non-members attend Club events?',
    'events', 3,
    'Most events are member-only, but selected events allow guests when accompanied by a member. Some signature events are open to the wider community — see the individual event page for details.',
  ],

  // ── Facilities → Aquatics programmes ─────────────────────────
  [
    "How do I determine my child's swim level?",
    'facilities', 10,
    'Book a free assessment for children over three years old by emailing aquatics@amclub.org.sg or submitting the assessment form at the Aquatics Counter. Babies and toddlers do not require assessment as levels are age-based.',
  ],
  [
    'Can I enrol after the term has started?',
    'facilities', 11,
    'Yes — enrolment is possible at any point subject to class availability. Submit an enrolment form to the Aquatics Counter and the team will respond within five working days.',
  ],
  [
    'When will my child move to the next swim level?',
    'facilities', 12,
    'There is no fixed duration. Once an instructor confirms the swimmer confidently completes all required skills, the Aquatics Coordinator runs a level assessment. The Spring and Fall programmes also include dedicated assessment weeks.',
  ],
  [
    "Will swimming lessons be held if it's raining?",
    'facilities', 13,
    'Lessons continue during light rain but are cancelled for thunder, lightning, or extremely heavy rain. Call the Aquatics Counter at 6739-4470 (or the office at 6739-4450) thirty minutes before class to confirm.',
  ],
  [
    'I missed my swim class. Can I attend a make-up class?',
    'facilities', 14,
    'With nearly 900 weekly swimmers and limited resources, the Club is unable to offer make-up classes.',
  ],
  [
    'What if my child is sick and misses swim lessons?',
    'facilities', 15,
    'Present a Medical Certificate covering the missed lesson dates at the Aquatics Counter within one week, or before the end of the month. Receipts are not accepted in place of an MC.',
  ],

  // ── Kids — The Quad / The Quad Poolside ─────────────────────
  [
    'Why are my guests charged at The Quad?',
    'kids', 1,
    'Member usage is prioritised over guests to ensure members can access The Quad whenever desired. Guest fees help minimise overcrowding and discourage misuse. Fees are $2.50 per entry during off-peak hours and $5 during peak hours (Friday evenings, Saturday, Sunday, and public holidays).',
  ],
  [
    'Do I really have to sign my child into The Quad Poolside and The Quad?',
    'kids', 2,
    'Parents of children under 12 must be present to sign them in and remain on premises. Authorised helpers or amahs may bring children only for Club-sponsored classes and supervised programmes, not for free play.',
  ],
  [
    'Why can\'t my 5-year-old and 7-year-old be at The Quad unsupervised together?',
    'kids', 3,
    'The Quad is not a child-minding area. Children 6+ can play independently and respond to staff guidance, while children 5 and under need more attention and should use The Quad Poolside instead.',
  ],
  [
    "Why can't my 4.5-year-old play at the Wallholla?",
    'kids', 4,
    'The Wallholla is a six-level vertical climbing structure requiring independent movement. The Club follows the manufacturer\'s recommendation allowing only children 5 years old and above.',
  ],
  [
    'Why do I have to pay for child-minding at The Quad Poolside?',
    'kids', 5,
    'Child-minding charges apply only during peak periods including weekends and public holidays due to limited capacity at The Quad Poolside.',
  ],
  [
    'Why are arcade games at The Quad chargeable?',
    'kids', 6,
    "Token purchases allow parents to track children's gaming time and spending. Charging also enables the Club to offer the newest equipment, including brand-new arcade games imported directly from the United States.",
  ],

  // ── Kids — Eagle Explorers Camps ─────────────────────────────
  [
    'Where do the seasonal camps take place?',
    'kids', 20,
    'Camps are offered both on-site at The American Club Singapore (ages 4–7, engaging club-wide facilities) and off-site at selected locations around Singapore (ages 8 and above). Camp formats and locations may evolve as we introduce new programmes.',
  ],
  [
    'Is transportation provided for off-site camps?',
    'kids', 21,
    'Yes. Two-way transportation is provided from The American Club Singapore to and from the designated daily location for campers aged 8 and above.',
  ],
  [
    'What ages are eligible to join the camps?',
    'kids', 22,
    'Our camps are designed for children aged 4 to 12 years old. Children within three months of the minimum age requirement may be permitted to join, subject to assessment and availability.',
  ],
  [
    'Are half-day camp options available?',
    'kids', 23,
    'Half-day options are available only for the on-site camp (ages 4–7). Availability may vary by season.',
  ],
  [
    'What activities can my child expect during camp?',
    'kids', 24,
    'Ages 4–7 enjoy indoor on-site activities including culinary, sports, creative play, movement, STEM, and themed programming. Ages 8+ enjoy off-site experiences blending sports, outdoor exploration, sightseeing, and educational activities across Singapore.',
  ],
  [
    'What is the camp counsellor-to-camper ratio?',
    'kids', 25,
    'General activities follow a 1:5 ratio. Water-play and pool days follow a 1:3 ratio for added supervision.',
  ],
  [
    'What is the camp cancellation policy?',
    'kids', 26,
    'Camp fees are charged per registered session or week. No refunds or make-up sessions are provided for missed days. Full first-day fees apply if a camper is unable to attend. Fees may only be waived upon submission of a valid medical certificate by the end of the camp week.',
  ],

  // ── General ──────────────────────────────────────────────────
  [
    'Where is The American Club located?',
    'general', 1,
    'The American Club is located in the heart of Orchard at 10 Claymore Hill, Singapore 229573. We are easily accessible by car, taxi, and a short walk from Orchard MRT.',
  ],
  [
    'How do I contact Member Services?',
    'general', 2,
    'You can reach Member Services via the Contact Us page on our website, by phone during operating hours, or in person at the front desk. We typically respond to email enquiries within one business day.',
  ],
  [
    'Is there a dress code at the Club?',
    'general', 3,
    'Smart casual attire is expected throughout the Club. Some venues, including fine-dining restaurants and certain event spaces, observe a stricter dress code. Sports facilities require appropriate athletic wear.',
  ],
];

async function ensureFaqCategory({ name, description, displayOrder }) {
  const slug = slugify(name);
  if (DRY) { console.log(`  [dry] upsert faq-category: ${name}`); return { documentId: `dry-${slug}`, slug }; }
  const existing = await findOneBySlug('faq-categories', slug);
  const payload = { name, slug, description, displayOrder };
  if (existing) {
    const r = await api(`/faq-categories/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    return r.data;
  } else {
    const r = await api('/faq-categories', { method: 'POST', body: { data: payload } });
    return r.data;
  }
}

function textToBlocks(text) {
  const paragraphs = String(text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paragraphs.map((p) => ({
    type: 'paragraph',
    children: [{ type: 'text', text: p }],
  }));
}

// Legacy enum on faq-item only covers the original 5 values until the CMS
// schema deploy lands the new ones. Map any category not yet in the enum to
// "general" so the POST/PUT succeeds; grouping on the page comes from the
// faqCategory relation (now publicly readable), so users still see the right
// section heading.
const LEGACY_ENUM_VALUES = new Set(['membership', 'facilities', 'dining', 'events', 'general']);

async function ensureFaqItem({ question, categorySlug, order, answerText, faqCategoryDocumentId }) {
  const slug = slugify(question);
  const legacyEnum = LEGACY_ENUM_VALUES.has(categorySlug) ? categorySlug : 'general';
  const payload = {
    question,
    slug,
    order,
    category: legacyEnum,
    faqCategory: faqCategoryDocumentId,
    answer: textToBlocks(answerText),
  };
  if (DRY) { console.log(`  [dry] upsert faq-item: ${question}`); return { documentId: `dry-${slug}`, slug }; }
  const existing = await findOneBySlug('faq-items', slug);
  if (existing) {
    const r = await api(`/faq-items/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    return r.data;
  } else {
    const r = await api('/faq-items', { method: 'POST', body: { data: payload } });
    return r.data;
  }
}

async function upsertFaqPage() {
  const data = {
    title: 'FAQ',
    introHeading: 'Frequently Asked Questions',
    introBody:
      'Answers to the questions our members and prospective members ask most. Can’t find what you’re looking for? Contact our Member Services team.',
    publishedAt: new Date().toISOString(),
  };
  if (DRY) { console.log(`  [dry] upsert faq-page (single type)`); return; }
  await api('/faq-page', { method: 'PUT', body: { data } });
}

async function main() {
  console.log(`Seeding FAQ Page → ${BASE}${DRY ? ' (dry-run)' : ''}\n`);

  console.log('[1/3] FAQ categories…');
  const catBySlug = {};
  for (const cat of FAQ_CATEGORIES) {
    const c = await ensureFaqCategory(cat);
    catBySlug[c?.slug ?? slugify(cat.name)] = c;
    console.log(`  ✓ ${cat.name} (${c?.slug ?? slugify(cat.name)})`);
  }

  console.log('\n[2/3] FAQ items…');
  for (const [question, categorySlug, order, answerText] of FAQ_ITEMS) {
    const faqCat = catBySlug[categorySlug];
    await ensureFaqItem({
      question,
      categorySlug,
      order,
      answerText,
      faqCategoryDocumentId: faqCat?.documentId ?? null,
    });
    console.log(`  ✓ [${categorySlug}] ${question}`);
  }

  console.log('\n[3/3] FAQ Page single type…');
  await upsertFaqPage();
  console.log('  ✓ faq-page upserted');

  console.log('\nDone.');
}

main().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});
