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
  // Per-slide measured durations (ms), populated as each <video> reports its
  // metadata. Image slides aren't tracked here — they always use autoPlayInterval.
  const [videoDurations, setVideoDurations] = useState<Record<number, number>>({});
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = (index: number) => {
    const next = ((index % slides.length) + slides.length) % slides.length;
    setCurrent(next);
  };

  const currentSlide = slides[current];
  const currentIsVideo = !!currentSlide?.backgroundVideo;
  // The active slide's on-screen duration drives the pink countdown dot. For
  // a video we use its measured duration once known; before metadata arrives
  // we fall back to autoPlayInterval (the bar will gracefully restart at the
  // correct rate when metadata fires).
  const activeDuration =
    currentIsVideo && videoDurations[current] ? videoDurations[current] : autoPlayInterval;

  // Drive playback: video slides advance on `ended`, image slides on a timer.
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Object.values(videoRefs.current).forEach((v) => {
      if (v) {
        v.pause();
        v.currentTime = 0;
      }
    });

    if (slides.length <= 1) return;

    if (currentIsVideo) {
      const v = videoRefs.current[current];
      if (v) {
        v.currentTime = 0;
        // play() returns a promise; swallow the AbortError that fires if the
        // user advances slides faster than the video can start.
        v.play().catch(() => {});
      }
      // Advance is handled by the <video onEnded> below — no setTimeout.
    } else {
      timerRef.current = setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
      }, autoPlayInterval);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [current, currentIsVideo, slides.length, autoPlayInterval]);

  const handleVideoLoadedMetadata = (i: number) => {
    const v = videoRefs.current[i];
    if (!v || !isFinite(v.duration) || v.duration <= 0) return;
    const ms = v.duration * 1000;
    setVideoDurations((prev) => (prev[i] === ms ? prev : { ...prev, [i]: ms }));
  };

  const handleVideoEnded = (i: number) => {
    if (i !== current) return;
    setCurrent((prev) => (prev + 1) % slides.length);
  };

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

          const isVideo = !!slide.backgroundVideo;

          return (
            <div
              key={i}
              className="relative flex-shrink-0 w-full h-full bg-primary"
              style={
                !isVideo && slide.backgroundImage
                  ? {
                      backgroundImage: `url(${slide.backgroundImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              {isVideo && (
                <video
                  ref={(el) => { videoRefs.current[i] = el; }}
                  src={slide.backgroundVideo}
                  // Poster: fall back to backgroundImage if also provided so the
                  // first frame doesn't flash black before the video starts.
                  poster={slide.backgroundImage || undefined}
                  muted
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={() => handleVideoLoadedMetadata(i)}
                  onEnded={() => handleVideoEnded(i)}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Dark overlay — opacity driven by slide.overlayDarken (0–100, default 0 = no effect) */}
              {(slide.overlayDarken ?? 0) > 0 && (
                <div
                  className="absolute inset-0 bg-black pointer-events-none"
                  style={{ opacity: Math.min(100, Math.max(0, slide.overlayDarken ?? 0)) / 100 }}
                />
              )}

              {/* Centered 1560px overlay container with 60px horizontal padding */}
              <div className="absolute inset-0 z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-[60px]">
                <div className="relative w-full h-full">
                  {sameZone ? (
                    /* Title + subtitle in same zone */
                    <div className={`absolute flex flex-col max-w-2xl lg:max-w-3xl ${ZONE_CLASSES[slideTitlePos]}`}>
                      {slide.title && (
                        <h1
                          className="font-heading italic text-[2.5rem] xl:text-[90px] leading-none tracking-[-0.04em] text-bg mb-4"
                          style={{
                            fontWeight: 600,
                            fontFeatureSettings: '"cv01", "cv05", "cv09", "cv11", "ss03"',
                            ...(slide.titleColor ? { color: slide.titleColor } : {}),
                          }}
                        >
                          {slide.title}
                        </h1>
                      )}
                      {slide.subtitle && (
                        slide.subtitleLink ? (
                          <Link
                            to={slide.subtitleLink}
                            className="font-heading italic text-[20.8px] leading-[1.4] mb-6 max-w-md underline-offset-4 hover:underline"
                            style={{
                              fontWeight: 600,
                              fontFeatureSettings: '"cv01", "cv05", "cv09", "cv11", "ss03"',
                              color: slide.subtitleColor ?? '#FFFFFF',
                            }}
                          >
                            {slide.subtitle}
                          </Link>
                        ) : (
                          <p
                            className="font-heading italic text-[20.8px] leading-[1.4] mb-6 max-w-md"
                            style={{
                              fontWeight: 600,
                              fontFeatureSettings: '"cv01", "cv05", "cv09", "cv11", "ss03"',
                              color: slide.subtitleColor ?? '#FFFFFF',
                            }}
                          >
                            {slide.subtitle}
                          </p>
                        )
                      )}
                      {slide.cta && (
                        <Button
                          label={slide.cta.label}
                          href={slide.cta.href}
                          variant="white"
                          className="uppercase tracking-[0.1em] text-[13.6px] self-start"
                          iconRight={<HeroArrowIcon />}
                        />
                      )}
                    </div>
                  ) : (
                    /* Title and subtitle in different zones */
                    <>
                      {slide.title && (
                        <div className={`absolute flex flex-col max-w-2xl lg:max-w-3xl ${ZONE_CLASSES[slideTitlePos]}`}>
                          <h1
                            className="font-heading italic text-[2.5rem] xl:text-[90px] leading-none tracking-[-0.04em] text-bg"
                            style={{
                              fontWeight: 600,
                              fontFeatureSettings: '"cv01", "cv05", "cv09", "cv11", "ss03"',
                              ...(slide.titleColor ? { color: slide.titleColor } : {}),
                            }}
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
                                className="font-heading italic text-[20.8px] leading-[1.4] mb-6 underline-offset-4 hover:underline"
                                style={{
                                  fontWeight: 600,
                                  fontFeatureSettings: '"cv01", "cv05", "cv09", "cv11", "ss03"',
                                  color: slide.subtitleColor ?? '#FFFFFF',
                                }}
                              >
                                {slide.subtitle}
                              </Link>
                            ) : (
                              <p
                                className="font-heading italic text-[20.8px] leading-[1.4] mb-6"
                                style={{
                                  fontWeight: 600,
                                  fontFeatureSettings: '"cv01", "cv05", "cv09", "cv11", "ss03"',
                                  color: slide.subtitleColor ?? '#FFFFFF',
                                }}
                              >
                                {slide.subtitle}
                              </p>
                            )
                          )}
                          {slide.cta && (
                            <Button
                              label={slide.cta.label}
                              href={slide.cta.href}
                              variant="white"
                              className="uppercase tracking-[0.1em] text-[13.6px] self-end"
                              iconRight={<HeroArrowIcon />}
                            />
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
                    key={`timer-${current}-${activeDuration}`}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      backgroundColor: '#DF4661',
                      animation: `timerFill ${activeDuration}ms linear forwards`,
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

function HeroArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="shrink-0 text-accent transition-colors duration-300 group-hover:text-secondary"
      aria-hidden="true"
    >
      <path
        d="M1 13L13 1M13 1H3M13 1V11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
