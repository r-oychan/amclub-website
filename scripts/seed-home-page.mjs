#!/usr/bin/env node
/**
 * Seed script: HomePage content into Strapi.
 *
 * Reads `cms/.env.seed` for:
 *   STRAPI_BASE_URL  — e.g. https://amclub-app1ff10ffc--0000039.purplehill-...azurecontainerapps.io
 *   STRAPI_API_TOKEN — Full-access admin API token
 *
 * Usage:
 *   node scripts/seed-home-page.mjs            # seed
 *   node scripts/seed-home-page.mjs --dry-run  # show plan, don't write
 *
 * Idempotent: re-running updates existing entries (matched by slug) and
 * skips re-uploading media files that already exist (matched by name).
 */

import { readFileSync, readdirSync, statSync, createReadStream } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MEDIA_DIR = join(ROOT, 'media', 'home');
const ENV_PATH = join(ROOT, 'cms', '.env.seed');

const DRY = process.argv.includes('--dry-run');

// ── Load env ─────────────────────────────────────────────
function loadEnv(path) {
  let text;
  try { text = readFileSync(path, 'utf8'); }
  catch {
    console.error(`Missing env file: ${path}`);
    console.error(`Create it with:`);
    console.error(`  STRAPI_BASE_URL=https://your-deployed-url`);
    console.error(`  STRAPI_API_TOKEN=...`);
    process.exit(1);
  }
  const env = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const env = loadEnv(ENV_PATH);
const BASE = (env.STRAPI_BASE_URL || '').replace(/\/$/, '');
const TOKEN = env.STRAPI_API_TOKEN;
if (!BASE || !TOKEN) {
  console.error('STRAPI_BASE_URL and STRAPI_API_TOKEN must be set in cms/.env.seed');
  process.exit(1);
}
const auth = { Authorization: `Bearer ${TOKEN}` };

// ── HTTP helpers ─────────────────────────────────────────
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

async function findUploadedByName(name) {
  // /upload/files supports search by name
  const url = `${BASE}/api/upload/files?filters[name][$eq]=${encodeURIComponent(name)}`;
  const res = await fetch(url, { headers: auth });
  if (!res.ok) return null;
  const arr = await res.json();
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}

async function uploadFile(localPath) {
  const name = basename(localPath);
  const existing = await findUploadedByName(name);
  if (existing) return existing;
  const buf = readFileSync(localPath);
  const fd = new FormData();
  const blob = new Blob([buf]);
  fd.append('files', blob, name);
  const res = await fetch(`${BASE}/api/upload`, { method: 'POST', headers: auth, body: fd });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`upload ${name} → ${res.status}: ${err}`);
  }
  const arr = await res.json();
  return arr[0];
}

// ── Plan ─────────────────────────────────────────────────
const IMAGES = [
  // hero
  'hero-slide-1-home-away.jpg',
  'hero-slide-2-dine-drink.jpeg',
  'hero-slide-3-stay-active.jpeg',
  // about
  'about-1.jpeg',
  'about-2.jpeg',
  'about-3.jpeg',
  'about-4.jpeg',
  // services / tabs (tabs reuse the service images per D9)
  'service-3-concierge.jpeg',
  // events
  'event-1-nostalgic-flavors.jpg',
  'event-2-pedal-to-victory.jpg',
  'event-3-scarily-fun-fridays.jpg',
  'event-4-smokin-sundays.jpg',
  'event-5-kanonkop-wine.jpg',
  'event-6-green-fix-buffet.jpg',
  'event-7-nfl-screening.jpg',
  'event-8-cocktail-masterclass.jpg',
  'event-9-tennis-challenge.jpg',
];

const EVENT_CATEGORIES = ['Dining', 'Fitness & Wellness', 'Kids', 'Member Engagement'];

const EVENTS = [
  // category, title, date (ISO), image filename, featured (always true here)
  ['Dining',              'Nostalgic Flavors of Singapore',                        '2026-12-04', 'event-1-nostalgic-flavors.jpg'],
  ['Fitness & Wellness',  'Pedal to Victory! A Spin Bike Time Challenge',          '2026-11-05', 'event-2-pedal-to-victory.jpg'],
  ['Kids',                'Scarily Fun Friday Nights for the Kids!',               '2026-10-19', 'event-3-scarily-fun-fridays.jpg'],
  ['Dining',              "Smokin' Sundays at Grillhouse",                         '2026-10-11', 'event-4-smokin-sundays.jpg'],
  ['Dining',              'Kanonkop Wine Dinner',                                  '2026-10-22', 'event-5-kanonkop-wine.jpg'],
  ['Dining',              'Get Your Green Fix Salad Bar Buffet',                   '2026-10-30', 'event-6-green-fix-buffet.jpg'],
  ['Kids',                'National Football League 2025 Live Screening',          '2026-12-20', 'event-7-nfl-screening.jpg'],
  ['Member Engagement',   'Classic & Contemporary: A Cocktail Masterclass Series', '2026-11-07', 'event-8-cocktail-masterclass.jpg'],
  ['Fitness & Wellness',  'Adult Team Tennis Challenge 2025',                      '2026-12-30', 'event-9-tennis-challenge.jpg'],
];

const TESTIMONIALS = [
  // name, quote, image filename, ctaUrl, order
  ['Ronald Williams',  'Abuzz with Independence Day cheer on July 1',                'event-3-scarily-fun-fridays.jpg', 'https://www.instagram.com/americanclubsingapore/', 1],
  ['Sarah Grey',       'A multitude of culinary experience for your tastebuds',      'event-2-pedal-to-victory.jpg',    'https://www.instagram.com/americanclubsingapore/', 2],
  ['Matthew Hallen',   'Fantastic evening of glitz, glamor and giving',              'event-4-smokin-sundays.jpg',      'https://www.instagram.com/americanclubsingapore/', 3],
  ['Joseph Gunner',    'Abuzz with Independence Day cheer on July 1',                'about-2.jpeg',                    'https://www.instagram.com/americanclubsingapore/', 4],
  ['Emma Chen',        'Sunday brunch with the family at the Grillhouse',            'about-1.jpeg',                    'https://www.instagram.com/americanclubsingapore/', 5],
];

const FAQ_ITEMS = [
  // question, category, order  (answer empty per D8)
  ['What types of membership do you offer?',          'membership', 1],
  ['What facilities and services are included?',      'facilities', 2],
  ['Is membership transferable?',                     'membership', 3],
  ['Can I upgrade or change my membership type?',     'membership', 4],
];

const slugify = (s) => s.toLowerCase()
  .replace(/['']/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

// ── Seed ─────────────────────────────────────────────────
async function ensureCategory(name) {
  const slug = slugify(name);
  if (DRY) { console.log(`  [dry] upsert event-category: ${name}`); return { documentId: `dry-${slug}`, slug }; }
  const existing = await findOneBySlug('event-categories', slug);
  if (existing) return existing;
  const r = await api('/event-categories', {
    method: 'POST',
    body: { data: { name, slug } },
  });
  return r.data;
}

async function ensureEvent(category, title, date, imageId) {
  const slug = slugify(title);
  if (DRY) { console.log(`  [dry] upsert event: ${title}`); return { documentId: `dry-${slug}`, slug }; }
  const existing = await findOneBySlug('events', slug);
  const payload = {
    title, slug, date,
    image: imageId,
    category: category.documentId,
    featured: true,
    publishedAt: new Date().toISOString(),
  };
  if (DRY) { console.log(`  [dry] upsert event: ${title}`); return { documentId: `dry-${slug}`, slug }; }
  if (existing) {
    const r = await api(`/events/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    return r.data;
  } else {
    const r = await api('/events', { method: 'POST', body: { data: payload } });
    return r.data;
  }
}

async function ensureTestimonial(name, quote, imageId, ctaUrl, order) {
  const slug = slugify(name);
  if (DRY) { console.log(`  [dry] upsert testimonial: ${name}`); return { documentId: `dry-${slug}`, slug }; }
  const existing = await findOneBySlug('testimonials', slug);
  const payload = {
    memberName: name,
    slug,
    quote,
    photo: imageId,
    ctaLabel: 'Watch More',
    ctaUrl,
    order,
    publishedAt: new Date().toISOString(),
  };
  if (DRY) { console.log(`  [dry] upsert testimonial: ${name}`); return { documentId: `dry-${slug}`, slug }; }
  if (existing) {
    const r = await api(`/testimonials/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    return r.data;
  } else {
    const r = await api('/testimonials', { method: 'POST', body: { data: payload } });
    return r.data;
  }
}

async function ensureFaqItem(question, category, order) {
  const slug = slugify(question);
  if (DRY) { console.log(`  [dry] upsert faq-item: ${question}`); return { documentId: `dry-${slug}`, slug }; }
  const existing = await findOneBySlug('faq-items', slug);
  const payload = { question, slug, category, order, answer: null };
  if (DRY) { console.log(`  [dry] upsert faq-item: ${question}`); return { documentId: `dry-${slug}`, slug }; }
  if (existing) {
    const r = await api(`/faq-items/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    return r.data;
  } else {
    const r = await api('/faq-items', { method: 'POST', body: { data: payload } });
    return r.data;
  }
}

async function upsertHomePage({ media, eventsCat, testimonialIds, faqIds }) {
  const data = {
    title: 'Home',
    hero: {
      heading: 'A Home Away From Home',
      subheading: 'Thrive in a vibrant community with a unique American and Canadian culture.',
      variant: 'full',
      titlePosition: 'bottom-left',
      subtitlePosition: 'bottom-right',
      autoPlayInterval: 5000,
      cta: { label: 'Request for a Club Tour', href: '#', variant: 'primary' },
      slides: [
        {
          backgroundImage: media['hero-slide-1-home-away.jpg'].id,
          title: 'A Home Away From Home',
          subtitle: 'Thrive in a vibrant community with a unique American and Canadian culture.',
          titlePosition: 'bottom-left',
          subtitlePosition: 'bottom-right',
          cta: { label: 'Request for a Club Tour', href: '#', variant: 'primary' },
        },
        {
          backgroundImage: media['hero-slide-2-dine-drink.jpeg'].id,
          title: 'Dine. Drink. Unwind.',
          subtitle: 'From casual bites to fine dining, discover our world-class restaurants and bars.',
          titlePosition: 'bottom-left',
          subtitlePosition: 'bottom-right',
          cta: { label: 'Explore Dining', href: '/dining', variant: 'primary' },
        },
        {
          backgroundImage: media['hero-slide-3-stay-active.jpeg'].id,
          title: 'Stay Active, Stay Healthy',
          subtitle: 'State-of-the-art fitness facilities, pools, and wellness programs for the whole family.',
          titlePosition: 'bottom-left',
          subtitlePosition: 'bottom-right',
          cta: { label: 'Discover Fitness', href: '/fitness', variant: 'primary' },
        },
      ],
    },
    aboutSection: {
      label: 'About Us',
      heading: 'Blending American Traditions with Singaporean Charm',
      stats: [
        { value: '11,000+', label: 'Members' },
        { value: '90+',     label: 'Nationalities' },
        { value: '77+',     label: 'Years of Heritage' },
      ],
      funFactIntro: 'Did You Know?',
      funFactBody: 'The idea of forming a social club for Americans was first mooted in 1932?',
      cta: { label: 'Discover Our Story', href: '/about', variant: 'primary' },
      images: [
        media['about-1.jpeg'].id,
        media['about-2.jpeg'].id,
        media['about-3.jpeg'].id,
        media['about-4.jpeg'].id,
      ],
    },
    events: {
      label: 'Events',
      heading: 'From memorable moments to unforgettable evenings - Your club calendar awaits',
      cta: { label: 'View Featured Club Events', href: '/whats-on', variant: 'primary' },
      maxItems: 9,
    },
    services: {
      label: 'Services',
      heading: 'From shared experiences to lasting bonds - it all starts here',
      cta: { label: 'Explore Membership', href: '/membership', variant: 'primary' },
      dark: true,
      features: [
        {
          heading: 'The Perfect Club Experience for the Whole Family',
          description: "From pool time to playtime, dining to downtime — there's something for everyone in the family to enjoy.",
          image: media['hero-slide-2-dine-drink.jpeg'].id,
        },
        {
          heading: 'Business Done Right. Leisure Done Better.',
          description: 'Connect, meet, or recharge — the Club makes balancing work and leisure effortless.',
          image: media['hero-slide-3-stay-active.jpeg'].id,
        },
        {
          heading: 'Everyday Concierge, the Club Way',
          description: 'A welcoming smile, a helping hand. Enjoy seamless support with a personal touch.',
          image: media['service-3-concierge.jpeg'].id,
        },
      ],
    },
    experience: {
      label: 'Experience',
      heading: 'Dine. Drink. Unwind. All in one unforgettable club.',
      dark: false,
      tabs: [
        { label: 'Dining & Retail',     href: '/dining',  isExternal: false, image: media['hero-slide-2-dine-drink.jpeg'].id },
        { label: 'Fitness & Wellness',  href: '/fitness', isExternal: false, image: media['hero-slide-3-stay-active.jpeg'].id },
        { label: 'Kids',                href: '/kids',    isExternal: false, image: media['service-3-concierge.jpeg'].id },
      ],
    },
    moments: {
      label: 'Moments',
      heading: 'Moments that matter, captured and shared by you',
      cta: { label: 'Follow Our Socials', href: 'https://www.instagram.com/americanclubsingapore/', isExternal: true, variant: 'primary' },
      dark: true,
      testimonials: testimonialIds,
    },
    faq: {
      label: 'FAQ',
      heading: 'Your Questions, Answered',
      ctas: [
        { label: 'View All FAQ', href: '#', variant: 'primary' },
        { label: 'Enquiries',    href: '/home-sub/contact-us', variant: 'outline' },
      ],
      items: faqIds,
    },
  };

  if (DRY) {
    console.log('  [dry] PUT /home-page payload size:', JSON.stringify(data).length, 'chars');
    return { documentId: 'dry-home-page' };
  }

  // Single types in v5: PUT /api/home-page (no id)
  const r = await api('/home-page', { method: 'PUT', body: { data } });
  return r.data;
}

// ── Run ──────────────────────────────────────────────────
async function main() {
  console.log(`Strapi base: ${BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);

  console.log('\n[1/6] Uploading media…');
  const media = {};
  for (const name of IMAGES) {
    const path = join(MEDIA_DIR, name);
    statSync(path); // throws if missing
    if (DRY) { media[name] = { id: 0, name }; console.log(`  [dry] upload ${name}`); continue; }
    const m = await uploadFile(path);
    media[name] = m;
    console.log(`  ✓ ${name.padEnd(40)} → id=${m.id}`);
  }

  console.log('\n[2/6] Event categories…');
  const cats = {};
  for (const name of EVENT_CATEGORIES) {
    cats[name] = await ensureCategory(name);
    console.log(`  ✓ ${name}`);
  }

  console.log('\n[3/6] Events…');
  for (const [catName, title, date, imgName] of EVENTS) {
    await ensureEvent(cats[catName], title, date, media[imgName].id);
    console.log(`  ✓ ${title}`);
  }

  console.log('\n[4/6] Testimonials…');
  const testimonialIds = [];
  for (const [name, quote, imgName, ctaUrl, order] of TESTIMONIALS) {
    const t = await ensureTestimonial(name, quote, media[imgName]?.id ?? 0, ctaUrl, order);
    testimonialIds.push(t.documentId);
    console.log(`  ✓ ${name}`);
  }

  console.log('\n[5/6] FAQ items…');
  const faqIds = [];
  for (const [q, cat, order] of FAQ_ITEMS) {
    const f = await ensureFaqItem(q, cat, order);
    faqIds.push(f.documentId);
    console.log(`  ✓ ${q}`);
  }

  console.log('\n[6/6] Home Page single type…');
  await upsertHomePage({ media, eventsCat: cats, testimonialIds, faqIds });
  console.log('  ✓ home-page upserted');

  console.log('\nDone.');
}

main().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});
