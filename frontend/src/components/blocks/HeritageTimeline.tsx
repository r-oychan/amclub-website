import { useEffect, useState } from 'react';
import type { TimelineSlide } from '../../lib/types';

const AUTOPLAY_MS = 6000;

export function HeritageTimeline({
  heading,
  body,
  slides,
  backgroundImage,
}: {
  heading: string;
  body: string;
  slides: TimelineSlide[];
  backgroundImage?: string;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = window.setTimeout(() => {
      setActive((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [active, paused, slides.length]);

  const goTo = (i: number) => setActive((i + slides.length) % slides.length);
  const prev = () => goTo(active - 1);
  const next = () => goTo(active + 1);

  return (
    <section
      className="relative overflow-hidden bg-primary text-white py-16 md:py-24"
      style={
        backgroundImage
          ? {
              backgroundImage: `linear-gradient(rgba(0,30,98,0.85), rgba(0,30,98,0.85)), url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="lg:max-w-md">
            <h2 className="font-heading italic font-light text-3xl md:text-4xl leading-[1.15] mb-4">
              {heading}
            </h2>
            <div className="h-[2px] w-12 bg-accent mb-6" />
            <p className="font-body text-base md:text-[17.6px] leading-[1.6] text-white/85 whitespace-pre-line">
              {body}
            </p>
          </div>

          <div className="relative aspect-[4/3] md:aspect-[16/11] w-full overflow-hidden">
            {slides.map((s, i) => (
              <div
                key={`${s.year}-${i}`}
                className="absolute inset-0 transition-opacity duration-700"
                style={{ opacity: i === active ? 1 : 0, pointerEvents: i === active ? 'auto' : 'none' }}
                aria-hidden={i !== active}
              >
                <img src={s.image} alt="" className="w-full h-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                <div className="absolute left-6 right-6 bottom-6 md:left-8 md:right-8 md:bottom-8">
                  <h3 className="font-heading italic font-light text-2xl md:text-3xl text-white mb-2">
                    {s.year}
                  </h3>
                  <p className="font-body text-sm md:text-[14.4px] leading-[1.5] text-white/90 whitespace-pre-line max-w-2xl">
                    {s.body}
                  </p>
                </div>
              </div>
            ))}

            <div className="absolute top-3 left-4 right-14 md:top-4 md:left-6 md:right-16 flex gap-1.5 z-20">
              {slides.map((_, i) => {
                const isActive = i === active;
                const isPast = i < active;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className="flex-1 h-[2px] bg-white/30 cursor-pointer overflow-hidden"
                  >
                    <span
                      key={`${active}-${paused}`}
                      className={`block h-full bg-white origin-left ${isActive && !paused ? 'animate-bar-fill' : ''}`}
                      style={{
                        width: isPast || (isActive && paused) ? '100%' : isActive ? '0%' : '0%',
                        animationDuration: `${AUTOPLAY_MS}ms`,
                      }}
                    />
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
              className="absolute top-2.5 right-3 md:top-3.5 md:right-4 z-20 w-7 h-7 md:w-8 md:h-8 rounded-full bg-black/30 backdrop-blur-sm text-white opacity-70 hover:opacity-100 transition flex items-center justify-center"
            >
              {paused ? (
                <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor" aria-hidden="true">
                  <path d="M0 0L10 6L0 12V0Z" />
                </svg>
              ) : (
                <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor" aria-hidden="true">
                  <rect x="0" width="3" height="12" />
                  <rect x="7" width="3" height="12" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/30 backdrop-blur-sm text-white opacity-70 hover:opacity-100 transition flex items-center justify-center"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/30 backdrop-blur-sm text-white opacity-70 hover:opacity-100 transition flex items-center justify-center"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
