export interface CrawlerRule { userAgent: string; allowPaths?: string; disallowPaths?: string }
export interface CrawlerSettings {
  allowIndexing?: boolean;
  sitemapEnabled?: boolean;
  llmsEnabled?: boolean;
  llmsTitle?: string;
  llmsSummary?: string;
  llmsGuidance?: string;
  excludedPaths?: string;
  robotsRules?: CrawlerRule[];
}
export interface DiscoveryPage { url: string; title: string; description?: string; modified?: string; group: string }

export const lines = (value?: string): string[] => (value ?? '').split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
export function siteOrigin(value?: string): string {
  if (!value) throw new Error('PUBLIC_SITE_URL must be configured');
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('PUBLIC_SITE_URL must be an HTTP(S) origin without credentials, path or query');
  }
  return url.origin;
}
export function localUrl(path: string, origin: string): string | undefined {
  if (!path.startsWith('/') || path.startsWith('//') || /[\r\n\\]/.test(path)) return undefined;
  const url = new URL(path, origin);
  if (url.origin !== origin || url.search || url.hash) return undefined;
  return url.href;
}
export function canonicalUrl(value: string | undefined, path: string, origin: string): string | undefined {
  if (!value?.trim()) return localUrl(path, origin);
  try {
    const url = new URL(value, origin);
    // Cross-site canonicals do not belong in this site's sitemap or llms index.
    return url.origin === origin && !url.username && !url.password && !url.search && !url.hash ? url.href : undefined;
  } catch { return undefined; }
}
export function excluded(url: string, settings: CrawlerSettings): boolean {
  const path = new URL(url).pathname;
  return lines(settings.excludedPaths).some((rule) => rule.startsWith('/') && (rule.endsWith('/') ? path.startsWith(rule) : path === rule));
}
export function plainText(value?: string): string {
  return (value ?? '').replace(/<[^>]*>/g, '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
}
const markdown = (value: string) => plainText(value).replace(/[\\`*_{}\[\]<>]/g, '\\$&');
const xml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const restricted = ['/admin', '/api/', '/content-manager/', '/content-type-builder/', '/strapi-plugin-sso/', '/*?*preview=*', '/*?*status=draft*'];
export function robots(settings: CrawlerSettings, origin: string, allowed: boolean): string {
  if (!allowed || settings.allowIndexing !== true) return 'User-agent: *\nDisallow: /\n';
  const groups = settings.robotsRules?.length ? settings.robotsRules : [{ userAgent: '*' }];
  const withWildcard = groups.some((rule) => rule.userAgent === '*') ? groups : [{ userAgent: '*' }, ...groups];
  const result = withWildcard.map((rule) => {
    if (!/^[A-Za-z0-9_*.-]+$/.test(rule.userAgent)) throw new Error('Invalid crawler user agent');
    const allow = lines(rule.allowPaths).filter((path) => path.startsWith('/') && !path.startsWith('//'));
    const disallow = [...new Set([...restricted, ...lines(rule.disallowPaths).filter((path) => path.startsWith('/') && !path.startsWith('//'))])];
    return [`User-agent: ${rule.userAgent}`, ...allow.map((p) => `Allow: ${p}`), ...disallow.map((p) => `Disallow: ${p}`)].join('\n');
  });
  if (settings.sitemapEnabled !== false) result.push(`Sitemap: ${origin}/sitemap.xml`);
  return `${result.join('\n\n')}\n`;
}
export function sitemap(pages: DiscoveryPage[]): string {
  if (pages.length > 50000) throw new Error('Sitemap exceeds 50,000 URLs; add a sitemap index');
  const urls = pages.map((page) => {
    const date = page.modified && !Number.isNaN(Date.parse(page.modified)) ? new Date(page.modified).toISOString() : undefined;
    return `  <url><loc>${xml(page.url)}</loc>${date ? `<lastmod>${date}</lastmod>` : ''}</url>`;
  });
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  if (Buffer.byteLength(body, 'utf8') > 50 * 1024 * 1024) throw new Error('Sitemap exceeds the 50 MB protocol limit');
  return body;
}
export function llms(settings: CrawlerSettings, pages: DiscoveryPage[], siteName: string, description?: string): string {
  const body = [`# ${markdown(settings.llmsTitle?.trim() || siteName)}`];
  const summary = settings.llmsSummary?.trim() || description;
  if (summary) body.push(`> ${plainText(summary)}`);
  if (settings.llmsGuidance?.trim()) body.push(settings.llmsGuidance.trim());
  for (const group of [...new Set(pages.map((page) => page.group))]) {
    body.push(`## ${markdown(group)}\n\n${pages.filter((page) => page.group === group).map((page) => `- [${markdown(page.title)}](<${page.url}>): ${markdown(page.description?.slice(0, 240) || page.title)}`).join('\n')}`);
  }
  return `${body.join('\n\n')}\n`;
}
