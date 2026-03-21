import { useState } from 'react';
import type { FaqItem, CtaButton } from '../../lib/types';
import { Button } from '../shared/Button';

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
    <section className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {label && (
          <p className="text-sm font-bold uppercase tracking-widest text-accent mb-4 text-center">{label}</p>
        )}
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary text-center mb-4 italic">
          {heading}
        </h2>
        {subheading && (
          <p className="text-text-dark/70 text-center mb-8">{subheading}</p>
        )}

        {ctas && ctas.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {ctas.map((cta) => (
              <Button key={cta.label} label={cta.label} href={cta.href} variant="secondary" className="text-sm" />
            ))}
          </div>
        )}

        <div className="divide-y divide-gray-200">
          {items.map((item, i) => (
            <div key={i}>
              <button
                className="w-full flex items-center justify-between py-5 text-left cursor-pointer group"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-heading font-bold text-primary group-hover:text-accent transition-colors pr-4">
                  {item.question}
                </span>
                <span className="text-primary flex-shrink-0 transition-transform" style={{ transform: openIndex === i ? 'rotate(180deg)' : 'none' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {openIndex === i && (
                <div className="pb-5 text-sm text-text-dark/70">
                  {item.answer || 'Details coming soon.'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
