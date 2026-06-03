// 2026-06-03 — Add a Supplementary Membership Categories section to
// dev's /membership/joining-fees page. Schema fields added in the
// accompanying commit; this script populates them.
//
// Run: SEED_ENV=dev node scripts/patch-2026-06-03-joining-fees-supplementary.mjs
//
// Idempotent — re-running on an env where the section is already
// populated leaves the existing supplementaryCards alone (compares
// card names by set).

import { initEnv, api } from './seed-helpers.mjs';

const ctx = initEnv();
const DRY = process.argv.includes('--dry-run');

// User-supplied URLs:
const JUNIOR_APPLY_URL = 'https://amclub.jotform.com/253623954879979';

// URLs the user didn't specify — left as `#` for now, can be edited in
// /admin (or supplied for a follow-up patch).
const TBD = '#';

const HEADING = 'Supplementary Membership Categories';
const SUBHEADING = '';

const CARDS = [
  // ---------- Junior Membership ----------
  {
    name: 'Junior Membership',
    description:
      "Junior Membership is open to Members' children who are aged between 12 and 24 years old. Monthly fees apply.\n\n" +
      '**Registration of Children Under the Age of 12**\n' +
      'Children under 12 must be accompanied by their parents at all times. ' +
      'Please register your children under your family membership here, if you have not.',
    cta: {
      label: 'APPLY NOW', href: JUNIOR_APPLY_URL, caption: null,
      isExternal: true, bordered: false, variant: 'primary', icon: 'arrow',
    },
    secondaryCta: {
      label: 'REGISTER HERE', href: TBD, caption: null,
      isExternal: false, bordered: false, variant: 'primary', icon: 'arrow',
    },
  },

  // ---------- Visiting Membership ----------
  // Four Type sections (A, B, C, D) each with its own description, fees,
  // and Register button. Encoded in description with markdown so the
  // rendered card has bold Type headings and inline "Register here"
  // links (no URLs supplied for these — placeholders).
  {
    name: 'Visiting Membership',
    description:
      'Visiting Memberships are designed to accommodate visitors for up to 90 days ' +
      '(can be split into three applications) in a calendar year. The following are ' +
      'eligible to apply for Visiting Membership, upon the nomination of any active Member.\n\n' +
      '**Type A**\n' +
      'Children of current Members, between 21 and 24 years old, who are full-time students ' +
      'of any recognized educational institution outside of Singapore and non-Singapore residents. ' +
      'Documentary proof is required.\n\n' +
      '**Fees:** S$210 per month or S$52.50 per week or part thereof per person.\n\n' +
      `[Register here](${TBD})\n\n` +
      '**Type B**\n' +
      'Visiting relatives (no age requirement) or children of Members who are 25 years old ' +
      'and above and non-Singapore residents.\n\n' +
      '**Fees:** S$248.20 per month or S$62.05 per week or part thereof per person.\n\n' +
      `[Register here](${TBD})\n\n` +
      '**Type C**\n' +
      'Any person or family of good standing, on social visit to Singapore.\n\n' +
      '**Fees:** S$615.80 per month or S$153.95 per week or part thereof.\n\n' +
      `[Register here](${TBD})\n\n` +
      '**Type D**\n' +
      'Any Member who is on Absent Status.\n\n' +
      '**Fees:**\n' +
      'Family Membership: S$226.72 per month or S$65 per week or part thereof\n' +
      'Single Membership: S$183.12 per month or S$52.50 per week or part thereof\n\n' +
      `[Register here](${TBD})`,
    // No primary cta — register links live inline.
  },

  // ---------- Dependent Senior Citizen Restricted Membership ----------
  {
    name: 'Dependent Senior Citizen Restricted Membership',
    description:
      'Members with parents aged 65 years old and above and reside permanently in the same ' +
      'household may apply for a Dependent Senior Citizen Restricted Membership.\n\n' +
      '**Restrictions:**\n' +
      "Membership and fees are subject to the General Committee's (GC) approval; Dependents may " +
      'not vote at General Meetings and not go on Absent Status. An annual and monthly usage fee ' +
      'apply. All charges will be linked to the main Membership account.\n\n' +
      '_Terms and conditions apply._',
    cta: {
      label: 'REGISTER HERE', href: TBD, caption: null,
      isExternal: false, bordered: false, variant: 'primary', icon: 'arrow',
    },
  },

  // ---------- Absent Status and Resignation ----------
  {
    name: 'Absent and Resignation Status',
    description:
      "If you're preparing to move away from Singapore and resign, please contact the membership " +
      'office for information on Absentee Status.\n\n' +
      'Our fully paid Ordinary, Service, and Associate Members have the option of going on Absentee ' +
      'Status. Absentee Status is a wonderful privilege, which is available for $1,170 (family) or ' +
      '$945 (single) for a five year period. As an Absentee Member, after you have left Singapore ' +
      'for a minimum of six months, you may come back and use the Club three times a year for up ' +
      'to ninety days for a nominal fee. If you return to Singapore within five years, we will ' +
      'refund you the prorated difference of your $1,170 (or $945) fee and you can restart your ' +
      'membership for only $110. Absent status is extendable on a five-year period at the ' +
      'prevailing fee.',
    cta: {
      label: 'Absent Status Application Form', href: TBD, caption: null,
      isExternal: false, bordered: false, variant: 'primary', icon: 'arrow',
    },
    secondaryCta: {
      label: 'Resignation Advisory Form', href: TBD, caption: null,
      isExternal: false, bordered: false, variant: 'primary', icon: 'arrow',
    },
  },
];

async function main() {
  console.log(`[patch-2026-06-03-joining-fees-supplementary] target=${ctx.BASE} dry=${DRY}`);

  // First, read existing to see if already populated
  const r = await api(ctx, '/joining-fees-page?populate[supplementaryCards][populate]=*');
  const cur = r?.data;
  if (!cur) { console.log('  ✗ joining-fees-page singleton not initialised'); return; }

  const currentNames = new Set((cur.supplementaryCards || []).map((c) => c.name));
  const desiredNames = new Set(CARDS.map((c) => c.name));
  const sameSet =
    currentNames.size === desiredNames.size &&
    [...desiredNames].every((n) => currentNames.has(n));

  if (sameSet && cur.supplementaryHeading === HEADING) {
    console.log('  = already populated — skip');
    return;
  }

  if (DRY) {
    console.log(`  [dry] PUT supplementaryHeading + ${CARDS.length} cards`);
    return;
  }

  await api(ctx, '/joining-fees-page', {
    method: 'PUT',
    body: {
      data: {
        supplementaryHeading: HEADING,
        supplementarySubheading: SUBHEADING,
        supplementaryCards: CARDS,
      },
    },
  });
  console.log(`  ✓ updated  supplementaryHeading="${HEADING}"  cards=${CARDS.length}`);
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
