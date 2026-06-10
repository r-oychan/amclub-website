import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { fetchAPI } from '../../lib/api';

// Google Analytics 4 (gtag.js) loader. The Measurement ID is editable in the
// CMS (`Global: Site Configuration` single type → googleAnalyticsId). An
// optional build-time `VITE_GA_ID` acts as a fallback so analytics can run
// before the CMS entry is seeded; the CMS value always takes precedence.
// Nothing loads when no valid `G-XXXX` id is configured, so dev/preview stay
// untracked unless explicitly set.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

interface SiteConfig {
  googleAnalyticsId?: string;
}

const GA_ID_RE = /^G-[A-Z0-9]+$/;
const ENV_GA_ID = (import.meta.env.VITE_GA_ID as string | undefined)?.trim() ?? '';

let injected = false;

function injectGtag(id: string): void {
  if (injected || document.getElementById('ga-gtag-src')) return;
  injected = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js reads the raw `arguments` object off the dataLayer, so push it
    // verbatim (not a rest-array) to match Google's official snippet.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  // Disable the automatic first page_view — we emit page_views ourselves on
  // every client-side route change (SPA) so navigation is tracked correctly.
  window.gtag('config', id, { send_page_view: false });

  const script = document.createElement('script');
  script.id = 'ga-gtag-src';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

export function Analytics() {
  const location = useLocation();
  const [gaId, setGaId] = useState<string>('');

  // Resolve the active Measurement ID once (CMS first, env fallback).
  useEffect(() => {
    let cancelled = false;
    fetchAPI<SiteConfig>('/site-config').then((cfg) => {
      if (cancelled) return;
      const fromCms = (cfg?.googleAnalyticsId ?? '').trim();
      const id = GA_ID_RE.test(fromCms) ? fromCms : GA_ID_RE.test(ENV_GA_ID) ? ENV_GA_ID : '';
      if (!id) return;
      injectGtag(id);
      setGaId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Emit a page_view on first load (once gaId is known) and on every route change.
  useEffect(() => {
    if (!gaId || typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [gaId, location.pathname, location.search]);

  return null;
}
