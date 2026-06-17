import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { fetchAPI } from '../../lib/api';

// Google tag loader. The Tag ID is editable in the CMS
// (`Global: Site Configuration` single type → googleTagId) and accepts either:
//   • a Google tag (gtag.js): G-XXXX (GA4), GT-XXXX (Google tag), AW-XXXX (Ads)
//   • a Google Tag Manager container: GTM-XXXX (gtm.js)
// The correct snippet is chosen automatically from the prefix. An optional
// build-time `VITE_GA_ID` acts as a fallback so analytics can run before the CMS
// entry is seeded; the CMS value always takes precedence. Nothing loads when no
// valid id is configured, so dev/preview stay untracked unless explicitly set.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

interface SiteConfig {
  googleTagId?: string;
  /** @deprecated previous field name; read as fallback during the rename. */
  googleAnalyticsId?: string;
}

const GTAG_RE = /^(G|GT|AW)-[A-Z0-9]+$/; // gtag.js
const GTM_RE = /^GTM-[A-Z0-9]+$/; // Google Tag Manager
const ENV_ID = (import.meta.env.VITE_GA_ID as string | undefined)?.trim() ?? '';

type Mode = 'gtag' | 'gtm';
const modeFor = (id: string): Mode | null =>
  GTAG_RE.test(id) ? 'gtag' : GTM_RE.test(id) ? 'gtm' : null;

let injected = false;

function injectGtag(id: string): void {
  if (injected || document.getElementById('ga-gtag-src')) return;
  injected = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
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

function injectGtm(id: string): void {
  if (injected || document.getElementById('gtm-src')) return;
  injected = true;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.id = 'gtm-src';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);

  // <noscript> fallback iframe, per Google's GTM snippet.
  const noscript = document.createElement('noscript');
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(id)}`;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.display = 'none';
  iframe.style.visibility = 'hidden';
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);
}

export function Analytics() {
  const location = useLocation();
  const [active, setActive] = useState<{ id: string; mode: Mode } | null>(null);

  // Resolve the active Tag ID once (CMS first, env fallback).
  useEffect(() => {
    let cancelled = false;
    fetchAPI<SiteConfig>('/site-config').then((cfg) => {
      if (cancelled) return;
      const fromCms = (cfg?.googleTagId ?? cfg?.googleAnalyticsId ?? '').trim();
      const id = modeFor(fromCms) ? fromCms : modeFor(ENV_ID) ? ENV_ID : '';
      const mode = modeFor(id);
      if (!id || !mode) return;
      if (mode === 'gtm') injectGtm(id);
      else injectGtag(id);
      setActive({ id, mode });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Emit a page_view on first load (once active) and on every route change.
  // gtag fires the GA event directly; GTM gets a dataLayer push that a
  // History-Change / page_view trigger in the container can act on.
  useEffect(() => {
    if (!active) return;
    const page_path = location.pathname + location.search;
    const page_location = window.location.href;
    const page_title = document.title;
    if (active.mode === 'gtag' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', { page_path, page_location, page_title });
    } else if (active.mode === 'gtm' && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: 'page_view', page_path, page_location, page_title });
    }
  }, [active, location.pathname, location.search]);

  return null;
}
