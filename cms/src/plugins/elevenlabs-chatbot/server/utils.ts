/**
 * Plugin-wide helpers. Two layers of config:
 *
 *  1. Plugin config — static per-install, loaded via strapi.plugin(pluginId).config(key).
 *     Combined with env vars; env wins. This is where agent ID, API key,
 *     doc-name prefix, harvest paths live.
 *
 *  2. Runtime settings — editable in the Strapi admin, stored in the
 *     plugin store. Look-and-feel (colors, position, panel title) + content
 *     type allow-list + chatbotEnabled kill switch.
 */

import type { ElevenLabsChatbotPluginConfig } from './config';

export const PLUGIN_ID = 'elevenlabs-chatbot';
export const SYNC_LOG_UID = `plugin::${PLUGIN_ID}.elevenlabs-doc`;

export interface RuntimeSettings {
  chatbotEnabled: boolean;
  voiceVisible: boolean;
  bubblePosition: 'bottom-right' | 'bottom-left';
  accentColor: string;
  panelTitle: string;
  contentTypeAllowList: string[];
}

export const DEFAULT_RUNTIME_SETTINGS: RuntimeSettings = {
  chatbotEnabled: true,
  voiceVisible: true,
  bubblePosition: 'bottom-right',
  accentColor: '#E52B50',
  panelTitle: 'Assistant',
  contentTypeAllowList: [],
};

interface StrapiLike {
  plugin: (id: string) => { config: <T>(key?: string) => T };
  config: { get: <T>(key: string, defaultValue?: T) => T };
  store: (opts: { type: string; name: string }) => {
    get: (opts: { key: string }) => Promise<unknown>;
    set: (opts: { key: string; value: unknown }) => Promise<unknown>;
  };
  contentTypes: Record<string, { kind?: string; uid?: string; info?: { singularName?: string } }>;
}

// `strapi.plugin(name).config()` is for SPECIFIC keys, not the whole bag.
// To read the merged plugin-config object (defaults from server/config.ts
// + user overrides from cms/config/plugins.ts), go through strapi.config
// with the `plugin::<name>` namespace.
export function getPluginConfig(strapi: StrapiLike): ElevenLabsChatbotPluginConfig {
  return (
    strapi.config.get<ElevenLabsChatbotPluginConfig>(`plugin::${PLUGIN_ID}`) ??
    ({} as ElevenLabsChatbotPluginConfig)
  );
}

export function getResolvedAgentId(strapi: StrapiLike): string | null {
  return process.env.ELEVENLABS_AGENT_ID ?? getPluginConfig(strapi).agentId ?? null;
}

export function getResolvedApiKey(strapi: StrapiLike): string | null {
  return process.env.ELEVENLABS_API_KEY ?? getPluginConfig(strapi).apiKey ?? null;
}

export function getSiteUrl(strapi: StrapiLike): string {
  return (
    process.env.PUBLIC_SITE_URL ?? getPluginConfig(strapi).publicSiteUrl ?? 'https://example.com'
  );
}

function pluginStore(strapi: StrapiLike) {
  return strapi.store({ type: 'plugin', name: PLUGIN_ID });
}

export async function readRuntimeSettings(strapi: StrapiLike): Promise<RuntimeSettings> {
  const stored = (await pluginStore(strapi).get({ key: 'settings' })) as Partial<RuntimeSettings> | null;
  if (!stored) return { ...DEFAULT_RUNTIME_SETTINGS };
  return { ...DEFAULT_RUNTIME_SETTINGS, ...stored };
}

export async function writeRuntimeSettings(
  strapi: StrapiLike,
  next: Partial<RuntimeSettings>,
): Promise<RuntimeSettings> {
  const merged = { ...(await readRuntimeSettings(strapi)), ...next };
  await pluginStore(strapi).set({ key: 'settings', value: merged });
  return merged;
}

/**
 * Effective allow-list: settings.contentTypeAllowList if non-empty, else
 * the plugin config's defaultContentTypes (project-level baseline).
 */
export async function getEffectiveAllowList(strapi: StrapiLike): Promise<string[]> {
  const settings = await readRuntimeSettings(strapi);
  if (settings.contentTypeAllowList.length > 0) return settings.contentTypeAllowList;
  return getPluginConfig(strapi).defaultContentTypes as string[];
}

export function listSyncableContentTypes(strapi: StrapiLike): Array<{ uid: string; kind: string; displayName: string }> {
  const out: Array<{ uid: string; kind: string; displayName: string }> = [];
  for (const [uid, schema] of Object.entries(strapi.contentTypes)) {
    if (!uid.startsWith('api::')) continue;
    out.push({
      uid,
      kind: schema.kind ?? 'collectionType',
      displayName: schema.info?.singularName ?? uid,
    });
  }
  return out.sort((a, b) => a.uid.localeCompare(b.uid));
}
