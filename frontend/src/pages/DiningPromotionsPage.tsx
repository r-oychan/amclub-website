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
  images?: StrapiMedia[];
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

const TAG_ORDER: RestaurantTag[] = [
  'club-wide', 'central', 'grillhouse', 'the-2nd-floor',
  'tradewinds', 'union-bar', 'the-gourmet-pantry',
];

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

// Each promotion may have 1+ images (multi-page flyer). Pull from `images`
// first, fall back to single `image` for legacy entries.
const imagesOf = (p: StrapiPromotion): string[] => {
  const list = (p.images ?? []).map(mediaUrl).filter(Boolean) as string[];
  if (list.length) return list;
  const single = mediaUrl(p.image);
  return single ? [single] : [];
};

function PromotionSlider({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  if (images.length === 0) return null;
  const last = images.length - 1;
  const go = (n: number) => setIndex(((n % images.length) + images.length) % images.length);

  return (
    <div className="relative w-full">
      <div className="relative overflow-hidden aspect-[1357/1920] bg-bg">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`${alt} — page ${i + 1}`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: i === index ? 1 : 0, zIndex: i === index ? 1 : 0 }}
          />
        ))}

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous page"
              onClick={() => go(index === 0 ? last : index - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-primary flex items-center justify-center shadow-md transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next page"
              onClick={() => go(index === last ? 0 : index + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-primary flex items-center justify-center shadow-md transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Go to page ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === index ? 'bg-accent' : 'bg-primary/20 hover:bg-primary/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
        }),
      ]);
      if (cancelled) return;
      setData(page);
      setPromotions(list ?? []);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const availableTags = useMemo<RestaurantTag[]>(() => {
    const present = new Set<RestaurantTag>();
    promotions.forEach((p) => present.add(p.restaurantTag));
    return TAG_ORDER.filter((t) => present.has(t));
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

      <section className="bg-white py-10 md:py-14">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          {data.promotionsHeading && (
            <h1 className="font-heading text-[28px] md:text-[38.4px] font-light text-accent leading-[1.1] mb-1">
              {data.promotionsHeading}
            </h1>
          )}
          {data.promotionsIntro && (
            <p className="text-[17px] md:text-[19.2px] text-primary/70 mb-10">{data.promotionsIntro}</p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-x-12 gap-y-8">
            {/* Sidebar */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <h2 className="font-heading text-[28px] md:text-[32px] font-normal text-primary mb-4">
                Menus
              </h2>
              <p className="text-[17px] md:text-[19.2px] text-primary/70 mb-5">Available Promotions</p>
              <ul className="space-y-3">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTag('all')}
                    className={`text-left text-[14.4px] font-bold tracking-[0.02em] transition-colors ${
                      activeTag === 'all' ? 'text-accent' : 'text-primary hover:text-accent'
                    }`}
                  >
                    All Promotions
                  </button>
                </li>
                {availableTags.map((tag) => (
                  <li key={tag}>
                    <button
                      type="button"
                      onClick={() => setActiveTag(tag)}
                      className={`text-left text-[14.4px] font-bold tracking-[0.02em] transition-colors ${
                        activeTag === tag ? 'text-accent' : 'text-primary hover:text-accent'
                      }`}
                    >
                      {TAG_LABELS[tag]}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Main column: vertically stacked promotions, each a slider */}
            <div>
              {filtered.length === 0 ? (
                <p className="text-primary/60 italic py-10">No promotions available for this venue right now.</p>
              ) : (
                <div className="flex flex-col gap-y-16">
                  {filtered.map((p) => {
                    const imgs = imagesOf(p);
                    return (
                      <article key={p.documentId} className="max-w-[680px] mx-auto w-full">
                        <PromotionSlider images={imgs} alt={p.title} />
                        <p className="mt-5 text-[13.6px] font-bold uppercase tracking-[0.08em] text-accent">
                          {TAG_LABELS[p.restaurantTag] ?? p.restaurantTag}
                        </p>
                        <h3 className="font-heading text-2xl md:text-[28px] font-normal italic text-primary leading-[1.1] mt-2 mb-2">
                          {p.title}
                        </h3>
                        {p.summary && (
                          <p className="text-[15px] text-primary/80 leading-[1.5]">{p.summary}</p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
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
