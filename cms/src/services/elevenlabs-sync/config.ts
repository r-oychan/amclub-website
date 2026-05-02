/**
 * Phase 1 config for ElevenLabs KB sync. Centralised so Phase 2 plugin
 * extraction is a rename: every value here becomes plugin config.
 */

export type ContentTypeUid = `api::${string}.${string}`;

export interface ElevenLabsSyncConfig {
  /** API base — almost always the default. */
  apiBaseUrl: string;
  /** Agent that owns the synced KB docs. Single-agent assumption (Phase 1). */
  agentIdEnv: string;
  /** API key env var name. Resolved at runtime so missing var fails loud. */
  apiKeyEnv: string;
  /** Doc-name prefix for everything we own — used for "Sync all" / "Clear all" matching. */
  docNamePrefix: string;
  /** Public URL of the deployed site, included in the markdown header. */
  siteUrlEnv: string;
  /** Strapi UIDs of content types whose entries we sync. */
  contentTypes: ContentTypeUid[];
  /**
   * Field paths that may contain a media URL pointing at an upload (CTAs etc.).
   * Each path is dot-separated, with `[]` to traverse arrays. The harvester
   * walks these on every entry and pulls any /uploads/ URL it finds.
   *
   * Phase 2: this becomes a per-content-type config option supplied by the
   * consumer of the plugin.
   */
  mediaUrlPaths: string[];
}

export const config: ElevenLabsSyncConfig = {
  apiBaseUrl: 'https://api.elevenlabs.io',
  agentIdEnv: 'ELEVENLABS_AGENT_ID',
  apiKeyEnv: 'ELEVENLABS_API_KEY',
  docNamePrefix: 'am-club:',
  siteUrlEnv: 'PUBLIC_SITE_URL',
  contentTypes: [
    'api::home-page.home-page',
    'api::about-page.about-page',
    'api::dining-page.dining-page',
    'api::fitness-page.fitness-page',
    'api::kids-page.kids-page',
    'api::membership-page.membership-page',
    'api::event-spaces-page.event-spaces-page',
    'api::whats-on-page.whats-on-page',
    'api::contact-us-page.contact-us-page',
    'api::gallery-page.gallery-page',
    'api::news-page.news-page',
    'api::event.event',
    'api::news-article.news-article',
    'api::restaurant.restaurant',
    'api::venue.venue',
    'api::facility.facility',
    'api::committee-member.committee-member',
    'api::faq-item.faq-item',
    'api::testimonial.testimonial',
    'api::gallery-album.gallery-album',
  ],
  mediaUrlPaths: [
    'cta.href',
    'ctas[].href',
    'hero.cta.href',
    'menuUrl',
  ],
};

export function getApiKey(): string {
  const key = process.env[config.apiKeyEnv];
  if (!key) throw new Error(`Missing env var: ${config.apiKeyEnv}`);
  return key;
}

export function getAgentId(): string {
  const id = process.env[config.agentIdEnv];
  if (!id) throw new Error(`Missing env var: ${config.agentIdEnv}`);
  return id;
}

export function getSiteUrl(): string {
  return process.env[config.siteUrlEnv] ?? 'https://amclub.example';
}
