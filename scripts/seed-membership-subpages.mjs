#!/usr/bin/env node
/**
 * Seed membership subpages (start-application, …) into Strapi as
 * Facility entries with category="membership".
 *
 * Usage: node scripts/seed-membership-subpages.mjs [--dry-run]
 *
 * Why facility? `/membership/:slug` routes through VenueDetailPage with
 * section="membership", which hits `/facilities?filters[slug][$eq]=…`.
 * Membership subpages reuse the venue/facility shape (hero image,
 * operating hours, location/contact, downloads), so the same schema
 * fits — we just gate them by category so they don't appear in fitness
 * or kids listings.
 */
import { initEnv, api, findOneBySlug, isDryRun } from './seed-helpers.mjs';

const DRY = isDryRun();
const ctx = initEnv();

const SUBPAGES = [
  {
    slug: 'start-application',
    name: 'Start an Application',
    category: 'membership',
    categoryLabel: 'Application',
    description:
      'Your journey to becoming a Member at The American Club starts here.\n\nGet to know the requirements to start your application.\n\nAll the items outlined in the Application Checklist must be submitted. Incomplete applications will not be accepted.',
    locationLevel: 'Level 1 Lobby (Opposite Tradewinds)',
    phone: '6737 3411',
    email: 'membership@amclub.org.sg',
    operatingHoursSections: [
      {
        title: 'Membership Office Operating Hours',
        rows: [
          { dayRange: 'Monday to Friday', time: '9:00 AM – 7:00 PM' },
          { dayRange: 'Saturday', time: '10:00 AM – 6:00 PM' },
          { dayRange: '', time: 'Closed on Sunday' },
        ],
      },
    ],
    locationContact: {
      locationLevel: 'Level 1 Lobby (Opposite Tradewinds)',
      phone: '6737 3411',
      email: 'membership@amclub.org.sg',
    },
    downloads: {
      heading: "Forms You'll Need",
      items: [
        { label: 'Application Checklist',              href: '/documents/membership/forms/application-checklist.pdf',              isExternal: true, variant: 'outline' },
        { label: 'Application Form',                   href: '/documents/membership/forms/membership-application-form.pdf',        isExternal: true, variant: 'outline' },
        { label: 'Endorsement Form',                   href: '/documents/membership/forms/endorsement-form.pdf',                   isExternal: true, variant: 'outline' },
        { label: 'Junior Membership Application Form', href: 'https://amclub.jotform.com/253623954879979',                           isExternal: true, variant: 'outline' },
        { label: 'PDPA Acknowledgement Form',          href: '/documents/membership/forms/pdpa-acknowledgement-form.pdf',          isExternal: true, variant: 'outline' },
        { label: 'GIRO Payment Form',                  href: '/documents/membership/forms/giro-payment-form.pdf',                  isExternal: true, variant: 'outline' },
        { label: 'Car Registration Form',              href: 'https://amclub.jotform.com/250688995352877',                          isExternal: true, variant: 'outline' },
      ],
    },
  },
];

async function upsertFacility(entry) {
  const existing = await findOneBySlug(ctx, 'facilities', entry.slug);
  const body = { data: entry };
  if (existing) {
    if (DRY) { console.log(`  [dry] PUT /facilities/${existing.documentId} (${entry.slug})`); return; }
    await api(ctx, `/facilities/${existing.documentId}`, { method: 'PUT', body });
    console.log(`  ✓ updated ${entry.slug} (${existing.documentId})`);
  } else {
    if (DRY) { console.log(`  [dry] POST /facilities (${entry.slug})`); return; }
    const r = await api(ctx, '/facilities', { method: 'POST', body });
    console.log(`  ✓ created ${entry.slug} (${r.data.documentId})`);
  }
}

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);
  console.log(`\nUpserting ${SUBPAGES.length} membership subpage(s)…`);
  for (const sp of SUBPAGES) await upsertFacility(sp);
  console.log('\nDone.');
}

main().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});
