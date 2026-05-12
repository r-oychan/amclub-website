// Static fallback content for /membership/joining-fees. Mirrors the
// `joining-fees-page` Strapi single-type. When the CMS entry is missing
// or any branch comes back empty, the page falls back to this object.

export interface JoiningFeesLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface PricedCard {
  name: string;
  description: string;
  feeLabel: string;
  feeAmount: string;
  breakdown: string[];
  badge?: string;
  badgeTone?: 'positive' | 'negative';
}

export interface CorporateClassCard {
  className: string;
  nominees: string;
  joiningFee: string;
  annualFee: string;
  badge?: string;
}

export interface JoiningFeesData {
  individualHeading: string;
  individualSubheading: string;
  individualCtas: JoiningFeesLink[];
  individualCards: PricedCard[];
  corporateHeading: string;
  corporateIntro1: string;
  corporateIntro2: string;
  corporateCtas: JoiningFeesLink[];
  corporateCards: CorporateClassCard[];
  nominationFeeHeading: string;
  nominationFeeBody: string;
  refundHeading: string;
  refundBody: string;
  additionalNotesHeading: string;
  additionalNotes: string[];
}

const START_APPLICATION_URL =
  'https://469380fc.delivery.rocketcdn.me/wp-content/uploads/2022/06/CSV-MO-08_Application_Form_for_Corporate_Membership.pdf';
const PAYMENT_PLANS_URL =
  'https://469380fc.delivery.rocketcdn.me/wp-content/uploads/2025/03/CSV-MO-03-Membership-Joining-Fees-Payment-Plans-Mar-2025.pdf';

export const JOINING_FEES_FALLBACK: JoiningFeesData = {
  individualHeading: 'Individual Membership Categories',
  individualSubheading: 'Five distinct membership types designed for different eligibility criteria',
  individualCtas: [
    { label: 'Start an Application', href: START_APPLICATION_URL, isExternal: true },
    { label: 'View Payment Plans', href: PAYMENT_PLANS_URL, isExternal: true },
  ],
  individualCards: [
    {
      name: 'Ordinary Membership',
      description: 'Lifetime, non-transferable membership for U.S. and Canadian citizens',
      feeLabel: 'Joining Fee (w/GST)',
      feeAmount: '$32,530',
      breakdown: ['Entrance Fee: $26,945.00', 'Operations Surcharge: $5,585.00'],
      badge: 'Payment Plan Available',
      badgeTone: 'positive',
    },
    {
      name: 'Service Membership',
      description:
        'Lifetime membership for U.S./Canadian military personnel and qualifying professionals',
      feeLabel: 'Joining Fee (w/GST)',
      feeAmount: '$19,057.50',
      breakdown: ['Entrance Fee: $13,472.50', 'Operations Surcharge: $5,585.00'],
      badge: 'Payment Plan Available',
      badgeTone: 'positive',
    },
    {
      name: 'Term Membership',
      description: 'One-year membership for non-U.S., non-Canadian, non-Singaporean residents',
      feeLabel: 'Joining Fee (w/GST)',
      feeAmount: '$10,286',
      breakdown: [
        'Entrance Fee: $8,276.00',
        'Operations Surcharge: $1,010.00',
        'Refundable Deposit: $1,000.00',
      ],
    },
    {
      name: 'Associate Membership',
      description: 'Lifetime membership for those not eligible for Ordinary Membership',
      feeLabel: 'Joining Fee (w/GST)',
      feeAmount: '$88,888',
      breakdown: ['Entrance Fee: $83,303', 'Operations Surcharge: $5,585'],
      badge: 'Currently Closed',
      badgeTone: 'negative',
    },
    {
      name: 'Transferable Membership',
      description: 'Membership purchased on the secondary market',
      feeLabel: 'Transfer Fee (w/GST)',
      feeAmount: '$39,240',
      breakdown: ['Transfer Fee: $33,655', 'Operations Surcharge: $5,585'],
    },
  ],
  corporateHeading: 'Corporate Membership',
  corporateIntro1:
    'The General Committee may at its discretion elect U.S. or Canadian corporations or partnerships incorporated, registered, or represented in Singapore as Corporate Members. Upon cessation of Corporate Membership, all Corporate Nominees, shall at the same time, cease to enjoy any of the facilities of the Club.',
  corporateIntro2:
    'Corporate Membership is not transferable and all fees paid for such Membership are non-refundable. Corporate Members are liable for the payment of all subscriptions, registration fees, and monies due on the accounts of their Nominees with the Club.',
  corporateCtas: [
    { label: 'Start an Application', href: START_APPLICATION_URL, isExternal: true },
    { label: '4-Year Payment Plan', href: PAYMENT_PLANS_URL, isExternal: true },
  ],
  corporateCards: [
    {
      className: 'Class A',
      nominees: '3 Nominees',
      joiningFee: '$109,000',
      annualFee: '$37,726.50',
      badge: '4-Year Plan Available',
    },
    {
      className: 'Class B',
      nominees: '2 Nominees',
      joiningFee: '$81,750',
      annualFee: '$27,876',
      badge: '4-Year Plan Available',
    },
    {
      className: 'Class C',
      nominees: '1 Nominees',
      joiningFee: '$54,500',
      annualFee: '$18,025.50',
      badge: '4-Year Plan Available',
    },
  ],
  nominationFeeHeading: 'Nominee Application / Re-nomination Fee',
  nominationFeeBody:
    'Each nomination or re-nomination requires a company letter or email and a payment of $8,310 ($2,725 Transfer Fee and a $5,585 Operations Surcharge, GST included). If a corporate place is left vacant, the prevailing Single Dues will apply.',
  refundHeading: 'Refund Policy',
  refundBody:
    'All fees paid are non-refundable with the exception below.\n\nAny Ordinary Member who resigns from the Club, by written notice within twelve (12) months, from date of issuance of temporary Membership card may apply for one half (1/2) of the one-time entrance fee which he or she has paid per 15(b) of The Constitution. This policy does not apply to payment plan applications.\n\nGrant of any such refund shall be at the discretion of the General Committee.',
  additionalNotesHeading: 'Additional Notes',
  additionalNotes: [
    'All fees are inclusive of prevailing Goods and Services Tax (GST).',
    'Each application for Membership to The American Club is subject to acceptance by the General Committee.',
    'The Club reserves the right to check references and verify employment.',
    'The Club reserves the right to amend the fees and update any information without any prior notice.',
  ],
};
