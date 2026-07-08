/**
 * Global lifecycle subscriber that fires KB sync on publish / unpublish / delete
 * for every content type in the runtime allow-list (plugin settings).
 *
 * Fire-and-forget so a flaky ElevenLabs response never blocks the editor save.
 */

import {
  PLUGIN_ID,
  getEffectiveAllowList,
  getPluginConfig,
  getResolvedAgentId,
  getResolvedApiKey,
} from '../utils';
import { syncEntry } from './sync';

interface LifecycleEvent {
  model: { uid: string };
  result?: Record<string, unknown> | null;
  params?: Record<string, unknown>;
}

type Strapi = {
  db: {
    transaction: <T>(cb: () => Promise<T>) => Promise<T>;
    lifecycles: {
      subscribe: (sub: {
        models?: string[];
        afterCreate?: (event: LifecycleEvent) => void | Promise<void>;
        afterUpdate?: (event: LifecycleEvent) => void | Promise<void>;
        afterDelete?: (event: LifecycleEvent) => void | Promise<void>;
      }) => void;
    };
  };
  log: { info: (...a: unknown[]) => void; warn: (...a: unknown[]) => void; error: (...a: unknown[]) => void };
  plugin: (id: string) => { config: <T>(key?: string) => T };
  store: (opts: { type: string; name: string }) => {
    get: (opts: { key: string }) => Promise<unknown>;
    set: (opts: { key: string; value: unknown }) => Promise<unknown>;
  };
  contentTypes: Record<string, unknown>;
};

function fireAndForget(strapi: Strapi, label: string, fn: () => Promise<unknown>): void {
  // Lifecycle events fire inside the request's DB transaction, which commits
  // before this async work finishes — queries then die with "Transaction query
  // already complete" and sync-log rows are silently lost. Opening a fresh
  // transaction scope detaches the sync from the completed one.
  void strapi.db
    .transaction(async () => fn())
    .catch((err) => {
      strapi.log.warn(`[${PLUGIN_ID}] ${label}: ${(err as Error).message}`);
    });
}

function isPublished(entry: Record<string, unknown> | null | undefined): boolean {
  return !!(entry && entry.publishedAt);
}

function getDocumentId(entry: Record<string, unknown> | null | undefined): string | undefined {
  return (entry?.documentId as string | undefined) ?? undefined;
}

export async function registerLifecycleHooks(strapi: Strapi): Promise<void> {
  const cfg = getPluginConfig(strapi as never);
  if (!cfg.autoSyncOnPublish) {
    strapi.log.info(`[${PLUGIN_ID}] autoSyncOnPublish disabled — lifecycle hooks not registered`);
    return;
  }
  if (!getResolvedApiKey(strapi as never) || !getResolvedAgentId(strapi as never)) {
    strapi.log.info(`[${PLUGIN_ID}] api key or agent id missing — lifecycle hooks not registered`);
    return;
  }

  // Subscribe to all api::* models — runtime allow-list is checked inside syncEntry.
  const allModels = Object.keys(strapi.contentTypes).filter((uid) => uid.startsWith('api::'));

  strapi.db.lifecycles.subscribe({
    models: allModels,
    async afterCreate(event) {
      const uid = event.model.uid;
      const allow = await getEffectiveAllowList(strapi as never);
      if (!allow.includes(uid)) return;
      const entry = event.result;
      if (!isPublished(entry)) return;
      fireAndForget(strapi, `${uid} create`, () => syncEntry(strapi as never, uid, getDocumentId(entry)));
    },
    async afterUpdate(event) {
      const uid = event.model.uid;
      const allow = await getEffectiveAllowList(strapi as never);
      if (!allow.includes(uid)) return;
      const entry = event.result;
      const documentId = getDocumentId(entry);
      if (isPublished(entry)) {
        fireAndForget(strapi, `${uid} update`, () => syncEntry(strapi as never, uid, documentId));
      } else {
        fireAndForget(strapi, `${uid} unpublish`, () => syncEntry(strapi as never, uid, documentId));
      }
    },
    async afterDelete(event) {
      const uid = event.model.uid;
      const allow = await getEffectiveAllowList(strapi as never);
      if (!allow.includes(uid)) return;
      const documentId = getDocumentId(event.result);
      fireAndForget(strapi, `${uid} delete`, () => syncEntry(strapi as never, uid, documentId));
    },
  });

  strapi.log.info(`[${PLUGIN_ID}] lifecycle hooks armed across ${allModels.length} api content type(s)`);
}
