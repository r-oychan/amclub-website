import { factories } from '@strapi/strapi';
import type { Context } from 'koa';

interface DiscoveryService { generate(file: 'robots' | 'sitemap' | 'llms'): Promise<{ body: string; status: number; type: string }> }
export default factories.createCoreController('api::crawler-settings.crawler-settings', ({ strapi }) => {
  const serve = async (ctx: Context, file: 'robots' | 'sitemap' | 'llms') => {
    // Public discovery never honors a preview token/status. The global preview
    // middleware sees this forced status and cannot replace published reads.
    ctx.query = { status: 'published' };
    ctx.set('Cache-Control', 'no-store');
    ctx.set('X-Robots-Tag', 'noindex');
    try {
      const service = strapi.service('api::crawler-settings.crawler-settings') as unknown as DiscoveryService;
      const result = await service.generate(file);
      ctx.status = result.status;
      ctx.type = result.type;
      ctx.body = result.body;
    } catch (error) {
      strapi.log.error(`[site-discovery] ${file} generation failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      // Never turn a CMS outage into an empty successful sitemap or permissive robots.
      ctx.status = 503;
      ctx.type = 'text/plain; charset=utf-8';
      ctx.body = 'Discovery temporarily unavailable\n';
      ctx.set('Retry-After', '60');
    }
  };
  return {
    robots: (ctx: Context) => serve(ctx, 'robots'),
    sitemap: (ctx: Context) => serve(ctx, 'sitemap'),
    llms: (ctx: Context) => serve(ctx, 'llms'),
  };
});
