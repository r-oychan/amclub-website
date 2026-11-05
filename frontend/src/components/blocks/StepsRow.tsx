import { Link } from 'react-router';
import type { CtaLink } from '../shared/CtaButton';
import { isHardLink } from '../../lib/links';

export interface StepItem {
  title: string;
  description?: string;
  /** Line icon (circle style) or 3:4 portrait art (tile style). A neutral placeholder renders when empty. */
  icon?: string;
  cta?: CtaLink;
}

export type StepIconStyle = 'circle' | 'tile';

const ICON_FRAME: Record<StepIconStyle, { frame: string; img: string; placeholder: string }> = {
  // 112px tinted badge with a ~50px line icon (DESIGN.md `step-icon`)
  circle: {
    frame: 'mb-4 w-[112px] h-[112px] rounded-full bg-secondary-soft flex items-center justify-center transition-transform duration-200 hover:-translate-y-0.5',
    img: 'w-[50px] h-[50px] object-contain',
    placeholder: 'w-[50px] h-[50px] rounded-full border border-dashed border-secondary-strong/40',
  },
  // 72 × 96 portrait illustration
  tile: {
    frame: 'overflow-hidden mb-3 w-[72px] h-[96px]',
    img: 'w-full h-full object-contain',
    placeholder: 'w-full h-full bg-primary/5 border border-dashed border-primary/20',
  },
};

/** Centered heading over a row of numbered steps, e.g. "Get Started in 4 Easy Steps". */
export function StepsRow({
  heading,
  items,
  numbered = true,
  iconStyle = 'circle',
}: {
  heading?: string;
  items: StepItem[];
  numbered?: boolean;
  iconStyle?: StepIconStyle;
}) {
  const icon = ICON_FRAME[iconStyle];
  return (
    <section className="py-16 bg-bg">
      <div className="max-w-7xl mx-auto px-10">
        {heading && (
          <h2
            className="font-heading text-primary text-center mb-10"
            style={{ fontSize: '26.56px', fontWeight: 300, fontStyle: 'italic' }}
          >
            {heading}
          </h2>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
          {items.map((step, i) => (
            <div key={`${step.title}-${i}`} className="flex flex-col items-center text-center">
              <div aria-hidden className={icon.frame}>
                {step.icon ? (
                  <img src={step.icon} alt="" className={icon.img} loading="lazy" />
                ) : (
                  <div className={icon.placeholder} />
                )}
              </div>
              <h3
                className="text-primary"
                style={{ fontFamily: 'Lato, sans-serif', fontSize: '24px', fontWeight: 700, lineHeight: '28px', letterSpacing: '-0.48px' }}
              >
                {numbered ? `${i + 1}. ${step.title}` : step.title}
              </h3>
              {step.description && (
                <p className="text-text-dark/70 mt-1 max-w-[220px]" style={{ fontSize: '13.6px', lineHeight: '19px' }}>
                  {step.description}
                </p>
              )}
              {step.cta && <StepLink cta={step.cta} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepLink({ cta }: { cta: CtaLink }) {
  const className = 'mt-2 text-accent uppercase hover:underline';
  const style = { fontSize: '12.8px', fontWeight: 700, letterSpacing: '0.04em' };
  return isHardLink(cta.href, cta.isExternal) || cta.href.startsWith('#') ? (
    <a
      href={cta.href}
      target={isHardLink(cta.href, cta.isExternal) ? '_blank' : undefined}
      rel={isHardLink(cta.href, cta.isExternal) ? 'noopener noreferrer' : undefined}
      className={className}
      style={style}
    >
      {cta.label}
    </a>
  ) : (
    <Link to={cta.href} className={className} style={style}>
      {cta.label}
    </Link>
  );
}
