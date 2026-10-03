import type { Metadata } from 'next';
import type { PageSeo } from '../../frontend/src/lib/seo';
import type { SiteConfig } from './cms';
export function pageMetadata({ seo, config, path, fallbackTitle, fallbackDescription, fallbackImage, preview }: { seo?: PageSeo | null; config: SiteConfig; path: string; fallbackTitle: string; fallbackDescription?: string; fallbackImage?: string; preview: boolean }): Metadata {
  const origin = process.env.PUBLIC_SITE_URL;
  if (!origin) throw new Error('PUBLIC_SITE_URL must be configured');
  const siteName = config.siteName?.trim() || 'The American Club Singapore';

  const defaults = config.defaultSeo;
  const baseTitle = seo?.metaTitle?.trim() || fallbackTitle;
  const title = baseTitle.includes(siteName) ? baseTitle : `${baseTitle} | ${siteName}`;
  const description = seo?.metaDescription?.trim() || defaults?.metaDescription?.trim() || fallbackDescription;
  const canonical = seo?.canonicalURL || `${origin}${path}`;
  const image = seo?.metaImage?.url || defaults?.metaImage?.url || fallbackImage;
  const images = image ? [new URL(image, origin).href] : undefined;
  return { robots: preview ? { index: false, follow: false } : undefined, title, description, metadataBase: new URL(origin), alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName, type: 'website', images },
    twitter: { card: images ? 'summary_large_image' : 'summary', title, description, images },
  };
}
