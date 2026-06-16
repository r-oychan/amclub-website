import { Markdown } from '../shared/Markdown';
import { DetailSection } from './DetailSection';
import { CtaButton, type CtaLink } from '../shared/CtaButton';
import { resolveIcon } from '../../lib/detailIcons';

/**
 * One alternating image + text panel (the `shared.image-text-panel` CMS
 * component). Used for fitness/kids facility sub-sections (e.g. Tennis
 * Programs / Tennis Etiquette) and the membership singletons
 * (e.g. Local Reciprocity on /membership/reciprocal-clubs).
 */
export interface ImageTextPanel {
  image: string;
  imageAlt?: string;
  imagePosition?: 'left' | 'right';
  slideWithText?: boolean;
  heading: string;
  ctas?: CtaLink[];
  /** @deprecated single-CTA shape from before imagePanels supported multiple; read as fallback. */
  cta?: CtaLink;
  subheading?: string;
  body?: string;
  bullets?: string[];
  operatingHours?: { title: string; rows: string[] }[];
  extraSections?: { title: string; content?: string; bullets?: string[] }[];
  footnote?: string;
}

/**
 * Renders a stack of alternating image+text panels. Image position
 * alternates left/right by index unless `imagePosition` is set per panel.
 * Each panel supports an optional multi-CTA row, body copy, a titled
 * sub-section (bullets + operating-hours groups), nested rich-text
 * extraSections, and a footnote.
 */
export function ImageTextPanels({ panels }: { panels?: ImageTextPanel[] }) {
  if (!panels || panels.length === 0) return null;
  return (
    <section className="bg-bg pb-[120px]">
      <div className="max-w-7xl mx-auto px-10 flex flex-col" style={{ gap: '120px' }}>
        {panels.map((panel, idx) => {
          const imageOnLeft = (panel.imagePosition ?? (idx % 2 === 0 ? 'left' : 'right')) === 'left';
          // By default the image stays pinned near the top of the viewport
          // while a long text column scrolls past. Pass `slideWithText` on
          // the panel to opt back into the row's normal flow.
          const stick = !panel.slideWithText;
          const imgEl = (
            <div className="lg:w-[52%] shrink-0">
              <div className={stick ? 'lg:sticky lg:top-[120px]' : ''}>
                <div className="overflow-hidden">
                  <img
                    src={panel.image}
                    alt={panel.imageAlt ?? panel.heading}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          );
          const textEl = (
            <div className="flex flex-col flex-1" style={{ gap: '32px' }}>
              <h2
                className="font-heading text-primary"
                style={{
                  fontSize: '38.4px',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  letterSpacing: '-1.152px',
                  lineHeight: '42.24px',
                }}
              >
                {panel.heading}
              </h2>

              {(() => {
                // Accept both the multi-CTA `ctas` and the legacy single `cta`
                // (static subpages fallback still uses the latter).
                const panelCtas = panel.ctas?.length ? panel.ctas : panel.cta ? [panel.cta] : [];
                return panelCtas.length > 0 ? (
                  <div className="flex flex-wrap items-center" style={{ gap: '12px' }}>
                    {panelCtas.map((cta, ci) => (
                      <CtaButton key={`${cta.label}-${ci}`} cta={cta} />
                    ))}
                  </div>
                ) : null;
              })()}

              {panel.body && (
                <p
                  className="text-text-dark"
                  style={{ fontSize: '19.2px', fontWeight: 400, lineHeight: '26.88px' }}
                >
                  {panel.body}
                </p>
              )}

              {panel.subheading && (() => {
                // Prefer clock when the subsection carries scheduled hours;
                // otherwise pick the closest semantic icon by title.
                const subIcon = panel.operatingHours && panel.operatingHours.length > 0
                  ? 'clock'
                  : resolveIcon(panel.subheading);
                return (
                  <DetailSection icon={subIcon} title={panel.subheading}>
                    <div className="flex flex-col" style={{ gap: '20px' }}>
                      {panel.bullets && panel.bullets.length > 0 && (
                        <ul className="list-disc pl-6 flex flex-col" style={{ gap: '8px' }}>
                          {panel.bullets.map((b, i) => (
                            <li
                              key={i}
                              className="text-text-dark"
                              style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                            >
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}
                      {panel.operatingHours && panel.operatingHours.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                          {panel.operatingHours.map((block, i) => (
                            <div key={i} className="flex flex-col gap-1">
                              <p
                                className="text-text-dark"
                                style={{ fontSize: '17.6px', fontWeight: 700, lineHeight: '24.64px' }}
                              >
                                {block.title}
                              </p>
                              {block.rows.map((row, j) => (
                                <p
                                  key={j}
                                  className="text-text-dark"
                                  style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                                >
                                  {row}
                                </p>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </DetailSection>
                );
              })()}

              {/* If there's no subheading, bullets/operatingHours still render unwrapped. */}
              {!panel.subheading && panel.bullets && panel.bullets.length > 0 && (
                <ul className="list-disc pl-6 flex flex-col" style={{ gap: '8px' }}>
                  {panel.bullets.map((b, i) => (
                    <li
                      key={i}
                      className="text-text-dark"
                      style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              {!panel.subheading && panel.operatingHours && panel.operatingHours.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  {panel.operatingHours.map((block, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <p
                        className="text-text-dark"
                        style={{ fontSize: '17.6px', fontWeight: 700, lineHeight: '24.64px' }}
                      >
                        {block.title}
                      </p>
                      {block.rows.map((row, j) => (
                        <p
                          key={j}
                          className="text-text-dark"
                          style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                        >
                          {row}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {panel.extraSections && panel.extraSections.length > 0 && (
                <div className="flex flex-col" style={{ gap: '24px' }}>
                  {panel.extraSections.map((extra, ei) => (
                    <div key={ei} className="flex flex-col" style={{ gap: '12px' }}>
                      <h3 className="text-primary" style={{ fontSize: '21px', fontWeight: 700, lineHeight: '28px' }}>
                        {extra.title}
                      </h3>
                      {extra.content && <Markdown compact>{extra.content}</Markdown>}
                      {Array.isArray(extra.bullets) && extra.bullets.length > 0 && (
                        <ul className="list-disc pl-6 flex flex-col" style={{ gap: '6px' }}>
                          {extra.bullets.map((b, bi) => (
                            <li key={bi} className="text-text-dark" style={{ fontSize: '17.6px', lineHeight: '25.6px' }}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {panel.footnote && (
                <p
                  className="text-text-dark/70 italic"
                  style={{ fontSize: '15.2px', lineHeight: '22px' }}
                >
                  {panel.footnote}
                </p>
              )}
            </div>
          );
          return (
            <div
              key={`${panel.heading}-${idx}`}
              className="flex flex-col lg:flex-row items-start"
              style={{ gap: '60px' }}
            >
              {imageOnLeft ? (
                <>
                  {imgEl}
                  {textEl}
                </>
              ) : (
                <>
                  {textEl}
                  {imgEl}
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
