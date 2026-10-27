import 'server-only';
import { notFound } from 'next/navigation';
import { fetchPublished, resolvePreview } from './cms';
type Preview = ReturnType<typeof resolvePreview>;
import type { DiningInitialData, StrapiDiningPage, StrapiRestaurant } from '../../frontend/src/pages/DiningPage';
export async function loadDining(preview?: Preview): Promise<DiningInitialData> {
  const [data, restaurants] = await Promise.all([
    fetchPublished<StrapiDiningPage>('/dining-page', undefined, preview),
    fetchPublished<StrapiRestaurant[]>('/restaurants', {
          'sort[0]': 'order:asc',
          'pagination[limit]': '20',
          'populate[image]': 'true',
          'populate[logo]': 'true',
          'populate[ctas]': 'true',
        }, preview)
  ]);
  return { data, restaurants };
}

import type { DiningPromotionsInitialData, StrapiDiningPromotionsPage, StrapiPromotion } from '../../frontend/src/pages/DiningPromotionsPage';
export async function loadDiningPromotions(preview?: Preview): Promise<DiningPromotionsInitialData> {
  const [data, promotions] = await Promise.all([
    fetchPublished<StrapiDiningPromotionsPage>('/dining-promotions-page', undefined, preview),
    fetchPublished<StrapiPromotion[]>('/dining-promotions', {
          'sort[0]': 'order:asc',
          'pagination[limit]': '50',
        }, preview)
  ]);
  return { data, promotions };
}

import type { FitnessInitialData, StrapiFitnessPage } from '../../frontend/src/pages/FitnessPage';
export async function loadFitness(preview?: Preview): Promise<FitnessInitialData> {
  const [data] = await Promise.all([
    fetchPublished<StrapiFitnessPage>('/fitness-page', undefined, preview)
  ]);
  return { data };
}

import type { KidsInitialData, StrapiKidsPage } from '../../frontend/src/pages/KidsPage';
export async function loadKids(preview?: Preview): Promise<KidsInitialData> {
  const [data] = await Promise.all([
    fetchPublished<StrapiKidsPage>('/kids-page', undefined, preview)
  ]);
  return { data };
}

import type { EventSpacesInitialData, StrapiEventSpacesPage } from '../../frontend/src/pages/EventSpacesPage';
export async function loadEventSpaces(preview?: Preview): Promise<EventSpacesInitialData> {
  const [data] = await Promise.all([
    fetchPublished<StrapiEventSpacesPage>('/event-spaces-page', undefined, preview)
  ]);
  return { data };
}

import type { MembershipInitialData, StrapiMembershipPage } from '../../frontend/src/pages/MembershipPage';
export async function loadMembership(preview?: Preview): Promise<MembershipInitialData> {
  const [data] = await Promise.all([
    fetchPublished<StrapiMembershipPage>('/membership-page', undefined, preview)
  ]);
  return { data };
}

import type { WhatsOnInitialData, StrapiWhatsOnPage, StrapiEvent, StrapiCategory } from '../../frontend/src/pages/WhatsOnPage';
export async function loadWhatsOn(preview?: Preview): Promise<WhatsOnInitialData> {
  const [data, events, categories] = await Promise.all([
    fetchPublished<StrapiWhatsOnPage>('/whats-on-page', undefined, preview),
    fetchPublished<StrapiEvent[]>('/events', {
          'pagination[limit]': '50',
          'sort[0]': 'date:asc',
          'populate[image]': 'true',
          'populate[category]': 'true',
        }, preview),
    fetchPublished<StrapiCategory[]>('/event-categories', {
          'pagination[limit]': '20',
          'sort[0]': 'name:asc',
        }, preview)
  ]);
  return { data, events, categories };
}

import type { NewsInitialData, StrapiNewsPage, StrapiNewsArticle } from '../../frontend/src/pages/NewsPage';
export async function loadNews(preview?: Preview): Promise<NewsInitialData> {
  const [data, articles] = await Promise.all([
    fetchPublished<StrapiNewsPage>('/news-page', undefined, preview),
    fetchPublished<StrapiNewsArticle[]>('/news-articles', {
          'sort[0]': 'order:asc',
          'pagination[limit]': '50',
          'populate[image]': 'true',
        }, preview)
  ]);
  return { data, articles };
}

import type { GalleryInitialData, StrapiGalleryPage, StrapiGalleryAlbum } from '../../frontend/src/pages/GalleryPage';
export async function loadGallery(preview?: Preview): Promise<GalleryInitialData> {
  const [data, albums] = await Promise.all([
    fetchPublished<StrapiGalleryPage>('/gallery-page', undefined, preview),
    fetchPublished<StrapiGalleryAlbum[]>('/gallery-albums', {
          'sort[0]': 'order:asc',
          'pagination[limit]': '50',
          populate: '*',
        }, preview)
  ]);
  return { data, albums };
}

import type { ContactUsInitialData, StrapiContactUsPage } from '../../frontend/src/pages/ContactUsPage';
export async function loadContactUs(preview?: Preview): Promise<ContactUsInitialData> {
  const [data] = await Promise.all([
    fetchPublished<StrapiContactUsPage>('/contact-us-page', undefined, preview)
  ]);
  return { data };
}

import type { FaqInitialData, StrapiFaqPage, StrapiFaqCategory, StrapiFaqItem } from '../../frontend/src/pages/FaqPage';
export async function loadFaq(preview?: Preview): Promise<FaqInitialData> {
  const [page, categories, items] = await Promise.all([
    fetchPublished<StrapiFaqPage>('/faq-page', {
          'populate[heroImage]': 'true',
        }, preview),
    fetchPublished<StrapiFaqCategory[]>('/faq-categories', {
          'sort[0]': 'displayOrder:asc',
          'pagination[limit]': '50',
        }, preview),
    fetchPublished<StrapiFaqItem[]>('/faq-items', {
          'sort[0]': 'order:asc',
          'pagination[limit]': '200',
          'populate[faqCategory]': 'true',
        }, preview)
  ]);
  return { page, categories, items };
}

import type { PrivacyStatementInitialData, PrivacyStatementData } from '../../frontend/src/pages/PrivacyStatementPage';
export async function loadPrivacyStatement(preview?: Preview): Promise<PrivacyStatementInitialData> {
  const [data] = await Promise.all([
    fetchPublished<PrivacyStatementData>('/privacy-statement-page', undefined, preview)
  ]);
  return { data };
}

import type { AdvertiseWithUsInitialData, AdvertiseData } from '../../frontend/src/pages/AdvertiseWithUsPage';
export async function loadAdvertiseWithUs(preview?: Preview): Promise<AdvertiseWithUsInitialData> {
  const [data] = await Promise.all([
    fetchPublished<AdvertiseData>('/advertise-with-us-page', undefined, preview)
  ]);
  return { data };
}

import type { ReciprocalClubsInitialData, ReciprocalData } from '../../frontend/src/pages/ReciprocalClubsPage';
export async function loadReciprocalClubs(preview?: Preview): Promise<ReciprocalClubsInitialData> {
  const [data] = await Promise.all([
    fetchPublished<ReciprocalData>('/reciprocal-clubs-page', undefined, preview)
  ]);
  return { data };
}

import type { EventDetailInitialData, StrapiEvent as DetailEvent } from '../../frontend/src/pages/EventDetailPage';
export async function loadEventDetail(preview?: Preview, slug?: string): Promise<EventDetailInitialData> {
  if (!slug) notFound();
  const [event] = await Promise.all([
    fetchPublished<DetailEvent[]>('/events', {
        'filters[slug][$eq]': slug,
        'populate[image]': 'true',
        'populate[category]': 'true',
        'populate[ctas]': 'true',
      }, preview).then((items) => items[0] ?? null)
  ]);
  if (!event) notFound();
  return { event };
}

import type { NewsArticleInitialData, StrapiNewsArticle as DetailNewsArticle } from '../../frontend/src/pages/NewsArticlePage';
export async function loadNewsArticle(preview?: Preview, slug?: string): Promise<NewsArticleInitialData> {
  if (!slug) notFound();
  const [article] = await Promise.all([
    fetchPublished<DetailNewsArticle[]>('/news-articles', {
        'filters[slug][$eq]': slug,
        'populate[image]': 'true',
        'populate[htmlBody]': 'true',
        'pagination[limit]': '1',
      }, preview).then((items) => items[0] ?? null)
  ]);
  if (!article) notFound();
  return { article };
}
