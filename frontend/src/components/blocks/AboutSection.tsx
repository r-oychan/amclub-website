import { Link } from 'react-router';
import type { StatItem, CtaButton } from '../../lib/types';
import { SectionHeader } from '../shared/SectionHeader';
import { useScrollFadeIn } from '../../hooks/useScrollFadeIn';

export function AboutSection({
  label,
  heading,
  stats,
  funFact,
  cta,
  images,
}: {
  label?: string;
  heading?: string;
  stats?: StatItem[];
  funFact?: string;
  cta?: CtaButton;
  images?: string[];
}) {
  const { ref: sectionRef, isVisible } = useScrollFadeIn(0.1);

  const fadeBase = 'transition-all duration-700 ease-out';
  const fadeHidden = 'opacity-0 translate-y-8';
  const fadeShow = 'opacity-100 translate-y-0';
  const fade = (delay: string) =>
    `${fadeBase} ${isVisible ? fadeShow : fadeHidden} ${delay}`;

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-bg overflow-hidden">
      {/* Top accent line */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 md:mb-16">
        <div className="h-px bg-secondary/40" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header: label left, heading right */}
        <div className={fade('delay-100')}>
          <SectionHeader label={label} heading={heading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8 items-start">
          {/* Left column - Photo collage (3D perspective fan) */}
          <div className={`relative ${fade('delay-0')}`}>
            {images && images.length > 0 && (
              <div className="relative w-full max-w-[514px] mx-auto lg:mx-0" style={{ aspectRatio: '514 / 411', perspective: '1200px' }}>
                {images[0] && (
                  <div
                    className="absolute overflow-hidden shadow-xl"
                    style={{
                      width: '62.26%',
                      aspectRatio: '320 / 201',
                      top: '47.69%',
                      left: '1.17%',
                      opacity: 0.2,
                      transform: 'perspective(1200px) rotate(-15deg) rotateX(31deg) rotateY(37deg)',
                    }}
                  >
                    <img src={images[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                {images[1] && (
                  <div
                    className="absolute overflow-hidden shadow-xl"
                    style={{
                      width: '62.26%',
                      aspectRatio: '320 / 201',
                      top: '36.50%',
                      left: '6.61%',
                      opacity: 0.4,
                      transform: 'perspective(1200px) rotate(-19deg) rotateX(29deg) rotateY(41deg)',
                    }}
                  >
                    <img src={images[1]} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                {images[2] && (
                  <div
                    className="absolute overflow-hidden shadow-xl"
                    style={{
                      width: '62.26%',
                      aspectRatio: '320 / 201',
                      top: '22.87%',
                      left: '13.04%',
                      opacity: 0.65,
                      transform: 'perspective(1200px) rotate(-23deg) rotateX(30deg) rotateY(39deg)',
                    }}
                  >
                    <img src={images[2]} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                {images[3] && (
                  <div
                    className="absolute overflow-hidden shadow-2xl"
                    style={{
                      width: '62.26%',
                      aspectRatio: '320 / 201',
                      top: '10.22%',
                      left: '50.99%',
                      transform: 'translateX(-50%) perspective(1200px) rotate(-25deg) rotateX(35deg) rotateY(31deg)',
                    }}
                  >
                    <img src={images[3]} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column - Stats, fun fact, CTA */}
          <div>
            {/* Stats cards */}
            {stats && stats.length > 0 && (
              <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-10 md:mb-14 ${fade('delay-300')}`}>
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-2xl px-6 py-8 text-center shadow-sm"
                  >
                    <div className="font-heading text-3xl md:text-4xl font-light italic text-accent mb-2">
                      {stat.value}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-[0.15em] text-text-dark/60">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fun fact */}
            {funFact && (
              <div className={`mb-10 ${fade('delay-[400ms]')}`}>
                <div className="flex gap-4">
                  <div className="w-1 shrink-0 bg-accent rounded-full" />
                  <div>
                    <p className="font-bold text-text-dark text-sm mb-1">Did You Know?</p>
                    <p className="text-text-dark/70 text-sm leading-relaxed">
                      {funFact.replace(/^Did You Know\?\s*/i, '')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CTA link */}
            {cta && cta.href && (
              <div className={fade('delay-500')}>
                <Link
                  to={cta.href}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary hover:text-accent transition-colors duration-200"
                >
                  {cta.label}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-accent">
                    <path d="M1 13L13 1M13 1H3M13 1V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
