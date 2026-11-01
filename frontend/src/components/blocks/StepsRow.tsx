import { Link } from 'react-router';
import type { CtaLink } from '../shared/CtaButton';
import { isHardLink } from '../../lib/links';

export interface StepItem {
  title: string;
  description?: string;
  /** 3:4 portrait icon (72 × 96). A neutral placeholder tile renders when empty. */
  icon?: string;
  cta?: CtaLink;
}

/** Centered heading over a row of numbered steps, e.g. "Get Started in 4 Easy Steps". */
export function StepsRow({ heading, items, numbered = true }: { heading?: string; items: StepItem[]; numbered?: boolean }) {
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
              <div className="overflow-hidden mb-3 w-[72px] h-[96px]">
                {step.icon ? (
                  <img src={step.icon} alt="" className="w-full h-full object-contain" loading="lazy" />
                ) : (
                  <div aria-hidden className="w-full h-full bg-primary/5 border border-dashed border-primary/20" />
                )}
              </div>
              <p
                className="font-heading text-primary"
                style={{ fontSize: '20.8px', fontWeight: 700, letterSpacing: '-0.416px' }}
              >
                {numbered ? `${i + 1}. ${step.title}` : step.title}
              </p>
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
