import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { Link } from 'react-router';
import type { HeroSlide, HeroZone } from '../../lib/types';
import { Button } from '../shared/Button';

interface HeroCarouselProps {
  slides: HeroSlide[];
  autoPlayInterval?: number;
  titlePosition?: HeroZone;
  subtitlePosition?: HeroZone;
  /** CMS toggle: on mobile, show each slide's media in full (capped to viewport
      width/height, letterboxed on brand background) instead of cover-cropping. */
  mobileFitMedia?: boolean;
}

/** Tracks a CSS media query so the carousel can switch layout modes on resize. */
function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
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
  mobileFitMedia = false,
}: HeroCarouselProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  // Fit mode: mobile only. Media renders as an <img>/<video> at natural aspect,
  // capped at 100% width and 100svh height, so nothing is cropped. Desktop keeps
  // the immersive full-screen cover layout regardless of the toggle.
  const fit = mobileFitMedia && isMobile;
  const [current, setCurrent] = useState(0);
  // 0..1 fraction of how far through the active slide we are. Drives the pink
  // countdown bar — read from video.currentTime/duration on video slides, or
  // computed as elapsed/autoPlayInterval on image slides.
  const [progress, setProgress] = useState(0);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const goTo = (index: number) => {
    const next = ((index % slides.length) + slides.length) % slides.length;
    setProgress(0);
    setCurrent(next);
  };

  // Touch swipe: a mostly-horizontal swipe of 50px+ moves to the next/previous
  // slide. Vertical pans fall through to normal page scrolling, and taps stay
  // taps (links/CTAs keep working) since we never preventDefault.
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || slides.length <= 1) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      goTo(current + (dx < 0 ? 1 : -1));
    }
  };

  const advance = () => {
    setProgress(0);
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const currentSlide = slides[current];
  const currentIsVideo = !!currentSlide?.backgroundVideo;

  // Drive playback: video slides advance on `ended`, image slides on a timer.
  // The progress fraction is updated each frame from the real source of truth
  // (video.currentTime for videos, elapsed time for images).
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // Pause any video that isn't the new active slide. Critically: do NOT
    // reset its currentTime — the previous slide is still mid-transition out
    // of view, and rewinding it to frame 0 would visibly snap the picture
    // back during the 700ms slide transition. Letting it sit on its last
    // frame keeps the exit smooth.
    Object.entries(videoRefs.current).forEach(([k, v]) => {
      if (v && Number(k) !== current) v.pause();
    });

    if (slides.length <= 1) return;

    if (currentIsVideo) {
      const v = videoRefs.current[current];
      if (v) {
        // Reset only the incoming slide's video so it plays from the start.
        v.currentTime = 0;
        // play() returns a promise; swallow the AbortError that fires if the
        // user advances slides faster than the video can start.
        v.play().catch(() => {});
      }
      const tick = () => {
        const vid = videoRefs.current[current];
        if (vid && isFinite(vid.duration) && vid.duration > 0) {
          setProgress(Math.min(1, vid.currentTime / vid.duration));
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      // Slide advance is handled by <video onEnded> below.
    } else {
      const start = performance.now();
      const tick = () => {
        const elapsed = performance.now() - start;
        setProgress(Math.min(1, elapsed / autoPlayInterval));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      timerRef.current = setTimeout(() => {
        setProgress(0);
        setCurrent((prev) => (prev + 1) % slides.length);
      }, autoPlayInterval);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [current, currentIsVideo, slides.length, autoPlayInterval]);

  const handleVideoEnded = (i: number) => {
    if (i !== current) return;
    advance();
  };

  return (
    <section
      className={`relative w-full overflow-hidden ${fit ? 'bg-primary' : 'h-screen max-h-screen'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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

          const hasMobileContent = !!(slide.title || slide.subtitle || slide.cta);
          // Shared mobile stack (title → subtitle → CTA). Rendered as an overlay in
          // cover mode, or as an in-flow strip below the media in fit mode so it
          // never covers a banner's baked-in artwork.
          const mobileSlideContent = (
            <>
              {slide.title && (
                <h1
                  className="font-heading italic text-[2.5rem] leading-none tracking-[-0.04em] text-bg mb-4"
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
                    className="font-body text-[1.05rem] leading-[1.4] mb-6 underline-offset-4 hover:underline"
                    style={{ fontWeight: 400, color: slide.subtitleColor ?? '#FFFFFF' }}
                  >
                    {slide.subtitle}
                  </Link>
                ) : (
                  <p
                    className="font-body text-[1.05rem] leading-[1.4] mb-6"
                    style={{ fontWeight: 400, color: slide.subtitleColor ?? '#FFFFFF' }}
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
            </>
          );

          return (
            <div
              key={i}
              className={`relative flex-shrink-0 w-full bg-primary ${fit ? 'flex flex-col justify-center' : 'h-full'}`}
              style={
                !fit && !isVideo && slide.backgroundImage
                  ? {
                      backgroundImage: `url(${slide.backgroundImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              {/* Fit mode: real <img> at natural aspect ratio, capped to viewport
                  width/height so the whole banner (incl. baked-in text) is visible. */}
              {fit && !isVideo && slide.backgroundImage && (
                <img
                  src={slide.backgroundImage}
                  alt={slide.title || ''}
                  className="block w-full max-h-svh object-contain"
                />
              )}
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
                  onEnded={() => handleVideoEnded(i)}
                  className={
                    fit
                      ? 'block w-full max-h-svh object-contain'
                      : 'absolute inset-0 w-full h-full object-cover'
                  }
                />
              )}

              {/* Dark overlay — opacity driven by slide.overlayDarken (0–100, default 0 = no effect) */}
              {(slide.overlayDarken ?? 0) > 0 && (
                <div
                  className="absolute inset-0 bg-black pointer-events-none"
                  style={{ opacity: Math.min(100, Math.max(0, slide.overlayDarken ?? 0)) / 100 }}
                />
              )}

              {/* Fit mode: content flows below the media on the brand background so
                  it never covers the banner artwork. Cover mode keeps the overlay. */}
              {fit && hasMobileContent && (
                <div className="relative z-10 px-6 pt-5 pb-2 flex flex-col items-start text-left">
                  {mobileSlideContent}
                </div>
              )}

              {/* Centered 1560px overlay container with 60px horizontal padding */}
              {!fit && (
              <div className="absolute inset-0 z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-[60px]">
                <div className="relative w-full h-full">
                  {/* Mobile (<md): always stack title → subtitle → CTA in the lower
                      half so the dual-zone CMS layout never overlaps on small screens. */}
                  <div className="md:hidden absolute bottom-0 left-0 right-0 pb-24 flex flex-col items-start text-left">
                    {mobileSlideContent}
                  </div>

                  {/* Desktop (md+): respect CMS-configured title/subtitle zones. */}
                  <div className="hidden md:block absolute inset-0">
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
                            className="font-body text-[20.8px] leading-[1.4] mb-6 max-w-md underline-offset-4 hover:underline"
                            style={{
                              fontWeight: 400,
                              color: slide.subtitleColor ?? '#FFFFFF',
                            }}
                          >
                            {slide.subtitle}
                          </Link>
                        ) : (
                          <p
                            className="font-body text-[20.8px] leading-[1.4] mb-6 max-w-md"
                            style={{
                              fontWeight: 400,
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
                        /* Cap the title at 50% of the container until 2xl (1440) so it
                           wraps instead of running into the opposite-zone subtitle —
                           the 90px font kicks in at xl (1200) but max-w-3xl + max-w-md
                           only fit side by side from ~1440 up. Mirrors Framer, which
                           holds the hero title to ~50% width at these breakpoints. */
                        <div className={`absolute flex flex-col max-w-2xl lg:max-w-[50%] 2xl:max-w-3xl ${ZONE_CLASSES[slideTitlePos]}`}>
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
                                className="font-body text-[20.8px] leading-[1.4] mb-6 underline-offset-4 hover:underline"
                                style={{
                                  fontWeight: 400,
                                  color: slide.subtitleColor ?? '#FFFFFF',
                                }}
                              >
                                {slide.subtitle}
                              </Link>
                            ) : (
                              <p
                                className="font-body text-[20.8px] leading-[1.4] mb-6"
                                style={{
                                  fontWeight: 400,
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
              )}
            </div>
          );
        })}
      </div>

      {/* Dot indicators — overlaid in cover mode; in-flow on the brand background
          in fit mode so they never sit on top of the banner artwork. */}
      {slides.length > 1 && (
        <div
          className={
            fit
              ? 'relative z-20 flex items-center justify-center gap-2 pt-3 pb-5'
              : 'absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20'
          }
        >
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
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      backgroundColor: '#DF4661',
                      width: `${Math.round(progress * 100)}%`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

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
