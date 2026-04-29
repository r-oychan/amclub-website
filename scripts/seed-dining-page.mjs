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

const HERO_IMAGES   = ['hero-bg.jpg'];
const REST_IMAGES   = ['central.jpeg', 'grillhouse.jpeg', 'the-2nd-floor.jpeg', 'the-gourmet-pantry.jpeg', 'tradewinds.jpeg', 'union-bar.jpeg'];
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
    ctas: [{ label: 'View Menu', icon: 'menu' }],
    operatingHoursSections: [
      { title: 'Operating Hours', rows: [
        { dayRange: 'Monday to Friday', time: '7:00 AM - 6:00 PM' },
        { dayRange: 'Saturday & Sunday', time: '8:00 AM - 4:00 PM' },
      ] },
    ],
    locationContact: { locationLevel: 'Level 1', phone: '6739 4358', email: 'central@amclub.org.sg' },
    order: 1,
  },
  {
    name: 'Grillhouse & Tiki Bar', slug: 'grillhouse', cuisineType: 'American BBQ & Grill', cuisineIconSlug: 'american',
    description: 'Welcome to a casual poolside dining restaurant – perfect for families with children and swimmers looking to have a delicious meal.\n\nDevour authentic American cuisine featuring Texas-style BBQ, mouth-watering burgers, delicious pizzas and salads with ice-cold American beer and special Grillhouse shakes.',
    imageFile: 'grillhouse.jpeg', logoFile: 'grillhouse.png', dressCode: null,
    ctas: [
      { label: 'View Menu', icon: 'menu' },
      { label: 'Promotions', icon: 'arrow' },
    ],
    operatingHoursSections: [
      { title: 'Grillhouse Operating Hours', rows: [
        { dayRange: 'Sunday to Thursday', time: '11:00 AM - 9:00 PM',  lastOrder: 'Last order at 8:30 p.m.' },
        { dayRange: 'Friday and Saturday', time: '11:00 AM - 9:30 PM', lastOrder: 'Last order at 9:00 p.m.' },
      ] },
      { title: 'Tiki Bar Operating Hours', rows: [
        { dayRange: 'Fridays & Saturdays', time: '11:30 AM - 12:00 AM', lastOrder: 'Last order at 11:30 p.m.' },
        { dayRange: 'Sundays',             time: '11:30 AM - 11:00 PM', lastOrder: 'Last order at 10:30 p.m.' },
      ] },
    ],
    locationContact: { locationLevel: 'Level 1', phone: '6739 4357', email: 'grillhouse@amclub.org.sg' },
    order: 2,
  },
  {
    name: 'The 2nd Floor', slug: 'the-2nd-floor', cuisineType: 'Casual Premium Fine Dining', cuisineIconSlug: 'casual-fine-dining',
    description: 'Experience the best of both worlds, where East and West create a fine dining experience.',
    imageFile: 'the-2nd-floor.jpeg', logoFile: 'the-2nd-floor.png', dressCode: 'Smart Casual',
    ctas: [{ label: 'View Menu', icon: 'menu' }],
    operatingHoursSections: [
      { title: 'Operating Hours', rows: [
        { dayRange: 'Tuesday to Sunday', time: '6:00 PM - 10:00 PM', lastOrder: 'Last order at 9:30 p.m.' },
      ] },
    ],
    locationContact: { locationLevel: 'Level 2', phone: '6739 4360', email: '2ndfloor@amclub.org.sg' },
    order: 3,
  },
  {
    name: 'The Gourmet Pantry', slug: 'the-gourmet-pantry', cuisineType: 'Wine & Gourmet Store', cuisineIconSlug: 'gourmet',
    description: 'A curated destination for modern tastemakers – offering exceptional wines, artisanal bites, and beautifully crafted tableware.',
    imageFile: 'the-gourmet-pantry.jpeg', logoFile: 'the-gourmet-pantry.png', dressCode: null,
    ctas: [{ label: 'View Menu', icon: 'menu' }],
    operatingHoursSections: [
      { title: 'Operating Hours', rows: [
        { dayRange: 'Daily', time: '10:00 AM - 9:00 PM' },
      ] },
    ],
    locationContact: { locationLevel: 'Level 1', phone: '6739 4361', email: 'pantry@amclub.org.sg' },
    order: 4,
  },
  {
    name: 'Tradewinds', slug: 'tradewinds', cuisineType: 'International', cuisineIconSlug: 'international',
    description: 'All-day casual dining featuring an international menu with flavors from America to Singapore.',
    imageFile: 'tradewinds.jpeg', logoFile: 'tradewinds.png', dressCode: null,
    ctas: [{ label: 'View Menu', icon: 'menu' }],
    operatingHoursSections: [
      { title: 'Operating Hours', rows: [
        { dayRange: 'Daily', time: '6:30 AM - 10:30 PM', lastOrder: 'Last order at 10:00 p.m.' },
      ] },
    ],
    locationContact: { locationLevel: 'Level 3', phone: '6739 4362', email: 'tradewinds@amclub.org.sg' },
    order: 5,
  },
  {
    name: 'Union Bar', slug: 'union-bar', cuisineType: 'American Bar Food', cuisineIconSlug: 'bar',
    description: 'Kick back after work at this classic American sports bar.',
    imageFile: 'union-bar.jpeg', logoFile: 'the-union-bar.png', dressCode: null,
    ctas: [{ label: 'View Menu', icon: 'menu' }],
    operatingHoursSections: [
      { title: 'Operating Hours', rows: [
        { dayRange: 'Monday to Sunday', time: '4:00 PM - 12:00 AM', lastOrder: 'Last order at 11:30 p.m.' },
      ] },
    ],
    locationContact: { locationLevel: 'Level 4', phone: '6739 4363', email: 'unionbar@amclub.org.sg' },
    order: 6,
  },
];

async function ensureRestaurant(r, imageId, logoId) {
  if (DRY) { console.log(`  [dry] upsert restaurant: ${r.name}`); return { documentId: `dry-${r.slug}`, slug: r.slug }; }
  const existing = await findOneBySlug(ctx, 'restaurants', r.slug);
  const ctas = (r.ctas ?? []).slice(0, 3).map((c) => ({
    label: c.label,
    href: c.href ?? '#',
    variant: c.variant ?? 'primary',
    icon: c.icon ?? 'arrow',
  }));
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
        { heading: 'TAC2Go!',     description: 'Savor your Club favorites in the comforts of your own home.',                            image: servMedia['tac2go.jpeg'].id,    cta: { label: 'Order Now', href: '/dining/tac2go',     variant: 'text', icon: 'arrow' } },
        { heading: 'Bottles2Go!', description: "Bringing the Club's cellar to your home with a curated range of premium wines.",        image: servMedia['bottles2go.jpg'].id, cta: { label: 'Order Now', href: '/dining/bottles2go', variant: 'text', icon: 'arrow' } },
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
        { label: 'Essentials2Go!',                       href: '/dining/essentials', variant: 'primary', icon: 'arrow' },
        { label: 'Retail Store & Laundry Services',      href: '/dining/essentials', variant: 'primary', icon: 'arrow' },
      ],
    },
    finalCta: {
      heading: 'Savor the Experience',
      body: 'Become a Member to explore our restaurants, where a variety of cuisines and thoughtfully crafted dining experiences await to delight every palate.',
      variant: 'light',
      ctas: [
        { label: 'Explore Membership', href: '/membership', variant: 'primary', icon: 'arrow' },
        { label: 'Book a Club Tour',   href: '#',           variant: 'outline', icon: 'arrow' },
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
