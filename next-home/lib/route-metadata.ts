import type { RouteData } from './routes';
import type { PageSeo } from '../../frontend/src/lib/seo';
function object(value: unknown): Record<string, unknown> { return value && typeof value === 'object' ? value as Record<string, unknown> : {}; }
function text(...values: unknown[]): string | undefined { return values.find((v): v is string => typeof v === 'string' && Boolean(v.trim())); }
/** CMS headings provide useful metadata when the optional SEO component is blank. */
export function routeMetadata(data: RouteData) {
  const initial = data.kind === 'VenueDetail' ? { venue: data.venue } : data.initialData;
  const page = object(Object.values(initial)[0]);
  const hero = object(page.hero), image = object(page.image ?? page.heroImage ?? hero.backgroundImage);
  return { seo: page.seo as PageSeo | undefined, fallbackTitle: text(page.title, page.name, page.heading, page.introHeading, hero.heading) ?? data.kind.replace(/([a-z])([A-Z])/g, '$1 $2'), fallbackDescription: text(page.description, page.subheading, page.introBody, hero.subheading), fallbackImage: text(image.url) };
}
