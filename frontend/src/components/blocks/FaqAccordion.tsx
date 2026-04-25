import { useState } from 'react';
import { Link } from 'react-router';
import type { FaqItem, CtaButton } from '../../lib/types';

export function FaqAccordion({
  label,
  heading,
  subheading,
  items,
  ctas,
}: {
  label?: string;
  heading: string;
  subheading?: string;
  items: FaqItem[];
  ctas?: CtaButton[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-bg py-20 px-6 sm:px-10 lg:px-[60px]">
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="border-t border-primary/15 pt-10 grid grid-cols-1 lg:grid-cols-[140px_1fr] gap-x-12 gap-y-10">
          {label && (
            <div className="flex items-start">
              <span className="block w-[3px] h-5 bg-accent mr-3 mt-[2px]" aria-hidden="true" />
              <span className="font-body text-[12.8px] uppercase tracking-[0.04em] text-primary leading-tight">
                {label}
              </span>
            </div>
          )}

          <div>
            <h2
              className="font-heading italic font-light text-primary"
              style={{
                fontSize: '2.4rem',
                lineHeight: '1.1',
                letterSpacing: '-0.03em',
              }}
            >
              {heading}
            </h2>

            {subheading && (
              <p className="mt-4 font-body text-[1rem] text-primary/70 max-w-2xl">{subheading}</p>
            )}

            {ctas && ctas.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                {ctas.map((cta) => (
                  <FaqCtaLink key={cta.label} label={cta.label} href={cta.href} />
                ))}
              </div>
            )}

            <ul className="mt-10">
              {items.map((item, i) => {
                const isOpen = openIndex === i;
                return (
                  <li
                    key={i}
                    className="border-t border-primary/15 last:border-b last:border-primary/15"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-6 py-6 text-left cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <span className="font-body text-[1.2rem] leading-[1.4] text-primary">
                        {item.question}
                      </span>
                      <span
                        className="flex-shrink-0 text-accent transition-transform duration-200"
                        style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                        aria-hidden="true"
                      >
                        <PlusIcon />
                      </span>
                    </button>
                    {isOpen && item.answer && (
                      <div className="pb-6 pr-12 font-body text-[1rem] leading-[1.6] text-primary/80">
                        {item.answer}
                      </div>
                    )}
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

function FaqCtaLink({ label, href }: { label: string; href?: string }) {
  const className =
    'group inline-flex items-center gap-2 font-body text-[12.8px] uppercase tracking-[0.08em] text-primary hover:text-accent transition-colors';
  const content = (
    <>
      <span>{label}</span>
      <ArrowUpRight className="text-accent transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
