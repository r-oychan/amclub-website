#!/usr/bin/env node
/**
 * Seed JoiningFeesPage content into Strapi.
 * Usage: node scripts/seed-joining-fees-page.mjs [--dry-run]
 *
 * Content matches `frontend/src/data/joiningFees.ts` (the frontend
 * fallback). Until CMS persistence catches up, the deployed site reads
 * either the seeded entry or the fallback; both render identical copy.
 */
import { initEnv, api, isDryRun } from './seed-helpers.mjs';

const DRY = isDryRun();
const ctx = initEnv();

const START_APPLICATION_URL = '/membership/start-application';
const PAYMENT_PLANS_URL = '/documents/membership/membership-joining-fees-payment-plans.pdf';
const MONTHLY_DUES_URL = '/documents/membership/membership-joining-fees-payment-plans.pdf';

const breakdown = (lines) => lines.join('\n');

const data = {
  title: 'Membership Types & Joining Fees',
  individualHeading: 'Individual Membership Categories',
  individualSubheading:
    'Five distinct membership types designed for different eligibility criteria',
  individualCtas: [
    { label: 'Start an Application', href: START_APPLICATION_URL, isExternal: false, variant: 'primary' },
    { label: 'View Payment Plans', href: PAYMENT_PLANS_URL, isExternal: true, variant: 'accent' },
    { label: 'Monthly Dues', href: MONTHLY_DUES_URL, isExternal: true, variant: 'outline' },
  ],
  individualCards: [
    {
      name: 'Ordinary Membership',
      description: 'Lifetime, non-transferable membership for U.S. and Canadian citizens',
      feeLabel: 'Joining Fee (w/GST)',
      feeAmount: '$32,530',
      breakdown: breakdown(['Entrance Fee: $26,945.00', 'Operations Surcharge: $5,585.00']),
      badge: 'Payment Plan Available',
      badgeTone: 'positive',
    },
    {
      name: 'Service Membership',
      description:
        'Lifetime membership for U.S./Canadian military personnel and qualifying professionals',
      feeLabel: 'Joining Fee (w/GST)',
      feeAmount: '$19,057.50',
      breakdown: breakdown(['Entrance Fee: $13,472.50', 'Operations Surcharge: $5,585.00']),
      badge: 'Payment Plan Available',
      badgeTone: 'positive',
    },
    {
      name: 'Term Membership',
      description: 'One-year membership for non-U.S., non-Canadian, non-Singaporean residents',
      feeLabel: 'Joining Fee (w/GST)',
      feeAmount: '$10,286',
      breakdown: breakdown([
        'Entrance Fee: $8,276.00',
        'Operations Surcharge: $1,010.00',
        'Refundable Deposit: $1,000.00',
      ]),
    },
    {
      name: 'Associate Membership',
      description: 'Lifetime membership for those not eligible for Ordinary Membership',
      feeLabel: 'Joining Fee (w/GST)',
      feeAmount: '$88,888',
      breakdown: breakdown(['Entrance Fee: $83,303', 'Operations Surcharge: $5,585']),
      badge: 'Currently Closed',
      badgeTone: 'negative',
    },
    {
      name: 'Transferable Membership',
      description: 'Membership purchased on the secondary market',
      feeLabel: 'Transfer Fee (w/GST)',
      feeAmount: '$39,240',
      breakdown: breakdown(['Transfer Fee: $33,655', 'Operations Surcharge: $5,585']),
    },
  ],
  corporateHeading: 'Corporate Membership',
  corporateIntro1:
    'The General Committee may at its discretion elect U.S. or Canadian corporations or partnerships incorporated, registered, or represented in Singapore as Corporate Members. Upon cessation of Corporate Membership, all Corporate Nominees, shall at the same time, cease to enjoy any of the facilities of the Club.',
  corporateIntro2:
    'Corporate Membership is not transferable and all fees paid for such Membership are non-refundable. Corporate Members are liable for the payment of all subscriptions, registration fees, and monies due on the accounts of their Nominees with the Club.',
  corporateCtas: [
    { label: 'Start an Application', href: START_APPLICATION_URL, isExternal: false, variant: 'primary' },
    { label: '4-Year Payment Plan', href: PAYMENT_PLANS_URL, isExternal: true, variant: 'outline' },
  ],
  corporateCards: [
    { className: 'Class A', nominees: '3 Nominees', joiningFee: '$109,000', annualFee: '$37,726.50', badge: '4-Year Plan Available' },
    { className: 'Class B', nominees: '2 Nominees', joiningFee: '$81,750', annualFee: '$27,876',    badge: '4-Year Plan Available' },
    { className: 'Class C', nominees: '1 Nominees', joiningFee: '$54,500', annualFee: '$18,025.50', badge: '4-Year Plan Available' },
  ],
  nominationFeeHeading: 'Nominee Application / Re-nomination Fee',
  nominationFeeBody:
    'Each nomination or re-nomination requires a company letter or email and a payment of $8,310 ($2,725 Transfer Fee and a $5,585 Operations Surcharge, GST included). If a corporate place is left vacant, the prevailing Single Dues will apply.',
  refundHeading: 'Refund Policy',
  refundBody:
    'All fees paid are non-refundable with the exception below.\n\nAny Ordinary Member who resigns from the Club, by written notice within twelve (12) months, from date of issuance of temporary Membership card may apply for one half (1/2) of the one-time entrance fee which he or she has paid per 15(b) of The Constitution. This policy does not apply to payment plan applications.\n\nGrant of any such refund shall be at the discretion of the General Committee.',
  additionalNotesHeading: 'Additional Notes',
  additionalNotes: [
    { text: 'All fees are inclusive of prevailing Goods and Services Tax (GST).' },
    { text: 'Each application for Membership to The American Club is subject to acceptance by the General Committee.' },
    { text: 'The Club reserves the right to check references and verify employment.' },
    { text: 'The Club reserves the right to amend the fees and update any information without any prior notice.' },
  ],
};

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);
  if (DRY) {
    console.log('  [dry] PUT /joining-fees-page payload size:', JSON.stringify(data).length, 'chars');
    return;
  }
  await api(ctx, '/joining-fees-page', { method: 'PUT', body: { data } });
  console.log('  ✓ joining-fees-page upserted');
}

main().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});
