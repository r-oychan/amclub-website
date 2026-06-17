import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { fetchAPI } from '../lib/api';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';
import { DetailSection } from '../components/detail/DetailSection';
import { CtaButton } from '../components/shared/CtaButton';
import { type CtaIconName } from '../components/shared/CtaIcon';
import { ImageTextPanels } from '../components/detail/ImageTextPanels';
import { mapImagePanels } from '../lib/imagePanels';
import { Markdown } from '../components/shared/Markdown';

interface StrapiLink {
  label?: string;
  href?: string;
  isExternal?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'text' | null;
  bordered?: boolean;
  icon?: CtaIconName | null;
}

interface OperatingHoursRow {
  dayRange?: string;
  time?: string;
}

interface OperatingHoursSection {
  title?: string;
  rows?: OperatingHoursRow[];
}

interface ReciprocalData {
  title?: string;
  label?: string;
  heading?: string;
  description?: string;
  heroImage?: { url?: string; alternativeText?: string };
  ctas?: StrapiLink[];
  secondaryImage?: { url?: string; alternativeText?: string };
  secondaryImageCaption?: string;
  secondaryImageSubCaption?: string;
  secondaryHeading?: string;
  secondaryBody?: string;
  secondaryCta?: StrapiLink;
  /** Raw `shared.image-text-panel` array from Strapi; normalised via mapImagePanels. */
  imagePanels?: unknown;
  operatingHoursSections?: OperatingHoursSection[];
  notesHeading?: string;
  notes?: string;
  parentLabel?: string;
  parentHref?: string;
}

const BLOCK_GAP = '60px';
const RIGHT_COL_GAP = '32px';

/**
 * Dedicated layout for /membership/reciprocal-clubs.
 *
 * Production has TWO stacked "image-left + content-right" hero blocks
 * which doesn't fit the generic VenueDetailPage layout (single hero
 * column, sections rendered full-width underneath). This component
 * fetches the `reciprocal-clubs-page` singleton from Strapi and renders
 * the two-block layout faithfully:
 *
 *   Block 1 — hero image (left, sticky) | heading + label + CTAs + description (right)
 *   Block 2 — secondary image (left)    | secondary heading + CTA + body + operating hours sub-sections + notes (right)
 */
export default function ReciprocalClubsPage() {
  const [data, setData] = useState<ReciprocalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const d = await fetchAPI<ReciprocalData>('/reciprocal-clubs-page');
      if (cancelled) return;
      setData(d);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-text-dark/60">
        Loading…
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-text-dark/60">
        This page hasn't been published yet.
      </div>
    );
  }

  const ctas = (data.ctas ?? []).filter((c) => c.label && c.href);
  const imagePanels = mapImagePanels(data.imagePanels);
  const parentLabel = data.parentLabel ?? 'Membership';
  const parentHref = data.parentHref ?? '/membership';
  const secondaryCta =
    data.secondaryCta?.label && data.secondaryCta.href ? data.secondaryCta : undefined;

  return (
    <>
      <DetailHeroBanner imageUrl={data.heroImage?.url} />
      <DetailBreadcrumb
        parentLabel={parentLabel}
        parentHref={parentHref}
        currentName={data.heading ?? data.title ?? ''}
      />

      {/* ── Block 1 — primary hero ── */}
      <section className="bg-bg">
        <div className="max-w-7xl mx-auto px-10 pt-12 pb-16">
          <div className="flex flex-col lg:flex-row" style={{ gap: BLOCK_GAP }}>
            <div className="lg:w-[52%] shrink-0">
              {data.heroImage?.url && (
                <div className="lg:sticky lg:top-[120px] overflow-hidden">
                  <img
                    src={data.heroImage.url}
                    alt={data.heroImage.alternativeText ?? data.heading ?? ''}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col" style={{ gap: RIGHT_COL_GAP }}>
              <h1
                className="font-heading text-primary"
                style={{ fontSize: '38.4px', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.1 }}
              >
                {data.heading ?? data.title}
              </h1>
              {data.label && (
                <p
                  className="font-body uppercase text-primary/70"
                  style={{ fontSize: '12.5px', letterSpacing: '0.2em' }}
                >
                  {data.label}
                </p>
              )}
              {ctas.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  {ctas.map((c, i) => (
                    <CtaButton key={i} cta={{ ...c, label: c.label!, href: c.href! }} />
                  ))}
                </div>
              )}
              {data.description && <Markdown>{data.description}</Markdown>}
            </div>
          </div>
        </div>
      </section>

      {/* ── Block 2 — secondary image + Tower Club partnership content ── */}
      {(data.secondaryImage?.url || data.secondaryHeading) && (
        <section className="bg-bg">
          <div className="max-w-7xl mx-auto px-10 pb-[120px]">
            <div className="flex flex-col lg:flex-row" style={{ gap: BLOCK_GAP }}>
              <div className="lg:w-[52%] shrink-0">
                {data.secondaryImage?.url && (
                  <div className="lg:sticky lg:top-[120px] flex flex-col" style={{ gap: '12px' }}>
                    <img
                      src={data.secondaryImage.url}
                      alt={data.secondaryImage.alternativeText ?? data.secondaryImageCaption ?? ''}
                      className="w-full h-auto object-cover"
                    />
                    {(data.secondaryImageCaption || data.secondaryImageSubCaption) && (
                      <div>
                        {data.secondaryImageCaption && (
                          <h3 className="font-heading text-primary" style={{ fontSize: '20px', fontWeight: 400 }}>
                            {data.secondaryImageCaption}
                          </h3>
                        )}
                        {data.secondaryImageSubCaption && (
                          <p className="font-body text-text-dark/70" style={{ fontSize: '14px' }}>
                            {data.secondaryImageSubCaption}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col" style={{ gap: RIGHT_COL_GAP }}>
                {data.secondaryHeading && (
                  <h2
                    className="font-heading text-primary"
                    style={{ fontSize: '32px', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.1 }}
                  >
                    {data.secondaryHeading}
                  </h2>
                )}
                {secondaryCta && (
                  <div>
                    <CtaButton cta={{ ...secondaryCta, label: secondaryCta.label!, href: secondaryCta.href! }} />
                  </div>
                )}
                {data.secondaryBody && <Markdown>{data.secondaryBody}</Markdown>}
                {(data.operatingHoursSections ?? []).map((section, idx) => (
                  <DetailSection key={idx} icon="clock" title={section.title ?? ''}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                      {(section.rows ?? []).map((row, j) => (
                        <div key={j} className="flex flex-col gap-1">
                          {row.dayRange && (
                            <p className="text-text-dark" style={{ fontSize: '17.6px', fontWeight: 700, lineHeight: '24.64px' }}>
                              {row.dayRange}
                            </p>
                          )}
                          {row.time && (
                            <p className="text-text-dark whitespace-pre-line" style={{ fontSize: '17.6px', lineHeight: '26.4px' }}>
                              {row.time}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </DetailSection>
                ))}
                {data.notes && (
                  <DetailSection icon="reservation" title={data.notesHeading ?? 'Important things to note'}>
                    <ul className="flex flex-col gap-2 text-text-dark" style={{ fontSize: '19.2px', lineHeight: '26.88px' }}>
                      {data.notes
                        .split('\n')
                        .map((line) => line.replace(/^•\s*/, '').trim())
                        .filter(Boolean)
                        .map((line, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-accent">•</span>
                            <span>{line}</span>
                          </li>
                        ))}
                    </ul>
                  </DetailSection>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Image + text panels (e.g. Local Reciprocity) ── */}
      <ImageTextPanels panels={imagePanels} />

      {/* ── Back link ── */}
      <section className="py-10 bg-bg">
        <div className="max-w-7xl mx-auto px-10">
          <Link
            to={parentHref}
            className="inline-flex items-center gap-2.5 font-bold uppercase text-primary hover:text-accent transition-colors"
            style={{ fontSize: '14.4px', letterSpacing: '0.576px' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#DF4661" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to {parentLabel}
          </Link>
        </div>
      </section>
    </>
  );
}
