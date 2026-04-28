#!/usr/bin/env node
import { initEnv, api, isDryRun } from './seed-helpers.mjs';

const DRY = isDryRun();
const ctx = initEnv();

async function upsertWhatsOnPage() {
  const data = {
    title: "What's On",
    hero: {
      heading: 'Where Community Comes Together',
      subheading: 'Experience year-round events that bring our vibrant community together.',
      variant: 'compact',
      titlePosition: 'bottom-left',
      subtitlePosition: 'bottom-right',
    },
    eventsSection: {
      heading: 'Featured Club Events',
      maxItems: 50,
      cta: { label: 'Browse All Events', href: '#', variant: 'outline' },
    },
    finalCta: {
      heading: 'Join the Celebration',
      body: 'Become a Member and enjoy access to exclusive events – from relaxed socials to our signature annual celebrations.',
      variant: 'default',
      ctas: [
        { label: 'Explore Membership', href: '/membership', variant: 'primary' },
        { label: 'Book a Tour',         href: '#',           variant: 'outline' },
      ],
    },
  };
  if (DRY) { console.log('  [dry] PUT /whats-on-page payload size:', JSON.stringify(data).length, 'chars'); return; }
  const r = await api(ctx, '/whats-on-page', { method: 'PUT', body: { data } });
  return r.data;
}

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);
  console.log('\n[1/1] What’s On Page single type…');
  await upsertWhatsOnPage();
  console.log('  ✓ whats-on-page upserted');
  console.log('\nDone.');
}
main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
