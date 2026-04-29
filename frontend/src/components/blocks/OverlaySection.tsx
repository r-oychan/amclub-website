import type { ReactNode, CSSProperties } from 'react';
import { ArrowLink, BorderedArrowLink } from '../shared/ArrowLink';
import type { CtaIconName } from '../shared/CtaIcon';
import { useScrollFadeIn } from '../../hooks/useScrollFadeIn';

export interface OverlaySectionProps {
  /** Horizontal position of the text panel */
  textPosition?: 'left' | 'right';
  /** Vertical alignment: 'start' = text top, 'center' = centered, 'end' = text bottom */
  textVerticalAlign?: 'start' | 'center' | 'end';
  /** Solid background color for text panel (hex) */
  textBgColor?: string;
  /** Background image URL for text panel (overrides textBgColor) */
  textBgImage?: string;
  /** 'light' = white text on dark bg, 'dark' = dark text on light bg */
  textTheme?: 'light' | 'dark';
  /** Main section image */
  image: string;
  imageAlt: string;
  /** Standard content props (ignored if children provided) */
  heading?: string;
  description?: string;
  ctas?: { label: string; href: string; bordered?: boolean; icon?: CtaIconName | null; isExternal?: boolean }[];
  logo?: string;
  /** Custom content for the text panel (overrides heading/description/ctas/logo) */
  children?: ReactNode;
}

export function OverlaySection({
  textPosition = 'left',
  textVerticalAlign,
  textBgColor,
  textBgImage,
  textTheme = 'light',
  image,
  imageAlt,
  heading,
  description,
  ctas,
  logo,
  children,
}: OverlaySectionProps) {
  const isLeft = textPosition === 'left';
  const vAlign = textVerticalAlign ?? (isLeft ? 'end' : 'center');
  const isDark = textTheme === 'light';
  // On a light panel, body copy renders in club navy (matching the Framer prototype),
  // not the generic charcoal body color.
  const textColorClass = isDark ? 'text-white' : 'text-primary';

  // Scroll-triggered slide + fade. Image and panel both slide in toward
  // center from their own outer side; panel trails the image slightly.
  const { ref: enterRef, isVisible } = useScrollFadeIn({ threshold: 0.15, replay: false });
  // Image is on the side opposite the text panel.
  const imgFadeClass = isLeft
    ? `transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
      }`
    : `transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
      }`;
  // Text panel is on the side named by textPosition.
  const panelFadeClass = isLeft
    ? `transition-all duration-700 ease-out delay-150 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
      }`
    : `transition-all duration-700 ease-out delay-150 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
      }`;

  const bgStyle: CSSProperties = textBgImage
    ? {
        backgroundColor: textBgColor || undefined,
        backgroundImage: `url(${textBgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { backgroundColor: textBgColor || '#001E62' };

  /* ── Resolve content ──────────────────────────────────── */
  const content = children ?? (
    <>
      {heading && (
        <h2 className={`heading-h2-serif mb-5 ${isDark ? '' : 'text-primary'}`}>
          {heading}
        </h2>
      )}
      {description && (
        <p
          className={`text-[17.6px] font-light leading-[1.4] mb-7 max-w-sm ${
            isDark ? 'text-white/77' : 'text-primary'
          }`}
        >
          {description}
        </p>
      )}
      {ctas && ctas.length > 0 && (
        <div
          className={
            ctas.some((c) => c.bordered)
              ? 'flex flex-col gap-1'
              : 'flex flex-wrap items-center gap-5'
          }
        >
          {ctas.map((cta) =>
            cta.bordered ? (
              <BorderedArrowLink
                key={cta.label}
                label={cta.label}
                href={cta.href}
                dark={isDark}
                icon={cta.icon ?? 'arrow'}
              />
            ) : (
              <ArrowLink
                key={cta.label}
                label={cta.label}
                href={cta.href}
                dark={isDark}
                icon={cta.icon ?? 'arrow'}
                isExternal={cta.isExternal}
              />
            ),
          )}
        </div>
      )}
      {logo && <img src={logo} alt="" className="h-12 mt-6" />}
    </>
  );

  const textPanel = (
    <div
      style={bgStyle}
      className={`p-8 md:p-10 lg:p-12 ${textColorClass}`}
    >
      {content}
    </div>
  );

  /* ── Layout helpers ───────────────────────────────────── */
  const imgOffset = isLeft ? 'md:ml-[28%]' : 'md:mr-[28%]';
  const txtCol = isLeft ? 'md:w-[40%]' : 'md:w-[40%] md:ml-auto';

  /* ── Center: CSS Grid with overlapping columns ────────── */
  if (vAlign === 'center') {
    return (
      <section className="py-6 md:py-10">
        <div ref={enterRef} className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div
              className={`md:row-start-1 ${imgFadeClass} ${
                isLeft
                  ? 'md:col-start-4 md:col-end-13'
                  : 'md:col-start-1 md:col-end-10'
              }`}
            >
              <img
                src={image}
                alt={imageAlt}
                className="w-full aspect-[16/10] object-cover"
              />
            </div>
            <div
              className={`relative z-10 -mt-8 mx-4 md:mx-0 md:mt-0 md:row-start-1 md:self-center ${panelFadeClass} ${
                isLeft
                  ? 'md:col-start-1 md:col-end-6'
                  : 'md:col-start-8 md:col-end-13'
              }`}
            >
              {textPanel}
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ── End: image first, text overlaps from below ────────── */
  if (vAlign === 'end') {
    return (
      <section className="py-6 md:py-10">
        <div ref={enterRef} className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`${imgOffset} ${imgFadeClass}`}>
            <img
              src={image}
              alt={imageAlt}
              className="w-full aspect-[16/10] object-cover"
            />
          </div>
          <div
            className={`relative z-10 -mt-8 mx-4 md:mx-0 md:-mt-52 lg:-mt-64 ${txtCol} ${panelFadeClass}`}
          >
            {textPanel}
          </div>
        </div>
      </section>
    );
  }

  /* ── Start: text first, image overlaps from below ──────── */
  return (
    <section className="py-6 md:py-10">
      <div
        ref={enterRef}
        className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:block"
      >
        <div
          className={`order-2 md:order-none relative z-10 -mt-8 mx-4 md:mx-0 md:mt-0 ${txtCol} ${panelFadeClass}`}
        >
          {textPanel}
        </div>
        <div
          className={`order-1 md:order-none ${imgOffset} md:-mt-40 lg:-mt-48 ${imgFadeClass}`}
        >
          <img
            src={image}
            alt={imageAlt}
            className="w-full aspect-[16/10] object-cover"
          />
        </div>
      </div>
    </section>
  );
}
