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
  const m = members[active];
  const showNav = members.length > 1;

  return (
    <section className="bg-bg py-16 md:py-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-primary text-white rounded-[12px] overflow-hidden px-6 sm:px-10 lg:px-16 py-12 lg:py-16">
          {watermark && (
            <img
              src={watermark}
              alt=""
              aria-hidden="true"
              className="pointer-events-none select-none absolute -bottom-12 -left-10 w-[420px] opacity-[0.07]"
            />
          )}

          <div className="relative">
            <h2
              className="font-heading italic text-white mb-10 md:mb-14"
              style={{ fontSize: 'clamp(2rem, 2.6vw + 1rem, 2.8rem)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.05 }}
            >
              {heading}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-16 items-start">
              {/* Left: profile copy */}
              <div className="lg:max-w-[500px]">
                <h3
                  className="font-body font-bold text-white mb-4"
                  style={{ fontSize: 'clamp(1.5rem, 1.5vw + 1rem, 1.875rem)', letterSpacing: '-0.01em', lineHeight: 1.15 }}
                >
                  {m.name}
                </h3>
                <div className="h-[1px] w-24 bg-white/40 mb-5" />
                <p className="font-body font-bold text-secondary mb-6" style={{ fontSize: '15px', letterSpacing: '0.02em' }}>
                  {m.role}
                </p>
                {m.bio && (
                  <div
                    className="font-body text-white/85 whitespace-pre-line space-y-4"
                    style={{ fontSize: '14.4px', lineHeight: 1.55 }}
                  >
                    {m.bio.split(/\n\n+/).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: photo */}
              <div className="relative">
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  {m.image ? (
                    <img src={m.image} alt={m.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-white/10" />
                  )}
                </div>
              </div>
            </div>

            {/* Pagination dots */}
            {showNav && (
              <div className="mt-10 flex items-center justify-center">
                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2.5">
                  {members.map((mem, i) => (
                    <button
                      key={mem.name}
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`Show ${mem.name}`}
                      className="rounded-full transition-colors"
                      style={{
                        width: i === active ? 8 : 6,
                        height: i === active ? 8 : 6,
                        backgroundColor: i === active ? '#ffffff' : 'rgba(255,255,255,0.4)',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Edge arrows */}
          {showNav && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Previous director"
                className="absolute z-10 flex items-center justify-center rounded-full text-white transition hover:opacity-100"
                style={{
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 44,
                  height: 44,
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  opacity: 0.9,
                }}
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next director"
                className="absolute z-10 flex items-center justify-center rounded-full text-white transition hover:opacity-100"
                style={{
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 44,
                  height: 44,
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  opacity: 0.9,
                }}
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
