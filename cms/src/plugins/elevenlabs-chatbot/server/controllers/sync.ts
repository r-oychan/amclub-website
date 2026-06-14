/**
 * Admin-scoped sync routes. Bulk operations run as background jobs so the
 * HTTP request returns instantly — Azure Container Apps' 240s gateway
 * timeout was previously killing long syncs and breaking the admin UI.
 *
 * Job state lives in module scope (single-replica deploy). GET /status
 * surfaces it so the admin UI can poll for progress.
 */

import {
  PLUGIN_ID,
  SYNC_LOG_UID,
  getEffectiveAllowList,
  getPluginConfig,
  getResolvedAgentId,
  getResolvedApiKey,
  listSyncableContentTypes,
} from '../utils';

interface Ctx {
  request: { body?: { uid?: string; documentId?: string; mode?: 'delta' | 'full' } };
  state: { user?: { id: number; email?: string } };
  badRequest: (msg: string) => void;
  body: unknown;
}

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
      // Always dump the full stack to container logs — the admin UI only
      // surfaces `error.message`, which loses the line/file of failures
      // happening above the per-entry safeSync wrapper.
      const e = err as Error;
      strapi.log.error(
        `[${PLUGIN_ID}] background job ${state.kind} crashed: ${e?.message ?? String(err)}\n${e?.stack ?? ''}`,
      );
      currentJob = {
        ...state,
        error: e?.message ?? String(err),
        finishedAt: new Date().toISOString(),
      };
    });
  return state;
}

interface StrapiArg { strapi: unknown }

export default ({ strapi: _ }: StrapiArg) => ({
  async syncEntry(ctx: Ctx): Promise<void> {
    const { uid, documentId } = ctx.request.body ?? {};
    if (!uid) return ctx.badRequest('uid is required');
    try {
      const sync = strapi.plugin(PLUGIN_ID).service('sync') as {
        syncEntry: (s: unknown, u: string, d?: string) => Promise<unknown>;
      };
      const result = await sync.syncEntry(strapi, uid, documentId);
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
    const sync = strapi.plugin(PLUGIN_ID).service('sync') as {
      syncAllDelta: (s: unknown) => Promise<Array<{ status: string }>>;
      syncAllFull: (s: unknown) => Promise<Array<{ status: string }>>;
    };
    const fn = mode === 'full' ? sync.syncAllFull : sync.syncAllDelta;
    const job = startJob({ kind: 'sync-all', mode, startedAt: new Date().toISOString() }, async () => {
      const results = await fn(strapi);
      const counts = results.reduce<Record<string, number>>((acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1;
        return acc;
      }, {});
      strapi.log.info(`[${PLUGIN_ID}] sync-all (${mode}) complete: ${JSON.stringify(counts)}`);
      return { counts };
    });
    ctx.body = { started: true, job };
  },

  clearAll(ctx: Ctx): void {
    if (currentJob && !currentJob.finishedAt) {
      ctx.body = { started: false, reason: 'Another sync job is already running', current: currentJob };
      return;
    }
    const sync = strapi.plugin(PLUGIN_ID).service('sync') as {
      clearAll: (s: unknown) => Promise<{ deleted: number }>;
    };
    const job = startJob({ kind: 'clear-all', startedAt: new Date().toISOString() }, async () => {
      const r = await sync.clearAll(strapi);
      strapi.log.info(`[${PLUGIN_ID}] cleared ${r.deleted} doc(s)`);
      return { deleted: r.deleted };
    });
    ctx.body = { started: true, job };
  },

  async status(ctx: Ctx): Promise<void> {
    const rows = await strapi.db.query(SYNC_LOG_UID).findMany({});
    const cfg = getPluginConfig(strapi as never);
    const allow = await getEffectiveAllowList(strapi as never);
    ctx.body = {
      configured: {
        agentIdSet: !!getResolvedAgentId(strapi as never),
        apiKeySet: !!getResolvedApiKey(strapi as never),
        contentTypes: allow,
        docNamePrefix: cfg.docNamePrefix,
        autoSyncOnPublish: cfg.autoSyncOnPublish,
      },
      availableContentTypes: listSyncableContentTypes(strapi as never),
      docs: rows,
      job: currentJob,
    };
  },
});
