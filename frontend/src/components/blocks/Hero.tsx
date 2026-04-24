import type { HeroContent } from '../../lib/types';
import { Button } from '../shared/Button';
import { HeroCarousel } from './HeroCarousel';

export function Hero({ heading, subheading, cta, backgroundImage, slides, variant = 'full', autoPlayInterval, titlePosition = 'bottom-left', subtitlePosition = 'bottom-right' }: HeroContent) {
  if (slides && slides.length > 1) {
    return <HeroCarousel slides={slides} autoPlayInterval={autoPlayInterval} titlePosition={titlePosition} subtitlePosition={subtitlePosition} />;
  }

  const heightClass = variant === 'compact' ? 'h-[460px]' : 'min-h-screen';

  const bg = slides && slides.length === 1 ? slides[0].backgroundImage : backgroundImage;

  return (
    <section
      className={`relative ${heightClass} flex items-center justify-center text-center text-white ${
        variant === 'compact' ? 'pt-[140px]' : ''
      }`}
      style={
        bg
          ? { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined
      }
    >
      <div className={`absolute inset-0 ${bg ? 'bg-primary/60' : 'bg-primary'}`} />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-24">
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold mb-6 italic">
          {heading}
        </h1>
        {subheading && (
          <p className="text-lg sm:text-xl text-text-light mb-8 max-w-2xl mx-auto">
            {subheading}
          </p>
        )}
        {cta && (
          <Button
            label={cta.label}
            href={cta.href}
            variant="white"
            className="uppercase tracking-[0.1em]"
            iconRight={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" aria-hidden="true">
                <path d="M1 13L13 1M13 1H3M13 1V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
        )}
      </div>
    </section>
  );
}
