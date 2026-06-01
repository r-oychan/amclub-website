import { PLUGIN_ID, type RuntimeSettings } from '../utils';

interface Ctx {
  request: { body?: Partial<RuntimeSettings> };
  body: unknown;
  badRequest: (msg: string) => void;
}

interface StrapiArg { strapi: unknown }

export default ({ strapi: _ }: StrapiArg) => ({
  async find(ctx: Ctx): Promise<void> {
    const settings = strapi.plugin(PLUGIN_ID).service('settings') as { read: () => Promise<RuntimeSettings> };
    ctx.body = await settings.read();
  },
  async update(ctx: Ctx): Promise<void> {
    const next = ctx.request.body;
    if (!next || typeof next !== 'object') return ctx.badRequest('body must be a settings object');
    const settings = strapi.plugin(PLUGIN_ID).service('settings') as {
      update: (n: Partial<RuntimeSettings>) => Promise<RuntimeSettings>;
    };
    ctx.body = await settings.update(next);
  },
});
