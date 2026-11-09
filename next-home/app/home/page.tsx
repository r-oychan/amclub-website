import { pageMetadata } from '../../lib/metadata';
import type { Metadata } from 'next';
import { getHomeData } from '../../lib/cms';
import { HomeClient } from '../home-client';

type PageProps = { searchParams: Promise<{ preview?: string; status?: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = await searchParams;
  const { home, config } = await getHomeData(query.preview, query.status);
  return pageMetadata({ seo: home.seo, config, path: '/home', fallbackTitle: 'A Home Away From Home', fallbackDescription: home.hero?.subheading || home.aboutSection?.heading, fallbackImage: home.hero?.backgroundImage?.url, preview: Boolean(query.preview) });
}

export default async function HomePage({ searchParams }: PageProps) {
  const query = await searchParams;
  const { home, events, header, footer } = await getHomeData(query.preview, query.status);
  return <HomeClient home={home} events={events} header={header} footer={footer} preview={Boolean(query.preview)} />;
}
