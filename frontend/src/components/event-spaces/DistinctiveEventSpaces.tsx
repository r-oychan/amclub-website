import { OverlaySection } from '../blocks/OverlaySection';
import { ArrowLink } from '../shared/ArrowLink';
import { useScrollFadeIn } from '../../hooks/useScrollFadeIn';

export interface VenueRow {
  name: string;
  capacity: string[];
  description: string;
  image: string;
  cta: { label: string; href?: string };
  /** Optional background image for the text panel (overrides panelBgColor for this row). */
  panelBgImage?: string;
}

export function DistinctiveEventSpaces({
  heading = 'Distinctive Event Spaces',
  subheading = 'Four curated venues, each with a distinct character, suited for everything from grand celebrations to smaller, intimate events.',
  items,
  panelBgColor = '#001E62',
  panelTheme = 'light',
}: {
  heading?: string;
  subheading?: string;
  items: VenueRow[];
  panelBgColor?: string;
  panelTheme?: 'light' | 'dark';
}) {
  return (
    <section className="bg-bg pb-8 md:pb-12">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle heading={heading} subheading={subheading} />
      </div>

      <div className="space-y-2 md:space-y-4">
        {items.map((row, i) => (
          <OverlaySection
            key={row.name}
            image={row.image}
            imageAlt={row.name}
            textPosition={i % 2 === 0 ? 'right' : 'left'}
            textVerticalAlign="center"
            textBgColor={panelBgColor}
            textBgImage={row.panelBgImage}
            textTheme={panelTheme}
          >
            <VenuePanelContent row={row} dark={panelTheme === 'light'} />
          </OverlaySection>
        ))}
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

export function VenuePanelContent({ row, dark = true }: { row: VenueRow; dark?: boolean }) {
  const titleClass = dark
    ? 'font-heading italic font-light text-[1.66rem] leading-[1.1] text-white mb-5'
    : 'font-heading italic font-light text-[1.66rem] leading-[1.1] text-primary mb-5';
  const itemClass = dark
    ? 'flex items-start gap-2.5 font-body text-[12.8px] font-bold uppercase tracking-[0.04em] text-white'
    : 'flex items-start gap-2.5 font-body text-[12.8px] font-bold uppercase tracking-[0.04em] text-text-dark';
  const descClass = dark
    ? 'font-body text-[15px] font-light leading-[1.5] text-white/77 mb-6'
    : 'font-body text-[15px] font-light leading-[1.5] text-text-dark/80 mb-6';

  return (
    <>
      <h3 className={titleClass}>{row.name}</h3>
      <ul className="space-y-2 mb-5">
        {row.capacity.map((c) => (
          <li key={c} className={itemClass}>
            <DocIcon className="mt-0.5 shrink-0 text-secondary" />
            <span>{c}</span>
          </li>
        ))}
      </ul>
      <p className={descClass}>{row.description}</p>
      <ArrowLink label={row.cta.label} href={row.cta.href ?? '#'} dark={dark} />
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
