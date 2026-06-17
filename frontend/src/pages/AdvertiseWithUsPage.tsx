import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { fetchAPI } from '../lib/api';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';
import { CtaButton } from '../components/shared/CtaButton';
import { type CtaIconName } from '../components/shared/CtaIcon';
import { Markdown } from '../components/shared/Markdown';
import { DetailSection } from '../components/detail/DetailSection';
import { ContactRow } from '../components/detail/ContactRow';
import { resolveIcon, type DetailIconName } from '../lib/detailIcons';

interface StrapiLink {
  label?: string;
  href?: string;
  isExternal?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'text' | null;
  bordered?: boolean;
  icon?: CtaIconName | null;
}

interface AdvertiseBlock {
  __component: string;
  heading?: string;
  body?: string;
}

interface AdvertiseData {
  title?: string;
  label?: string;
  heading?: string;
  description?: string;
  heroImage?: { url?: string; alternativeText?: string };
  ctas?: StrapiLink[];
  phone?: string;
  email?: string;
  locationContact?: { locationLevel?: string; phone?: string; email?: string } | null;
  extraSections?: { title?: string; content?: string; bullets?: string[]; icon?: DetailIconName | null }[];
  body?: AdvertiseBlock[];
  parentLabel?: string;
  parentHref?: string;
}

const BLOCK_GAP = '60px';
const RIGHT_COL_GAP = '32px';

/**
 * Dedicated layout for /home-sub/advertise-with-us.
 *
 * Production renders one image-left + content-right block with the
 * "Sponsorship" sub-section stacked inside the right column (not as a
 * separate full-width section below the hero). The generic
 * VenueDetailPage puts body blocks in a full-width band — this
 * component fetches the singleton and inlines text-block body content
 * into the right column so the visual matches.
 */
export default function AdvertiseWithUsPage() {
  const [data, setData] = useState<AdvertiseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const d = await fetchAPI<AdvertiseData>('/advertise-with-us-page');
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
  const parentLabel = data.parentLabel ?? 'The American Club';
  const parentHref = data.parentHref ?? '/home';
  const extraSections = data.extraSections ?? [];
  // Legacy titled sections lived in the `body` dynamiczone as text-blocks.
  // Extra Sections superseded them (icon subheader + editable icon). Render the
  // body text-blocks only as a fallback when no Extra Sections exist, so
  // environments not yet migrated to Extra Sections (e.g. prod) still show the
  // content while migrated ones (UAT) don't duplicate it.
  const textBlocks =
    extraSections.length === 0
      ? (data.body ?? []).filter((b) => b.__component === 'blocks.text-block')
      : [];
  // Optional Location & Contact module (same shape as dining). When filled it
  // renders the dining-style section; otherwise we fall back to the legacy
  // top-level phone/email so existing content keeps showing.
  const lc = data.locationContact;
  const locationContact = lc && (lc.locationLevel || lc.phone || lc.email) ? lc : null;

  return (
    <>
      <DetailHeroBanner imageUrl={data.heroImage?.url} />
      <DetailBreadcrumb
        parentLabel={parentLabel}
        parentHref={parentHref}
        currentName={data.heading ?? data.title ?? ''}
      />

      <section className="bg-bg">
        <div className="max-w-7xl mx-auto px-10 pt-12 pb-[120px]">
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
              {data.description && (
                <div
                  className="font-body text-text-dark/85 whitespace-pre-line"
                  style={{ fontSize: '17px', lineHeight: 1.55 }}
                >
                  {data.description}
                </div>
              )}

              {/* Legacy body text-blocks — fallback only (rendered when there are
                  no Extra Sections; see `textBlocks` above). */}
              {textBlocks.map((b, idx) => (
                <div key={`tb-${idx}`} className="flex flex-col" style={{ gap: '20px' }}>
                  {b.heading && (
                    <h2
                      className="font-heading text-primary"
                      style={{ fontSize: '28px', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.15 }}
                    >
                      {b.heading}
                    </h2>
                  )}
                  {b.body && (
                    <div
                      className="font-body text-text-dark/85 whitespace-pre-line"
                      style={{ fontSize: '17px', lineHeight: 1.55 }}
                    >
                      {b.body}
                    </div>
                  )}
                </div>
              ))}

              {/* Extra Sections — rendered with the facilities-style icon + title
                  subheader (DetailSection). The icon is CMS-editable; when unset
                  it's inferred from the title (e.g. "Sponsorship" → heart). */}
              {extraSections.map((ex, idx) => (
                <DetailSection
                  key={`ex-${idx}`}
                  icon={ex.icon ?? resolveIcon(ex.title ?? '')}
                  title={ex.title ?? ''}
                >
                  <div className="flex flex-col" style={{ gap: '16px' }}>
                    {ex.content && <Markdown compact>{ex.content}</Markdown>}
                    {Array.isArray(ex.bullets) && ex.bullets.length > 0 && (
                      <ul className="list-disc pl-6 flex flex-col font-body text-text-dark/85" style={{ gap: '8px', fontSize: '17px', lineHeight: 1.55 }}>
                        {ex.bullets.map((b, k) => (
                          <li key={k}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </DetailSection>
              ))}

              {/* Location & Contact — dining-style module from the CMS
                  `locationContact` component; falls back to top-level phone/email. */}
              {locationContact ? (
                <DetailSection icon="location" title="Location & Contact">
                  <div className="flex flex-col" style={{ gap: '16px' }}>
                    {locationContact.locationLevel && (
                      <ContactRow icon="pin" text={locationContact.locationLevel} />
                    )}
                    {locationContact.phone && (
                      <ContactRow
                        icon="phone"
                        text={locationContact.phone}
                        href={`tel:${locationContact.phone.replace(/\s+/g, '')}`}
                      />
                    )}
                    {locationContact.email && (
                      <ContactRow
                        icon="email"
                        text={locationContact.email}
                        href={`mailto:${locationContact.email}`}
                      />
                    )}
                  </div>
                </DetailSection>
              ) : (data.phone || data.email) ? (
                <dl
                  className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 font-body text-text-dark/85 pt-2"
                  style={{ fontSize: '16px', lineHeight: 1.5 }}
                >
                  {data.phone && (
                    <>
                      <dt className="text-primary/70 uppercase tracking-wider" style={{ fontSize: '13px' }}>Phone</dt>
                      <dd>
                        <a className="hover:text-accent transition-colors" href={`tel:${data.phone.replace(/\s+/g, '')}`}>
                          {data.phone}
                        </a>
                      </dd>
                    </>
                  )}
                  {data.email && (
                    <>
                      <dt className="text-primary/70 uppercase tracking-wider" style={{ fontSize: '13px' }}>Email</dt>
                      <dd>
                        <a className="hover:text-accent transition-colors" href={`mailto:${data.email}`}>
                          {data.email}
                        </a>
                      </dd>
                    </>
                  )}
                </dl>
              ) : null}
            </div>
          </div>
        </div>
      </section>

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
