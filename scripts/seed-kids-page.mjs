#!/usr/bin/env node
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, uploadAll, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MEDIA_DIR = join(ROOT, 'media', 'pages', 'kids');
const DRY = isDryRun();
const ctx = initEnv();

// Images already exist in media/pages/kids/ (seed-media for runtime); upload
// them to Strapi media library so editors can swap them via /admin.
const IMAGES = [
  'hero-bg.jpeg',
  'hangout.jpeg',
  'parties.jpg',
  'party-bg.png',
  'camps.jpg',
  'classes.jpg',
  'seasonal-camps.jpg',
  'recreational-classes.jpg',
  'quadstudio.jpeg',
  'bowling-alley.jpeg',
  'union-bar.jpeg',
];

async function upsertKidsPage({ media }) {
  const data = {
    title: 'Kids',
    hero: {
      heading: 'Kids',
      subheading: 'Learn and play without limits.',
      variant: 'compact',
      backgroundImage: media['hero-bg.jpeg'].id,
      titlePosition: 'bottom-left',
      subtitlePosition: 'bottom-right',
    },
    hangout: {
      heading: 'The Hangout',
      description: 'An outdoor chill zone for kids and teens – designed for laid-back fun with friends, featuring pool and foosball tables, comfy lounge chairs, and space to relax, play, and unwind together.',
      image: media['hangout.jpeg'].id,
      imageAlt: 'The Hangout',
      textPosition: 'left',
      textVerticalAlign: 'center',
      textBgColor: '#001E62',
      textTheme: 'light',
      ctas: [{ label: 'Learn More', href: '/kids/the-hangout', variant: 'primary' }],
    },
    parties: {
      heading: "Kids' Parties",
      description: 'From games to giggles, we plan it all so you can enjoy the fun.',
      image: media['parties.jpg'].id,
      imageAlt: "Kids' Parties",
      textPosition: 'right',
      textVerticalAlign: 'center',
      textBgColor: '#FEB700',
      textBgImage: media['party-bg.png'].id,
      textTheme: 'dark',
      ctas: [{ label: 'Learn More', href: '/kids/kids-parties', variant: 'primary' }],
    },
    partyPackages: {
      heading: 'Parties Made Easy',
      subheading: "Fun-filled kids' party packages designed for memorable celebrations.",
      items: [
        {
          name: 'The Quad Studio Party Package',
          image: media['quadstudio.jpeg'].id,
          imageAlt: 'The Quad Studio Party Package',
          cta: {
            label: 'Download Brochure',
            href: '/documents/kids/the-quad-studios-party-package.pdf',
            isExternal: true,
            variant: 'text',
            icon: 'arrow',
          },
        },
        {
          name: 'The Bowling Alley Party Package',
          image: media['bowling-alley.jpeg'].id,
          imageAlt: 'The Bowling Alley Party Package',
          cta: {
            label: 'Download Brochure',
            href: '/documents/kids/the-bowling-alley-party-package.pdf',
            isExternal: true,
            variant: 'text',
            icon: 'arrow',
          },
        },
        {
          name: 'Union Bar x The Bowling Alley',
          image: media['union-bar.jpeg'].id,
          imageAlt: 'Union Bar x The Bowling Alley',
          cta: {
            label: 'View Menu',
            href: '/documents/kids/union-bar-bowling-alley-menu.jpg',
            isExternal: true,
            variant: 'text',
            icon: 'arrow',
          },
        },
      ],
    },
    learning: {
      heading: 'Where Learning Meets Fun, All Year Long',
      subheading: 'From signature seasonal camps to after-school enrichment classes, children can dive into sports, arts, dance, and STEM.',
      columns: '2',
      variant: 'centered',
      items: [
        {
          heading: 'Seasonal Camps',
          description: 'A mix of sports, arts, STEM fun, and outdoor adventures, all designed to spark curiosity and new friendships.',
          image: media['seasonal-camps.jpg'].id,
          imageAlt: 'Seasonal Camps',
          cta: { label: 'Explore', href: '/kids/camps', variant: 'primary' },
        },
        {
          heading: 'Recreational Classes',
          description: 'Curated arts, sports, and enrichment classes crafted for curious young learners.',
          image: media['recreational-classes.jpg'].id,
          imageAlt: 'Recreational Classes',
          cta: { label: 'Explore', href: '/kids/recreational-classes', variant: 'primary' },
        },
      ],
    },
    safety: {
      heading: "Your Child's Safety Is Our Priority",
      body: 'All instructors and supervisors are certified professionals, and low child-to-staff ratios ensure personalized attention and close supervision.',
      centered: true,
      features: [
        { heading: 'Trained & Certified Team Members' },
        { heading: 'Dedicated Attention & Supervision' },
        { heading: 'Safe & Secure Environment' },
      ],
    },
    finalCta: {
      heading: 'Where Kids Learn, Play & Belong',
      body: 'Join The American Club and give your children access to world-class facilities, enriching programs, and a community that values family and friendship.',
      variant: 'default',
      ctas: [
        { label: 'Explore Membership', href: '/membership', variant: 'primary' },
        { label: 'Book a Club Tour', href: 'https://amclub.jotform.com/260813837273966?parentURL=https%3A%2F%2Famclub.org.sg%2Fmembership-enquiry-form%2F&jsForm=true', isExternal: true, variant: 'outline' },
      ],
    },
  };
  if (DRY) { console.log('  [dry] PUT /kids-page payload size:', JSON.stringify(data).length, 'chars'); return { documentId: 'dry-kids-page' }; }
  const r = await api(ctx, '/kids-page', { method: 'PUT', body: { data } });
  return r.data;
}

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);

  console.log('\n[1/2] Uploading media…');
  const media = await uploadAll(ctx, MEDIA_DIR, IMAGES, { dry: DRY });

  console.log('\n[2/2] Kids Page single type…');
  await upsertKidsPage({ media });
  console.log('  ✓ kids-page upserted');

  console.log('\nDone.');
}
main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
