import { useEffect, useState } from 'react';

const AUTOPLAY_MS = 6000;

export interface SlideshowSlide {
  src: string;
  alt?: string;
  caption?: string;
  subCaption?: string;
}

export function ImagePanelSlideshow({
  slides,
  className,
}: {
  slides: SlideshowSlide[];
  className?: string;
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

  if (slides.length === 0) return null;

  const goTo = (i: number) => setActive((i + slides.length) % slides.length);
  const prev = () => goTo(active - 1);
  const next = () => goTo(active + 1);

  return (
    <div className={`relative overflow-hidden w-full ${className ?? ''}`}>
      {slides.map((s, i) => (
        <div
          key={`${s.src}-${i}`}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === active ? 1 : 0, pointerEvents: i === active ? 'auto' : 'none' }}
          aria-hidden={i !== active}
        >
          <img
            src={s.src}
            alt={s.alt ?? ''}
            className="absolute inset-0 w-full h-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
          {(s.caption || s.subCaption) && (
            <>
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent 50%)' }}
              />
              <div
                className="absolute inset-0 z-10 flex flex-col"
                style={{ padding: 24, justifyContent: 'flex-end', alignItems: 'flex-start' }}
              >
                <div className="flex flex-col" style={{ gap: 4 }}>
                  {s.caption && (
                    <h3
                      className="text-white"
                      style={{
                        fontFamily: '"Noto Serif", serif',
                        fontSize: 24,
                        fontStyle: 'italic',
                        fontWeight: 400,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.1,
                        margin: 0,
                      }}
                    >
                      {s.caption}
                    </h3>
                  )}
                  {s.subCaption && (
                    <p
                      className="text-white/90"
                      style={{
                        fontFamily: 'Lato, sans-serif',
                        fontSize: 13,
                        fontWeight: 400,
                        lineHeight: 1.3,
                        margin: 0,
                      }}
                    >
                      {s.subCaption}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <div
            className="absolute z-20 flex items-center"
            style={{ top: 16, left: 16, right: 16, gap: 8 }}
          >
            <div className="flex flex-1" style={{ gap: 4 }}>
              {slides.map((_, i) => {
                const isActive = i === active;
                const isPast = i < active;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className="flex-1 cursor-pointer overflow-hidden"
                    style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 }}
                  >
                    <span
                      key={`${active}-${paused}`}
                      className={`block h-full ${isActive && !paused ? 'animate-bar-fill' : ''}`}
                      style={{
                        width: isPast || (isActive && paused) ? '100%' : '0%',
                        backgroundColor: '#ffffff',
                        borderRadius: 2,
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
              className="flex items-center justify-center shrink-0 rounded-full text-white hover:opacity-100 transition"
              style={{
                padding: 8,
                backgroundColor: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                opacity: 0.7,
              }}
            >
              {paused ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M6 4L20 12L6 20V4Z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute z-20 flex items-center justify-center rounded-full text-white hover:opacity-100 transition"
            style={{
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 32,
              height: 32,
              backgroundColor: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              opacity: 0.7,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              style={{ width: 19.2, height: 19.2, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}
              aria-hidden="true"
            >
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute z-20 flex items-center justify-center rounded-full text-white hover:opacity-100 transition"
            style={{
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 32,
              height: 32,
              backgroundColor: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              opacity: 0.7,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              style={{ width: 19.2, height: 19.2, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}
              aria-hidden="true"
            >
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
