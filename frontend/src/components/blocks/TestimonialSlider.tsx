import { useEffect, useRef, useState } from 'react';
import type { TestimonialItem, CtaButton } from '../../lib/types';
import { ArrowLink } from '../shared/ArrowLink';
import { SectionLabel } from '../shared/SectionLabel';

export function TestimonialSlider({
  label,
  heading,
  items,
  cta,
  dark = true,
}: {
  label?: string;
  heading: string;
  items: TestimonialItem[];
  cta?: CtaButton;
  dark?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = () => {
    const el = trackRef.current;
    if (!el) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    setCanScrollPrev(el.scrollLeft > 2);
    setCanScrollNext(el.scrollLeft < maxScrollLeft - 2);
  };

  useEffect(() => {
    updateScrollState();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [items.length]);

  const scrollBy = (dir: 1 | -1) => {
    if (!trackRef.current) return;
    const card = trackRef.current.querySelector<HTMLElement>('[data-moment-card]');
    const step = (card?.offsetWidth ?? 320) + 24;
    trackRef.current.scrollBy({ left: step * dir, behavior: 'smooth' });
  };

  return (
    <section className={`py-16 md:py-24 ${dark ? 'bg-primary text-white' : 'bg-bg'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header: label top-left, heading right, CTA under heading */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(160px,1fr)_3fr] gap-4 lg:gap-8 mb-10 md:mb-14">
          <div className="pt-2">
            {label && <SectionLabel label={label} dark={dark} />}
          </div>
          <div>
            <h2
              className={`heading-h2-serif max-w-3xl ${
                dark ? 'text-white' : 'text-primary'
              }`}
            >
              {heading}
            </h2>
            {cta?.href && (
              <div className="mt-6">
                <ArrowLink label={cta.label} href={cta.href} dark={dark} isExternal={cta.isExternal} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Carousel: aligned with section width, with fade-mask and prev/next buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <div
            ref={trackRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            style={{
              scrollbarWidth: 'none',
              WebkitMaskImage:
                'linear-gradient(to right, rgba(0,0,0,0) 0%, #000 6%, #000 94%, rgba(0,0,0,0) 100%)',
              maskImage:
                'linear-gradient(to right, rgba(0,0,0,0) 0%, #000 6%, #000 94%, rgba(0,0,0,0) 100%)',
            }}
          >
            {items.map((item, i) => (
              <MomentCard key={i} item={item} />
            ))}
          </div>

          {/* Prev button */}
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Previous testimonials"
            className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-opacity duration-200"
            style={{
              opacity: canScrollPrev ? 1 : 0,
              pointerEvents: canScrollPrev ? 'auto' : 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Next button */}
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Next testimonials"
            className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-opacity duration-200"
            style={{
              opacity: canScrollNext ? 1 : 0,
              pointerEvents: canScrollNext ? 'auto' : 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}

function MomentCard({ item }: { item: TestimonialItem }) {
  const Wrapper: React.ElementType = item.href ? 'a' : 'div';
  const wrapperProps = item.href
    ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
    : {};
  return (
    <Wrapper
      data-moment-card
      {...wrapperProps}
      className="group relative flex-shrink-0 w-[280px] md:w-[320px] aspect-[320/520] rounded-3xl overflow-hidden snap-start shadow-xl bg-primary-dark"
    >
      {item.image && (
        <img
          src={item.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/70" />

      {/* Instagram name pill — top, centered, translucent white */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-white/25 backdrop-blur-md px-5 py-2.5 text-white">
        <InstagramIcon />
        <span className="font-body text-xs font-semibold whitespace-nowrap">{item.name}</span>
      </div>

      {/* Quote + Watch More — bottom, centered */}
      <div className="absolute left-0 right-0 bottom-0 p-5 flex flex-col items-center gap-4">
        <p className="font-body text-[25.6px] leading-snug text-white text-center">
          &ldquo;{item.quote}&rdquo;
        </p>
        {item.cta && (
          <span className="inline-flex items-center gap-2 font-body text-[14.4px] font-bold uppercase tracking-[0.04em] text-white text-center">
            {item.cta}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-secondary" aria-hidden="true">
              <path
                d="M1 13L13 1M13 1H3M13 1V11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </div>
    </Wrapper>
  );
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
