import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import type { HeroSlide, HeroZone } from '../../lib/types';
import { Button } from '../shared/Button';

interface HeroCarouselProps {
  slides: HeroSlide[];
  autoPlayInterval?: number;
  titlePosition?: HeroZone;
  subtitlePosition?: HeroZone;
}

const ZONE_CLASSES: Record<HeroZone, string> = {
  'bottom-left': 'bottom-0 left-0 items-start text-left pb-24',
  'bottom-right': 'bottom-0 right-0 items-end text-right pb-24',
  'middle-left': 'top-1/2 left-0 -translate-y-1/2 items-start text-left',
  'middle-right': 'top-1/2 right-0 -translate-y-1/2 items-end text-right',
};

export function HeroCarousel({
  slides,
  autoPlayInterval = 8000,
  titlePosition = 'bottom-left',
  subtitlePosition = 'bottom-right',
}: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (index: number) => {
    setCurrent(index);
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [slides.length, autoPlayInterval]);

  return (
    <section
      className="relative w-full h-screen max-h-screen overflow-hidden"
    >
      {/* Slides */}
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => {
          const slideTitlePos = slide.titlePosition ?? titlePosition;
          const slideSubtitlePos = slide.subtitlePosition ?? subtitlePosition;
          const sameZone = slideTitlePos === slideSubtitlePos;

          return (
            <div
              key={i}
              className="relative flex-shrink-0 w-full h-full"
              style={{
                backgroundImage: `url(${slide.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/40" />

              {/* Centered 1560px overlay container with 60px horizontal padding */}
              <div className="absolute inset-0 z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-[60px]">
                <div className="relative w-full h-full">
                  {sameZone ? (
                    /* Title + subtitle in same zone */
                    <div className={`absolute flex flex-col max-w-xl ${ZONE_CLASSES[slideTitlePos]}`}>
                      {slide.title && (
                        <h1
                          className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold italic mb-4"
                          style={{ color: slide.titleColor ?? '#ffffff' }}
                        >
                          {slide.title}
                        </h1>
                      )}
                      {slide.subtitle && (
                        slide.subtitleLink ? (
                          <Link
                            to={slide.subtitleLink}
                            className="text-base sm:text-lg mb-6 max-w-md underline-offset-4 hover:underline"
                            style={{ color: slide.subtitleColor ?? 'rgba(255,255,255,0.85)' }}
                          >
                            {slide.subtitle}
                          </Link>
                        ) : (
                          <p
                            className="text-base sm:text-lg mb-6 max-w-md"
                            style={{ color: slide.subtitleColor ?? 'rgba(255,255,255,0.85)' }}
                          >
                            {slide.subtitle}
                          </p>
                        )
                      )}
                      {slide.cta && (
                        <Button label={slide.cta.label} href={slide.cta.href} variant="primary" className="!bg-accent hover:!bg-accent/90" />
                      )}
                    </div>
                  ) : (
                    /* Title and subtitle in different zones */
                    <>
                      {slide.title && (
                        <div className={`absolute flex flex-col max-w-xl ${ZONE_CLASSES[slideTitlePos]}`}>
                          <h1
                            className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold italic"
                            style={{ color: slide.titleColor ?? '#ffffff' }}
                          >
                            {slide.title}
                          </h1>
                        </div>
                      )}
                      {(slide.subtitle || slide.cta) && (
                        <div className={`absolute flex flex-col max-w-md ${ZONE_CLASSES[slideSubtitlePos]}`}>
                          {slide.subtitle && (
                            slide.subtitleLink ? (
                              <Link
                                to={slide.subtitleLink}
                                className="text-base sm:text-lg mb-6 underline-offset-4 hover:underline"
                                style={{ color: slide.subtitleColor ?? 'rgba(255,255,255,0.85)' }}
                              >
                                {slide.subtitle}
                              </Link>
                            ) : (
                              <p
                                className="text-base sm:text-lg mb-6"
                                style={{ color: slide.subtitleColor ?? 'rgba(255,255,255,0.85)' }}
                              >
                                {slide.subtitle}
                              </p>
                            )
                          )}
                          {slide.cta && (
                            <Button label={slide.cta.label} href={slide.cta.href} variant="primary" className="!bg-accent hover:!bg-accent/90" />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {slides.map((_, i) => {
            const isActive = i === current;
            return (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="relative overflow-hidden rounded-full transition-all duration-300 ease-in-out"
                style={{
                  width: isActive ? '32px' : '8px',
                  height: '8px',
                  backgroundColor: isActive ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.5)',
                }}
              >
                {isActive && (
                  <span
                    key={`timer-${current}`}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      backgroundColor: '#DF4661',
                      animation: `timerFill ${autoPlayInterval}ms linear forwards`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes timerFill {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
