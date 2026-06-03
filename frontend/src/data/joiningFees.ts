// Static fallback content for /membership/joining-fees. Mirrors the
// `joining-fees-page` Strapi single-type. When the CMS entry is missing
// or any branch comes back empty, the page falls back to this object.

export interface JoiningFeesLink {
  label: string;
  href: string;
  isExternal?: boolean;
  // Visual variant for the rendered button.
  //   primary → dark-blue filled pill (call-to-action)
  //   accent  → pink filled pill (secondary action)
  //   outline → white pill with subtle border (tertiary / quiet action)
  variant?: 'primary' | 'accent' | 'outline';
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

/**
 * Card shape used for the Supplementary Membership Categories section.
 * Same `shared.priced-card` Strapi component as the pricing tiers (so
 * the admin uses one familiar editor), but the supplementary section
 * renders only `name`, `description` (markdown-aware), `cta`, and
 * `secondaryCta`. Pricing fields go unused here.
 */
export interface SupplementaryCard {
  name: string;
  description: string;
  cta?: JoiningFeesLink;
  secondaryCta?: JoiningFeesLink;
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
  supplementaryHeading: string;
  supplementarySubheading: string;
  supplementaryCards: SupplementaryCard[];
  refundHeading: string;
  refundBody: string;
  additionalNotesHeading: string;
  additionalNotes: string[];
}

const START_APPLICATION_URL = '/membership/start-application';
const PAYMENT_PLANS_URL = '/documents/membership/membership-joining-fees-payment-plans.pdf';
const MONTHLY_DUES_URL = '/documents/membership/monthly-dues.pdf';
const CORPORATE_APPLICATION_URL =
  '/documents/membership/csv-mo-08-application-form-corporate-membership.pdf';
const CORPORATE_4_YEAR_PLAN_URL =
  '/documents/membership/corporate-membership-4-year-payment-plan.jpg';

export const JOINING_FEES_FALLBACK: JoiningFeesData = {
  individualHeading: 'Individual Membership Categories',
  individualSubheading: 'Five distinct membership types designed for different eligibility criteria',
  individualCtas: [
    { label: 'Start an Application', href: START_APPLICATION_URL, variant: 'primary' },
    { label: 'View Payment Plans', href: PAYMENT_PLANS_URL, isExternal: true, variant: 'accent' },
    { label: 'Monthly Dues', href: MONTHLY_DUES_URL, isExternal: true, variant: 'outline' },
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
    { label: 'Start an Application', href: CORPORATE_APPLICATION_URL, isExternal: true, variant: 'primary' },
    { label: '4-Year Payment Plan', href: CORPORATE_4_YEAR_PLAN_URL, isExternal: true, variant: 'outline' },
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
  // Supplementary Membership Categories — dev-only section. Lives here as
  // the canonical source for now (CMS PUTs for the supplementaryCards
  // component field are silently dropped on dev's running Strapi until the
  // component-link table sync resolves). When/if the CMS surfaces the
  // populated cards, the JoiningFeesPage data picker will switch over
  // automatically via `normalizeSupplementaryCards`.
  supplementaryHeading: 'Supplementary Membership Categories',
  supplementarySubheading: '',
  supplementaryCards: [
    {
      name: 'Junior Membership',
      description:
        "Junior Membership is open to Members' children who are aged between 12 and 24 years old. Monthly fees apply.\n\n" +
        '**Registration of Children Under the Age of 12**\n' +
        'Children under 12 must be accompanied by their parents at all times. Please register your children under your family membership here, if you have not.',
      cta: { label: 'APPLY NOW', href: 'https://amclub.jotform.com/253623954879979', isExternal: true, variant: 'accent' },
      secondaryCta: { label: 'REGISTER HERE', href: '#', isExternal: false, variant: 'accent' },
    },
    {
      name: 'Visiting Membership',
      description:
        'Visiting Memberships are designed to accommodate visitors for up to 90 days (can be split into three applications) in a calendar year. The following are eligible to apply for Visiting Membership, upon the nomination of any active Member.\n\n' +
        '**Type A**\n' +
        'Children of current Members, between 21 and 24 years old, who are full-time students of any recognized educational institution outside of Singapore and non-Singapore residents. Documentary proof is required.\n\n' +
        '**Fees:** S$210 per month or S$52.50 per week or part thereof per person.\n\n' +
        '[Register here](#)\n\n' +
        '**Type B**\n' +
        'Visiting relatives (no age requirement) or children of Members who are 25 years old and above and non-Singapore residents.\n\n' +
        '**Fees:** S$248.20 per month or S$62.05 per week or part thereof per person.\n\n' +
        '[Register here](#)\n\n' +
        '**Type C**\n' +
        'Any person or family of good standing, on social visit to Singapore.\n\n' +
        '**Fees:** S$615.80 per month or S$153.95 per week or part thereof.\n\n' +
        '[Register here](#)\n\n' +
        '**Type D**\n' +
        'Any Member who is on Absent Status.\n\n' +
        '**Fees:**\n' +
        'Family Membership: S$226.72 per month or S$65 per week or part thereof\n' +
        'Single Membership: S$183.12 per month or S$52.50 per week or part thereof\n\n' +
        '[Register here](#)',
    },
    {
      name: 'Dependent Senior Citizen Restricted Membership',
      description:
        'Members with parents aged 65 years old and above and reside permanently in the same household may apply for a Dependent Senior Citizen Restricted Membership.\n\n' +
        '**Restrictions:**\n' +
        "Membership and fees are subject to the General Committee's (GC) approval; Dependents may not vote at General Meetings and not go on Absent Status. An annual and monthly usage fee apply. All charges will be linked to the main Membership account.\n\n" +
        '_Terms and conditions apply._',
      cta: { label: 'REGISTER HERE', href: '#', isExternal: false, variant: 'accent' },
    },
    {
      name: 'Absent and Resignation Status',
      description:
        "If you're preparing to move away from Singapore and resign, please contact the membership office for information on Absentee Status.\n\n" +
        'Our fully paid Ordinary, Service, and Associate Members have the option of going on Absentee Status. Absentee Status is a wonderful privilege, which is available for $1,170 (family) or $945 (single) for a five year period. As an Absentee Member, after you have left Singapore for a minimum of six months, you may come back and use the Club three times a year for up to ninety days for a nominal fee. If you return to Singapore within five years, we will refund you the prorated difference of your $1,170 (or $945) fee and you can restart your membership for only $110. Absent status is extendable on a five-year period at the prevailing fee.',
      cta: { label: 'Absent Status Application Form', href: '#', isExternal: false, variant: 'accent' },
      secondaryCta: { label: 'Resignation Advisory Form', href: '#', isExternal: false, variant: 'accent' },
    },
  ],
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
