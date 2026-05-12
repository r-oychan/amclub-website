import { Link } from 'react-router';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';
import { CtaIcon } from '../components/shared/CtaIcon';

const START_APPLICATION_URL =
  'https://469380fc.delivery.rocketcdn.me/wp-content/uploads/2022/06/CSV-MO-08_Application_Form_for_Corporate_Membership.pdf';
const PAYMENT_PLANS_URL =
  'https://469380fc.delivery.rocketcdn.me/wp-content/uploads/2025/03/CSV-MO-03-Membership-Joining-Fees-Payment-Plans-Mar-2025.pdf';

interface IndividualCard {
  name: string;
  description: string;
  feeLabel: string;
  feeAmount: string;
  breakdown: string[];
  badge?: string;
  badgeTone?: 'positive' | 'negative';
}

const INDIVIDUAL_CARDS: IndividualCard[] = [
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
    description: 'Lifetime membership for U.S./Canadian military personnel and qualifying professionals',
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
];

interface CorporateCard {
  className: string;
  nominees: string;
  joiningFee: string;
  annualFee: string;
}

const CORPORATE_CARDS: CorporateCard[] = [
  { className: 'Class A', nominees: '3 Nominees', joiningFee: '$109,000', annualFee: '$37,726.50' },
  { className: 'Class B', nominees: '2 Nominees', joiningFee: '$81,750', annualFee: '$27,876' },
  { className: 'Class C', nominees: '1 Nominees', joiningFee: '$54,500', annualFee: '$18,025.50' },
];

const PILL_CLASS =
  'inline-flex items-center gap-2 bg-white rounded-full text-primary uppercase hover:shadow-md transition-shadow border border-primary/10';
const PILL_STYLE = {
  padding: '12px 16px 12px 24px',
  fontSize: '13.6px',
  fontWeight: 700,
  letterSpacing: '0.04em',
  boxShadow: 'rgba(32, 99, 171, 0.07) 0px 20px 19px -12px',
} as const;

function ExternalPill({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={PILL_CLASS} style={PILL_STYLE}>
      {label}
      <CtaIcon name="arrow" size={20} className="text-accent" />
    </a>
  );
}

function Badge({ tone, children }: { tone?: 'positive' | 'negative'; children: React.ReactNode }) {
  const isPositive = tone !== 'negative';
  return (
    <span
      className="inline-flex items-center self-start uppercase"
      style={{
        backgroundColor: isPositive ? 'rgba(0, 30, 98, 0.06)' : 'rgba(223, 70, 97, 0.08)',
        color: isPositive ? '#001E62' : '#DF4661',
        padding: '6px 12px',
        borderRadius: '999px',
        fontSize: '11.2px',
        fontWeight: 700,
        letterSpacing: '0.06em',
      }}
    >
      {children}
    </span>
  );
}

function IndividualCardView({ card }: { card: IndividualCard }) {
  return (
    <div
      className="bg-white flex flex-col"
      style={{ padding: '32px 24px', gap: '20px', borderRadius: '4px' }}
    >
      {card.badge && <Badge tone={card.badgeTone}>{card.badge}</Badge>}
      <h3
        className="font-heading text-primary"
        style={{
          fontSize: '24px',
          fontWeight: 300,
          fontStyle: 'italic',
          letterSpacing: '-0.72px',
          lineHeight: '28.8px',
        }}
      >
        {card.name}
      </h3>
      <p className="text-text-dark/80" style={{ fontSize: '15.2px', lineHeight: '22px' }}>
        {card.description}
      </p>
      <div className="flex flex-col" style={{ gap: '6px', marginTop: '4px' }}>
        <p
          className="text-text-dark/60 uppercase"
          style={{ fontSize: '11.2px', fontWeight: 700, letterSpacing: '0.06em' }}
        >
          {card.feeLabel}
        </p>
        <p
          className="font-heading text-primary"
          style={{
            fontSize: '28.8px',
            fontWeight: 300,
            fontStyle: 'italic',
            letterSpacing: '-0.864px',
            lineHeight: '32px',
          }}
        >
          {card.feeAmount}
        </p>
      </div>
      <div className="flex flex-col" style={{ gap: '4px', marginTop: '4px' }}>
        <p
          className="text-text-dark/60 uppercase"
          style={{ fontSize: '11.2px', fontWeight: 700, letterSpacing: '0.06em' }}
        >
          Breakdown
        </p>
        {card.breakdown.map((line) => (
          <p key={line} className="text-text-dark" style={{ fontSize: '14.4px', lineHeight: '21px' }}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function CorporateCardView({ card }: { card: CorporateCard }) {
  return (
    <div
      className="bg-white flex flex-col"
      style={{ padding: '32px 24px', gap: '20px', borderRadius: '4px' }}
    >
      <Badge tone="positive">4-Year Plan Available</Badge>
      <h3
        className="font-heading text-primary"
        style={{
          fontSize: '24px',
          fontWeight: 300,
          fontStyle: 'italic',
          letterSpacing: '-0.72px',
          lineHeight: '28.8px',
        }}
      >
        {card.className}
      </h3>
      <p
        className="text-text-dark/80"
        style={{ fontSize: '17.6px', fontWeight: 700, lineHeight: '24px' }}
      >
        {card.nominees}
      </p>
      <div className="flex flex-col" style={{ gap: '6px', marginTop: '4px' }}>
        <p
          className="text-text-dark/60 uppercase"
          style={{ fontSize: '11.2px', fontWeight: 700, letterSpacing: '0.06em' }}
        >
          Joining Fee (w/GST)
        </p>
        <p
          className="font-heading text-primary"
          style={{
            fontSize: '28.8px',
            fontWeight: 300,
            fontStyle: 'italic',
            letterSpacing: '-0.864px',
            lineHeight: '32px',
          }}
        >
          {card.joiningFee}
        </p>
      </div>
      <div className="flex flex-col" style={{ gap: '6px', marginTop: '4px' }}>
        <p
          className="text-text-dark/60 uppercase"
          style={{ fontSize: '11.2px', fontWeight: 700, letterSpacing: '0.06em' }}
        >
          Annual Fee (w/GST)
        </p>
        <p
          className="font-heading text-primary"
          style={{
            fontSize: '28.8px',
            fontWeight: 300,
            fontStyle: 'italic',
            letterSpacing: '-0.864px',
            lineHeight: '32px',
          }}
        >
          {card.annualFee}
        </p>
      </div>
    </div>
  );
}

export default function JoiningFeesPage() {
  return (
    <>
      <DetailHeroBanner />
      <DetailBreadcrumb parentLabel="Membership" parentHref="/membership" currentName="Joining Fees" />

      {/* ── Individual Membership Categories ── */}
      <section className="bg-bg pb-[80px]">
        <div className="max-w-7xl mx-auto px-10 flex flex-col" style={{ gap: '40px' }}>
          <div className="text-center flex flex-col" style={{ gap: '16px' }}>
            <h2
              className="font-heading text-primary"
              style={{
                fontSize: '38.4px',
                fontWeight: 300,
                fontStyle: 'italic',
                letterSpacing: '-1.152px',
                lineHeight: '42.24px',
              }}
            >
              Individual Membership Categories
            </h2>
            <p
              className="text-text-dark/70 max-w-2xl mx-auto"
              style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
            >
              Five distinct membership types designed for different eligibility criteria
            </p>
            <div className="flex flex-wrap justify-center gap-3" style={{ marginTop: '8px' }}>
              <ExternalPill href={START_APPLICATION_URL} label="Start an Application" />
              <ExternalPill href={PAYMENT_PLANS_URL} label="View Payment Plans" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {INDIVIDUAL_CARDS.map((c) => (
              <IndividualCardView key={c.name} card={c} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Corporate Membership ── */}
      <section className="bg-bg pb-[80px]">
        <div className="max-w-7xl mx-auto px-10 flex flex-col" style={{ gap: '40px' }}>
          <div className="flex flex-col" style={{ gap: '24px' }}>
            <h2
              className="font-heading text-primary text-center"
              style={{
                fontSize: '38.4px',
                fontWeight: 300,
                fontStyle: 'italic',
                letterSpacing: '-1.152px',
                lineHeight: '42.24px',
              }}
            >
              Corporate Membership
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <p className="text-text-dark" style={{ fontSize: '17.6px', lineHeight: '26.4px' }}>
                The General Committee may at its discretion elect U.S. or Canadian corporations or
                partnerships incorporated, registered, or represented in Singapore as Corporate
                Members. Upon cessation of Corporate Membership, all Corporate Nominees, shall at the
                same time, cease to enjoy any of the facilities of the Club.
              </p>
              <p className="text-text-dark" style={{ fontSize: '17.6px', lineHeight: '26.4px' }}>
                Corporate Membership is not transferable and all fees paid for such Membership are
                non-refundable. Corporate Members are liable for the payment of all subscriptions,
                registration fees, and monies due on the accounts of their Nominees with the Club.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <ExternalPill href={START_APPLICATION_URL} label="Start an Application" />
              <ExternalPill href={PAYMENT_PLANS_URL} label="4-Year Payment Plan" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CORPORATE_CARDS.map((c) => (
              <CorporateCardView key={c.className} card={c} />
            ))}
          </div>
          <div
            className="bg-white flex flex-col"
            style={{ padding: '32px 28px', gap: '12px', borderRadius: '4px' }}
          >
            <h3
              className="font-heading text-primary"
              style={{
                fontSize: '22.4px',
                fontWeight: 300,
                fontStyle: 'italic',
                letterSpacing: '-0.672px',
                lineHeight: '28px',
              }}
            >
              Nominee Application / Re-nomination Fee
            </h3>
            <p className="text-text-dark" style={{ fontSize: '15.2px', lineHeight: '22.8px' }}>
              Each nomination or re-nomination requires a company letter or email and a payment of
              $8,310 ($2,725 Transfer Fee and a $5,585 Operations Surcharge, GST included). If a
              corporate place is left vacant, the prevailing Single Dues will apply.
            </p>
          </div>
        </div>
      </section>

      {/* ── Refund Policy / Additional Notes ── */}
      <section className="bg-bg pb-[80px]">
        <div className="max-w-7xl mx-auto px-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="flex flex-col" style={{ gap: '20px' }}>
            <h2
              className="font-heading text-primary"
              style={{
                fontSize: '26.56px',
                fontWeight: 300,
                fontStyle: 'italic',
                letterSpacing: '-0.797px',
              }}
            >
              Refund Policy
            </h2>
            <p className="text-text-dark" style={{ fontSize: '17.6px', lineHeight: '26.4px' }}>
              All fees paid are non-refundable with the exception below.
            </p>
            <p className="text-text-dark" style={{ fontSize: '15.2px', lineHeight: '22.8px' }}>
              Any Ordinary Member who resigns from the Club, by written notice within twelve (12)
              months, from date of issuance of temporary Membership card may apply for one half
              (1/2) of the one-time entrance fee which he or she has paid per 15(b) of The
              Constitution. This policy does not apply to payment plan applications.
            </p>
            <p className="text-text-dark" style={{ fontSize: '15.2px', lineHeight: '22.8px' }}>
              Grant of any such refund shall be at the discretion of the General Committee.
            </p>
          </div>
          <div className="flex flex-col" style={{ gap: '20px' }}>
            <h2
              className="font-heading text-primary"
              style={{
                fontSize: '26.56px',
                fontWeight: 300,
                fontStyle: 'italic',
                letterSpacing: '-0.797px',
              }}
            >
              Additional Notes
            </h2>
            <ul className="list-disc pl-5 flex flex-col" style={{ gap: '10px' }}>
              {[
                'All fees are inclusive of prevailing Goods and Services Tax (GST).',
                'Each application for Membership to The American Club is subject to acceptance by the General Committee.',
                'The Club reserves the right to check references and verify employment.',
                'The Club reserves the right to amend the fees and update any information without any prior notice.',
              ].map((line) => (
                <li
                  key={line}
                  className="text-text-dark"
                  style={{ fontSize: '15.2px', lineHeight: '22.8px' }}
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Back link ── */}
      <section className="py-10 bg-bg">
        <div className="max-w-7xl mx-auto px-10">
          <Link
            to="/membership"
            className="inline-flex items-center gap-2.5 font-bold uppercase text-primary hover:text-accent transition-colors"
            style={{ fontSize: '14.4px', letterSpacing: '0.576px' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="#DF4661"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Membership
          </Link>
        </div>
      </section>
    </>
  );
}
