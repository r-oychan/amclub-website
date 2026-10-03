import { notFound } from 'next/navigation';
import { getSiteData } from '../../lib/cms';
import { getAboutData } from '../../lib/pages';
import { pageMetadata } from '../../lib/metadata';
import { SiteShell } from '../site-shell';
import { AboutContent } from '../content-client';
type Props = { searchParams: Promise<{ preview?: string; status?: string }>; params: Promise<{ slug: string }> };
export const dynamic = 'force-dynamic';
async function load(props: Props) {
  const query = await props.searchParams;
  const [data, site] = await Promise.all([getAboutData(query.preview, query.status), getSiteData(query.preview, query.status)]);
  if (!data) notFound();
  return { data, site, preview: Boolean(query.preview) };
}
export async function generateMetadata(props: Props) {
  const { data, site, preview } = await load(props);
  return pageMetadata({ seo: data.page.seo, config: site.config, path: '/about', fallbackTitle: data.page.title || 'About', fallbackDescription: data.page.hero?.subheading, preview });
}
export default async function Page(props: Props) {
  const { data, site, preview } = await load(props);
  return <SiteShell header={site.header} footer={site.footer} preview={preview}><AboutContent data={data} /></SiteShell>;
}
