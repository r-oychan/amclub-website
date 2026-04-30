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

  // Cascading rise-up animation for the perspective gallery.
  // Cards start translated down from the bottom card's slot and rise into
  // their final fan positions, bottom card first, then climbing upward.
  const cardOpacities = [0.2, 0.4, 0.65, 1];
  const cardDelays = [0, 350, 700, 1050];
  const cardDuration = 1600;
  const cardOpacity = (i: number) => (isVisible ? cardOpacities[i] : 0);
  const cardTransition = (i: number) =>
    `opacity ${cardDuration}ms ease-out ${cardDelays[i]}ms, transform ${cardDuration}ms cubic-bezier(0.22, 1, 0.36, 1) ${cardDelays[i]}ms`;
  // Bottom card sits at top: 47.69%; each higher card needs to translate up
  // from that slot to its own. The hidden state offsets each card *down* by
  // the percentage difference so they appear to start where the bottom card sits.
  const baseTops = [47.69, 36.5, 22.87, 10.22];
  const hiddenOffset = (i: number) => `${baseTops[0] - baseTops[i]}%`;

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
          <div className="relative">
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
                      opacity: cardOpacity(0),
                      transition: cardTransition(0),
                      transform: `translateY(${isVisible ? '0%' : hiddenOffset(0)}) perspective(1200px) rotate(-15deg) rotateX(31deg) rotateY(37deg)`,
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
                      opacity: cardOpacity(1),
                      transition: cardTransition(1),
                      transform: `translateY(${isVisible ? '0%' : hiddenOffset(1)}) perspective(1200px) rotate(-19deg) rotateX(29deg) rotateY(41deg)`,
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
                      opacity: cardOpacity(2),
                      transition: cardTransition(2),
                      transform: `translateY(${isVisible ? '0%' : hiddenOffset(2)}) perspective(1200px) rotate(-23deg) rotateX(30deg) rotateY(39deg)`,
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
                      opacity: cardOpacity(3),
                      transition: cardTransition(3),
                      transform: `translate(-50%, ${isVisible ? '0%' : hiddenOffset(3)}) perspective(1200px) rotate(-25deg) rotateX(35deg) rotateY(31deg)`,
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
                    className="bg-white/[0.77] rounded-[32px] p-10 text-center"
                  >
                    <div className="font-heading text-[1.8rem] xl:text-[2.4rem] font-light italic text-accent leading-[1.1] xl:tracking-[-0.03em] mb-2">
                      {stat.value}
                    </div>
                    <div className="text-[13.6px] font-normal uppercase tracking-[0.04em] text-primary leading-[1.1]">
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
                    <p className="font-body text-primary text-[19.2px] leading-[1.4] mb-1">Did You Know?</p>
                    <p className="font-body font-light text-primary text-[17.6px] leading-[1.4]">
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
