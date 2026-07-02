import { useEffect } from 'react';
import { applySeo, type PageSeo } from '../lib/seo';

/**
 * Apply a page's CMS SEO (shared.seo component) to the document head once its
 * data has loaded. Pass `null`/`undefined` while loading — the site-wide
 * defaults (applied by SeoManager on every route change) stay in place, and
 * blank fields fall back per-field to those defaults.
 */
export function usePageSeo(seo: PageSeo | null | undefined): void {
  useEffect(() => {
    if (!seo) return;
    void applySeo(seo);
  }, [seo]);
}
