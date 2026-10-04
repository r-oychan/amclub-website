import { getRouteData } from '../../lib/routes';
import { getSiteData } from '../../lib/cms';
import { pageMetadata } from '../../lib/metadata';
import { routeMetadata } from '../../lib/route-metadata';
import { SiteShell } from '../site-shell';
import { RouteContent } from '../route-content';
type Props = { params: Promise<{ path: string[] }>; searchParams: Promise<{ preview?: string; status?: string }> };
export const dynamic = 'force-dynamic';
async function load(props: Props) {
  const [{ path }, query] = await Promise.all([props.params, props.searchParams]);
  const [data, site] = await Promise.all([getRouteData(path.join('/'), query.preview, query.status), getSiteData(query.preview, query.status)]);
  return { path: `/${path.join('/')}`, data, site, preview: Boolean(query.preview) };
}
export async function generateMetadata(props: Props) {
  const { data, site, path, preview } = await load(props);
  return pageMetadata({ ...routeMetadata(data), config: site.config, path, preview });
}
export default async function Page(props: Props) {
  const { data, site, preview } = await load(props);
  return <SiteShell header={site.header} footer={site.footer} copy={site.config} preview={preview}><RouteContent data={data} /></SiteShell>;
}
