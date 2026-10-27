import 'server-only';
import { cache } from 'react';
import { fetchPublished, resolvePreview } from './cms';
import type { AboutInitialData, StrapiAboutPage, StrapiCommitteeMember } from '../../frontend/src/pages/AboutPage';

export const getAboutData = cache(async (token?: string, status?: string): Promise<AboutInitialData> => {
  const preview = resolvePreview(token, status);
  const members = (type: string) => fetchPublished<StrapiCommitteeMember[]>('/committee-members', { 'filters[memberType][$eq]': type, 'sort[0]': 'order:asc', 'pagination[limit]': '50', 'populate[photo]': 'true' }, preview);
  const [page, gc, mgmt] = await Promise.all([fetchPublished<StrapiAboutPage>('/about-page', undefined, preview), members('general-committee'), members('management')]);
  return { page, gc, mgmt };
});
