import { useEffect, useRef, useState } from 'react';

export interface TestimonialQuote {
  text: string;
  attribution?: string;
  role?: string;
}

export function Testimonials({
  label = 'Member Testimonials',
  heading,
  items,
  dark = true,
}: {
  label?: string;
  heading?: string;
  items: TestimonialQuote[];
  dark?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const animLockRef = useRef(false);
  const animTimerRef = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const count = items.length;
  const hasMultiple = count > 1;

  const goTo = (next: number) => {
    if (!hasMultiple || animLockRef.current) return;
    const normalised = ((next % count) + count) % count;
    if (normalised === index) return;
    animLockRef.current = true;
    if (animTimerRef.current) window.clearTimeout(animTimerRef.current);
    animTimerRef.current = window.setTimeout(() => {
      animLockRef.current = false;
    }, 520);
    setIndex(normalised);
  };

  useEffect(() => () => {
    if (animTimerRef.current) window.clearTimeout(animTimerRef.current);
  }, []);

  const prev = () => goTo(index === 0 ? count - 1 : index - 1);
  const next = () => goTo(index === count - 1 ? 0 : index + 1);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) next(); else prev();
  };

  const bg = dark ? 'bg-primary' : 'bg-bg';
  const heading_color = dark ? 'text-white' : 'text-primary';
  const body_color = dark ? 'text-white' : 'text-text-dark';
  const label_color = dark ? 'text-white/85' : 'text-primary/70';
  const role_color = dark ? 'text-white/60' : 'text-text-dark/60';
  const dot_inactive = dark ? 'bg-white/40' : 'bg-primary/30';
  const chevron_color = dark ? 'text-white/80 hover:text-white' : 'text-primary/70 hover:text-primary';

  return (
    <section className={`${bg} relative overflow-hidden`} style={{ paddingTop: '80px', paddingBottom: '96px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
        {label && (
          <p
            className={`${label_color} font-body`}
            style={{ fontSize: '15.2px', letterSpacing: '0.04em', marginBottom: '24px' }}
          >
            {label}
          </p>
        )}
        {heading && (
          <h2
            className={`font-heading ${heading_color} mx-auto`}
            style={{
              fontSize: 'clamp(34px, 5vw, 56px)',
              fontWeight: 300,
              fontStyle: 'italic',
              letterSpacing: '-0.02em',
              lineHeight: 1.08,
              maxWidth: '900px',
            }}
          >
            {heading}
          </h2>
        )}

        <div aria-hidden="true" className="mt-12 mb-10 flex justify-center text-accent">
          <svg width="46" height="36" viewBox="0 0 46 36" fill="currentColor" aria-hidden="true">
            <path d="M0 36V21C0 9.402 7.402 0 19 0v7.2c-5.2 0-9.6 4-9.6 9.6h9.6V36H0Zm27 0V21C27 9.402 34.402 0 46 0v7.2c-5.2 0-9.6 4-9.6 9.6H46V36H27Z" />
          </svg>
        </div>

        <div
          className="relative mx-auto"
          style={{ maxWidth: '900px', minHeight: '220px' }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {items.map((q, i) => {
            const isActive = i === index;
            const offsetSign = i < index ? -1 : i > index ? 1 : 0;
            const translate = isActive ? '0%' : offsetSign === -1 ? '-12%' : '12%';
            return (
              <div
                key={`${q.attribution ?? i}-${i}`}
                className="absolute inset-0 transition-all duration-500 ease-out"
                style={{
                  opacity: isActive ? 1 : 0,
                  transform: `translate3d(${translate}, 0, 0)`,
                  pointerEvents: isActive ? 'auto' : 'none',
                }}
                aria-hidden={!isActive}
              >
                <p
                  className={`${body_color} font-body mx-auto`}
                  style={{
                    fontSize: 'clamp(16px, 1.4vw, 19.2px)',
                    lineHeight: 1.7,
                    maxWidth: '780px',
                  }}
                >
                  {q.text}
                </p>
                {(q.attribution || q.role) && (
                  <div className="mt-10 flex flex-col items-center" style={{ gap: '6px' }}>
                    {q.attribution && (
                      <p
                        className={`${heading_color} font-heading`}
                        style={{ fontSize: '19.2px', fontWeight: 700, fontStyle: 'italic' }}
                      >
                        {q.attribution}
                      </p>
                    )}
                    {q.role && (
                      <p
                        className={`${role_color} font-heading`}
                        style={{ fontSize: '14.4px', fontStyle: 'italic' }}
                      >
                        {q.role}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ visibility: 'hidden' }}>
            <p
              className="font-body"
              style={{
                fontSize: 'clamp(16px, 1.4vw, 19.2px)',
                lineHeight: 1.7,
                maxWidth: '780px',
                margin: '0 auto',
              }}
            >
              {items[index].text}
            </p>
            {(items[index].attribution || items[index].role) && (
              <div className="mt-10" style={{ height: '54px' }} />
            )}
          </div>
        </div>

        {hasMultiple && (
          <div className="mt-12 flex items-center justify-center gap-3" aria-label="Testimonial pagination">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show testimonial ${i + 1}`}
                aria-current={i === index}
                className={`transition-all duration-300 rounded-full ${
                  i === index
                    ? 'w-3.5 h-3.5 border-2 border-accent bg-transparent'
                    : `w-2.5 h-2.5 ${dot_inactive}`
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous testimonial"
            className={`hidden sm:flex absolute left-6 lg:left-10 top-1/2 -translate-y-1/2 ${chevron_color} transition-colors`}
            style={{ padding: '12px' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next testimonial"
            className={`hidden sm:flex absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 ${chevron_color} transition-colors`}
            style={{ padding: '12px' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}
    </section>
  );
}
