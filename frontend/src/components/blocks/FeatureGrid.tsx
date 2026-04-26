import type { FeatureItem, CtaButton } from '../../lib/types';
import { Button } from '../shared/Button';

export function FeatureGrid({
  label,
  heading,
  subheading,
  body,
  items,
  cta,
  listItems,
  ctas,
  dark = false,
  asideImage,
  asideImagePosition = 'left',
}: {
  label?: string;
  heading?: string;
  subheading?: string;
  body?: string;
  items?: FeatureItem[];
  cta?: CtaButton;
  listItems?: string[];
  ctas?: CtaButton[];
  dark?: boolean;
  asideImage?: string;
  asideImagePosition?: 'left' | 'right';
}) {
  const aside = asideImage ? (
    <img
      src={asideImage}
      alt=""
      className="w-full max-w-[420px] mx-auto md:mx-0 object-contain"
      loading="lazy"
    />
  ) : null;

  return (
    <section className={`py-16 md:py-24 ${dark ? 'bg-primary text-white' : 'bg-bg'}`}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {label && (
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-1 h-5 shrink-0 bg-accent rounded-full" />
            <span
              className={`text-[14.4px] font-bold uppercase tracking-[0.04em] ${
                dark ? 'text-white/70' : 'text-text-dark'
              }`}
            >
              {label}
            </span>
          </div>
        )}
        {heading && (
          <h2
            className={`font-heading italic text-center mb-12 md:mb-16 ${
              dark ? 'text-white' : 'text-primary'
            }`}
            style={{
              fontSize: 'clamp(2rem, 2.6vw + 1rem, 2.8rem)',
              fontWeight: 300,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
            }}
          >
            {heading}
          </h2>
        )}
        {cta && cta.href && (
          <div className="flex justify-center mb-10">
            <Button label={cta.label} href={cta.href} variant={dark ? 'white' : 'secondary'} />
          </div>
        )}

        <div className={asideImage ? 'grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-10 lg:gap-16 items-start' : ''}>
          {aside && asideImagePosition === 'left' && aside}
          <div>
        {subheading && (
          <p className={`max-w-2xl mb-4 ${dark ? 'text-white/70' : 'text-text-dark/70'}`}>
            {subheading}
          </p>
        )}
        {body && (
          <p className={`max-w-2xl mb-8 ${dark ? 'text-white/70' : 'text-text-dark/70'}`}>
            {body}
          </p>
        )}

        {items && items.length > 0 && (
          <div className={`grid grid-cols-1 ${items.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'} gap-8`}>
            {items.map((item) => (
              <div key={item.heading} className="flex flex-col">
                {item.image && (
                  <img
                    src={item.image}
                    alt=""
                    className="w-full aspect-[344/217] object-cover block mb-6"
                  />
                )}
                <h3
                  className={`font-heading italic font-light text-2xl md:text-[26.56px] leading-[1.1] mb-4 ${
                    dark ? 'text-bg' : 'text-primary'
                  }`}
                >
                  {item.heading}
                </h3>
                {item.description && (
                  <p className={`font-body text-base md:text-[17.6px] leading-[1.4] ${dark ? 'text-bg/90' : 'text-text-dark/80'}`}>
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {listItems && listItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mt-8">
            {listItems.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="text-secondary mt-0.5">&#10003;</span>
                <span className={`text-sm ${dark ? 'text-white/80' : 'text-text-dark/80'}`}>{item}</span>
              </div>
            ))}
          </div>
        )}

        {ctas && ctas.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-10">
            {ctas.map((c) => (
              <Button key={c.label} label={c.label} href={c.href} variant={dark ? 'white' : 'secondary'} />
            ))}
          </div>
        )}
          </div>
          {aside && asideImagePosition === 'right' && aside}
        </div>
      </div>
    </section>
  );
}
