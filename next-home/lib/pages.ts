import 'server-only';
import { cache } from 'react';
import { fetchPublished, resolvePreview } from './cms';
import type { AboutInitialData, StrapiAboutPage, StrapiCommitteeMember } from '../../frontend/src/pages/AboutPage';
import { staticFallback, resolveMarquee } from '../../frontend/src/lib/venue-data';
import type { VenueData } from '../../frontend/src/pages/VenueDetailPage';

export const getAboutData = cache(async (token?: string, status?: string): Promise<AboutInitialData> => {
  const preview = resolvePreview(token, status);
  const members = (type: string) => fetchPublished<StrapiCommitteeMember[]>('/committee-members', { 'filters[memberType][$eq]': type, 'sort[0]': 'order:asc', 'pagination[limit]': '50', 'populate[photo]': 'true' }, preview);
  const [page, gc, mgmt] = await Promise.all([fetchPublished<StrapiAboutPage>('/about-page', undefined, preview), members('general-committee'), members('management')]);
  return { page, gc, mgmt };
});
export const getRestaurant = cache(async (slug: string, token?: string, status?: string) => {
  // The restaurant controller owns deep population, including dynamic zones.
  const items = await fetchPublished<VenueData[]>('/restaurants', { 'filters[slug][$eq]': slug }, resolvePreview(token, status));
  const api = items[0];
  if (!api) return null;
  const fallback = staticFallback('dining', slug);
  const venue = { ...fallback, ...api };
  for (const key of Object.keys(fallback ?? {}) as (keyof VenueData)[]) {
    const value = api[key];
    if (value == null || value === '' || (Array.isArray(value) && !value.length)) {
      Object.assign(venue, { [key]: fallback?.[key] });
    }
  }
  venue.gallery = resolveMarquee(api, fallback);
  return venue;
});
