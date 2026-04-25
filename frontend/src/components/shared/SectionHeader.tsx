import { Link } from 'react-router';
import type { CtaButton } from '../../lib/types';

export function SectionHeader({
  label,
  heading,
  cta,
  dark = false,
}: {
  label?: string;
  heading?: string;
  cta?: CtaButton;
  dark?: boolean;
}) {
  if (!label && !heading) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(160px,1fr)_3fr] gap-4 lg:gap-8 mb-10 md:mb-14">
      {/* Left column — section label */}
      <div className="flex items-start gap-3 pt-2">
        {label && (
          <>
            <div className="w-1 h-5 shrink-0 bg-accent rounded-full" />
            <span
              className={`text-[14.4px] font-bold uppercase tracking-[0.04em] ${
                dark ? 'text-white/70' : 'text-text-dark'
              }`}
            >
              {label}
            </span>
          </>
        )}
      </div>

      {/* Right column — heading + CTA */}
      <div>
        {heading && (
          <h2
            className={`heading-h2-serif ${
              dark ? 'text-white' : 'text-primary'
            } ${cta ? 'mb-6' : ''}`}
          >
            {heading}
          </h2>
        )}
        {cta && cta.href && (
          <Link
            to={cta.href}
            className={`inline-flex items-center gap-2 text-[14.4px] font-bold uppercase tracking-[0.04em] transition-colors duration-200 ${
              dark
                ? 'text-white/80 hover:text-white'
                : 'text-primary hover:text-accent'
            }`}
          >
            {cta.label}
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className={dark ? 'text-secondary' : 'text-accent'}
            >
              <path
                d="M1 13L13 1M13 1H3M13 1V11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}
