import { useEffect, useState, useMemo } from 'react';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { Hero } from '../components/blocks/Hero';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { Button } from '../components/shared/Button';
import { PageFade } from '../components/shared/PageFade';

type StrapiMedia = { id: number; url: string; alternativeText?: string | null };
type StrapiLink = { label: string; href?: string; isExternal?: boolean; variant?: string };

interface StrapiWhatsOnPage {
  title: string;
  hero?: { heading: string; subheading?: string; variant?: 'full' | 'compact'; backgroundImage?: StrapiMedia };
  eventsSection?: { heading?: string; cta?: StrapiLink; maxItems?: number };
  finalCta?: { heading: string; body?: string; variant?: 'default' | 'light' | 'dark' | 'accent'; ctas?: StrapiLink[] };
}

interface StrapiEvent {
  documentId: string;
  title: string;
  date: string;
  image?: StrapiMedia;
  category?: { name: string } | null;
}

const CATEGORIES = ['All', 'Dining', 'Kids', 'Thinkspace', 'Fitness & Wellness', 'Member Engagement'];

const mediaUrl = (m?: StrapiMedia | null): string | undefined => {
  if (!m?.url) return undefined;
  if (/^https?:/i.test(m.url)) return m.url;
  return `${STRAPI_URL}${m.url}`;
};

const formatEventDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
};

export default function WhatsOnPage() {
  const [data, setData] = useState<StrapiWhatsOnPage | null>(null);
  const [events, setEvents] = useState<StrapiEvent[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [page, evs] = await Promise.all([
        fetchAPI<StrapiWhatsOnPage>('/whats-on-page'),
        fetchAPI<StrapiEvent[]>('/events', {
          'pagination[limit]': '50',
          'sort[0]': 'date:asc',
          'populate[image]': 'true',
          'populate[category]': 'true',
        }),
      ]);
      if (cancelled) return;
      setData(page);
      setEvents(evs ?? []);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return events;
    return events.filter((e) => e.category?.name === activeCategory);
  }, [events, activeCategory]);

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

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary text-center mb-8">
            {data.eventsSection?.heading ?? 'Featured Club Events'}
          </h2>

          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  activeCategory === cat ? 'bg-primary text-white' : 'bg-bg text-text-dark hover:bg-primary/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((event) => (
              <div key={event.documentId} className="rounded-xl overflow-hidden bg-bg shadow-md hover:shadow-lg transition-shadow">
                {event.image && (
                  <div className="h-52 overflow-hidden">
                    <img src={mediaUrl(event.image)} alt={event.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-block bg-accent text-white text-xs font-bold px-2 py-1 rounded">
                      {formatEventDate(event.date)}
                    </span>
                    {event.category?.name && (
                      <span className="text-xs text-secondary font-bold uppercase tracking-wide">
                        {event.category.name}
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading text-lg font-bold text-primary">{event.title}</h3>
                </div>
              </div>
            ))}
          </div>

          {data.eventsSection?.cta?.label && (
            <div className="text-center mt-12">
              <Button label={data.eventsSection.cta.label} href={data.eventsSection.cta.href ?? '#'} variant="secondary" />
            </div>
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
