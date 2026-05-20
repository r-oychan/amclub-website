import { useEffect, useState } from 'react';
import { fetchAPI } from '../lib/api';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';
import { BlockRenderer } from '../components/blocks/BlockRenderer';
import { Button } from '../components/shared/Button';
import { toCtas, type DetailBody, type StrapiMedia, type StrapiLink } from '../lib/blocks';

interface SingletonPageData {
  title?: string;
  parentLabel?: string;
  parentHref?: string;
  heroImage?: StrapiMedia;
  heading?: string;
  intro?: string;
  ctas?: StrapiLink[];
  bottomCtas?: StrapiLink[];
  body?: DetailBody;
}

/**
 * Generic React page for any single-type membership detail page. App.tsx
 * routes each membership URL to this component with its singleton endpoint.
 * The Strapi side gives every page its own admin form via separate
 * singleType content types, but the rendering is uniform: hero,
 * heading/intro, top CTAs, dynamiczone body, bottom CTAs.
 */
export default function MembershipSingletonPage({
  endpoint,
  defaultParentLabel = 'Membership',
  defaultParentHref = '/membership',
}: {
  endpoint: string;
  defaultParentLabel?: string;
  defaultParentHref?: string;
}) {
  const [data, setData] = useState<SingletonPageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAPI<SingletonPageData>(endpoint)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  if (loading && !data) {
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

  const topCtas = toCtas(data.ctas);
  const bottomCtas = toCtas(data.bottomCtas);

  return (
    <>
      <DetailHeroBanner imageUrl={data.heroImage?.url} />
      <DetailBreadcrumb
        parentLabel={data.parentLabel ?? defaultParentLabel}
        parentHref={data.parentHref ?? defaultParentHref}
        currentName={data.title ?? ''}
      />
      {(data.heading || data.intro || topCtas) && (
        <section className="bg-bg py-12 md:py-20">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {data.heading && (
              <h1 className="font-heading italic font-light text-[2.5rem] md:text-[3.25rem] leading-[1.05] tracking-[-0.03em] text-primary">
                {data.heading}
              </h1>
            )}
            {data.intro && (
              <p className="mt-5 mx-auto max-w-3xl font-body text-[17px] md:text-[19px] leading-[1.5] text-text-dark/80 whitespace-pre-line">
                {data.intro}
              </p>
            )}
            {topCtas && topCtas.length > 0 && (
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                {topCtas.map((c, i) => (
                  <Button key={i} href={c.href} label={c.label} variant={i === 0 ? 'primary' : 'secondary'} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
      <BlockRenderer blocks={data.body} />
      {bottomCtas && bottomCtas.length > 0 && (
        <section className="bg-bg pb-20">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center gap-4">
            {bottomCtas.map((c, i) => (
              <Button key={i} href={c.href} label={c.label} variant={i === 0 ? 'primary' : 'secondary'} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
