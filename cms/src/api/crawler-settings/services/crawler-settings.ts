import type { Core, UID } from '@strapi/strapi';
import { factories } from '@strapi/strapi';
import { canonicalUrl, excluded, llms, plainText, robots, sitemap, siteOrigin } from '../utils/discovery-format';
import type { CrawlerSettings, DiscoveryPage } from '../utils/discovery-format';

interface ContentEntry {
  title?: string; name?: string; heading?: string; introHeading?: string; slug?: string;
  description?: string; introBody?: string; shortDescription?: string; updatedAt?: string;
  hero?: { heading?: string; subheading?: string };
  seo?: { metaTitle?: string; metaDescription?: string; canonicalURL?: string };
}
interface PageSource { type: string; path: string; section: string; collection?: boolean }
// URL structure is code; titles, summaries, canonical overrides and visibility are CMS content.
export const SOURCES: PageSource[] = [
  { type: 'home-page', path: '/home', section: '/home' },
  { type: 'about-page', path: '/about', section: '/about' },
  { type: 'dining-page', path: '/dining', section: '/dining' },
  { type: 'dining-promotions-page', path: '/dining/dining-promotion', section: '/dining' },
  { type: 'fitness-page', path: '/fitness', section: '/fitness' },
  { type: 'kids-page', path: '/kids', section: '/kids' },
  { type: 'event-spaces-page', path: '/event-spaces', section: '/event-spaces' },
  { type: 'membership-page', path: '/membership', section: '/membership' },
  { type: 'whats-on-page', path: '/whats-on', section: '/whats-on' },
  { type: 'news-page', path: '/home-sub/news', section: '/home-sub/news' },
  { type: 'gallery-page', path: '/home-sub/gallery', section: '/home-sub/gallery' },
  { type: 'contact-us-page', path: '/home-sub/contact-us', section: '/home-sub/contact-us' },
  { type: 'faq-page', path: '/faq', section: '/faq' },
  { type: 'privacy-statement-page', path: '/privacy-statement', section: '/privacy-statement' },
  { type: 'advertise-with-us-page', path: '/home-sub/advertise-with-us', section: '/about' },
  { type: 'joining-fees-page', path: '/membership/joining-fees', section: '/membership' },
  { type: 'referral-page', path: '/membership/referal', section: '/membership' },
  { type: 'reciprocal-clubs-page', path: '/membership/reciprocal-clubs', section: '/membership' },
  { type: 'start-application-page', path: '/membership/start-application', section: '/membership' },
  { type: 'niche-group-membership-page', path: '/membership/niche-group-membership', section: '/membership' },
  { type: 'restaurant', path: '/dining/', section: '/dining', collection: true },
  { type: 'fitness-facility', path: '/fitness/', section: '/fitness', collection: true },
  { type: 'kids-experience', path: '/kids/', section: '/kids', collection: true },
  { type: 'event-space', path: '/event-spaces/', section: '/event-spaces', collection: true },
  { type: 'event', path: '/whats-on/', section: '/whats-on', collection: true },
  { type: 'news-article', path: '/home-sub/club-news/', section: '/home-sub/news', collection: true },
  { type: 'aquatics-coach', path: '/coaches/aquatics/', section: '/fitness', collection: true },
  { type: 'tennis-coach', path: '/coaches/tennis/', section: '/fitness', collection: true },
  { type: 'gym-trainer', path: '/coaches/gym/', section: '/fitness', collection: true },
  { type: 'pilates-instructor', path: '/coaches/pilates/', section: '/fitness', collection: true },
];
const uid = (type: string) => `api::${type}.${type}` as UID.ContentType;
const title = (entry: ContentEntry) => [entry.seo?.metaTitle, entry.name, entry.title, entry.heading, entry.introHeading, entry.hero?.heading].map(plainText).find(Boolean) || '';

export default factories.createCoreService('api::crawler-settings.crawler-settings', ({ strapi }: { strapi: Core.Strapi }) => ({
  async settings(): Promise<CrawlerSettings | null> {
    return await strapi.documents(uid('crawler-settings')).findFirst({ status: 'published', populate: ['robotsRules'] } as never) as unknown as CrawlerSettings | null;
  },
  async pages(settings: CrawlerSettings, origin: string): Promise<DiscoveryPage[]> {
    const entries = await Promise.all(SOURCES.map(async (source) => {
      const schema = strapi.contentTypes[uid(source.type)];
      const fields = ['title', 'name', 'heading', 'introHeading', 'slug', 'description', 'introBody', 'shortDescription', 'updatedAt'].filter((field) => field === 'updatedAt' || field in schema.attributes);
      const populate = ['seo', 'hero'].filter((field) => field in schema.attributes);
      const read = strapi.documents(uid(source.type));
      if (!source.collection) {
        const entry = await read.findFirst({ status: 'published', fields, populate } as never);
        return { source, rows: entry ? [entry as unknown as ContentEntry] : [] };
      }
      const rows: ContentEntry[] = [];
      // Document Service pagination bypasses public REST limits and listing expiry filters.
      // Expired events retain working detail URLs, so stay in the published URL index.
      for (let start = 0; ; start += 100) {
        const batch = await read.findMany({ status: 'published', fields, populate, sort: 'documentId:asc', start, limit: 100 } as never) as unknown as ContentEntry[];
        rows.push(...batch);
        if (batch.length < 100) break;
      }
      return { source, rows };
    }));
    const headings = new Map(entries.filter(({ source }) => !source.collection).map(({ source, rows }) => [source.path, rows[0] ? title(rows[0]) : '']));
    const pages = new Map<string, DiscoveryPage>();
    for (const { source, rows } of entries) for (const entry of rows) {
      const label = title(entry);
      if (!label || (source.collection && (!entry.slug || !/^[A-Za-z0-9_-]+$/.test(entry.slug)))) continue;
      let path = source.collection ? source.path + entry.slug : source.path;
      if (source.type === 'fitness-facility' && entry.slug?.startsWith('aquatics-')) path = `/fitness/aquatics/${entry.slug.slice('aquatics-'.length)}`;
      const url = canonicalUrl(entry.seo?.canonicalURL, path, origin);
      if (!url || excluded(url, settings)) continue;
      if (!pages.has(url)) pages.set(url, { url, title: label, description: plainText(entry.seo?.metaDescription || entry.shortDescription || entry.description || entry.introBody || entry.hero?.subheading), modified: entry.updatedAt, group: headings.get(source.section) || headings.get('/home') || label });
    }
    return [...pages.values()];
  },
  async generate(file: 'robots' | 'sitemap' | 'llms'): Promise<{ body: string; status: number; type: string }> {
    const origin = siteOrigin(process.env.PUBLIC_SITE_URL);
    const settings = await this.settings() ?? {};
    const allowed = process.env.SITE_INDEXING_ALLOWED === 'true' && settings.allowIndexing === true;
    if (file === 'robots') return { body: robots(settings, origin, allowed), status: 200, type: 'text/plain; charset=utf-8' };
    if (file === 'sitemap') return { body: sitemap(allowed && settings.sitemapEnabled !== false ? await this.pages(settings, origin) : []), status: 200, type: 'application/xml; charset=utf-8' };
    if (!allowed || settings.llmsEnabled === false) return { body: 'Not found\n', status: 404, type: 'text/plain; charset=utf-8' };
    const [pages, config] = await Promise.all([this.pages(settings, origin), strapi.documents(uid('site-config')).findFirst({ status: 'published', populate: ['defaultSeo'] } as never)]);
    const site = config as unknown as { siteName?: string; defaultSeo?: { metaDescription?: string } } | null;
    const siteName = settings.llmsTitle?.trim() || site?.siteName?.trim() || pages.find((page) => new URL(page.url).pathname === '/home')?.title;
    if (!siteName) throw new Error('Publish a site name or llms title before enabling llms.txt');
    return { body: llms(settings, pages, siteName, site?.defaultSeo?.metaDescription), status: 200, type: 'text/plain; charset=utf-8' };
  },
}));
