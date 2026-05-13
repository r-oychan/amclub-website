import { Link } from 'react-router';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';
import { DetailSection } from '../components/detail/DetailSection';
import { CtaIcon } from '../components/shared/CtaIcon';
import { ImagePanelSlideshow, type SlideshowSlide } from '../components/blocks/ImagePanelSlideshow';

const RECIPROCAL_LIST_URL = '/documents/membership/reciprocal-club-list.pdf';
const LETTER_OF_INTRODUCTION_URL = 'https://amclub.jotform.com/form/tac-reciprocal-club-LOI';
const TOWER_CLUB_URL = '#';

const HERO_IMAGE = 'https://framerusercontent.com/images/bdz4bVfeQtZyQC6ebpW09r3ujU.jpg';

const TOWER_CLUB_SLIDES: SlideshowSlide[] = [
  {
    src: 'https://framerusercontent.com/images/xpKPh1BXgtlMvXSIOldtsW7Lhog.jpg',
    caption: 'Atlantic Dining Room',
    subCaption: 'Tower Club Singapore',
  },
];

const HOURS_BLOCKS: { title: string; rows: { day: string; lines: string[] }[] }[] = [
  {
    title: 'Tower Club Operating Hours',
    rows: [
      { day: 'Mondays to Fridays', lines: ['7:30 AM – 11:00 PM'] },
      { day: 'Saturdays', lines: ['9:00 AM – 11:00 PM'] },
    ],
  },
  {
    title: 'Atlantic Dining Room (Level 62)',
    rows: [
      {
        day: 'Mondays to Fridays',
        lines: [
          'Breakfast: 7:30 AM – 10:30 AM',
          'Lunch: 11:30 AM – 2:30 PM',
          'Dinner: 6:30 PM – 11:00 PM',
        ],
      },
      { day: 'Saturdays', lines: ['Dinner: 6:30 PM – 11:00 PM'] },
    ],
  },
  {
    title: 'Ba Xian Dining Room (Level 63)',
    rows: [
      {
        day: 'Mondays to Saturdays',
        lines: ['Lunch: 11:30 AM – 2:30 PM', 'Dinner: 6:30 PM – 11:00 PM'],
      },
    ],
  },
  {
    title: 'Straits Bar (Level 64)',
    rows: [
      { day: 'Mondays to Saturdays', lines: ['All day dining from 11:30 AM – 11:00 PM'] },
    ],
  },
];

const NOTES = [
  'The dress code is Business Attire',
  'Dining reservations must be made directly to Tower Club in advance. Please mention your child’s age, if any, when making your dining reservation.',
  'The American Club membership card must be presented upon arrival at Tower Club',
  'The American Club Members are subject to 10% Surcharge and 10% Service Charge in addition to the prevailing GST',
  'No restrictions on the number of guests but they must be accompanied by an American Club Member at all times',
  'Children aged 12 years and above, accompanied by a Member, may only dine in the Private Dining Rooms during lunch',
  'In the evenings, children aged 6 years and above, accompanied by a Member, are welcome to dine in the Atlantic, Ba Xian and any of the Private Dining Rooms',
  'Parents are requested to ensure the good behavior of their children so as not to disturb other members',
  'Carpark charges would be “as charged” and based on the Republic Plaza Building Management’s prevailing carpark rates',
  'Strictly no access to the Fitness Centre',
  'All charges must be settled at Tower Club; no inter-club billing allowed',
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

function Pill({ href, label, external }: { href: string; label: string; external?: boolean }) {
  const inner = (
    <>
      {label}
      <CtaIcon name="arrow" size={20} className="text-accent" />
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={PILL_CLASS} style={PILL_STYLE}>
      {inner}
    </a>
  ) : (
    <Link to={href} className={PILL_CLASS} style={PILL_STYLE}>
      {inner}
    </Link>
  );
}

export default function ReciprocalClubsPage() {
  return (
    <>
      <DetailHeroBanner />
      <DetailBreadcrumb
        parentLabel="Membership"
        parentHref="/membership"
        currentName="Reciprocal Clubs"
      />

      {/* ── Panel 1: Membership Without Borders ── */}
      <section className="bg-bg pb-[80px]">
        <div className="max-w-7xl mx-auto px-10">
          <div className="flex flex-col lg:flex-row items-start" style={{ gap: '60px' }}>
            <div className="lg:w-[52%] shrink-0">
              <div className="overflow-hidden">
                <img
                  src={HERO_IMAGE}
                  alt="Reciprocal Clubs"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col" style={{ gap: '24px' }}>
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
                Membership Without Borders
              </h1>
              <div className="flex flex-wrap gap-3">
                <Pill href={RECIPROCAL_LIST_URL} label="List of Reciprocal Clubs" external />
                <Pill href={LETTER_OF_INTRODUCTION_URL} label="Letter of Introduction Application" external />
              </div>
              <p
                className="text-text-dark"
                style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
              >
                As a Member of The American Club, enjoy privileged access to over 150 distinguished
                clubs worldwide, extending the comfort of membership wherever you travel.
              </p>
              <p
                className="text-text-dark"
                style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
              >
                Simply present a Letter of Introduction to visit your destination club, with all
                payments conveniently made on-site via major credit cards or cash where accepted.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Panel 2: Local Reciprocity (with slideshow image) ── */}
      <section className="bg-bg pb-[120px]">
        <div className="max-w-7xl mx-auto px-10">
          <div className="flex flex-col lg:flex-row items-start" style={{ gap: '60px' }}>
            <div className="lg:w-[52%] shrink-0">
              <div className="lg:sticky lg:top-[120px]">
                <ImagePanelSlideshow
                  slides={TOWER_CLUB_SLIDES}
                  className="h-[420px] sm:h-[480px] lg:h-[520px]"
                />
              </div>
            </div>
            <div className="flex flex-col" style={{ gap: '32px' }}>
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
                Local Reciprocity
              </h2>
              <div className="flex flex-wrap gap-3">
                <Pill href={TOWER_CLUB_URL} label="Learn More About Tower Club" />
              </div>
              <p
                className="text-text-dark"
                style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
              >
                The American Club maintains a reciprocal partnership with Tower Club, extending
                exclusive privileges to our Members and their guests. Enjoy complimentary access to
                Singapore’s only premier private business club located in the heart of the Central
                Business District.
              </p>

              {HOURS_BLOCKS.map((block) => (
                <DetailSection key={block.title} icon="clock" title={block.title}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                    {block.rows.map((row) => (
                      <div key={row.day} className="flex flex-col gap-1">
                        <p
                          className="text-text-dark"
                          style={{ fontSize: '17.6px', fontWeight: 700, lineHeight: '24.64px' }}
                        >
                          {row.day}
                        </p>
                        {row.lines.map((line) => (
                          <p
                            key={line}
                            className="text-text-dark"
                            style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </DetailSection>
              ))}

              <DetailSection icon="reservation" title="Important things to note">
                <ul className="list-disc pl-6 flex flex-col" style={{ gap: '8px' }}>
                  {NOTES.map((note) => (
                    <li
                      key={note}
                      className="text-text-dark"
                      style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                    >
                      {note}
                    </li>
                  ))}
                </ul>
              </DetailSection>
            </div>
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
