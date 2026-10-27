import { useEffect, useState } from 'react';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { usePageSeo } from '../hooks/usePageSeo';
import { HomeView } from './home-view';
import type { StrapiHomePage, StrapiEvent } from '../lib/home-types';

export default function HomePage() {
  const [data, setData] = useState<StrapiHomePage | null>(null);
  const [events, setEvents] = useState<StrapiEvent[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  usePageSeo(data?.seo ?? null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const eventParams = {
        'sort[0]': 'date:asc',
        'populate[image]': 'true',
        'populate[category]': 'true',
      };
      const [home, curated] = await Promise.all([
        fetchAPI<StrapiHomePage>('/home-page'),
        // Curators pick which events surface here via the "Featured On Homepage"
        // flag on each Event entry.
        fetchAPI<StrapiEvent[]>('/events', {
          ...eventParams,
          'filters[featuredOnHomepage][$eq]': 'true',
          'filters[date][$gte]': today,
        }),
      ]);
      // If nothing has been curated yet (or the CMS predates the flag), fall
      // back to the next upcoming events so the section never silently vanishes.
      let evs = curated;
      if (!evs || evs.length === 0) {
        evs = await fetchAPI<StrapiEvent[]>('/events', {
          ...eventParams,
          'filters[date][$gte]': today,
          'pagination[limit]': '9',
        });
      }
      if (cancelled) return;
      setData(home);
      setEvents(evs ?? []);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loaded && !data) {
    return <div className="min-h-screen flex items-center justify-center text-text-dark/70">Home page content unavailable.</div>;
  }

  if (!data) return null;
  return <HomeView data={data} events={events ?? []} mediaOrigin={STRAPI_URL} />;
}
