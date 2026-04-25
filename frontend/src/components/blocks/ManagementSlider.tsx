import { useState } from 'react';
import type { TeamMember } from '../../lib/types';

export function ManagementSlider({
  heading,
  members,
  watermark,
}: {
  heading: string;
  members: TeamMember[];
  watermark?: string;
}) {
  const [active, setActive] = useState(0);
  const goTo = (i: number) => setActive((i + members.length) % members.length);
  const prev = () => goTo(active - 1);
  const next = () => goTo(active + 1);

  if (members.length === 0) return null;
  const showNav = members.length > 1;

  return (
    <section className="bg-bg py-16 md:py-24 px-4 sm:px-6 lg:px-5">
      <div className="max-w-[1400px] mx-auto">
        <div className="relative bg-primary text-white overflow-hidden lg:h-[775px]">
          {/* Logo watermark */}
          {watermark && (
            <img
              src={watermark}
              alt=""
              aria-hidden="true"
              className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] max-w-none opacity-[0.05]"
            />
          )}

          {/* Static title (aligns with content) */}
          <div className="relative pt-10 lg:pt-14 px-8 sm:px-16 lg:px-[120px]">
            <h2
              className="font-heading italic text-white"
              style={{
                fontSize: 'clamp(2.5rem, 4vw + 1rem, 4.25rem)',
                fontWeight: 300,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
              }}
            >
              {heading}
            </h2>
          </div>

          {/* Carousel */}
          <div className="relative mt-8 lg:mt-6 lg:h-[600px]">
            {/* Sliding track */}
            <div className="overflow-hidden h-full">
              <div
                className="flex h-full transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${active * 100}%)`, willChange: 'transform' }}
                aria-roledescription="carousel"
                aria-live="polite"
              >
                {members.map((m, i) => (
                  <div
                    key={m.name}
                    className="w-full shrink-0 px-8 sm:px-16 lg:px-[120px]"
                    aria-hidden={i !== active}
                    aria-label={`${i + 1} of ${members.length}`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-8 lg:gap-12 items-start h-full">
                      {/* Left: text */}
                      <div className="lg:max-w-[460px] lg:pt-2">
                        <h3
                          className="font-body font-bold text-white mb-3"
                          style={{
                            fontSize: 'clamp(1.5rem, 1.5vw + 1rem, 1.875rem)',
                            letterSpacing: '-0.01em',
                            lineHeight: 1.15,
                          }}
                        >
                          {m.name}
                        </h3>
                        <div className="h-[1px] w-24 bg-white/40 mb-4" />
                        <p
                          className="font-body font-bold text-secondary mb-5"
                          style={{ fontSize: '15px', letterSpacing: '0.02em' }}
                        >
                          {m.role}
                        </p>
                        {m.bio && (
                          <div
                            className="font-body text-white/85 whitespace-pre-line space-y-4"
                            style={{ fontSize: '14.4px', lineHeight: 1.55 }}
                          >
                            {m.bio.split(/\n\n+/).map((para, j) => (
                              <p key={j}>{para}</p>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: image */}
                      <div className="relative w-full lg:max-w-[558px] lg:justify-self-end">
                        <div className="relative w-full aspect-[558/473] overflow-hidden">
                          {m.image ? (
                            <img src={m.image} alt={m.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full bg-white/10" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prev / Next — sit in the panel padding gap */}
            {showNav && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous"
                  className="absolute z-10 hidden lg:flex items-center justify-center rounded-full text-white transition hover:opacity-100"
                  style={{
                    left: 20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 60,
                    height: 60,
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15,18 9,12 15,6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next"
                  className="absolute z-10 hidden lg:flex items-center justify-center rounded-full text-white transition hover:opacity-100"
                  style={{
                    right: 20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 60,
                    height: 60,
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </button>

                {/* Pagination dots */}
                <div
                  className="absolute z-10 flex items-center"
                  style={{
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bottom: 16,
                    borderRadius: 50,
                    backgroundColor: 'rgba(0,0,0,0.25)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                  }}
                >
                  {members.map((mem, i) => (
                    <button
                      key={mem.name}
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`Scroll to page ${i + 1}`}
                      className="flex items-center justify-center"
                      style={{
                        padding:
                          i === 0
                            ? '10px 5px 10px 10px'
                            : i === members.length - 1
                            ? '10px 10px 10px 5px'
                            : '10px 5px',
                      }}
                    >
                      <span
                        className="block rounded-full bg-white"
                        style={{ width: 10, height: 10, opacity: i === active ? 1 : 0.5 }}
                      />
                    </button>
                  ))}
                </div>

                {/* Mobile prev/next under content */}
                <div className="lg:hidden flex items-center justify-center gap-4 mt-6">
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Previous"
                    className="w-10 h-10 rounded-full bg-black/25 backdrop-blur-sm text-white flex items-center justify-center"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="15,18 9,12 15,6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Next"
                    className="w-10 h-10 rounded-full bg-black/25 backdrop-blur-sm text-white flex items-center justify-center"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="9,18 15,12 9,6" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
