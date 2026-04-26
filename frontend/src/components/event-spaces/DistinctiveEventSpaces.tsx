import { Link } from 'react-router';
import { useScrollFadeIn } from '../../hooks/useScrollFadeIn';

export interface VenueRow {
  name: string;
  capacity: string[];
  description: string;
  image: string;
  cta: { label: string; href?: string };
}

export function DistinctiveEventSpaces({
  heading = 'Distinctive Event Spaces',
  subheading = 'Four curated venues, each with a distinct character, suited for everything from grand celebrations to smaller, intimate events.',
  items,
}: {
  heading?: string;
  subheading?: string;
  items: VenueRow[];
}) {
  return (
    <section className="bg-bg pb-16 md:pb-24">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle heading={heading} subheading={subheading} />
        <div className="space-y-12 lg:space-y-20">
          {items.map((row, i) => (
            <VenueZigzagRow key={row.name} row={row} reverse={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ heading, subheading }: { heading: string; subheading?: string }) {
  const { ref, isVisible } = useScrollFadeIn({ threshold: 0.1, replay: false });
  const fade = isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6';
  return (
    <div
      ref={ref}
      className={`text-center max-w-3xl mx-auto mb-12 md:mb-16 transition-all duration-700 ease-out ${fade}`}
    >
      <h2 className="font-heading italic font-light text-[2rem] md:text-[2.4rem] leading-[1.1] tracking-[-0.03em] text-primary">
        {heading}
      </h2>
      {subheading && (
        <p className="mt-3 font-body text-[15px] md:text-[17.6px] font-light leading-[1.4] text-text-dark/80">
          {subheading}
        </p>
      )}
    </div>
  );
}

function VenueZigzagRow({ row, reverse }: { row: VenueRow; reverse: boolean }) {
  const { ref, isVisible } = useScrollFadeIn({ threshold: 0.1, replay: false });
  const fade = isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8';

  // Mobile/tablet: stack image then panel.
  // Desktop (lg+): image takes ~67% width on one side; navy panel overlaps the opposite corner.
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${fade}`}>
      {/* Mobile/tablet stacked layout */}
      <div className="lg:hidden">
        <div className="relative w-full aspect-[3/2] overflow-hidden">
          <img
            src={row.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="bg-primary text-white px-7 py-8 sm:px-10 sm:py-10">
          <VenuePanelContent row={row} />
        </div>
      </div>

      {/* Desktop overlapping zigzag layout */}
      <div className="hidden lg:block relative" style={{ minHeight: 580 }}>
        {/* Image side */}
        <div
          className={`absolute top-0 ${reverse ? 'right-0' : 'left-0'} w-[66%]`}
        >
          <div className="relative w-full aspect-[3/2] overflow-hidden">
            <img
              src={row.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* Navy panel overlapping the opposite corner, vertically centered */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${
            reverse ? 'left-0' : 'right-0'
          } w-[34%] max-w-[461px]`}
        >
          <div className="bg-primary text-white p-[60px] shadow-[0_30px_60px_-30px_rgba(0,30,98,0.45)]">
            <VenuePanelContent row={row} />
          </div>
        </div>
      </div>
    </div>
  );
}

function VenuePanelContent({ row }: { row: VenueRow }) {
  return (
    <>
      <h3 className="font-heading italic font-light text-[1.66rem] leading-[1.1] text-white mb-5">
        {row.name}
      </h3>
      <ul className="space-y-2 mb-5">
        {row.capacity.map((c) => (
          <li
            key={c}
            className="flex items-start gap-2.5 font-body text-[12.8px] font-bold uppercase tracking-[0.04em] text-white"
          >
            <DocIcon className="mt-0.5 shrink-0 text-secondary" />
            <span>{c}</span>
          </li>
        ))}
      </ul>
      <p className="font-body text-[15px] font-light leading-[1.5] text-white/77 mb-6">
        {row.description}
      </p>
      <ArrowLinkLight label={row.cta.label} href={row.cta.href ?? '#'} />
    </>
  );
}

function DocIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="16"
      viewBox="0 0 14 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2 1.5h7l3 3v9.5a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5V2a.5.5 0 0 1 .5-.5z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M9 1.5V4.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowLinkLight({ label, href }: { label: string; href: string }) {
  const className =
    'group inline-flex items-center gap-2 font-body text-[14.4px] font-bold uppercase tracking-[0.04em] text-white hover:text-secondary transition-colors duration-200';
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
