import { Link } from 'react-router';
import { useEffect, useState } from 'react';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { Hero } from '../components/blocks/Hero';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { OverlaySection } from '../components/blocks/OverlaySection';
import { RestaurantCard } from '../components/dining/RestaurantCard';
import { PromoCell } from '../components/dining/PromoCell';
import { PageFade } from '../components/shared/PageFade';

type StrapiMedia = { id: number; url: string; alternativeText?: string | null };
type StrapiLink = { label: string; href?: string; isExternal?: boolean; variant?: string };

interface StrapiRestaurant {
  documentId: string;
  name: string;
  slug: string;
  cuisineType?: string;
  cuisineIconSlug?: string;
  description: string;
  image?: StrapiMedia;
  logo?: StrapiMedia;
  dressCode?: string;
  ctas?: StrapiLink[];
  order?: number;
}

interface StrapiOverlay {
  heading?: string;
  description?: string;
  image?: StrapiMedia;
  imageAlt?: string;
  textPosition?: 'left' | 'right';
  textVerticalAlign?: 'start' | 'center' | 'end';
  textBgColor?: string;
  textBgImage?: StrapiMedia;
  textTheme?: 'light' | 'dark';
  ctas?: StrapiLink[];
}

interface StrapiDiningPage {
  title: string;
  hero?: { heading: string; subheading?: string; variant?: 'full' | 'compact'; backgroundImage?: StrapiMedia };
  clubFavorites?: {
    heading?: string; subheading?: string;
    cards?: { heading: string; description?: string; image?: StrapiMedia; cta?: StrapiLink }[];
  };
  essentials?: StrapiOverlay;
  finalCta?: { heading: string; body?: string; variant?: 'default' | 'light' | 'dark' | 'accent'; ctas?: StrapiLink[] };
}

const mediaUrl = (m?: StrapiMedia | null): string | undefined => {
  if (!m?.url) return undefined;
  if (/^https?:/i.test(m.url)) return m.url;
  return `${STRAPI_URL}${m.url}`;
};

const linksOf = (ls?: StrapiLink[]) =>
  (ls ?? []).map((l) => ({ label: l.label, href: l.href ?? '#', isExternal: l.isExternal }));

export default function DiningPage() {
  const [data, setData] = useState<StrapiDiningPage | null>(null);
  const [restaurants, setRestaurants] = useState<StrapiRestaurant[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [page, list] = await Promise.all([
        fetchAPI<StrapiDiningPage>('/dining-page'),
        fetchAPI<StrapiRestaurant[]>('/restaurants', {
          'sort[0]': 'order:asc',
          'pagination[limit]': '20',
          'populate[image]': 'true',
          'populate[logo]': 'true',
          'populate[ctas]': 'true',
        }),
      ]);
      if (cancelled) return;
      setData(page);
      setRestaurants(list ?? []);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loaded) return <PageFade loaded={false}>{null}</PageFade>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-text-dark/70">Dining page content unavailable.</div>;

  const venues = restaurants.map((r) => ({
    name: r.name,
    slug: r.slug,
    cuisineType: r.cuisineType ?? '',
    cuisineIconSlug: r.cuisineIconSlug ?? '',
    description: r.description,
    image: mediaUrl(r.image) ?? '',
    logo: mediaUrl(r.logo) ?? '',
    dressCode: r.dressCode,
    ctas: (r.ctas ?? []).map((c) => ({ label: c.label, href: c.href })),
  }));
  const leftColumn = venues.filter((_, i) => i % 2 === 0);
  const rightColumn = venues.filter((_, i) => i % 2 === 1);

  const cf = data.clubFavorites;
  const cfCards = (cf?.cards ?? []).map((c) => ({
    name: c.heading,
    description: c.description ?? '',
    image: mediaUrl(c.image) ?? '',
    cta: { label: c.cta?.label ?? 'Order Now', href: c.cta?.href ?? '#' },
  }));

  const ess = data.essentials;
  const essentialsProps = ess && ess.image ? {
    heading: ess.heading,
    description: ess.description,
    image: mediaUrl(ess.image) ?? '',
    imageAlt: ess.imageAlt ?? '',
    textPosition: ess.textPosition,
    textVerticalAlign: ess.textVerticalAlign,
    textBgColor: ess.textBgColor,
    textBgImage: mediaUrl(ess.textBgImage),
    textTheme: ess.textTheme,
    ctas: linksOf(ess.ctas),
  } : null;

  return (
    <PageFade loaded={loaded}>
      {data.hero && (
        <Hero
          heading={data.hero.heading}
          subheading={data.hero.subheading}
          backgroundImage={mediaUrl(data.hero.backgroundImage)}
          variant={data.hero.variant ?? 'compact'}
        />
      )}

      {/* Restaurant Zigzag Grid */}
      {venues.length > 0 && (
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="hidden md:flex items-start gap-x-[80px]">
              <div className="w-[45%] max-w-[700px] flex flex-col gap-16 lg:gap-20">
                {leftColumn.map((venue) => (
                  <RestaurantCard key={venue.slug} {...venue} />
                ))}
              </div>
              <div className="w-[45%] max-w-[700px] flex flex-col gap-16 lg:gap-20">
                <PromoCell />
                {rightColumn.map((venue) => (
                  <RestaurantCard key={venue.slug} {...venue} />
                ))}
              </div>
            </div>
            <div className="md:hidden space-y-12">
              <PromoCell />
              {venues.map((venue) => (
                <RestaurantCard key={venue.slug} {...venue} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Club Favorites */}
      {cf && cfCards.length > 0 && (
        <section className="py-16 md:py-20 bg-bg">
          <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
            {cf.heading && (
              <h2 className="font-heading text-3xl md:text-4xl font-light italic text-primary text-center mb-3">
                {cf.heading}
              </h2>
            )}
            {cf.subheading && (
              <p className="text-text-dark/70 text-center max-w-2xl mx-auto mb-10 text-sm">
                {cf.subheading}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {cfCards.map((item) => (
                <Link
                  key={item.name}
                  to={item.cta.href}
                  className="group relative rounded-xl overflow-hidden aspect-[16/10]"
                >
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-heading text-xl md:text-2xl font-light italic text-white mb-2">{item.name}</h3>
                    <p className="text-white/70 text-sm mb-3 max-w-sm">{item.description}</p>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white/90 group-hover:text-white transition-colors">
                      {item.cta.label}
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-secondary shrink-0">
                        <path d="M1 13L13 1M13 1H3M13 1V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {essentialsProps && <OverlaySection {...essentialsProps} />}

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
