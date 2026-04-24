import { useState } from 'react';
import type { TestimonialItem, CtaButton } from '../../lib/types';
import { ArrowLink } from '../shared/ArrowLink';

export function TestimonialSlider({
  label,
  heading,
  items,
  cta,
}: {
  label?: string;
  heading: string;
  items: TestimonialItem[];
  cta?: CtaButton;
}) {
  const [active, setActive] = useState(0);

  return (
    <section className="py-16 bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div className="flex-1">
            {label && (
              <p className="text-sm font-bold uppercase tracking-widest text-secondary mb-4 text-center md:text-left">{label}</p>
            )}
            <h2 className="font-heading text-3xl md:text-4xl font-bold italic text-center md:text-left max-w-3xl">{heading}</h2>
          </div>
          {cta?.href && (
            <div className="flex justify-center md:justify-end md:pb-2 shrink-0">
              <ArrowLink label={cta.label} href={cta.href} dark isExternal={cta.isExternal} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className={`rounded-xl p-6 transition-all cursor-pointer ${
                active === i ? 'bg-white/15 scale-105' : 'bg-white/5 hover:bg-white/10'
              }`}
              onClick={() => setActive(i)}
            >
              <div className="w-16 h-16 rounded-full bg-white/20 mb-4 flex items-center justify-center text-2xl">
                {item.name.charAt(0)}
              </div>
              <p className="font-heading text-sm italic mb-3 text-text-light">&ldquo;{item.quote}&rdquo;</p>
              <p className="text-sm font-bold">{item.name}</p>
              {item.cta && (
                <button className="text-xs text-secondary mt-2 hover:underline cursor-pointer">{item.cta}</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
