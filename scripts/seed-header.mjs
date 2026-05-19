#!/usr/bin/env node
/**
 * Seed script: Header single type.
 *
 * Uploads logo + dropdown mega-menu images from media/branding/ and writes the
 * full nav structure (logo, ctaButton, 7 navItems with columns + nav-items +
 * images) into Strapi's `header` single type. After this seed runs, the
 * frontend's `useHeaderData` hook receives a complete payload from CMS and the
 * DEFAULT_HEADER fallback in the hook becomes unused.
 *
 * Usage:
 *   node scripts/seed-header.mjs            # seed
 *   node scripts/seed-header.mjs --dry-run  # show plan, don't write
 */

import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, uploadAll, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MEDIA_DIR = join(ROOT, 'media', 'branding');
const DRY = isDryRun();
const ctx = initEnv();

const IMAGES = [
  'logo.webp',
  'nav-dining.jpeg',
  'nav-fitness.jpeg',
  'nav-kids.jpeg',
];

async function upsertHeader({ media }) {
  const data = {
    logo: media['logo.webp'].id,
    ctaButton: {
      label: 'Member Login',
      href: 'https://amclub-portal.iontone.com/#/login',
      isExternal: true,
      variant: 'primary',
    },
    navItems: [
      {
        label: 'Home',
        href: '/home',
        isExternal: false,
        columns: [
          {
            links: [
              { label: 'About Us',                  href: '/about',                          isExternal: false },
              { label: 'Club News',                 href: '/home-sub/news',                  isExternal: false },
              { label: 'Gallery',                   href: '/home-sub/gallery',               isExternal: false },
              { label: 'Advertising & Sponsorship', href: '/home-sub/advertise-with-us',     isExternal: false },
              { label: 'Contact Us',                href: '/home-sub/contact-us',            isExternal: false },
              { label: 'Club Constitution',         href: '/documents/club-constitution.pdf', isExternal: true },
              { label: 'Club By-laws',              href: '/documents/club-bylaws.pdf',       isExternal: true },
            ],
          },
        ],
      },
      {
        label: 'Dining & Retail',
        href: '/dining',
        isExternal: false,
        columns: [
          {
            heading: 'Restaurants & Bars',
            links: [
              { label: 'Central',              href: '/dining/central',            isExternal: false },
              { label: 'Grillhouse',           href: '/dining/grillhouse',         isExternal: false },
              { label: 'The 2nd Floor',        href: '/dining/the-2nd-floor',      isExternal: false },
              { label: 'Tradewinds',           href: '/dining/tradewinds',         isExternal: false },
              { label: 'Union Bar',            href: '/dining/union-bar',          isExternal: false },
              { label: 'The Gourmet Pantry',   href: '/dining/the-gourmet-pantry', isExternal: false },
            ],
          },
          {
            heading: 'Promotions & Services',
            links: [
              { label: 'Dining Promotions', href: '/dining/dining-promotion',                       isExternal: false },
              { label: 'TAC2Go!',           href: 'https://amclub.jotform.com/252650968518973',     isExternal: true },
              { label: 'Bottles2Go!',       href: 'https://amclub.jotform.com/252638314015956',     isExternal: true },
              { label: 'Essentials',        href: '/dining/essentials',                             isExternal: false },
            ],
          },
          {
            image: media['nav-dining.jpeg'].id,
            imageLink: '/dining',
          },
        ],
      },
      {
        label: 'Fitness & Wellness',
        href: '/fitness',
        isExternal: false,
        columns: [
          {
            heading: 'Facilities',
            links: [
              { label: 'sên Spa',  href: '/fitness/sen-spa',  isExternal: false },
              { label: 'Aquatics', href: '/fitness/aquatics', isExternal: false },
              { label: 'Gym',      href: '/fitness/gym',      isExternal: false },
              { label: 'Tennis',   href: '/fitness/tennis',   isExternal: false },
            ],
          },
          {
            heading: 'Activities',
            links: [
              { label: 'Golf',                href: '/fitness/golf',                 isExternal: false },
              { label: 'Multi-Purpose Court', href: '/fitness/multi-purpose-court', isExternal: false },
              { label: 'Squash',              href: '/fitness/squash',              isExternal: false },
            ],
          },
          {
            image: media['nav-fitness.jpeg'].id,
            imageLink: '/fitness',
          },
        ],
      },
      {
        label: 'Kids',
        href: '/kids',
        isExternal: false,
        columns: [
          {
            heading: 'Programs',
            links: [
              { label: 'The Quad Poolside (18 Months – 6 Years Old)', href: '/kids/the-quad-poolside', isExternal: false },
              { label: 'The Quad (6 Years Old & Above)',              href: '/kids/the-quad',          isExternal: false },
              { label: 'The Quad Studios',                            href: '/kids/the-quad-studios',  isExternal: false },
            ],
          },
          {
            heading: 'Activities',
            links: [
              { label: 'Parties & Celebrations', href: '/kids/kids-parties',          isExternal: false },
              { label: 'Seasonal Camps',         href: '/kids/camps',                 isExternal: false },
              { label: 'Recreational Classes',   href: '/kids/recreational-classes', isExternal: false },
            ],
          },
          {
            image: media['nav-kids.jpeg'].id,
            imageLink: '/kids',
          },
        ],
      },
      {
        label: 'Private Events & Catering',
        href: '/event-spaces',
        isExternal: false,
        columns: [
          {
            heading: 'Packages',
            links: [
              { label: 'Wedding Celebrations', href: '/event-spaces/wedding-celebration', isExternal: false },
              { label: 'Corporate Functions',  href: '/event-spaces/corporate-functions', isExternal: false },
              { label: 'Parties',              href: '/event-spaces/parties',             isExternal: false },
            ],
          },
          {
            heading: 'Venues',
            links: [
              { label: 'The Galbraith Ballroom', href: '/event-spaces/the-gallbrainth-ballroom', isExternal: false },
              { label: 'Thinkspace',             href: '/event-spaces/thinkspace',                isExternal: false },
              { label: 'The Bowling Alley',      href: '/event-spaces/bowling-alley',             isExternal: false },
              { label: 'Library',                href: '/event-spaces/library',                   isExternal: false },
              { label: 'Meeting Rooms',          href: '/event-spaces/meeting-rooms',             isExternal: false },
            ],
          },
        ],
      },
      {
        label: 'Membership',
        href: '/membership',
        isExternal: false,
        columns: [
          {
            heading: 'Join Us',
            links: [
              { label: 'Start Application',     href: '/membership/start-application', isExternal: false },
              { label: 'Types & Joining Fees',  href: '/membership/joining-fees',      isExternal: false },
            ],
          },
          {
            heading: 'Programs',
            links: [
              { label: 'Refer a Friend',          href: '/membership/referal',                  isExternal: false },
              { label: 'Niche Group Membership',  href: '/membership/niche-group-membership',   isExternal: false },
              { label: 'Reciprocal Clubs',        href: '/membership/reciprocal-clubs',         isExternal: false },
            ],
          },
        ],
      },
      {
        label: "What's On",
        href: '/whats-on',
        isExternal: false,
      },
    ],
  };

  if (DRY) {
    console.log('  [dry] PUT /header payload size:', JSON.stringify(data).length, 'chars');
    return { documentId: 'dry-header' };
  }
  // Header schema has `draftAndPublish: false` — every PUT is a full
  // replacement of the published entry. No second publish call needed.
  const r = await api(ctx, '/header', { method: 'PUT', body: { data } });
  return r.data;
}

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);

  console.log('\n[1/2] Uploading branding media…');
  const media = await uploadAll(ctx, MEDIA_DIR, IMAGES, { dry: DRY });

  console.log('\n[2/2] Header single type…');
  await upsertHeader({ media });
  console.log('  ✓ header upserted');

  console.log('\nDone.');
}

main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
