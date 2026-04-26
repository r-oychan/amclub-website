import { Link } from 'react-router';
import { useScrollFadeIn } from '../../hooks/useScrollFadeIn';

export interface CateringPillar {
  heading: string;
  subheading: string;
  items: string[];
  image: string;
}

export interface CateringSubBanner {
  heading: string;
  body: string;
  image: string;
  cta: { label: string; href?: string };
}

export function OffsiteCateringServices({
  heading = 'Off-site Catering Services',
  body = "Bring The American Club's signature dishes and service to your chosen venue. Our Events & Catering team manages every detail, from menu preparation to on-site service.",
  ctas,
  pillars,
  subBanner,
}: {
  heading?: string;
  body?: string;
  ctas?: { label: string; href?: string }[];
  pillars: CateringPillar[];
  subBanner?: CateringSubBanner;
}) {
  return (
    <section className="bg-bg">
      {/* Heading + intro on cream */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-12 md:pb-16">
        <SectionHeader heading={heading} body={body} ctas={ctas} />
      </div>

      {/* Navy band with the three pillar cards */}
      <div className="bg-primary text-white">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12">
            {pillars.map((p) => (
              <PillarCard key={p.heading} pillar={p} />
            ))}
          </div>
        </div>

        {subBanner && <Catering2GoBanner banner={subBanner} />}
      </div>
    </section>
  );
}

function SectionHeader({
  heading,
  body,
  ctas,
}: {
  heading: string;
  body?: string;
  ctas?: { label: string; href?: string }[];
}) {
  const { ref, isVisible } = useScrollFadeIn({ threshold: 0.1, replay: false });
  const fade = isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6';
  return (
    <div
      ref={ref}
      className={`text-center max-w-3xl mx-auto transition-all duration-700 ease-out ${fade}`}
    >
      <h2 className="font-heading italic font-light text-[2rem] md:text-[2.4rem] leading-[1.1] tracking-[-0.03em] text-primary">
        {heading}
      </h2>
      {body && (
        <p className="mt-4 font-body text-[15px] md:text-[17.6px] font-light leading-[1.4] text-text-dark/80">
          {body}
        </p>
      )}
      {ctas && ctas.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-x-10 gap-y-4">
          {ctas.map((c) => (
            <ArrowLinkDark key={c.label} label={c.label} href={c.href ?? '#'} />
          ))}
        </div>
      )}
    </div>
  );
}

function PillarCard({ pillar }: { pillar: CateringPillar }) {
  const { ref, isVisible } = useScrollFadeIn({ threshold: 0.1, replay: false });
  const fade = isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6';
  return (
    <div
      ref={ref}
      className={`flex flex-col transition-all duration-700 ease-out ${fade}`}
    >
      <div className="relative w-full aspect-[3/2] overflow-hidden mb-6">
        <img
          src={pillar.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <h3 className="font-heading italic font-light text-[1.66rem] leading-[1.1] text-white mb-3">
        {pillar.heading}
      </h3>
      <p className="font-body text-[15px] font-light leading-[1.4] text-white/77 mb-5">
        {pillar.subheading}
      </p>
      <ul className="space-y-2">
        {pillar.items.map((it) => (
          <li
            key={it}
            className="flex items-start gap-2.5 font-body text-[15px] font-light leading-[1.4] text-white"
          >
            <CheckIcon className="mt-1 shrink-0 text-secondary" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Catering2GoBanner({ banner }: { banner: CateringSubBanner }) {
  const { ref, isVisible } = useScrollFadeIn({ threshold: 0.1, replay: false });
  const fade = isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6';
  return (
    <div
      ref={ref}
      className={`relative bg-[#041B52] transition-all duration-700 ease-out ${fade}`}
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(5,27,79,0.95), rgba(5,27,79,0.7)), url(' +
          banner.image +
          ')',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-[60px]">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-8 md:gap-12 items-center">
          <div className="relative w-full max-w-[360px] aspect-[3/2] overflow-hidden mx-auto md:mx-0">
            <img
              src={banner.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div>
            <h3 className="font-heading italic font-light text-[1.66rem] md:text-[1.8rem] leading-[1.1] text-white mb-4">
              {banner.heading}
            </h3>
            <p className="font-body text-[15px] md:text-[16px] font-light leading-[1.45] text-white/77 mb-6 max-w-md">
              {banner.body}
            </p>
            <a
              href={banner.cta.href ?? '#'}
              className="inline-flex items-center gap-2 bg-white text-primary font-body text-[14.4px] font-bold uppercase tracking-[0.04em] px-6 py-3 rounded-full hover:bg-bg transition-colors duration-200"
            >
              {banner.cta.label}
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="shrink-0"
                aria-hidden="true"
              >
                <path
                  d="M1 13L13 1M13 1H3M13 1V11"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2.5 7.5L5.5 10.5L11.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowLinkDark({ label, href }: { label: string; href: string }) {
  const className =
    'group inline-flex items-center gap-2 font-body text-[14.4px] font-bold uppercase tracking-[0.04em] text-primary hover:text-primary-dark transition-colors duration-200';
  const icon = (
    <svg
      width="12"
      height="12"
      viewBox="0 0 14 14"
      fill="none"
      className="shrink-0 transition-transform duration-200 group-hover:translate-x-1"
      aria-hidden="true"
    >
      <path
        d="M1 13L13 1M13 1H3M13 1V11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  if (href.startsWith('http')) {
    return (
      <a className={className} href={href} target="_blank" rel="noopener noreferrer">
        {label}
        {icon}
      </a>
    );
  }
  return (
    <Link className={className} to={href}>
      {label}
      {icon}
    </Link>
  );
}

