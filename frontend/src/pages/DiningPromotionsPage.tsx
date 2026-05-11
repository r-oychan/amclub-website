import { useEffect, useMemo, useState } from 'react';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { Hero } from '../components/blocks/Hero';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { PageFade } from '../components/shared/PageFade';

import type { CtaIconName } from '../components/shared/CtaIcon';

type StrapiMedia = { id: number; url: string; alternativeText?: string | null };
type StrapiLink = {
  label: string;
  href?: string;
  isExternal?: boolean;
  variant?: string;
  icon?: CtaIconName | null;
};

type RestaurantTag =
  | 'club-wide'
  | 'central'
  | 'grillhouse'
  | 'the-2nd-floor'
  | 'tradewinds'
  | 'union-bar'
  | 'the-gourmet-pantry';

interface StrapiPromotion {
  documentId: string;
  title: string;
  slug: string;
  summary?: string;
  restaurantTag: RestaurantTag;
  validFrom?: string | null;
  validTo?: string | null;
  image?: StrapiMedia;
  ctas?: StrapiLink[];
  order?: number;
}

interface StrapiDiningPromotionsPage {
  title: string;
  subtitle?: string;
  hero?: { heading: string; subheading?: string; variant?: 'full' | 'compact'; backgroundImage?: StrapiMedia };
  promotionsHeading?: string;
  promotionsIntro?: string;
  finalCta?: { heading: string; body?: string; variant?: 'default' | 'light' | 'dark' | 'accent'; ctas?: StrapiLink[] };
}

const TAG_LABELS: Record<RestaurantTag, string> = {
  'club-wide': 'Club-wide',
  central: 'Central',
  grillhouse: 'Grillhouse & Tiki Bar',
  'the-2nd-floor': 'The 2nd Floor',
  tradewinds: 'Tradewinds',
  'union-bar': 'Union Bar',
  'the-gourmet-pantry': 'The Gourmet Pantry',
};

const mediaUrl = (m?: StrapiMedia | null): string | undefined => {
  if (!m?.url) return undefined;
  if (/^https?:/i.test(m.url)) return m.url;
  return `${STRAPI_URL}${m.url}`;
};

const linksOf = (ls?: StrapiLink[]) =>
  (ls ?? []).map((l) => ({
    label: l.label,
    href: l.href ?? '#',
    isExternal: l.isExternal,
    icon: l.icon ?? 'arrow',
  }));

export default function DiningPromotionsPage() {
  const [data, setData] = useState<StrapiDiningPromotionsPage | null>(null);
  const [promotions, setPromotions] = useState<StrapiPromotion[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTag, setActiveTag] = useState<RestaurantTag | 'all'>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [page, list] = await Promise.all([
        fetchAPI<StrapiDiningPromotionsPage>('/dining-promotions-page'),
        fetchAPI<StrapiPromotion[]>('/dining-promotions', {
          'sort[0]': 'order:asc',
          'pagination[limit]': '50',
          'populate[image]': 'true',
          'populate[ctas]': 'true',
        }),
      ]);
      if (cancelled) return;
      setData(page);
      setPromotions(list ?? []);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Tabs are derived from the tags actually present in the data —
  // hide tabs for restaurants that have no current promotions.
  const availableTags = useMemo<RestaurantTag[]>(() => {
    const present = new Set<RestaurantTag>();
    promotions.forEach((p) => present.add(p.restaurantTag));
    const ORDER: RestaurantTag[] = [
      'club-wide', 'central', 'grillhouse', 'the-2nd-floor',
      'tradewinds', 'union-bar', 'the-gourmet-pantry',
    ];
    return ORDER.filter((t) => present.has(t));
  }, [promotions]);

  const filtered = useMemo(
    () => (activeTag === 'all' ? promotions : promotions.filter((p) => p.restaurantTag === activeTag)),
    [promotions, activeTag],
  );

  if (!loaded) return <PageFade loaded={false}>{null}</PageFade>;
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-dark/70">
        Dining promotions content unavailable.
      </div>
    );
  }

  return (
    <PageFade loaded={loaded}>
      {data.hero && (
        <Hero
          heading={data.hero.heading}
          subheading={data.hero.subheading ?? data.subtitle}
          backgroundImage={mediaUrl(data.hero.backgroundImage)}
          variant={data.hero.variant ?? 'compact'}
        />
      )}

      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
          {data.promotionsHeading && (
            <h2 className="font-heading text-3xl md:text-[40px] font-light italic text-primary mb-2">
              {data.promotionsHeading}
            </h2>
          )}
          {data.promotionsIntro && (
            <p className="text-primary/70 mb-8 max-w-2xl">{data.promotionsIntro}</p>
          )}

          {/* Restaurant filter tabs */}
          {availableTags.length > 1 && (
            <div className="flex flex-wrap gap-x-7 gap-y-2 mb-10 border-b border-primary/10 pb-4">
              <button
                type="button"
                onClick={() => setActiveTag('all')}
                className={`text-[13.6px] font-bold uppercase tracking-[0.08em] transition-colors ${
                  activeTag === 'all' ? 'text-accent' : 'text-primary/70 hover:text-primary'
                }`}
              >
                All
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(tag)}
                  className={`text-[13.6px] font-bold uppercase tracking-[0.08em] transition-colors ${
                    activeTag === tag ? 'text-accent' : 'text-primary/70 hover:text-primary'
                  }`}
                >
                  {TAG_LABELS[tag]}
                </button>
              ))}
            </div>
          )}

          {/* Promotion grid */}
          {filtered.length === 0 ? (
            <p className="text-primary/60 italic py-10">No promotions available for this venue right now.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-8 gap-y-14">
              {filtered.map((p) => {
                const img = mediaUrl(p.image);
                return (
                  <article key={p.documentId} className="group">
                    {img && (
                      <div className="overflow-hidden aspect-[1357/1920] bg-bg">
                        <img
                          src={img}
                          alt={p.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <p className="mt-4 text-[13.6px] font-bold uppercase tracking-[0.08em] text-accent">
                      {TAG_LABELS[p.restaurantTag] ?? p.restaurantTag}
                    </p>
                    <h3 className="font-heading text-2xl md:text-[28px] font-normal italic text-primary leading-[1.1] mt-2 mb-2">
                      {p.title}
                    </h3>
                    {p.summary && (
                      <p className="text-[15px] text-primary/80 leading-[1.5] mb-3">{p.summary}</p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {data.finalCta && (
        <CtaBanner
          heading={data.finalCta.heading}
          body={data.finalCta.body ?? ''}
          variant={data.finalCta.variant === 'default' ? undefined : data.finalCta.variant}
          ctas={linksOf(data.finalCta.ctas)}
        />
      )}
    </PageFade>
  );
}
