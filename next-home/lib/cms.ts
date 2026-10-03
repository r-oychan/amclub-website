import 'server-only';
import { cache } from 'react';
import { timingSafeEqual } from 'node:crypto';
import type { StrapiHomePage, StrapiEvent } from '../../frontend/src/lib/home-types';
import type { StrapiHeader } from '../../frontend/src/hooks/useHeaderData';
import type { StrapiFooter } from '../../frontend/src/hooks/useFooterData';
import type { PageSeo } from '../../frontend/src/lib/seo';

export interface SiteConfig { siteName?: string | null; defaultSeo?: PageSeo | null }

export async function fetchPublished<T>(endpoint: string, params?: Record<string, string>, preview?: { token: string; status: string }): Promise<T> {
  const origin = process.env.STRAPI_INTERNAL_URL;
  if (!origin) throw new Error('STRAPI_INTERNAL_URL must be configured');
  const url = new URL(`/api${endpoint}`, origin);
  for (const [key, value] of Object.entries(params ?? {})) url.searchParams.set(key, value);
  url.searchParams.set('status', preview?.status ?? 'published');
  const response = await fetch(url, { cache: 'no-store', headers: preview ? { Authorization: `Bearer ${preview.token}` } : undefined, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`CMS ${endpoint} returned ${response.status}`);
  const result: { data: T | null } = await response.json();
  if (!result.data) throw new Error(`CMS ${endpoint} has no published content`);
  return result.data;
}

export const getHomeData = cache(async (token?: string, requestedStatus?: string) => {
  const preview = resolvePreview(token, requestedStatus);
  const read = <T,>(endpoint: string, params?: Record<string, string>) => fetchPublished<T>(endpoint, params, preview);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' }).format(new Date());
  const eventParams = { 'sort[0]': 'date:asc', 'populate[image]': 'true', 'populate[category]': 'true', 'filters[date][$gte]': today, 'pagination[limit]': '9' };
  const [home, curated, header, footer, config] = await Promise.all([
    read<StrapiHomePage>('/home-page'),
    read<StrapiEvent[]>('/events', { ...eventParams, 'filters[featuredOnHomepage][$eq]': 'true' }),
    read<StrapiHeader>('/header', { 'populate[logo]': 'true', 'populate[navItems][populate][columns][populate]': '*', 'populate[ctaButton]': '*' }),
    read<StrapiFooter>('/footer', { 'populate[logo]': 'true', 'populate[columns][populate][links]': '*', 'populate[socials]': '*', 'populate[legalLinks]': '*' }),
    read<SiteConfig>('/site-config'),
  ]);
  const events = curated.length ? curated : await read<StrapiEvent[]>('/events', eventParams);
  return { home, events, header, footer, config };
});

export function resolvePreview(token?: string, requestedStatus?: string) {
  const expected = process.env.PREVIEW_TOKEN;
  const valid = Boolean(token && expected && Buffer.byteLength(token) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(token), Buffer.from(expected)));
  if (token && !valid) throw new Error('Invalid CMS preview token');
  const preview = valid ? { token: token!, status: requestedStatus === 'published' ? 'published' : 'draft' } : undefined;
  return preview;
}

export const getSiteData = cache(async (token?: string, status?: string) => {
  const preview = resolvePreview(token, status);
  const [header, footer, config] = await Promise.all([
    fetchPublished<StrapiHeader>('/header', { 'populate[logo]': 'true', 'populate[navItems][populate][columns][populate]': '*', 'populate[ctaButton]': '*' }, preview),
    fetchPublished<StrapiFooter>('/footer', { 'populate[logo]': 'true', 'populate[columns][populate][links]': '*', 'populate[socials]': '*', 'populate[legalLinks]': '*' }, preview),
    fetchPublished<SiteConfig>('/site-config', undefined, preview),
  ]);
  return { header, footer, config };
});
