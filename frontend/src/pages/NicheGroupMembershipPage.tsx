import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { fetchAPI } from '../lib/api';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';
import { BlockRenderer } from '../components/blocks/BlockRenderer';
import { Button } from '../components/shared/Button';
import { CtaIcon, type CtaIconName } from '../components/shared/CtaIcon';
import type { DetailBlock } from '../lib/blocks';

interface StrapiLink {
  label?: string;
  href?: string;
  isExternal?: boolean;
  icon?: CtaIconName | null;
}

interface NicheGroupData {
  title?: string;
  label?: string;
  heading?: string;
  intro?: string;
  description?: string;
  heroImage?: { url?: string; alternativeText?: string } | null;
  ctas?: StrapiLink[];
  phone?: string;
  email?: string;
  body?: DetailBlock[];
  parentLabel?: string;
  parentHref?: string;
}

/**
 * Dedicated CMS-driven page for /membership/niche-group-membership.
 *
 * Previously this URL fell through to the generic /membership/:slug route,
 * whose dead `/facilities` fetch always served the static subpages.ts
 * fallback — so the `niche-group-membership-page` singleton (including the
 * tier cards' image fields) was never read and edits in /admin had no
 * effect. This page fetches the singleton and renders its dynamic-zone body
 * (the tier grid) through BlockRenderer, making every tier card — image
 * included — editable in the CMS.
 */
export default function NicheGroupMembershipPage() {
  const [data, setData] = useState<NicheGroupData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const d = await fetchAPI<NicheGroupData>('/niche-group-membership-page');
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
  const parentLabel = data.parentLabel ?? 'Membership';
  const parentHref = data.parentHref ?? '/membership';

  return (
    <>
      <DetailHeroBanner imageUrl={data.heroImage?.url} />
      <DetailBreadcrumb
        parentLabel={parentLabel}
        parentHref={parentHref}
        currentName={data.heading ?? data.title ?? ''}
      />

      <section className="bg-bg">
        <div className="max-w-7xl mx-auto px-10 pt-12 pb-10">
          <div className="flex flex-col max-w-3xl" style={{ gap: '24px' }}>
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
            {data.intro && (
              <div
                className="font-body text-text-dark/70 whitespace-pre-line"
                style={{ fontSize: '16px', lineHeight: 1.55 }}
              >
                {data.intro}
              </div>
            )}
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
      </section>

      {/* Dynamic-zone body — the tier grid (blocks.priced-card-grid) et al. */}
      <BlockRenderer blocks={data.body} />

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
