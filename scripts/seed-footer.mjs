#!/usr/bin/env node
// Seed the `footer` single type. Mirrors the data currently hardcoded
// in frontend/src/components/layout/Footer.tsx so the deployed footer
// row matches what the page renders today. Footer.tsx still uses the
// hardcoded data as a fallback — once it's refactored to consume
// /api/footer, this seed becomes the source of truth.

import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { initEnv, api, uploadFile, publishDocument, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY = isDryRun();
const ctx = initEnv();

const EXPLORE_LINKS = [
  { label: 'Dining & Retail', href: '/dining' },
  { label: 'Fitness & Wellness', href: '/fitness' },
  { label: 'Kids', href: '/kids' },
  { label: 'Private Events & Catering', href: '/event-spaces' },
  { label: 'Membership', href: '/membership' },
  { label: 'Events Calendar', href: '/whats-on' },
];

const ABOUT_LINKS = [
  { label: 'Club News', href: '/home-sub/news' },
  { label: 'Gallery', href: '/home-sub/gallery' },
  { label: 'Advertising & Sponsorships', href: '/home-sub/advertise-with-us' },
  { label: 'Contact Us', href: '/home-sub/contact-us' },
];

const MEMBER_LINKS = [
  { label: 'Login', href: 'https://amclub-portal.iontone.com/#/login', isExternal: true },
  { label: 'Reciprocal Clubs', href: '/membership/reciprocal-clubs' },
  { label: 'Refer a Friend', href: '/membership/referal' },
  { label: 'Niche Group Membership', href: '/membership/niche-group-membership' },
];

(async () => {
  console.log(`Seed target: ${ctx.BASE}`);
  let logoId = null;
  const logoPath = join(ROOT, 'media', 'branding', 'logo.webp');
  if (existsSync(logoPath)) {
    if (DRY) { console.log('  [dry] upload logo.webp'); }
    else {
      const r = await uploadFile(ctx, logoPath);
      logoId = r?.id ?? null;
      console.log(`  ✓ uploaded logo (id=${logoId})`);
    }
  } else {
    console.warn('  ! logo.webp not found under media/branding/');
  }
  const payload = {
    logo: logoId,
    address: '10 Claymore Hill Singapore, 229573',
    phone: '+65 6737 3411',
    email: 'info@amclub.org.sg',
    columns: [
      { title: 'Explore the Club', links: EXPLORE_LINKS },
      { title: 'About Us', links: ABOUT_LINKS },
      { title: 'Member', links: MEMBER_LINKS },
    ],
    copyright: '© 2026 The American Club Singapore® All rights reserved.',
    publishedAt: new Date().toISOString(),
  };
  if (DRY) {
    console.log('  [dry] PUT /footer payload:', JSON.stringify(payload, null, 2).slice(0, 500));
    return;
  }
  await api(ctx, '/footer', { method: 'PUT', body: { data: payload } });
  await publishDocument(ctx, 'footer');
  console.log('  ↻ upserted footer');
  console.log('\n✓ Done.');
})().catch((err) => { console.error(err); process.exit(1); });
