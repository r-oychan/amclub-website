// Static fallback content for /membership/referal. Mirrors the
// `referral-page` Strapi single-type; used when the CMS entry isn't
// present or any branch is empty.

export interface ReferralRow {
  type: string;
  referrer: string;
  newMember: string;
}

export interface ReferralData {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  ctaIsExternal: boolean;
  rewardsLabel: string;
  rewardsSubLabel: string;
  columnHeadings: { type: string; referrer: string; newMember: string };
  rows: ReferralRow[];
  footnote: string;
}

export const REFERRAL_FALLBACK: ReferralData = {
  heading: 'Refer a Friend',
  body:
    'Introduce a friend to become a Member of The American Club and get rewarded with Club dining vouchers.',
  ctaLabel: 'Make a Referral',
  ctaHref: 'https://amclub.jotform.com/250639099479878',
  ctaIsExternal: true,
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
