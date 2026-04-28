#!/usr/bin/env node
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, uploadAll, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MEDIA_DIR = join(ROOT, 'media', 'event-spaces');
const DRY = isDryRun();
const ctx = initEnv();

const IMAGES = [
  'hero.jpg',
  'package-wedding.jpg', 'package-corporate.jpg', 'package-parties.jpg',
  'venue-galbraith.jpeg', 'venue-thinkspace.jpg', 'venue-bowling.jpeg', 'venue-quad.jpeg',
  'catering-styles.jpg', 'catering-culinary.jpg', 'catering-dietary.jpg', 'catering-2go.png',
];

async function upsertEventSpacesPage({ media }) {
  const data = {
    title: 'Private Events & Catering',
    hero: {
      heading: 'Host Your Next Event with Us',
      subheading: 'From weddings and business milestones to meaningful moments with your loved ones, we create experiences that are thoughtfully planned and well executed.',
      variant: 'compact',
      backgroundImage: media['hero.jpg'].id,
      titlePosition: 'bottom-left',
      subtitlePosition: 'bottom-right',
    },
    privatePackages: {
      heading: 'Private Event Packages',
      subheading: 'Carefully curated venues with customizable packages for every occasion.',
      enquireCta: { label: 'Make an Enquiry', href: '#enquire', variant: 'primary' },
      items: [
        {
          name: 'Wedding Celebrations', tagline: 'Your Day. Your Way. Perfectly Executed',
          image: media['package-wedding.jpg'].id,
          serviceFeatures: ['Custom wedding cake', 'Professional photography'],
          venues: ['The Galbraith Ballroom', 'The 2nd Floor'],
          cta: { label: 'View Packages', href: '/event-spaces/wedding-celebration', variant: 'primary' },
        },
        {
          name: 'Corporate Functions', tagline: 'Blend professionalism with hospitality',
          image: media['package-corporate.jpg'].id,
          serviceFeatures: ['Video conferencing', 'Stage, podium, AV support', 'Coffee breaks & lunch'],
          venues: ['The Galbraith Ballroom', 'Thinkspace Meeting Rooms', 'The Bowling Alley'],
          cta: { label: 'View Packages', href: '/event-spaces/corporate-functions', variant: 'primary' },
        },
        {
          name: 'Parties', tagline: 'Birthdays, Anniversaries & Milestones',
          image: media['package-parties.jpg'].id,
          serviceFeatures: ['Customized Menus', 'Full Bar Service', 'Professional event staff', 'Dietary Flexibility'],
          venues: ['The Galbraith Ballroom', 'The Bowling Alley', 'The Quad Studios'],
          cta: { label: 'View Packages', href: '/event-spaces/parties', variant: 'primary' },
        },
      ],
    },
    distinctiveSpaces: {
      heading: 'Distinctive Event Spaces',
      subheading: 'Four curated venues, each with a distinct character, suited for everything from grand celebrations to smaller, intimate events.',
      panelBgColor: '#001E62',
      items: [
        {
          name: 'The Galbraith Ballroom', capacity: ['3400 sqm'],
          description: 'The Galbraith Ballroom is a versatile, beautifully designed venue that adapts effortlessly to any occasion. With flexible setups and tailored packages, it transforms every gathering into a memorable experience.',
          image: media['venue-galbraith.jpeg'].id,
          cta: { label: 'Learn More', href: '/event-spaces/the-gallbrainth-ballroom', variant: 'primary' },
        },
        {
          name: 'Thinkspace', capacity: ['Meeting Rooms: From 2 – 16 pax', 'Events Space: Up to 40 pax'],
          description: "A dedicated space for Members who need more than just a workspace. Featuring adult and children's libraries, quiet focus areas, meeting rooms, and versatile spaces for small-scale events and networking sessions.",
          image: media['venue-thinkspace.jpg'].id,
          cta: { label: 'Learn More', href: '/event-spaces/thinkspace', variant: 'primary' },
        },
        {
          name: 'The Bowling Alley', capacity: ['Up to 50 pax'],
          description: 'Beyond the lanes, The Bowling Alley doubles as a flexible venue for corporate events and private celebrations, where friendly competition meets a lively yet relaxed atmosphere.',
          image: media['venue-bowling.jpeg'].id,
          cta: { label: 'Learn More', href: '/event-spaces/bowling-alley', variant: 'primary' },
        },
        {
          name: 'The Quad Studios', capacity: ['Up to 50 pax'],
          description: "A vibrant, youth-focused venue for kids' parties and celebrations. With three flexible spaces – Quad Studio 1, 2 & 3 – it transforms effortlessly into fun, customizable settings for birthdays and special milestones.",
          image: media['venue-quad.jpeg'].id,
          cta: { label: "Kids' Party Packages", href: '/kids', variant: 'primary' },
        },
      ],
    },
    offsiteCatering: {
      heading: 'Off-site Catering Services',
      body: "Bring The American Club's signature dishes and service to your chosen venue. Our Events & Catering team manages every detail, from menu preparation to on-site service.",
      ctas: [
        { label: 'View Menu',   href: '#menu',    variant: 'primary' },
        { label: 'Enquire Now', href: '#enquire', variant: 'outline' },
      ],
      pillars: [
        {
          heading: 'Service Styles', subheading: 'Select the service format that best suits your event.',
          items: ['Plated Seated Dinners', 'Buffet Stations', 'Cocktail Receptions', 'Family-style Service'],
          image: media['catering-styles.jpg'].id,
        },
        {
          heading: 'Culinary Expertise', subheading: 'Delicious, diverse cuisine tailored to your preferences.',
          items: ['American Favorites', 'Contemporary Asian'],
          image: media['catering-culinary.jpg'].id,
        },
        {
          heading: 'Dietary Considerations', subheading: 'Dietary requirements thoughtfully accommodated.',
          items: ['Vegetarian', 'Gluten-free Options', 'Allergen Protocols', 'Menu Customization'],
          image: media['catering-dietary.jpg'].id,
        },
      ],
      subBanner: {
        heading: 'Catering2Go!',
        body: 'Off-site catering made effortless. Enjoy your Club favorites wherever the occasion takes you.',
        image: media['catering-2go.png'].id,
        cta: { label: 'Order Now', href: '#order', variant: 'primary' },
      },
    },
    finalCta: {
      heading: 'Plan Your Next Event With Us',
      body: 'Our Club membership opens the door to exceptional event spaces, thoughtfully curated experiences, and seamless off-site catering.',
      variant: 'light',
      ctas: [
        { label: 'Explore Membership', href: '/membership',  variant: 'primary' },
        { label: 'Book a Club Tour',   href: '/contact-us', variant: 'outline' },
      ],
    },
  };
  if (DRY) { console.log('  [dry] PUT /event-spaces-page payload size:', JSON.stringify(data).length, 'chars'); return; }
  const r = await api(ctx, '/event-spaces-page', { method: 'PUT', body: { data } });
  return r.data;
}

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);
  console.log('\n[1/2] Uploading media…');
  const media = await uploadAll(ctx, MEDIA_DIR, IMAGES, { dry: DRY });
  console.log('\n[2/2] Event Spaces Page single type…');
  await upsertEventSpacesPage({ media });
  console.log('  ✓ event-spaces-page upserted');
  console.log('\nDone.');
}
main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
