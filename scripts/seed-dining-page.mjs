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
const RESTAURANTS = [
  // [name, slug, cuisineType, cuisineIconSlug, description, imageFile, logoFile, dressCode|null, ctas]
  ['Central',             'central',             'Cafe',                         'cafe',               'Your favorite coffee, sandwich and chatter spot.', 'central.jpeg',             'central.png',             null,           [{ label: 'View Menu', icon: 'menu' }], 1],
  ['Grillhouse & Tiki Bar','grillhouse',         'American BBQ & Grill',         'american',           'The home of American BBQ, pizza and beer at a poolside setting. Devour authentic American cuisine featuring Texas-style BBQ, mouth-watering burgers, and delicious pizzas.', 'grillhouse.jpeg', 'grillhouse.png', null, [{ label: 'View Menu', icon: 'menu' }, { label: 'Opening Hours', icon: 'clock' }], 2],
  ['The 2nd Floor',       'the-2nd-floor',      'Casual Premium Fine Dining',   'casual-fine-dining', 'Experience the best of both worlds, where East and West create a fine dining experience.', 'the-2nd-floor.jpeg',     'the-2nd-floor.png',      'Smart Casual', [{ label: 'View Menu', icon: 'menu' }], 3],
  ['The Gourmet Pantry',  'the-gourmet-pantry', 'Wine & Gourmet Store',         'gourmet',            'A curated destination for modern tastemakers – offering exceptional wines, artisanal bites, and beautifully crafted tableware.', 'the-gourmet-pantry.jpeg', 'the-gourmet-pantry.png', null,        [{ label: 'View Menu', icon: 'menu' }], 4],
  ['Tradewinds',          'tradewinds',         'International',                'international',      'All-day casual dining featuring an international menu with flavors from America to Singapore.', 'tradewinds.jpeg',          'tradewinds.png',         null,        [{ label: 'View Menu', icon: 'menu' }], 5],
  ['Union Bar',           'union-bar',          'American Bar Food',            'bar',                'Kick back after work at this classic American sports bar.', 'union-bar.jpeg',                                          'the-union-bar.png',      null,        [{ label: 'View Menu', icon: 'menu' }], 6],
];

async function ensureRestaurant(name, slug, cuisineType, cuisineIconSlug, description, imageId, logoId, dressCode, ctas, order) {
  if (DRY) { console.log(`  [dry] upsert restaurant: ${name}`); return { documentId: `dry-${slug}`, slug }; }
  const existing = await findOneBySlug(ctx, 'restaurants', slug);
  const payload = {
    name, slug, cuisineType, cuisineIconSlug, description,
    image: imageId, logo: logoId, dressCode, order,
    ctas: ctas.map((c) => ({ label: c.label, href: c.href ?? '#', variant: 'primary', icon: c.icon ?? 'arrow' })),
    publishedAt: new Date().toISOString(),
  };
  if (existing) {
    const r = await api(ctx, `/restaurants/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    return r.data;
  }
  const r = await api(ctx, '/restaurants', { method: 'POST', body: { data: payload } });
  return r.data;
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
  for (const [name, slug, ct, ci, desc, imgFile, logoFile, dc, ctas, order] of RESTAURANTS) {
    await ensureRestaurant(name, slug, ct, ci, desc, restMedia[imgFile]?.id ?? null, logoMedia[logoFile]?.id ?? null, dc, ctas, order);
    console.log(`  ✓ ${name}`);
  }

  console.log('\n[3/4] Dining Page single type…');
  await upsertDiningPage({ heroMedia, servMedia });
  console.log('  ✓ dining-page upserted');

  console.log('\nDone.');
}
main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
