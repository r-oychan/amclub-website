import { useEffect, useMemo, useRef, useState } from 'react';
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

// Each restaurant has a single consolidated menu PDF served statically from
// frontend/public/menus/. Promotions for that tag link to the same PDF so the
// dining-promotion page mirrors the CTA set on /dining.
const MENU_URLS: Partial<Record<RestaurantTag, string>> = {
  central:              '/menus/central-menu.pdf',
  grillhouse:           '/menus/grillhouse-menu.pdf',
  'the-2nd-floor':      '/menus/the-2nd-floor-menu.pdf',
  tradewinds:           '/menus/tradewinds-menu.pdf',
  'union-bar':          '/menus/union-bar-menu.pdf',
  'the-gourmet-pantry': '/menus/the-gourmet-pantry-menu.pdf',
};

const mediaUrl = (m?: StrapiMedia | null): string | undefined => {
  if (!m?.url) return undefined;
  if (/^https?:/i.test(m.url)) return m.url;
  return `${STRAPI_URL}${m.url}`;
};

// Patch CTAs the CMS still seeds with placeholder hrefs. Once the deployed
// Strapi entry carries the real URL these overrides become no-ops. Mirrors
// the override map on DiningPage so both pages share the same fallback.
const CTA_OVERRIDES: Record<string, { href: string; isExternal: boolean }> = {
  'Book a Club Tour': {
    href: 'https://amclub.jotform.com/260813837273966?parentURL=https%3A%2F%2Famclub.org.sg%2Fmembership-enquiry-form%2F&jsForm=true',
    isExternal: true,
  },
};

const linksOf = (ls?: StrapiLink[]) =>
  (ls ?? []).map((l) => {
    const override = CTA_OVERRIDES[l.label];
    if (override && (!l.href || l.href === '#')) {
      return {
        label: l.label,
        href: override.href,
        isExternal: override.isExternal,
        icon: l.icon ?? 'arrow',
      };
    }
    return {
      label: l.label,
      href: l.href ?? '#',
      isExternal: l.isExternal,
      icon: l.icon ?? 'arrow',
    };
  });

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

// Lucide "book-open" glyph for the sidebar "Menus" heading.
function BookIcon({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

// Diagonal arrow indicator next to inactive sidebar items.
function ArrowUpRight({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

// Right-pointing arrow inside the active pill.
function ArrowRight({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// Group promotions by restaurantTag while preserving the page-defined order.
function groupByTag(promotions: StrapiPromotion[]): Map<RestaurantTag, StrapiPromotion[]> {
  const groups = new Map<RestaurantTag, StrapiPromotion[]>();
  for (const tag of TAG_ORDER) groups.set(tag, []);
  for (const p of promotions) groups.get(p.restaurantTag)?.push(p);
  for (const tag of TAG_ORDER) if (groups.get(tag)?.length === 0) groups.delete(tag);
  return groups;
}

function tagFromHash(): RestaurantTag | null {
  if (typeof window === 'undefined') return null;
  const slug = window.location.hash.replace(/^#promo-/, '');
  return slug && (TAG_ORDER as readonly string[]).includes(slug) ? (slug as RestaurantTag) : null;
}

export default function DiningPromotionsPage() {
  const [data, setData] = useState<StrapiDiningPromotionsPage | null>(null);
  const [promotions, setPromotions] = useState<StrapiPromotion[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Seed the active tag from the URL hash if one is present (e.g. arrived via
  // /dining/dining-promotion#promo-central). Lazy-init so we don't setState
  // inside an effect.
  const [activeTag, setActiveTag] = useState<RestaurantTag | null>(() => tagFromHash());
  const sectionRefs = useRef<Map<RestaurantTag, HTMLElement>>(new Map());

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

  const groups = useMemo(() => groupByTag(promotions), [promotions]);
  const availableTags = useMemo(() => Array.from(groups.keys()), [groups]);
  // The pill highlight defaults to the first available tag until the user
  // clicks or the scroll-spy picks one up. Derived during render so we don't
  // setState inside an effect.
  const displayedActiveTag: RestaurantTag | null = activeTag ?? availableTags[0] ?? null;

  // Scroll to the matching section if the page was opened with a #promo-<tag>
  // hash (e.g. arrived via a /dining card). Pure side-effect — the active tag
  // is already seeded from the hash by the useState lazy initializer above.
  useEffect(() => {
    if (!loaded || availableTags.length === 0) return;
    const tag = tagFromHash();
    if (!tag || !availableTags.includes(tag)) return;
    // Wait one frame so refs have attached before scrolling.
    requestAnimationFrame(() => {
      const el = sectionRefs.current.get(tag);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  }, [loaded, availableTags]);

  // Scroll-spy: update the sidebar's active tag (and the URL hash) as the
  // user scrolls between sections. We use replaceState so the browser back
  // button isn't polluted with every scroll-driven hash change.
  useEffect(() => {
    if (availableTags.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry whose top edge is closest to the top of the viewport.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const tag = visible[0].target.getAttribute('data-tag') as RestaurantTag | null;
          if (tag) {
            setActiveTag(tag);
            const next = `#promo-${tag}`;
            if (window.location.hash !== next) {
              window.history.replaceState(null, '', next);
            }
          }
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 },
    );
    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [availableTags]);

  const scrollToTag = (tag: RestaurantTag) => {
    const el = sectionRefs.current.get(tag);
    if (!el) return;
    const headerOffset = 96; // sticky header height-ish
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveTag(tag);
    // Push a new history entry so the back button returns the user to wherever
    // they came from (e.g. /dining), and the URL reflects the active section.
    const next = `#promo-${tag}`;
    if (window.location.hash !== next) {
      window.history.pushState(null, '', next);
    }
  };

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
              <div className="flex items-center gap-3 mb-3 text-primary">
                <BookIcon size={28} />
                <h2 className="font-heading text-[32px] md:text-[38.4px] font-light italic leading-none">
                  Menus
                </h2>
              </div>
              <p className="text-[15px] md:text-[17px] text-primary/70 mb-4">Available Promotions</p>
              <div className="border-t border-[#6BBBAE]/60 mb-5" />
              {availableTags.length === 0 ? (
                <p className="text-primary/60 italic">No promotions right now.</p>
              ) : (
                <ul className="flex flex-col gap-y-2">
                  {availableTags.map((tag) => {
                    const isActive = displayedActiveTag === tag;
                    return (
                      <li key={tag}>
                        {isActive ? (
                          <button
                            type="button"
                            onClick={() => scrollToTag(tag)}
                            className="inline-flex items-center justify-between gap-3 rounded-full bg-accent text-white uppercase font-bold tracking-[0.04em] text-[14.4px] py-3 pl-4 pr-3 hover:brightness-95 transition"
                          >
                            <span>{TAG_LABELS[tag]}</span>
                            <ArrowRight size={18} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => scrollToTag(tag)}
                            className="inline-flex items-center gap-2 px-1 py-2 text-primary uppercase font-bold tracking-[0.04em] text-[14.4px] hover:text-accent transition-colors"
                          >
                            <span>{TAG_LABELS[tag]}</span>
                            <ArrowUpRight size={14} className="text-accent" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>

            {/* Main column: vertically stacked promotions, grouped by restaurant. */}
            <div>
              {availableTags.length === 0 ? (
                <p className="text-primary/60 italic py-10">No promotions available right now.</p>
              ) : (
                <div className="flex flex-col gap-y-20">
                  {availableTags.map((tag) => {
                    const items = groups.get(tag) ?? [];
                    return (
                      <section
                        key={tag}
                        id={`promo-${tag}`}
                        data-tag={tag}
                        ref={(el) => {
                          if (el) sectionRefs.current.set(tag, el);
                          else sectionRefs.current.delete(tag);
                        }}
                        className="scroll-mt-28"
                      >
                        <div className="flex flex-col gap-y-16">
                          {items.map((p) => {
                            const imgs = imagesOf(p);
                            const menuHref = MENU_URLS[p.restaurantTag];
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
                                {menuHref && (
                                  <div className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-3">
                                    <a
                                      href={menuHref}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 text-primary uppercase font-bold tracking-[0.04em] text-[13.6px] hover:text-accent transition-colors"
                                    >
                                      View Menu
                                      <ArrowUpRight size={14} className="text-accent" />
                                    </a>
                                  </div>
                                )}
                              </article>
                            );
                          })}
                        </div>
                      </section>
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
