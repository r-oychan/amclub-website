import { useState } from 'react';
import { Link } from 'react-router';
import type { FaqItem, CtaButton } from '../../lib/types';
import { SectionLabel } from '../shared/SectionLabel';

export function FaqAccordion({
  label,
  heading,
  subheading,
  items,
  ctas,
  dark = false,
}: {
  label?: string;
  heading: string;
  subheading?: string;
  items: FaqItem[];
  ctas?: CtaButton[];
  dark?: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const headingColor = dark ? 'text-white' : 'text-primary';
  const rowDivider = dark
    ? 'border-t border-white/15 last:border-b last:border-white/15'
    : 'border-t border-primary/15 last:border-b last:border-primary/15';
  const questionColor = dark ? 'text-white' : 'text-primary';
  const answerColor = dark ? 'text-white/80' : 'text-primary/80';
  const subColor = dark ? 'text-white/70' : 'text-primary/70';
  const topAccent = dark ? 'border-white/20' : 'border-primary/15';

  return (
    <section className={`py-20 ${dark ? 'bg-primary text-white' : 'bg-bg'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`border-t ${topAccent} pt-10 grid grid-cols-1 lg:grid-cols-[minmax(160px,1fr)_3fr] gap-x-8 gap-y-10`}>
          {/* Left column — section label (top-left, matches other sections) */}
          <div className="pt-2">
            {label && <SectionLabel label={label} dark={dark} />}
          </div>

          {/* Right column — heading, ctas, accordion */}
          <div>
            <h2
              className={`font-heading italic font-light ${headingColor}`}
              style={{
                fontSize: '2.4rem',
                lineHeight: '1.1',
                letterSpacing: '-0.03em',
              }}
            >
              {heading}
            </h2>

            {subheading && (
              <p className={`mt-4 font-body text-[1rem] max-w-2xl ${subColor}`}>{subheading}</p>
            )}

            {ctas && ctas.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                {ctas.map((cta) => (
                  <FaqCtaLink key={cta.label} label={cta.label} href={cta.href} dark={dark} />
                ))}
              </div>
            )}

            <ul className="mt-10">
              {items.map((item, i) => {
                const isOpen = openIndex === i;
                return (
                  <li key={i} className={rowDivider}>
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-6 py-6 text-left cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <span className={`font-body text-[1.2rem] leading-[1.4] ${questionColor}`}>
                        {item.question}
                      </span>
                      <span
                        className="flex-shrink-0 text-accent transition-transform duration-300 ease-out"
                        style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                        aria-hidden="true"
                      >
                        <PlusIcon />
                      </span>
                    </button>
                    {/* Sliding-down answer panel.
                        Animates via grid-template-rows 0fr ↔ 1fr; inner div hides overflow. */}
                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      }`}
                    >
                      <div className="overflow-hidden">
                        {item.answer && (
                          <div
                            className={`pb-6 pr-12 font-body text-[1rem] leading-[1.6] ${answerColor}`}
                          >
                            {item.answer}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqCtaLink({ label, href, dark }: { label: string; href?: string; dark?: boolean }) {
  const className = `group inline-flex items-center gap-2 font-body text-[12.8px] uppercase tracking-[0.08em] transition-colors ${
    dark ? 'text-white hover:text-secondary' : 'text-primary hover:text-accent'
  }`;
  const content = (
    <>
      <span>{label}</span>
      <ArrowUpRight
        className={`transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
          dark ? 'text-secondary' : 'text-accent'
        }`}
      />
    </>
  );
  if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return (
      <a href={href ?? '#'} className={className}>
        {content}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {content}
    </Link>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2.5V17.5M2.5 10H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={className} aria-hidden="true">
      <path d="M2 10L10 2M10 2H3.5M10 2V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
