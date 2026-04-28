#!/usr/bin/env node
/**
 * Seed MembershipPage content into Strapi.
 * Usage: node scripts/seed-membership-page.mjs [--dry-run]
 */
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, uploadAll, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MEDIA_DIR = join(ROOT, 'media', 'membership');
const DRY = isDryRun();
const ctx = initEnv();

const IMAGES = [
  'hero-membership.jpg',
  'program-refer.png',
  'program-eagle-rewards.png',
  'program-reciprocal.jpg',
];

async function upsertMembershipPage({ media }) {
  const data = {
    title: 'Membership',
    hero: {
      heading: 'Membership',
      subheading: 'A diverse, close-knit community founded on the values of freedom, inclusivity and friendship.',
      variant: 'compact',
      backgroundImage: media['hero-membership.jpg'].id,
      titlePosition: 'bottom-left',
      subtitlePosition: 'bottom-right',
    },
    joinCta: {
      heading: 'Join Our Community',
      body: "The American Club is more than a social club – it's a welcoming community where Members and their families connect, unwind, and belong.",
      variant: 'light',
      ctas: [
        { label: 'Start Your Application', href: '#', variant: 'primary' },
      ],
    },
    intro: {
      heading: 'A Home Away From Home',
      body: 'Designed for American, Canadian and international families in Singapore, the Club offers a seamless blend of comfort, culture, and convenience.',
    },
    benefits: {
      heading: undefined,
      features: [
        { heading: 'World-class Facilities',     description: 'The Club offers thoughtfully designed facilities and amenities for every lifestyle.' },
        { heading: 'Exceptional Dining',         description: 'Savor American comfort food and classic favorites, complemented by diverse dining concepts and seasonal menus across the Club.' },
        { heading: 'Signature Events',           description: 'Enjoy a vibrant calendar of American, Canadian, and local celebrations that bring the feeling of home to life all year round.' },
        { heading: 'Where Kids Thrive',          description: "Engaging kids' camps, enrichment classes, youth activities and spaces that support learning, play, and friendship." },
        { heading: 'Community & Connection',     description: 'Build meaningful relationships through shared experiences, multi-generational programming, and a strong sense of belonging.' },
        { heading: '150+ Reciprocal Clubs',      description: 'Your membership extends worldwide, with reciprocal clubs offering the same warm welcome wherever your travels take you.' },
      ],
    },
    findRightCta: {
      heading: 'Find the Right Membership for You',
      body: 'The American Club offers a range of membership options. Membership is open to individuals aged 21 and above.',
      variant: 'default',
      ctas: [
        { label: 'Membership Types & Joining Fees', href: '#', variant: 'primary' },
        { label: 'Book a Club Tour',                href: '#', variant: 'outline' },
      ],
    },
    programs: {
      cards: [
        { heading: 'Refer & Be Rewarded',          description: 'Extend the privilege of membership to your family and friends, and enjoy exclusive rewards through our referral program.', image: media['program-refer.png'].id,          cta: { label: 'Learn More', href: '#', variant: 'text' } },
        { heading: 'The Eagle Rewards Program',    description: 'A tiered rewards experience that offers elevated recognition and privileges as you enjoy more of the Club.',                  image: media['program-eagle-rewards.png'].id, cta: { label: 'Learn More', href: '#', variant: 'text' } },
        { heading: 'Reciprocal Clubs',             description: 'Enjoy privileged access to over 150 distinguished private clubs worldwide.',                                                   image: media['program-reciprocal.jpg'].id,    cta: { label: 'Learn More', href: '#', variant: 'text' } },
      ],
    },
    faq: {
      heading: 'Your Questions, Answered',
      ctas: [
        { label: 'View All FAQ', href: '#', variant: 'primary' },
        { label: 'Enquiries',    href: '/home-sub/contact-us', variant: 'outline' },
      ],
      // items relation reused from HomePage seed (FAQ items already exist in DB)
      // We don't link them here — frontend can fetch faq-items separately if needed.
    },
    beginJourneyCta: {
      heading: 'Begin Your Membership Journey',
      body: "Take the first step toward life at Singapore's premier social club.",
      variant: 'default',
      ctas: [
        { label: 'Start Your Application', href: '#', variant: 'primary' },
        { label: 'Book a Club Tour',       href: '#', variant: 'outline' },
      ],
    },
  };

  if (DRY) {
    console.log('  [dry] PUT /membership-page payload size:', JSON.stringify(data).length, 'chars');
    return { documentId: 'dry-membership-page' };
  }
  const r = await api(ctx, '/membership-page', { method: 'PUT', body: { data } });
  return r.data;
}

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);

  console.log('\n[1/2] Uploading media…');
  const media = await uploadAll(ctx, MEDIA_DIR, IMAGES, { dry: DRY });

  console.log('\n[2/2] Membership Page single type…');
  await upsertMembershipPage({ media });
  console.log('  ✓ membership-page upserted');

  console.log('\nDone.');
}

main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
