import { fetchAPI, STRAPI_URL } from './api';

// ── Site-wide SEO with per-page override ────────────────────────────────────
// Every page's `shared.seo` component (metaTitle/metaDescription/metaImage/
// canonicalURL) overrides the site-wide defaults configured on the
// "Global: Site Configuration" single type (`siteName` + `defaultSeo`).
// Blank page fields fall back per-field to the defaults, so a page can set
// just a title and still inherit the shared description and share image.

/** Shape of the `shared.seo` Strapi component as returned by the API. */
export interface PageSeo {
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaImage?: { url: string } | null;
  canonicalURL?: string | null;
}

interface SiteConfigSeo {
  siteName?: string | null;
  defaultSeo?: PageSeo | null;
}

const FALLBACK_SITE_NAME = 'The American Club Singapore';

// One request per session, shared by every page. The site-config controller
// populates defaultSeo (incl. metaImage) without populate params.
let configPromise: Promise<SiteConfigSeo | null> | null = null;
function getSeoDefaults(): Promise<SiteConfigSeo | null> {
  configPromise ??= fetchAPI<SiteConfigSeo>('/site-config');
  return configPromise;
}

const absoluteUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (/^https?:/i.test(url)) return url;
  const origin = STRAPI_URL || window.location.origin;
  return `${origin}${url}`;
};

function setMeta(attr: 'name' | 'property', key: string, content?: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href?: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

// Monotonic ticket so only the most recent applySeo call writes the head —
// a slow config fetch from a previous route can't stomp the current page.
let applyGeneration = 0;

/**
 * Merge page-level SEO over the site-wide defaults and write the document
 * head (title, description, canonical, Open Graph, Twitter card).
 * Pass `null`/no page SEO to apply the site-wide defaults alone.
 */
export async function applySeo(page?: PageSeo | null): Promise<void> {
  const generation = ++applyGeneration;
  const cfg = await getSeoDefaults();
  if (generation !== applyGeneration) return;
  const siteName = cfg?.siteName?.trim() || FALLBACK_SITE_NAME;
  const defaults = cfg?.defaultSeo ?? {};

  const baseTitle = page?.metaTitle?.trim() || defaults.metaTitle?.trim() || siteName;
  // Suffix the site name unless the title already carries it.
  const title = baseTitle.includes(siteName) ? baseTitle : `${baseTitle} | ${siteName}`;
  const description = page?.metaDescription?.trim() || defaults.metaDescription?.trim() || undefined;
  const image = absoluteUrl(page?.metaImage?.url || defaults.metaImage?.url);
  const canonical =
    page?.canonicalURL?.trim() || `${window.location.origin}${window.location.pathname}`;

  document.title = title;
  setMeta('name', 'description', description);
  setCanonical(canonical);

  setMeta('property', 'og:site_name', siteName);
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', canonical);
  setMeta('property', 'og:image', image);

  setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', image);
}
