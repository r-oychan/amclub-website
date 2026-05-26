/**
 * Plugin config defaults. Host overrides via cms/config/plugins.ts.
 *
 * agentId / apiKey can be supplied here or via env (env wins so infra owns
 * secrets). Allow-list, doc-name prefix, harvest paths are per-project
 * static config — runtime override happens via the admin settings page,
 * which seeds itself from these defaults on first use.
 */

export type ContentTypeUid = `api::${string}.${string}`;

export interface ElevenLabsChatbotPluginConfig {
  apiBaseUrl: string;
  agentId: string | null;
  apiKey: string | null;
  docNamePrefix: string;
  publicSiteUrl: string;
  autoSyncOnPublish: boolean;
  defaultContentTypes: ContentTypeUid[];
  mediaUrlPaths: string[];
}

const DEFAULT_CONFIG: ElevenLabsChatbotPluginConfig = {
  apiBaseUrl: 'https://api.elevenlabs.io',
  agentId: null,
  apiKey: null,
  docNamePrefix: 'el-kb:',
  publicSiteUrl: '',
  autoSyncOnPublish: true,
  defaultContentTypes: [],
  mediaUrlPaths: ['cta.href', 'ctas[].href', 'hero.cta.href', 'menuUrl'],
};

export default {
  default: DEFAULT_CONFIG,
  validator(config: Partial<ElevenLabsChatbotPluginConfig>) {
    if (config.docNamePrefix && !config.docNamePrefix.endsWith(':')) {
      throw new Error('elevenlabs-chatbot: docNamePrefix must end with ":"');
    }
  },
};
