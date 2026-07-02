import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { applySeo } from '../../lib/seo';

/**
 * Resets the document head to the site-wide SEO defaults on every route
 * change. Pages that fetch their own `shared.seo` component override these
 * via usePageSeo once their data arrives; pages without one keep the
 * defaults (with a correct per-route canonical/og:url).
 */
export function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    void applySeo(null);
  }, [location.pathname]);

  return null;
}
