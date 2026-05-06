import { useEffect, useState } from 'react';
import type { CollageImage, CtaButton } from '../../lib/types';
import { Button } from '../shared/Button';
import { CtaIcon } from '../shared/CtaIcon';
import { useScrollFadeIn } from '../../hooks/useScrollFadeIn';

interface MembershipCommunityCollageProps {
  heading: string;
  body?: string;
  ctas?: CtaButton[];
  images: CollageImage[];
}

// Per-image grid placement + parallax rate. The rate is added scroll-dependent
// translateY: positive = lags behind scroll (slower), negative = leads (faster).
// Rates approximate the Framer prototype's measured slopes.
const SLOTS: { col: string; row: string; aspect: string; baseY: string; rate: number }[] = [
  { col: 'lg:col-start-1 lg:col-span-3',  row: 'lg:row-start-1', aspect: 'aspect-[314/451]', baseY: '0px',   rate: 0.30 },
  { col: 'lg:col-start-10 lg:col-span-3', row: 'lg:row-start-1', aspect: 'aspect-[335/347]', baseY: '48px',  rate: 0.20 },
  { col: 'lg:col-start-3 lg:col-span-4',  row: 'lg:row-start-2', aspect: 'aspect-[420/259]', baseY: '-32px', rate: 0.05 },
  { col: 'lg:col-start-7 lg:col-span-5',  row: 'lg:row-start-2', aspect: 'aspect-[498/333]', baseY: '-8px',  rate: -0.10 },
];

export function MembershipCommunityCollage({
  heading,
  body,
  ctas,
  images,
}: MembershipCommunityCollageProps) {
  const [parallax, setParallax] = useState(0);
  const { ref: sectionRef, isVisible } = useScrollFadeIn<HTMLElement>({
    threshold: 0,
    rootMargin: '0px 0px -25% 0px',
    replay: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // Center of section relative to viewport center: 0 when centered,
      // negative when section is below viewport center, positive when above.
      const center = rect.top + rect.height / 2;
      const offset = center - vh / 2;
      // Normalize to a smaller pixel-domain scroll offset for parallax.
      // Use ~40% of the viewport offset as the driving value so motion is
      // visible without being chaotic.
      setParallax(-offset * 0.6);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sectionRef]);

  if (!images || images.length === 0) return null;
  const visible = images.slice(0, SLOTS.length);

  return (
    <section
      ref={sectionRef}
      className="bg-bg pt-16 md:pt-24 pb-20 md:pb-28 overflow-hidden"
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-x-8 lg:gap-y-12 relative">
          {visible.map((img, i) => {
            const slot = SLOTS[i];
            const translateY = `calc(${slot.baseY} + ${parallax * slot.rate}px)`;
            return (
              <figure
                key={img.src + i}
                className={`overflow-hidden ${slot.col} ${slot.row} transition-[opacity] duration-700 ease-out ${
                  isVisible ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  transform: `translate3d(0, ${translateY}, 0)`,
                  transitionDelay: `${i * 80}ms`,
                  willChange: 'transform',
                }}
              >
                <div className={`w-full ${slot.aspect}`}>
                  <img
                    src={img.src}
                    alt={img.alt ?? ''}
                    className="w-full h-full object-cover block"
                    loading="lazy"
                  />
                </div>
              </figure>
            );
          })}

          {/* Centered text + CTA, sitting on top of the collage at lg+ */}
          <div className="lg:absolute lg:inset-0 lg:row-start-1 lg:col-start-4 lg:col-span-6 lg:flex lg:items-start lg:justify-center lg:pointer-events-none">
            <div
              className={`text-center max-w-md mx-auto lg:pt-2 lg:pointer-events-auto transition-all duration-700 ease-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: '120ms' }}
            >
              <h2 className="font-heading italic font-light text-primary mb-6 text-[2rem] md:text-[2.4rem] leading-[1.1] tracking-[-0.03em]">
                {heading}
              </h2>
              {body && (
                <p className="font-body font-light text-primary/80 text-[15px] md:text-[17.6px] leading-[1.4] mb-8">
                  {body}
                </p>
              )}
              {ctas && ctas.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3">
                  {ctas.map((c) => (
                    <Button
                      key={c.label}
                      label={c.label}
                      href={c.href}
                      variant="secondary"
                      className="px-7 py-3.5 uppercase tracking-[0.04em] text-[12.8px]"
                      iconRight={<CtaIcon name="arrow" size={14} className="text-secondary" />}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
