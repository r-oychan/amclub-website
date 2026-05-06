import { useEffect, useState, useMemo } from 'react';
import { fetchAPI, STRAPI_URL } from '../lib/api';
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

export default function WhatsOnPage() {
  const [data, setData] = useState<StrapiWhatsOnPage | null>(null);
  const [events, setEvents] = useState<StrapiEvent[]>([]);
  const [categories, setCategories] = useState<StrapiCategory[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
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

  const filtered = useMemo(() => {
    if (!activeSlug) return events;
    return events.filter((e) => e.category?.slug === activeSlug);
  }, [events, activeSlug]);

  if (!loaded) return <PageFade loaded={false}>{null}</PageFade>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-text-dark/70">What's On page content unavailable.</div>;

  const browseAllHref = data.eventsSection?.cta?.href ?? '/whats-on';

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
            activeSlug={activeSlug}
            onToggle={(slug) => setActiveSlug((cur) => (cur === slug ? null : slug))}
          />

          <div className="mt-16 lg:mt-24 flex flex-wrap items-center justify-between gap-4 mb-10">
            <h2
              className="font-heading italic text-primary"
              style={{ fontSize: 'clamp(1.75rem, 2.4vw, 2rem)', lineHeight: 1, letterSpacing: '-0.01em' }}
            >
              {data.eventsSection?.heading ?? 'Featured Club Events'}
            </h2>
            <a
              href={browseAllHref}
              className="group inline-flex items-center gap-3 bg-white text-primary font-body text-xs tracking-[0.18em] uppercase font-bold px-6 py-3 rounded-full shadow-sm hover:shadow-md transition-shadow"
            >
              <span>{data.eventsSection?.cta?.label ?? 'Browse All Events'}</span>
              <ArrowUpRight />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
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
          variant={data.finalCta.variant === 'default' ? undefined : data.finalCta.variant}
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
              className={`flex items-center justify-center w-[100px] h-[100px] rounded-full transition-all ${
                isActive ? 'bg-accent ring-4 ring-accent/20' : 'bg-primary group-hover:bg-primary-dark'
              }`}
            >
              <img
                src={`/icons/whatson/${cat.slug}.png`}
                alt=""
                aria-hidden
                className="w-12 h-12 object-contain"
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
  return (
    <article className="flex flex-col gap-4 group">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {event.image && (
          <img
            src={mediaUrl(event.image)}
            alt={event.image.alternativeText ?? event.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        )}
        {month && day && (
          <div className="absolute right-0 bottom-0 bg-white px-3 py-2 flex flex-col items-center justify-center min-w-[71px]">
            <span className="text-primary font-body font-bold uppercase tracking-[0.04em] text-sm leading-none">
              {month}
            </span>
            <span
              className="text-primary font-heading italic font-light leading-none mt-1"
              style={{ fontSize: '26.56px' }}
            >
              {day}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {event.category?.name && (
          <span className="self-start bg-primary text-white text-[11px] font-body uppercase tracking-[0.04em] px-3.5 py-1.5 rounded-full">
            {event.category.name}
          </span>
        )}
        <h3 className="font-body font-light text-primary text-[17.6px] leading-[1.4]">
          {event.title}
        </h3>
      </div>
    </article>
  );
}

function ArrowUpRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-accent"
      aria-hidden
    >
      <path
        d="M3 11L11 3M11 3H4.5M11 3V9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
