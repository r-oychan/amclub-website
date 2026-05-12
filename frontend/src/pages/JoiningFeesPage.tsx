import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { fetchAPI } from '../lib/api';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';
import { CtaIcon } from '../components/shared/CtaIcon';
import {
  JOINING_FEES_FALLBACK,
  type JoiningFeesData,
  type PricedCard,
  type CorporateClassCard,
  type JoiningFeesLink,
} from '../data/joiningFees';

type StrapiLink = { label: string; href?: string; isExternal?: boolean };

interface StrapiJoiningFeesPage {
  title?: string;
  individualHeading?: string;
  individualSubheading?: string;
  individualCtas?: StrapiLink[];
  individualCards?: PricedCard[];
  corporateHeading?: string;
  corporateIntro1?: string;
  corporateIntro2?: string;
  corporateCtas?: StrapiLink[];
  corporateCards?: CorporateClassCard[];
  nominationFeeHeading?: string;
  nominationFeeBody?: string;
  refundHeading?: string;
  refundBody?: string;
  additionalNotesHeading?: string;
  additionalNotes?: { text: string }[];
}

const PILL_CLASS =
  'inline-flex items-center gap-2 bg-white rounded-full text-primary uppercase hover:shadow-md transition-shadow border border-primary/10';
const PILL_STYLE = {
  padding: '12px 16px 12px 24px',
  fontSize: '13.6px',
  fontWeight: 700,
  letterSpacing: '0.04em',
  boxShadow: 'rgba(32, 99, 171, 0.07) 0px 20px 19px -12px',
} as const;

function CtaPill({ link }: { link: JoiningFeesLink }) {
  const inner = (
    <>
      {link.label}
      <CtaIcon name="arrow" size={20} className="text-accent" />
    </>
  );
  return link.isExternal ? (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={PILL_CLASS} style={PILL_STYLE}>
      {inner}
    </a>
  ) : (
    <Link to={link.href} className={PILL_CLASS} style={PILL_STYLE}>
      {inner}
    </Link>
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

function IndividualCardView({ card }: { card: PricedCard }) {
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

function CorporateCardView({ card }: { card: CorporateClassCard }) {
  return (
    <div
      className="bg-white flex flex-col"
      style={{ padding: '32px 24px', gap: '20px', borderRadius: '4px' }}
    >
      {card.badge && <Badge tone="positive">{card.badge}</Badge>}
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

function pickArr<T>(api: T[] | undefined, fallback: T[]): T[] {
  return api && api.length > 0 ? api : fallback;
}
function pickStr(api: string | undefined, fallback: string): string {
  return api && api.trim() ? api : fallback;
}
function normalizeLinks(api: StrapiLink[] | undefined, fallback: JoiningFeesLink[]): JoiningFeesLink[] {
  if (!api || api.length === 0) return fallback;
  return api.map((l) => ({
    label: l.label,
    href: l.href ?? '#',
    isExternal: l.isExternal,
  }));
}

export function JoiningFeesView({ data }: { data: JoiningFeesData }) {
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
              {data.individualHeading}
            </h2>
            <p
              className="text-text-dark/70 max-w-2xl mx-auto"
              style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
            >
              {data.individualSubheading}
            </p>
            {data.individualCtas.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3" style={{ marginTop: '8px' }}>
                {data.individualCtas.map((c) => (
                  <CtaPill key={c.label} link={c} />
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {data.individualCards.map((c) => (
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
              {data.corporateHeading}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <p className="text-text-dark" style={{ fontSize: '17.6px', lineHeight: '26.4px' }}>
                {data.corporateIntro1}
              </p>
              <p className="text-text-dark" style={{ fontSize: '17.6px', lineHeight: '26.4px' }}>
                {data.corporateIntro2}
              </p>
            </div>
            {data.corporateCtas.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3">
                {data.corporateCtas.map((c) => (
                  <CtaPill key={c.label} link={c} />
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {data.corporateCards.map((c) => (
              <CorporateCardView key={c.className} card={c} />
            ))}
          </div>
          {(data.nominationFeeHeading || data.nominationFeeBody) && (
            <div
              className="bg-white flex flex-col"
              style={{ padding: '32px 28px', gap: '12px', borderRadius: '4px' }}
            >
              {data.nominationFeeHeading && (
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
                  {data.nominationFeeHeading}
                </h3>
              )}
              {data.nominationFeeBody && (
                <p className="text-text-dark" style={{ fontSize: '15.2px', lineHeight: '22.8px' }}>
                  {data.nominationFeeBody}
                </p>
              )}
            </div>
          )}
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
              {data.refundHeading}
            </h2>
            {data.refundBody.split('\n\n').map((p, i) => (
              <p
                key={i}
                className="text-text-dark"
                style={{ fontSize: i === 0 ? '17.6px' : '15.2px', lineHeight: i === 0 ? '26.4px' : '22.8px' }}
              >
                {p}
              </p>
            ))}
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
              {data.additionalNotesHeading}
            </h2>
            <ul className="list-disc pl-5 flex flex-col" style={{ gap: '10px' }}>
              {data.additionalNotes.map((line) => (
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

export default function JoiningFeesPage() {
  const [data, setData] = useState<JoiningFeesData>(JOINING_FEES_FALLBACK);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const api = await fetchAPI<StrapiJoiningFeesPage>('/joining-fees-page', {
        'populate[individualCtas]': '*',
        'populate[individualCards]': '*',
        'populate[corporateCtas]': '*',
        'populate[corporateCards]': '*',
        'populate[additionalNotes]': '*',
      });
      if (cancelled || !api) return;
      const fb = JOINING_FEES_FALLBACK;
      setData({
        individualHeading: pickStr(api.individualHeading, fb.individualHeading),
        individualSubheading: pickStr(api.individualSubheading, fb.individualSubheading),
        individualCtas: normalizeLinks(api.individualCtas, fb.individualCtas),
        individualCards: pickArr(api.individualCards, fb.individualCards),
        corporateHeading: pickStr(api.corporateHeading, fb.corporateHeading),
        corporateIntro1: pickStr(api.corporateIntro1, fb.corporateIntro1),
        corporateIntro2: pickStr(api.corporateIntro2, fb.corporateIntro2),
        corporateCtas: normalizeLinks(api.corporateCtas, fb.corporateCtas),
        corporateCards: pickArr(api.corporateCards, fb.corporateCards),
        nominationFeeHeading: pickStr(api.nominationFeeHeading, fb.nominationFeeHeading),
        nominationFeeBody: pickStr(api.nominationFeeBody, fb.nominationFeeBody),
        refundHeading: pickStr(api.refundHeading, fb.refundHeading),
        refundBody: pickStr(api.refundBody, fb.refundBody),
        additionalNotesHeading: pickStr(api.additionalNotesHeading, fb.additionalNotesHeading),
        additionalNotes:
          api.additionalNotes && api.additionalNotes.length > 0
            ? api.additionalNotes.map((n) => n.text)
            : fb.additionalNotes,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <JoiningFeesView data={data} />;
}
