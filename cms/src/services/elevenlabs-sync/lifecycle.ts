/**
 * Global lifecycle subscriber that fires KB sync on publish/unpublish/delete
 * for every content type in the configured allow-list.
 *
 * - afterCreate / afterUpdate: sync if the result has a non-null publishedAt.
 *   If publishedAt transitioned to null (unpublish), delete the KB doc.
 * - afterDelete: delete the KB doc.
 *
 * All work is fire-and-forget — never blocks the editor's save and swallows
 * errors with a log warn so a flaky ElevenLabs response can't break Strapi.
 */

import { config } from './config';
import { syncEntry } from './index';

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
};

function fireAndForget(strapi: Strapi, label: string, fn: () => Promise<unknown>): void {
  void fn().catch((err) => {
    strapi.log.warn(`[elevenlabs-sync] ${label}: ${(err as Error).message}`);
  });
}

function isPublished(entry: Record<string, unknown> | null | undefined): boolean {
  return !!(entry && entry.publishedAt);
}

function getDocumentId(entry: Record<string, unknown> | null | undefined): string | undefined {
  return (entry?.documentId as string | undefined) ?? undefined;
}

export function registerLifecycleHooks(strapi: Strapi): void {
  if (!process.env[config.apiKeyEnv] || !process.env[config.agentIdEnv]) {
    strapi.log.info('[elevenlabs-sync] skipping lifecycle hooks — env vars not set');
    return;
  }

  strapi.db.lifecycles.subscribe({
    models: [...config.contentTypes],
    afterCreate(event) {
      const uid = event.model.uid;
      const entry = event.result;
      if (!isPublished(entry)) return;
      const documentId = getDocumentId(entry);
      fireAndForget(strapi, `${uid} create`, () => syncEntry(strapi as never, uid, documentId));
    },
    afterUpdate(event) {
      const uid = event.model.uid;
      const entry = event.result;
      const documentId = getDocumentId(entry);
      if (isPublished(entry)) {
        fireAndForget(strapi, `${uid} update`, () => syncEntry(strapi as never, uid, documentId));
      } else {
        // publishedAt transitioned to null (unpublish) — let syncEntry's
        // not-found branch clean up the KB doc.
        fireAndForget(strapi, `${uid} unpublish`, () => syncEntry(strapi as never, uid, documentId));
      }
    },
    afterDelete(event) {
      const uid = event.model.uid;
      const documentId = getDocumentId(event.result);
      // Entry is gone, so syncEntry's findOne returns null and triggers deletion.
      fireAndForget(strapi, `${uid} delete`, () => syncEntry(strapi as never, uid, documentId));
    },
  });

  strapi.log.info(`[elevenlabs-sync] lifecycle hooks armed for ${config.contentTypes.length} content type(s)`);
}
