/**
 * Controllers for the admin-scoped sync routes. Thin wrappers around the
 * sync service in `services/elevenlabs-sync/`. The global `strapi` is
 * injected by the Strapi runtime and typed via @strapi/types.
 */

import * as syncService from '../../../services/elevenlabs-sync';
import { config } from '../../../services/elevenlabs-sync/config';

interface Ctx {
  request: { body?: { uid?: string; documentId?: string; mode?: 'delta' | 'full' } };
  state: { user?: { id: number; email?: string } };
  badRequest: (msg: string) => void;
  body: unknown;
}

const SYNC_LOG_UID = 'api::elevenlabs-doc.elevenlabs-doc';

export default {
  async syncEntry(ctx: Ctx): Promise<void> {
    const { uid, documentId } = ctx.request.body ?? {};
    if (!uid) return ctx.badRequest('uid is required');
    const result = await syncService.syncEntry(strapi as never, uid, documentId);
    ctx.body = result;
  },

  async syncAll(ctx: Ctx): Promise<void> {
    const mode = ctx.request.body?.mode ?? 'delta';
    const fn = mode === 'full' ? syncService.syncAllFull : syncService.syncAllDelta;
    const results = await fn(strapi as never);
    const counts = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {});
    ctx.body = { mode, counts, results };
  },

  async clearAll(ctx: Ctx): Promise<void> {
    const result = await syncService.clearAll(strapi as never);
    ctx.body = result;
  },

  async status(ctx: Ctx): Promise<void> {
    const rows = await strapi.db.query(SYNC_LOG_UID).findMany({});
    ctx.body = {
      configured: {
        agentIdSet: !!process.env[config.agentIdEnv],
        apiKeySet: !!process.env[config.apiKeyEnv],
        contentTypes: config.contentTypes,
        docNamePrefix: config.docNamePrefix,
      },
      docs: rows,
    };
  },
};
