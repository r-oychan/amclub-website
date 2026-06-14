import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { fetchAPI } from '../lib/api';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';
import { Button } from '../components/shared/Button';
import { CtaIcon, type CtaIconName } from '../components/shared/CtaIcon';

interface StrapiLink {
  label?: string;
  href?: string;
  isExternal?: boolean;
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
  const textBlocks = (data.body ?? []).filter((b) => b.__component === 'blocks.text-block');

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
                    <Button
                      key={i}
                      label={c.label!}
                      href={c.href!}
                      iconRight={c.icon ? <CtaIcon name={c.icon} /> : null}
                      variant={i === 0 ? 'primary' : 'secondary'}
                    />
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

              {/* Sub-sections (text-blocks rendered inline inside the right column) */}
              {textBlocks.map((b, idx) => (
                <div key={idx} className="flex flex-col" style={{ gap: '20px' }}>
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

              {(data.phone || data.email) && (
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
              )}
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
