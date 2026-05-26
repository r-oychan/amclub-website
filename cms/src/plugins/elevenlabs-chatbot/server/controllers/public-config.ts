/**
 * Public config endpoint consumed by the on-site chat widget. Returns only
 * the subset of plugin config + runtime settings that's safe to expose
 * to anonymous browsers (no API keys, no admin allow-list internals).
 */

import { PLUGIN_ID, getResolvedAgentId, type RuntimeSettings } from '../utils';

interface Ctx { body: unknown }
interface StrapiArg { strapi: unknown }

export default ({ strapi: _ }: StrapiArg) => ({
  async find(ctx: Ctx): Promise<void> {
    const settings = strapi.plugin(PLUGIN_ID).service('settings') as { read: () => Promise<RuntimeSettings> };
    const s = await settings.read();
    ctx.body = {
      agentId: getResolvedAgentId(strapi as never),
      chatbotEnabled: s.chatbotEnabled,
      voiceVisible: s.voiceVisible,
      bubblePosition: s.bubblePosition,
      accentColor: s.accentColor,
      panelTitle: s.panelTitle,
    };
  },
});
