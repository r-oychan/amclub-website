import type { Metadata } from 'next';
import { getHomeData } from '../../lib/cms';
import { HomeClient } from '../home-client';

type PageProps = { searchParams: Promise<{ preview?: string; status?: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = await searchParams;
  const { home, config } = await getHomeData(query.preview, query.status);
  const origin = process.env.PUBLIC_SITE_URL;
  if (!origin) throw new Error('PUBLIC_SITE_URL must be configured');
  const siteName = config.siteName?.trim() || 'The American Club Singapore';
  const seo = home.seo;
  const defaults = config.defaultSeo;
  const baseTitle = seo?.metaTitle?.trim() || 'A Home Away From Home';
  const title = baseTitle.includes(siteName) ? baseTitle : `${baseTitle} | ${siteName}`;
  const description = seo?.metaDescription?.trim() || defaults?.metaDescription?.trim() || home.hero?.subheading || home.aboutSection?.heading || undefined;
  const canonical = seo?.canonicalURL || `${origin}/home`;
  const image = seo?.metaImage?.url || defaults?.metaImage?.url || home.hero?.backgroundImage?.url;
  const images = image ? [new URL(image, origin).href] : undefined;
  return { robots: query.preview ? { index: false, follow: false } : undefined, title, description, metadataBase: new URL(origin), alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName, type: 'website', images },
    twitter: { card: images ? 'summary_large_image' : 'summary', title, description, images },
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  const query = await searchParams;
  const { home, events, header, footer } = await getHomeData(query.preview, query.status);
  return <HomeClient home={home} events={events} header={header} footer={footer} preview={Boolean(query.preview)} />;
}
