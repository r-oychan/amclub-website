import type { FeatureItem, CtaButton } from '../../lib/types';
import { SectionHeader } from '../shared/SectionHeader';
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
  centered = false,
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
  centered?: boolean;
}) {
  const aside = asideImage ? (
    <img
      src={asideImage}
      alt=""
      className="w-full max-w-[420px] mx-auto md:mx-0 object-contain"
      style={{ mixBlendMode: 'multiply', backgroundColor: 'transparent' }}
      loading="lazy"
    />
  ) : null;

  // When an asideImage is present, the heading + body live INSIDE the content
  // column (next to the image), matching the Framer "Club Advocacy" layout.
  // Without an asideImage we keep the existing label/heading split layout via SectionHeader.
  const inlineHeader = asideImage ? (
    <>
      {heading && (
        <h2
          className={`font-heading italic mb-5 ${centered ? 'text-center' : ''} ${
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
      <div className={`h-[2px] w-12 mb-7 ${dark ? 'bg-white/40' : 'bg-accent'} ${centered ? 'mx-auto' : ''}`} />
      {subheading && (
        <h3
          className={`font-heading italic mb-5 ${centered ? 'text-center' : ''} ${
            dark ? 'text-white' : 'text-primary'
          }`}
          style={{
            fontSize: 'clamp(1.25rem, 1.2vw + 0.8rem, 1.5rem)',
            fontWeight: 300,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          {subheading}
        </h3>
      )}
      {body && (
        <div className={`mb-8 max-w-2xl space-y-4 ${centered ? 'mx-auto text-center' : ''}`}>
          {body.split(/\n\n+/).map((para, i) => (
            <p
              key={i}
              className={`font-body ${dark ? 'text-white/80' : 'text-primary'}`}
              style={{ fontSize: '17.6px', fontWeight: 300, lineHeight: '24.64px' }}
            >
              {para}
            </p>
          ))}
        </div>
      )}
    </>
  ) : null;

  return (
    <section className={`py-16 md:py-24 ${dark ? 'bg-primary text-white' : 'bg-bg'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top accent line */}
        <div className={`h-px ${dark ? 'bg-white/20' : 'bg-secondary/40'} mb-12 md:mb-16`} />

        {!asideImage && (
          <>
            {centered ? (
              heading && (
                <h2
                  className={`heading-h2-serif text-center mb-10 md:mb-14 ${
                    dark ? 'text-white' : 'text-primary'
                  }`}
                >
                  {heading}
                </h2>
              )
            ) : (
              <SectionHeader label={label} heading={heading} cta={cta} dark={dark} />
            )}

            {(subheading || body) && (
              <div className={`mb-10 max-w-2xl ${centered ? 'mx-auto text-center' : ''}`}>
                {subheading && (
                  <p className={`mb-4 ${dark ? 'text-white/70' : 'text-text-dark/70'}`}>{subheading}</p>
                )}
                {body && (
                  <p className={`${dark ? 'text-white/70' : 'text-text-dark/70'}`}>{body}</p>
                )}
              </div>
            )}
          </>
        )}

        <div
          className={
            asideImage
              ? 'grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-10 lg:gap-16 items-start'
              : ''
          }
        >
          {aside && asideImagePosition === 'left' && aside}
          <div>
            {inlineHeader}
            {items && items.length > 0 && (
              <div
                className={`grid grid-cols-1 ${
                  items.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'
                } gap-8`}
              >
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
                      <p
                        className={`font-body font-light text-base md:text-[17.6px] leading-[1.4] ${
                          dark ? 'text-bg/70' : 'text-text-dark/80'
                        }`}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {listItems && listItems.length > 0 && (
              <div className="flex flex-col gap-2 max-w-2xl mt-2">
                {listItems.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="text-secondary shrink-0" aria-hidden="true">&#10003;</span>
                    <span
                      className={`font-body ${dark ? 'text-white/80' : 'text-primary'}`}
                      style={{ fontSize: '17.6px', fontWeight: 400, lineHeight: '26.4px' }}
                    >
                      {item}
                    </span>
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
