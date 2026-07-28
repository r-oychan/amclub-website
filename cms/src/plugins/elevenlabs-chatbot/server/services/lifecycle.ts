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

// Lifecycle events fire inside the request's DB transaction, which commits
// before an async sync finishes — queries then die with "Transaction query
// already complete" and sync-log rows are silently lost. (Wrapping in
// strapi.db.transaction doesn't help: a nested call JOINS the completed
// parent.) The escape: queue jobs and drain them from a setInterval worker.
// Timer callbacks run with the async context captured at REGISTRATION —
// bootstrap, outside any request — so queued syncs get a clean DB context.
// The queue also serializes syncs, ending the concurrent-upsert races that
// duplicated KB docs.

interface SyncJob {
  uid: string;
  documentId?: string;
  label: string;
}

const pendingJobs = new Map<string, SyncJob>();
let draining = false;

function enqueueSync(uid: string, label: string, documentId?: string): void {
  pendingJobs.set(`${uid}:${documentId ?? ''}`, { uid, documentId, label });
}

async function drainQueue(strapi: Strapi): Promise<void> {
  while (pendingJobs.size > 0) {
    const next = pendingJobs.entries().next().value as [string, SyncJob];
    pendingJobs.delete(next[0]);
    const job = next[1];
    try {
      await syncEntry(strapi as never, job.uid, job.documentId);
    } catch (err) {
      strapi.log.warn(`[${PLUGIN_ID}] ${job.label}: ${(err as Error).message}`);
    }
  }
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
      enqueueSync(uid, `${uid} create`, getDocumentId(entry));
    },
    async afterUpdate(event) {
      const uid = event.model.uid;
      const allow = await getEffectiveAllowList(strapi as never);
      if (!allow.includes(uid)) return;
      const entry = event.result;
      const documentId = getDocumentId(entry);
      enqueueSync(uid, `${uid} ${isPublished(entry) ? 'update' : 'unpublish'}`, documentId);
    },
    async afterDelete(event) {
      const uid = event.model.uid;
      const allow = await getEffectiveAllowList(strapi as never);
      if (!allow.includes(uid)) return;
      enqueueSync(uid, `${uid} delete`, getDocumentId(event.result));
    },
  });

  // Registered at bootstrap → callbacks run outside request transactions.
  const timer = setInterval(() => {
    if (draining || pendingJobs.size === 0) return;
    draining = true;
    void drainQueue(strapi).finally(() => {
      draining = false;
    });
  }, 1000);
  timer.unref?.();

  strapi.log.info(`[${PLUGIN_ID}] lifecycle hooks armed across ${allModels.length} api content type(s)`);
}
