#!/usr/bin/env node
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, uploadAll, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MEDIA_DIR = join(ROOT, 'media', 'fitness');
const DRY = isDryRun();
const ctx = initEnv();

const IMAGES = [
  'header-bg.jpg',
  'spa.jpeg',
  'spa-gradient.svg',
  'fRArJiszmhGHpOFTkbxpn8pcnAY.png',
  'aquatics.jpeg',
  'connect.jpeg',
  'gym.jpeg',
  'tennis.jpeg',
  'golf-activities.jpg',
  'multi-purpose-court.jpeg',
  'Squash.jpeg',
  'bowling.jpeg',
];

async function upsertFitnessPage({ media }) {
  const data = {
    title: 'Fitness & Wellness',
    pageBackgroundColor: '#F5F4F2',
    hero: {
      heading: 'Fitness & Wellness',
      subheading: 'Fitness, movement, and wellness experiences that fit seamlessly into your lifestyle.',
      variant: 'compact',
      backgroundImage: media['header-bg.jpg'].id,
      titlePosition: 'bottom-left',
      subtitlePosition: 'bottom-right',
    },
    senSpa: {
      heading: 'sèn Spa',
      description: 'Step away from the everyday and immerse yourself in a retreat where you can unwind, relax, and rejuvenate your mind and body.',
      image: media['spa.jpeg'].id,
      imageAlt: 'sèn Spa',
      textPosition: 'right',
      textVerticalAlign: 'center',
      textBgColor: '#F3E3CA',
      textBgImage: media['spa-gradient.svg'].id,
      textTheme: 'dark',
      logo: media['fRArJiszmhGHpOFTkbxpn8pcnAY.png'].id,
      ctas: [
        { label: 'Learn More', href: '/fitness/sen-spa', variant: 'primary' },
        { label: 'View Menu', href: '/fitness/sen-spa', variant: 'primary' },
      ],
    },
    aquatics: {
      heading: 'Aquatics',
      description: "From leisure to competitive swimming, dive into the Club's Aquatics programs and embrace an active lifestyle, whether learning, training, or enjoying water fun with family.",
      image: media['aquatics.jpeg'].id,
      imageAlt: 'Aquatics',
      textPosition: 'left',
      textVerticalAlign: 'center',
      textBgColor: '#001E62',
      textTheme: 'light',
      ctas: [
        { label: 'Learn More', href: '/fitness/aquatics', variant: 'primary' },
        { label: 'View Our Aquatics Programs', href: '/fitness/aquatics', variant: 'primary' },
      ],
    },
    connectDiscover: {
      heading: 'Connect & Discover',
      description: 'Where hobbies become friendship',
      image: media['connect.jpeg'].id,
      imageAlt: 'Connect & Discover',
      textPosition: 'right',
      textVerticalAlign: 'center',
      textBgColor: '#D2E6C8',
      textTheme: 'dark',
      ctas: [{ label: 'View All Activities', href: '/fitness', variant: 'primary' }],
    },
    gym: {
      heading: 'Gym',
      description: 'Whether you have been training for years or trying to get started, get the right support for your fitness journey',
      image: media['gym.jpeg'].id,
      imageAlt: 'Gym',
      textPosition: 'left',
      textVerticalAlign: 'center',
      textBgColor: '#272E3D',
      textTheme: 'light',
      ctas: [
        { label: 'Private Trainings',     href: '/fitness/gym',     variant: 'outline', bordered: true },
        { label: 'Group Fitness Class',   href: '/fitness/gym',     variant: 'outline', bordered: true },
        { label: 'Pilates',               href: '/fitness/pilates', variant: 'outline', bordered: true },
        { label: 'Learn More',            href: '/fitness/gym',     variant: 'outline', bordered: true },
      ],
    },
    tennis: {
      heading: 'Tennis',
      description: "Experience the thrill of tennis on the Club's four state-of-the-art artificial grass courts, ideal for learning, training, or enjoying a friendly match.",
      image: media['tennis.jpeg'].id,
      imageAlt: 'Tennis',
      textPosition: 'right',
      textVerticalAlign: 'center',
      textBgColor: '#37402D',
      textTheme: 'light',
      ctas: [
        { label: 'Learn More', href: '/fitness/tennis', variant: 'primary' },
        { label: 'Group Fitness Programs', href: '/fitness/tennis', variant: 'primary' },
      ],
    },
    moreActivities: {
      columns: '3',
      variant: 'centered',
      items: [
        { heading: 'Golf Activities',     description: 'Tee Off & Connect.',                  image: media['golf-activities.jpg'].id,        imageAlt: 'Golf Activities',     cta: { label: 'Explore', href: '/fitness/golf-activities',     variant: 'primary' }, accentColor: '#DF4661' },
        { heading: 'Multi-purpose Court', description: 'Pickleball & More.',                  image: media['multi-purpose-court.jpeg'].id,   imageAlt: 'Multi-purpose Court', cta: { label: 'Explore', href: '/fitness/multi-purpose-court', variant: 'primary' }, accentColor: '#E8721E' },
        { heading: 'Squash',              description: 'Your Squash Experience Starts Here.', image: media['Squash.jpeg'].id,                imageAlt: 'Squash',              cta: { label: 'Explore', href: '/fitness/squash',              variant: 'primary' }, accentColor: '#DF4661' },
      ],
    },
    bowling: {
      heading: 'The Bowling Alley',
      description: 'Strike up some fun at The Bowling Alley, where friendly competition and good times roll together.',
      image: media['bowling.jpeg'].id,
      imageAlt: 'The Bowling Alley',
      textPosition: 'left',
      textVerticalAlign: 'center',
      textBgColor: '#2E045E',
      textTheme: 'light',
      ctas: [{ label: 'Learn More', href: '/fitness/bowling-alley', variant: 'primary' }],
    },
    finalCta: {
      heading: 'Kickstart Your Fitness & Wellness Journey',
      body: 'Join as a Member and enjoy unlimited access to fitness facilities, energizing group classes, and indulgent spa experiences.',
      variant: 'light',
      ctas: [
        { label: 'Explore Membership', href: '/membership', variant: 'primary' },
        { label: 'Book a Club Tour',   href: '#',           variant: 'outline' },
      ],
    },
  };
  if (DRY) { console.log('  [dry] PUT /fitness-page payload size:', JSON.stringify(data).length, 'chars'); return { documentId: 'dry-fitness-page' }; }
  const r = await api(ctx, '/fitness-page', { method: 'PUT', body: { data } });
  return r.data;
}

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);
  console.log('\n[1/2] Uploading media…');
  const media = await uploadAll(ctx, MEDIA_DIR, IMAGES, { dry: DRY });
  console.log('\n[2/2] Fitness Page single type…');
  await upsertFitnessPage({ media });
  console.log('  ✓ fitness-page upserted');
  console.log('\nDone.');
}
main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
