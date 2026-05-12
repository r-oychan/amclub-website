import { Link } from 'react-router';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';
import { CtaIcon } from '../components/shared/CtaIcon';

const REFERRAL_FORM_URL = 'https://amclub.jotform.com/250639099479878';

interface Row {
  type: string;
  referrer: string;
  newMember: string;
}

const ROWS: Row[] = [
  { type: 'Ordinary', referrer: '$500', newMember: '$250' },
  { type: 'Annual Payment Plan', referrer: '$200', newMember: '$100' },
  { type: 'Term', referrer: '$200', newMember: '$100' },
];

export default function ReferralPage() {
  return (
    <>
      <DetailHeroBanner />
      <DetailBreadcrumb
        parentLabel="Membership"
        parentHref="/membership"
        currentName="Membership Referral"
      />

      <section className="bg-bg pb-[120px]">
        <div className="max-w-5xl mx-auto px-10 flex flex-col" style={{ gap: '48px' }}>
          <div className="text-center flex flex-col items-center" style={{ gap: '20px' }}>
            <h1
              className="font-heading text-primary"
              style={{
                fontSize: '38.4px',
                fontWeight: 300,
                fontStyle: 'italic',
                letterSpacing: '-1.152px',
                lineHeight: '42.24px',
              }}
            >
              Refer a Friend
            </h1>
            <p
              className="text-text-dark/80 max-w-2xl"
              style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
            >
              Introduce a friend to become a Member of The American Club and get rewarded with Club
              dining vouchers.
            </p>
            <a
              href={REFERRAL_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-white uppercase hover:opacity-90 transition-opacity"
              style={{
                padding: '12px 16px 12px 24px',
                fontSize: '13.6px',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              Make a Referral
              <CtaIcon name="arrow" size={20} className="text-secondary" />
            </a>
          </div>

          {/* Rewards table card */}
          <div
            className="bg-white relative"
            style={{ padding: '40px 48px', borderRadius: '8px' }}
          >
            <div
              className="absolute flex flex-col items-end"
              style={{ top: '24px', right: '32px', gap: '4px' }}
            >
              <div
                className="inline-flex items-center gap-2 text-accent"
                style={{ fontSize: '15.2px', fontStyle: 'italic', fontFamily: '"Noto Serif", serif' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M20 7H17.62C17.86 6.42 18 5.79 18 5.13C18 3.4 16.6 2 14.88 2C13.6 2 12.5 2.78 12 3.85C11.5 2.78 10.4 2 9.13 2C7.4 2 6 3.4 6 5.13C6 5.79 6.14 6.42 6.38 7H4C2.9 7 2 7.9 2 9V11C2 11.55 2.45 12 3 12V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V12C21.55 12 22 11.55 22 11V9C22 7.9 21.1 7 20 7ZM14.88 4C15.5 4 16 4.5 16 5.13C16 5.75 15.5 6.25 14.88 6.25H13.5V5.13C13.5 4.5 14 4 14.88 4ZM9.13 4C9.75 4 10.25 4.5 10.25 5.13V6.25H8.88C8.25 6.25 7.75 5.75 7.75 5.13C7.75 4.5 8.25 4 9.13 4ZM4 9H20V10H4V9ZM5 12H19V20H5V12ZM12 14L13.5 17H10.5L12 14Z"
                    fill="currentColor"
                  />
                </svg>
                Rewards
              </div>
              <p
                className="text-text-dark/60"
                style={{ fontSize: '12.8px', letterSpacing: '0.01em' }}
              >
                (Club Dining Vouchers)
              </p>
            </div>
            <div
              className="grid items-baseline"
              style={{ gridTemplateColumns: '1.4fr 1fr 1fr', columnGap: '24px', rowGap: '24px' }}
            >
              <p
                className="text-primary uppercase"
                style={{ fontSize: '13.6px', fontWeight: 700, letterSpacing: '0.04em' }}
              >
                Referred Membership Type
              </p>
              <p
                className="text-primary uppercase"
                style={{ fontSize: '13.6px', fontWeight: 700, letterSpacing: '0.04em' }}
              >
                Referrer
              </p>
              <p
                className="text-primary uppercase"
                style={{ fontSize: '13.6px', fontWeight: 700, letterSpacing: '0.04em' }}
              >
                New Member
              </p>
              {ROWS.map((row, i) => (
                <div key={row.type} className="contents">
                  <div
                    className="border-t border-text-dark/10"
                    style={{ gridColumn: '1 / -1', height: 0, marginTop: i === 0 ? '0' : '0' }}
                  />
                  <p
                    className="font-heading text-text-dark"
                    style={{
                      fontSize: '20.8px',
                      fontStyle: 'italic',
                      fontWeight: 300,
                      letterSpacing: '-0.624px',
                      paddingTop: '16px',
                      paddingBottom: '16px',
                    }}
                  >
                    {row.type}
                  </p>
                  <p
                    className="font-heading text-accent"
                    style={{
                      fontSize: '24px',
                      fontStyle: 'italic',
                      fontWeight: 300,
                      letterSpacing: '-0.72px',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                    }}
                  >
                    {row.referrer}
                  </p>
                  <p
                    className="font-heading text-accent"
                    style={{
                      fontSize: '24px',
                      fontStyle: 'italic',
                      fontWeight: 300,
                      letterSpacing: '-0.72px',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                    }}
                  >
                    {row.newMember}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p
            className="text-text-dark/70 text-center italic"
            style={{ fontSize: '13.6px', lineHeight: '20px' }}
          >
            *Referral form must be completed to be eligible for rewards. Each referral is valid for
            six months only.
          </p>
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
