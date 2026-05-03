/**
 * Controllers for the admin-scoped sync routes. Bulk operations run as
 * background jobs so the HTTP request returns instantly — Azure Container
 * Apps' default 240s gateway timeout was killing long syncs and returning
 * an HTML error page that broke the admin UI's JSON parser.
 *
 * Job state lives in module scope (single-replica deploy, persistence
 * across container restarts isn't needed — the user just retries). The
 * GET /status endpoint surfaces it so the admin UI can poll for progress.
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

interface JobState {
  kind: 'sync-all' | 'clear-all';
  mode?: 'delta' | 'full';
  startedAt: string;
  finishedAt?: string;
  counts?: Record<string, number>;
  deleted?: number;
  error?: string;
}

let currentJob: JobState | null = null;

function startJob(state: JobState, runner: () => Promise<Partial<JobState>>): JobState {
  currentJob = state;
  void runner()
    .then((result) => {
      currentJob = { ...state, ...result, finishedAt: new Date().toISOString() };
    })
    .catch((err: unknown) => {
      currentJob = {
        ...state,
        error: err instanceof Error ? err.message : String(err),
        finishedAt: new Date().toISOString(),
      };
    });
  return state;
}

export default {
  async syncEntry(ctx: Ctx): Promise<void> {
    const { uid, documentId } = ctx.request.body ?? {};
    if (!uid) return ctx.badRequest('uid is required');
    try {
      const result = await syncService.syncEntry(strapi as never, uid, documentId);
      ctx.body = result;
    } catch (err) {
      ctx.body = { status: 'error', documentName: uid, error: (err as Error).message };
    }
  },

  syncAll(ctx: Ctx): void {
    if (currentJob && !currentJob.finishedAt) {
      ctx.body = { started: false, reason: 'Another sync job is already running', current: currentJob };
      return;
    }
    const mode = ctx.request.body?.mode ?? 'delta';
    const fn = mode === 'full' ? syncService.syncAllFull : syncService.syncAllDelta;
    const job = startJob({ kind: 'sync-all', mode, startedAt: new Date().toISOString() }, async () => {
      const results = await fn(strapi as never);
      const counts = results.reduce<Record<string, number>>((acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1;
        return acc;
      }, {});
      strapi.log.info(`[elevenlabs-sync] sync-all (${mode}) complete: ${JSON.stringify(counts)}`);
      return { counts };
    });
    ctx.body = { started: true, job };
  },

  clearAll(ctx: Ctx): void {
    if (currentJob && !currentJob.finishedAt) {
      ctx.body = { started: false, reason: 'Another sync job is already running', current: currentJob };
      return;
    }
    const job = startJob({ kind: 'clear-all', startedAt: new Date().toISOString() }, async () => {
      const r = await syncService.clearAll(strapi as never);
      strapi.log.info(`[elevenlabs-sync] cleared ${r.deleted} doc(s)`);
      return { deleted: r.deleted };
    });
    ctx.body = { started: true, job };
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
      job: currentJob,
    };
  },
};
