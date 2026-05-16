#!/usr/bin/env node
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, findOneBySlug, uploadAll, slugify, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY = isDryRun();
const ctx = initEnv();

// 6 restaurant photos + 6 logos + 1 hero + 2 delivery + 1 essentials = 16
const HERO_DIR = join(ROOT, 'media', 'pages', 'dining');
const REST_DIR = join(ROOT, 'media', 'restaurants');
const LOGO_DIR = join(ROOT, 'media', 'logos');
const SERV_DIR = join(ROOT, 'media', 'services');
// Menu PDFs are served as static assets from the frontend's `public/menus/`
// directory (URL: `/menus/<slug>-menu.pdf`). This lets browsers open them inline
// in a new tab — Azure Blob Storage (where Strapi uploads go) doesn't set
// `Content-Disposition: inline`, so PDFs served from there download instead.

const HERO_IMAGES   = ['hero-bg.jpg'];
const REST_IMAGES   = ['central.jpeg', 'grillhouse.jpeg', 'the-2nd-floor.jpeg', 'the-gourmet-pantry.jpeg', 'tradewinds.jpeg', 'uncorked.jpg', 'union-bar.jpeg'];
const LOGO_IMAGES   = ['central.png',  'grillhouse.png',  'the-2nd-floor.png',  'the-gourmet-pantry.png',  'tradewinds.png',  'the-union-bar.png'];
const SERV_IMAGES   = ['tac2go.jpeg', 'bottles2go.jpg', 'essentials.jpeg'];

// CTAs are stored without "Read More" — the UI auto-prepends a "Read More" link
// pointing back to the restaurant detail page (/dining/<slug>) as the first link.
// Each restaurant supports up to 3 user-defined CTAs (capped by the schema).
const RESTAURANTS = [
  {
    name: 'Central', slug: 'central', cuisineType: 'Cafe', cuisineIconSlug: 'cafe',
    description: 'Your favorite coffee, sandwich and chatter spot.',
    imageFile: 'central.jpeg', logoFile: 'central.png', dressCode: null,
    menuLinks: [
      { label: 'View Menu', href: '/menus/central-menu.pdf' },
    ],
    ctas: [{ label: 'Promotions', href: '/dining/dining-promotion#promo-central', icon: 'arrow' }],
    operatingHoursSections: [
      { title: 'Opening Hours', rows: [
        { dayRange: 'Daily', time: '7:00 AM - 7:00 PM' },
      ] },
    ],
    locationContact: { locationLevel: 'Level 1', phone: '6739 4359', email: 'central@amclub.org.sg' },
    order: 1,
  },
  {
    name: 'Grillhouse & Tiki Bar', slug: 'grillhouse', cuisineType: 'American BBQ & Grill', cuisineIconSlug: 'american',
    description: 'Welcome to a casual poolside dining restaurant – perfect for families with children and swimmers looking to have a delicious meal.\n\nDevour authentic American cuisine featuring Texas-style BBQ, mouth-watering burgers, delicious pizzas and salads with ice-cold American beer and special Grillhouse shakes.',
    imageFile: 'grillhouse.jpeg', logoFile: 'grillhouse.png', dressCode: null,
    menuLinks: [
      { label: 'View Menu', href: '/menus/grillhouse-menu.pdf' },
    ],
    ctas: [{ label: 'Promotions', href: '/dining/dining-promotion#promo-grillhouse', icon: 'arrow' }],
    operatingHoursSections: [
      { title: 'Grillhouse Operating Hours', rows: [
        { dayRange: 'Sunday to Thursday', time: '11:00 AM - 9:00 PM', lastOrder: 'Last order at 8:30 PM' },
        { dayRange: 'Friday',             time: '11:00 AM - 9:30 PM', lastOrder: 'Last order at 9:00 PM' },
        { dayRange: 'Saturday',           time: '8:30 AM - 9:30 PM',  lastOrder: 'Last order at 9:00 PM' },
      ] },
      { title: 'Tiki Bar Operating Hours', rows: [
        { dayRange: 'Sunday to Thursday', time: '11:00 AM - 9:00 PM', lastOrder: 'Last order at 8:30 PM' },
        { dayRange: 'Friday',             time: '11:00 AM - 9:30 PM', lastOrder: 'Last order at 9:00 PM' },
        { dayRange: 'Saturday',           time: '8:30 AM - 9:30 PM',  lastOrder: 'Last order at 9:00 PM' },
      ] },
    ],
    locationContact: { locationLevel: 'Level 1', phone: '6739 4357', email: 'grillhouse@amclub.org.sg' },
    order: 2,
  },
  {
    name: 'The 2nd Floor', slug: 'the-2nd-floor', cuisineType: 'Casual Premium Fine Dining', cuisineIconSlug: 'casual-fine-dining',
    description: 'Experience the best of both worlds, where East and West create a fine dining experience.',
    imageFile: 'the-2nd-floor.jpeg', logoFile: 'the-2nd-floor.png', dressCode: 'Smart Casual',
    menuLinks: [
      { label: 'View Menu', href: '/menus/the-2nd-floor-menu.pdf' },
    ],
    ctas: [{ label: 'Promotions', href: '/dining/dining-promotion#promo-the-2nd-floor', icon: 'arrow' }],
    operatingHoursSections: [
      { title: 'Operating Hours', rows: [
        {
          dayRange: 'Tuesday to Sunday',
          time: 'Lunch: 11:30 AM – 2:30 PM\nDinner: 5:30 PM – 10:00 PM',
          note: 'The 2nd Floor is closed on Mondays',
        },
      ] },
    ],
    locationContact: { locationLevel: 'Level 2', phone: '6739 4360', email: '2ndfloor@amclub.org.sg' },
    order: 3,
  },
  {
    name: 'The Gourmet Pantry', slug: 'the-gourmet-pantry', cuisineType: 'Wine & Gourmet Store', cuisineIconSlug: 'gourmet',
    description: 'A curated destination for modern tastemakers – offering exceptional wines, artisanal bites, and beautifully crafted tableware.',
    imageFile: 'the-gourmet-pantry.jpeg', logoFile: 'the-gourmet-pantry.png', dressCode: null,
    menuLinks: [
      { label: 'View Menu', href: '/menus/the-gourmet-pantry-menu.pdf' },
    ],
    ctas: [],
    operatingHoursSections: [
      { title: 'Opening Hours', rows: [
        { dayRange: 'Monday to Thursday', time: '11:00 AM - 8:00 PM' },
        { dayRange: 'Friday to Sunday',   time: '10:00 AM - 8:00 PM' },
      ] },
    ],
    locationContact: { locationLevel: 'Level 1', phone: '6739 4361', email: 'pantry@amclub.org.sg' },
    order: 4,
  },
  {
    name: 'Tradewinds', slug: 'tradewinds', cuisineType: 'International', cuisineIconSlug: 'international',
    description: 'All-day casual dining featuring an international menu with flavors from America to Singapore.',
    imageFile: 'tradewinds.jpeg', logoFile: 'tradewinds.png', dressCode: null,
    menuLinks: [
      { label: 'View Menu', href: '/menus/tradewinds-menu.pdf' },
    ],
    ctas: [{ label: 'Promotions', href: '/dining/dining-promotion#promo-tradewinds', icon: 'arrow' }],
    operatingHoursSections: [
      { title: 'Opening Hours', rows: [
        { dayRange: 'Sunday to Thursday', time: '8:00 AM - 9:00 PM',  lastOrder: 'Last order at 8:30 PM' },
        { dayRange: 'Friday & Saturday',  time: '8:00 AM - 10:00 PM', lastOrder: 'Last order at 9:30 PM' },
      ] },
    ],
    locationContact: { locationLevel: 'Level 3', phone: '6739 4362', email: 'tradewinds@amclub.org.sg' },
    order: 5,
  },
  {
    name: 'Union Bar', slug: 'union-bar', cuisineType: 'American Bar Food', cuisineIconSlug: 'bar',
    description: 'Kick back after work at this classic American sports bar.',
    imageFile: 'union-bar.jpeg', logoFile: 'the-union-bar.png', dressCode: null,
    menuLinks: [
      { label: 'View Menu', href: '/menus/union-bar-menu.pdf' },
    ],
    ctas: [{ label: 'Promotions', href: '/dining/dining-promotion#promo-union-bar', icon: 'arrow' }],
    operatingHoursSections: [
      { title: 'Opening Hours', rows: [
        { dayRange: 'Sunday to Thursday',              time: '12:00 PM - 11:00 PM' },
        { dayRange: 'Friday and Saturday & Eve of PH', time: '12:00 PM - 12:00 AM' },
      ] },
    ],
    locationContact: { locationLevel: 'Basement 2', phone: '6739 4340', email: 'unionbar@amclub.org.sg' },
    order: 6,
  },
  {
    // UNCORKED is a wine-club program, not a venue. Excluded from the
    // /dining grid by slug in DiningPage.tsx but still reachable at
    // /dining/uncorked. Membership bullets live in subpages.ts because
    // the `facility/restaurant` schema doesn't model `extraSections`.
    name: 'UNCORKED', slug: 'uncorked', cuisineType: 'Wine Club', cuisineIconSlug: 'gourmet',
    description: 'Introducing UNCORKED by The American Club, a collective of wine aficionados in our community. Connect with fellow vinophiles and elevate your experience with the Club\'s extensive wine labels, programs and events. UNCORKED Members are entitled to exclusive deals, invites to special events, priority booking and other special privileges.',
    imageFile: 'uncorked.jpg', logoFile: null, dressCode: null,
    menuLinks: [],
    ctas: [
      { label: 'Join Now', href: 'https://amclub.jotform.com/252308693060051', isExternal: true, icon: 'arrow' },
    ],
    operatingHoursSections: [],
    locationContact: null,
    order: 99,
  },
];

async function ensureRestaurant(r, imageId, logoId) {
  // Menu CTAs point at static PDFs in `frontend/public/menus/`; combined with
  // user CTAs and capped at 3 total by the schema.
  if (DRY) { console.log(`  [dry] upsert restaurant: ${r.name} (${(r.menuLinks ?? []).length} menu(s))`); return { documentId: `dry-${r.slug}`, slug: r.slug }; }
  const existing = await findOneBySlug(ctx, 'restaurants', r.slug);
  const menuCtas = (r.menuLinks ?? []).map((m) => ({
    label: m.label, href: m.href, isExternal: true, variant: 'primary', icon: 'menu',
  }));
  const extraCtas = (r.ctas ?? []).map((c) => ({
    label: c.label, href: c.href ?? '#', variant: c.variant ?? 'primary', icon: c.icon ?? 'arrow',
    ...(c.isExternal != null ? { isExternal: c.isExternal } : {}),
  }));
  const ctas = [...menuCtas, ...extraCtas].slice(0, 3);
  const payload = {
    name: r.name,
    slug: r.slug,
    cuisineType: r.cuisineType,
    cuisineIconSlug: r.cuisineIconSlug,
    description: r.description,
    image: imageId,
    logo: logoId,
    dressCode: r.dressCode,
    order: r.order,
    ctas,
    operatingHoursSections: r.operatingHoursSections ?? [],
    locationContact: r.locationContact ?? null,
    publishedAt: new Date().toISOString(),
  };
  if (existing) {
    const resp = await api(ctx, `/restaurants/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    return resp.data;
  }
  const resp = await api(ctx, '/restaurants', { method: 'POST', body: { data: payload } });
  return resp.data;
}

async function upsertDiningPage({ heroMedia, servMedia }) {
  const data = {
    title: 'Dining & Retail',
    hero: {
      heading: 'Dining & Retail',
      subheading: 'Drink for leisure. Eat for pleasure.',
      variant: 'compact',
      backgroundImage: heroMedia['hero-bg.jpg'].id,
      titlePosition: 'bottom-left',
      subtitlePosition: 'bottom-right',
    },
    clubFavorites: {
      heading: 'Club Favorites, Straight to Your Door',
      subheading: 'Savor your favorite Club dishes and curated wines from the comfort of home, with delivery and takeaway services at your fingertips.',
      cards: [
        { heading: 'TAC2Go!',     description: 'Savor your Club favorites in the comforts of your own home.',                     image: servMedia['tac2go.jpeg'].id,    cta: { label: 'Order Now', href: 'https://amclub.jotform.com/252650968518973', isExternal: true, variant: 'text', icon: 'arrow' } },
        { heading: 'Bottles2Go!', description: "Bringing the Club's cellar to your home with a curated range of premium wines.", image: servMedia['bottles2go.jpg'].id, cta: { label: 'Order Now', href: 'https://amclub.jotform.com/252638314015956', isExternal: true, variant: 'text', icon: 'arrow' } },
      ],
    },
    essentials: {
      heading: 'Essentials',
      description: 'Your one-stop shop for everyday essentials, seasonal treats, and laundry services—all in one convenient spot.',
      image: servMedia['essentials.jpeg'].id,
      imageAlt: 'Essentials',
      textPosition: 'right',
      textVerticalAlign: 'center',
      textBgColor: '#F5F4F2',
      textTheme: 'dark',
      ctas: [
        { label: 'Essentials2Go!',                  href: 'https://amclub.jotform.com/253312807189965', isExternal: true, variant: 'primary', icon: 'arrow' },
        { label: 'Retail Store & Laundry Services', href: '/dining/essentials',                                            variant: 'primary', icon: 'arrow' },
      ],
    },
    finalCta: {
      heading: 'Savor the Experience',
      body: 'Become a Member to explore our restaurants, where a variety of cuisines and thoughtfully crafted dining experiences await to delight every palate.',
      variant: 'light',
      ctas: [
        { label: 'Explore Membership', href: '/membership', variant: 'primary', icon: 'arrow' },
        { label: 'Book a Club Tour',   href: 'https://amclub.jotform.com/260813837273966?parentURL=https%3A%2F%2Famclub.org.sg%2Fmembership-enquiry-form%2F&jsForm=true', isExternal: true, variant: 'outline', icon: 'arrow' },
      ],
    },
  };
  if (DRY) { console.log('  [dry] PUT /dining-page payload size:', JSON.stringify(data).length, 'chars'); return; }
  const r = await api(ctx, '/dining-page', { method: 'PUT', body: { data } });
  return r.data;
}

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);

  console.log('\n[1/4] Uploading media…');
  const heroMedia = await uploadAll(ctx, HERO_DIR, HERO_IMAGES, { dry: DRY });
  const restMedia = await uploadAll(ctx, REST_DIR, REST_IMAGES, { dry: DRY });
  const logoMedia = await uploadAll(ctx, LOGO_DIR, LOGO_IMAGES, { dry: DRY });
  const servMedia = await uploadAll(ctx, SERV_DIR, SERV_IMAGES, { dry: DRY });

  console.log('\n[2/4] Restaurants…');
  for (const r of RESTAURANTS) {
    await ensureRestaurant(r, restMedia[r.imageFile]?.id ?? null, logoMedia[r.logoFile]?.id ?? null);
    console.log(`  ✓ ${r.name}`);
  }

  console.log('\n[3/4] Dining Page single type…');
  await upsertDiningPage({ heroMedia, servMedia });
  console.log('  ✓ dining-page upserted');

  console.log('\nDone.');
}
main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
