import 'server-only';
import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { fetchPublished, fetchOptional, resolvePreview } from './cms';
import * as loaders from './route-loaders';
import { loadVenue } from '../../frontend/src/lib/venue-loader';
import type { StrapiJoiningFeesPage } from '../../frontend/src/pages/JoiningFeesPage';
import type { StrapiReferralPage } from '../../frontend/src/pages/ReferralPage';
import type { CoachApi } from '../../frontend/src/pages/CoachDetailPage';
import { getCoach } from '../../frontend/src/data/coaches';

export const getRouteData = cache(async (path: string, token?: string, status?: string) => {
  const preview = resolvePreview(token, status);
  if (path === 'membership/the-eagles-rewards-program') redirect('/membership/niche-group-membership');
  switch (path) {
    case 'dining': return { kind: 'Dining' as const, initialData: await loaders.loadDining(preview) };
    case 'dining/dining-promotion': return { kind: 'DiningPromotions' as const, initialData: await loaders.loadDiningPromotions(preview) };
    case 'fitness': return { kind: 'Fitness' as const, initialData: await loaders.loadFitness(preview) };
    case 'kids': return { kind: 'Kids' as const, initialData: await loaders.loadKids(preview) };
    case 'event-spaces': return { kind: 'EventSpaces' as const, initialData: await loaders.loadEventSpaces(preview) };
    case 'membership': return { kind: 'Membership' as const, initialData: await loaders.loadMembership(preview) };
    case 'whats-on': return { kind: 'WhatsOn' as const, initialData: await loaders.loadWhatsOn(preview) };
    case 'home-sub/news': return { kind: 'News' as const, initialData: await loaders.loadNews(preview) };
    case 'home-sub/gallery': return { kind: 'Gallery' as const, initialData: await loaders.loadGallery(preview) };
    case 'home-sub/contact-us': return { kind: 'ContactUs' as const, initialData: await loaders.loadContactUs(preview) };
    case 'faq': return { kind: 'Faq' as const, initialData: await loaders.loadFaq(preview) };
    case 'privacy-statement': return { kind: 'PrivacyStatement' as const, initialData: await loaders.loadPrivacyStatement(preview) };
    case 'home-sub/advertise-with-us': return { kind: 'AdvertiseWithUs' as const, initialData: await loaders.loadAdvertiseWithUs(preview) };
    case 'membership/reciprocal-clubs': return { kind: 'ReciprocalClubs' as const, initialData: await loaders.loadReciprocalClubs(preview) };
    case 'membership/joining-fees': return { kind: 'JoiningFees' as const, initialData: { api: await fetchPublished<StrapiJoiningFeesPage>('/joining-fees-page', undefined, preview) } };
    case 'membership/referal': return { kind: 'Referral' as const, initialData: { api: await fetchPublished<StrapiReferralPage>('/referral-page', undefined, preview) } };
  }
  const parts = path.split('/');
  if (parts[0] === 'whats-on' && parts.length === 2) return { kind: 'EventDetail' as const, initialData: await loaders.loadEventDetail(preview, parts[1]) };
  if (parts[0] === 'home-sub' && parts[1] === 'club-news' && parts.length === 3) return { kind: 'NewsArticle' as const, initialData: await loaders.loadNewsArticle(preview, parts[2]) };
  if (parts[0] === 'coaches' && parts.length === 3) {
    const collections: Record<string, string> = { aquatics: 'aquatics-coaches', tennis: 'tennis-coaches', gym: 'gym-trainers', pilates: 'pilates-instructors' };
    const section = parts[1], slug = parts[2];
    const endpoint = collections[section] ?? 'coaches';
    const items = await fetchOptional<CoachApi[]>(`/${endpoint}`, { 'filters[slug][$eq]': slug, ...(endpoint === 'coaches' ? { 'filters[section][$eq]': section } : {}), 'populate[photo]': 'true' }, preview);
    const coach = items?.[0] ?? getCoach(section, slug);
    if (!coach) notFound();
    return { kind: 'CoachDetail' as const, initialData: { coach, section } };
  }
  if (['dining', 'fitness', 'kids', 'event-spaces', 'membership', 'home-sub'].includes(parts[0]) && (parts.length === 2 || (parts[0] === 'fitness' && parts.length === 3))) {
    const slug = parts.slice(1).join('-');
    const venue = await loadVenue(parts[0], slug, <T,>(endpoint: string, params?: Record<string, string>) => fetchOptional<T>(endpoint, params, preview), true);
    if (!venue) notFound();
    return { kind: 'VenueDetail' as const, section: parts[0], venue };
  }
  notFound();
});
export type RouteData = Awaited<ReturnType<typeof getRouteData>>;
