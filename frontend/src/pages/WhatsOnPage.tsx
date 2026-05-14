import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { EVENT_PLACEHOLDER_IMAGE } from '../lib/events';
import { Hero } from '../components/blocks/Hero';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { PageFade } from '../components/shared/PageFade';

type StrapiMedia = { id: number; url: string; alternativeText?: string | null };
type StrapiLink = { label: string; href?: string; isExternal?: boolean; variant?: string };

interface StrapiWhatsOnPage {
  title: string;
  hero?: { heading: string; subheading?: string; variant?: 'full' | 'compact'; backgroundImage?: StrapiMedia };
  eventsSection?: { heading?: string; cta?: StrapiLink; maxItems?: number };
  finalCta?: { heading: string; body?: string; variant?: 'default' | 'light' | 'dark' | 'accent'; ctas?: StrapiLink[] };
}

interface StrapiCategory {
  documentId: string;
  name: string;
  slug: string;
  displayOrder?: number | null;
}

interface StrapiEvent {
  documentId: string;
  title: string;
  slug?: string;
  date: string;
  image?: StrapiMedia;
  category?: StrapiCategory | null;
}

const FILTER_ORDER = ['dining', 'kids', 'thinkspace', 'fitness-wellness', 'member-engagement'];

const mediaUrl = (m?: StrapiMedia | null): string | undefined => {
  if (!m?.url) return undefined;
  if (/^https?:/i.test(m.url)) return m.url;
  return `${STRAPI_URL}${m.url}`;
};

const formatMonth = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
};

const formatDay = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return String(d.getDate());
};

const sortCategories = (cats: StrapiCategory[]): StrapiCategory[] => {
  return [...cats].sort((a, b) => {
    const ai = FILTER_ORDER.indexOf(a.slug);
    const bi = FILTER_ORDER.indexOf(b.slug);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    const ao = a.displayOrder ?? 999;
    const bo = b.displayOrder ?? 999;
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name);
  });
};

const readHashSlug = (): string | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.location.hash.replace(/^#/, '').trim().toLowerCase();
  return raw || null;
};

export default function WhatsOnPage() {
  const [data, setData] = useState<StrapiWhatsOnPage | null>(null);
  const [events, setEvents] = useState<StrapiEvent[]>([]);
  const [categories, setCategories] = useState<StrapiCategory[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(readHashSlug);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [page, evs, cats] = await Promise.all([
        fetchAPI<StrapiWhatsOnPage>('/whats-on-page'),
        fetchAPI<StrapiEvent[]>('/events', {
          'pagination[limit]': '50',
          'sort[0]': 'date:asc',
          'populate[image]': 'true',
          'populate[category]': 'true',
        }),
        fetchAPI<StrapiCategory[]>('/event-categories', {
          'pagination[limit]': '20',
          'sort[0]': 'name:asc',
        }),
      ]);
      if (cancelled) return;
      setData(page);
      setEvents(evs ?? []);
      setCategories(sortCategories(cats ?? []));
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Keep the filter in sync with browser back/forward navigation and external
  // links that change `#…` while the page is already mounted.
  useEffect(() => {
    const onHashChange = () => setActiveSlug(readHashSlug());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Treat the URL hash as a hint: only honour it if it names a real category.
  const effectiveSlug = useMemo(() => {
    if (!activeSlug) return null;
    return categories.some((c) => c.slug === activeSlug) ? activeSlug : null;
  }, [activeSlug, categories]);

  const toggleSlug = (slug: string) => {
    setActiveSlug((cur) => {
      const next = cur === slug ? null : slug;
      const hash = next ? `#${next}` : ' ';
      const url = `${window.location.pathname}${window.location.search}${hash}`;
      window.history.replaceState(null, '', url);
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (!effectiveSlug) return events;
    return events.filter((e) => e.category?.slug === effectiveSlug);
  }, [events, effectiveSlug]);

  if (!loaded) return <PageFade loaded={false}>{null}</PageFade>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-text-dark/70">What's On page content unavailable.</div>;

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

      <section className="py-16 lg:py-24 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CategoryFilters
            categories={categories}
            activeSlug={effectiveSlug}
            onToggle={toggleSlug}
          />

          <div className="mt-16 lg:mt-24 mb-10">
            <h2
              className="font-heading italic text-primary"
              style={{ fontSize: 'clamp(1.75rem, 2.4vw, 2rem)', lineHeight: 1, letterSpacing: '-0.01em' }}
            >
              {data.eventsSection?.heading ?? 'Featured Club Events'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-20">
            {filtered.map((event) => (
              <EventCard key={event.documentId} event={event} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-text-dark/60">No events in this category right now. Check back soon.</div>
          )}
        </div>
      </section>

      {data.finalCta && (
        <CtaBanner
          heading={data.finalCta.heading}
          body={data.finalCta.body ?? ''}
          variant="white"
          ctas={(data.finalCta.ctas ?? []).map((c) => ({ label: c.label, href: c.href ?? '#', isExternal: c.isExternal }))}
        />
      )}
    </PageFade>
  );
}

function CategoryFilters({
  categories,
  activeSlug,
  onToggle,
}: {
  categories: StrapiCategory[];
  activeSlug: string | null;
  onToggle: (slug: string) => void;
}) {
  if (categories.length === 0) return null;
  return (
    <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-8 sm:gap-x-12">
      {categories.map((cat) => {
        const isActive = activeSlug === cat.slug;
        const isDimmed = activeSlug !== null && !isActive;
        return (
          <button
            key={cat.documentId}
            type="button"
            onClick={() => onToggle(cat.slug)}
            aria-pressed={isActive}
            className={`group flex flex-col items-center gap-3 cursor-pointer focus:outline-none transition-opacity ${
              isDimmed ? 'opacity-40 hover:opacity-80' : 'opacity-100'
            }`}
          >
            <span
              className={`flex items-center justify-center w-[124px] h-[124px] rounded-full transition-all ${
                isActive ? 'bg-accent ring-4 ring-accent/20' : 'bg-primary group-hover:bg-primary-dark'
              }`}
            >
              <img
                src={`/icons/whatson/${cat.slug}.png`}
                alt=""
                aria-hidden
                className="w-14 h-14 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </span>
            <span className="text-[13px] font-body uppercase text-primary tracking-[0.04em] text-center max-w-[120px] leading-tight">
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function EventCard({ event }: { event: StrapiEvent }) {
  const month = formatMonth(event.date);
  const day = formatDay(event.date);
  const inner = (
    <article className="flex flex-col group">
      <div className="relative mb-10">
        <img
          src={mediaUrl(event.image) ?? EVENT_PLACEHOLDER_IMAGE}
          alt={event.image?.alternativeText ?? event.title}
          className="w-full aspect-[344/217] object-cover block transition-transform duration-500 group-hover:scale-[1.02] bg-primary"
        />

        {month && day && (
          <div className="absolute right-[18px] -bottom-[40px] bg-white p-2 flex flex-col items-center w-[68px] z-10 shadow-sm">
            <span className="font-body text-[13.6px] font-normal uppercase text-primary tracking-[0.04em] leading-none">
              {month}
            </span>
            <span className="block h-px w-[33px] bg-accent my-1.5" />
            <span className="font-heading italic text-[28.8px] font-light text-primary leading-none">
              {day}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {event.category?.name && (
          <span className="self-start bg-primary text-white text-[11.2px] font-body uppercase tracking-[0.04em] px-3.5 py-0.5 rounded-full">
            {event.category.name}
          </span>
        )}
        <h3 className="font-body text-[17.6px] font-normal text-primary leading-[1.4] group-hover:text-accent transition-colors">
          {event.title}
        </h3>
      </div>
    </article>
  );
  if (!event.slug) return inner;
  return (
    <Link to={`/whats-on/${event.slug}`} className="block">
      {inner}
    </Link>
  );
}

