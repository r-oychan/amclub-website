#!/usr/bin/env node
/**
 * Seed ReferralPage content into Strapi.
 * Usage: node scripts/seed-referral-page.mjs [--dry-run]
 */
import { initEnv, api, isDryRun } from './seed-helpers.mjs';

const DRY = isDryRun();
const ctx = initEnv();

const data = {
  title: 'Refer a Friend',
  heading: 'Refer a Friend',
  body:
    'Introduce a friend to become a Member of The American Club and get rewarded with Club dining vouchers.',
  cta: {
    label: 'Make a Referral',
    href: 'https://amclub.jotform.com/250639099479878',
    isExternal: true,
    variant: 'primary',
  },
  rewardsLabel: 'Rewards',
  rewardsSubLabel: '(Club Dining Vouchers)',
  columnHeadings: {
    type: 'Referred Membership Type',
    referrer: 'Referrer',
    newMember: 'New Member',
  },
  rows: [
    { type: 'Ordinary', referrer: '$500', newMember: '$250' },
    { type: 'Annual Payment Plan', referrer: '$200', newMember: '$100' },
    { type: 'Term', referrer: '$200', newMember: '$100' },
  ],
  footnote:
    '*Referral form must be completed to be eligible for rewards. Each referral is valid for six months only.',
};

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);
  if (DRY) {
    console.log('  [dry] PUT /referral-page payload size:', JSON.stringify(data).length, 'chars');
    return;
  }
  await api(ctx, '/referral-page', { method: 'PUT', body: { data } });
  console.log('  ✓ referral-page upserted');
}

main().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});
