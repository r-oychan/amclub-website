/**
 * Phase 1 sync orchestrator. Walks page entries, renders to markdown,
 * pushes to ElevenLabs KB, attaches to the agent, and tracks state in
 * the `elevenlabs-doc` collection so future runs can skip unchanged
 * entries via a hash-based delta check.
 *
 * Exposes:
 *   syncEntry(uid, entryId) — sync one entry (entryId undefined for singletons)
 *   syncAllDelta()          — sync everything in config.contentTypes that's changed
 *   syncAllFull()           — wipe all am-club:* docs and re-sync everything
 *   clearAll()              — wipe all am-club:* docs (and the local log)
 */

import crypto from 'node:crypto';
import * as client from './client';
import { config, getAgentId, getSiteUrl } from './config';
import { buildDeepPopulate } from './populate';
import { renderEntryMarkdown } from './markdown';

type Strapi = {
  contentTypes: Record<string, { kind?: 'singleType' | 'collectionType'; info?: { singularName?: string } }>;
  components: Record<string, unknown>;
  documents: (uid: string) => {
    findFirst: (opts?: { populate?: unknown; status?: string }) => Promise<unknown>;
    findOne: (opts: { documentId: string; populate?: unknown; status?: string }) => Promise<unknown>;
    findMany: (opts?: { populate?: unknown; status?: string; limit?: number; start?: number }) => Promise<unknown[]>;
  };
  db: { query: (uid: string) => DbQuery };
  log: { info: (...args: unknown[]) => void; warn: (...args: unknown[]) => void; error: (...args: unknown[]) => void };
};

interface DbQuery {
  findOne: (opts: { where: Record<string, unknown> }) => Promise<unknown>;
  findMany: (opts?: { where?: Record<string, unknown>; limit?: number; start?: number }) => Promise<unknown[]>;
  create: (opts: { data: Record<string, unknown> }) => Promise<unknown>;
  update: (opts: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
  delete: (opts: { where: Record<string, unknown> }) => Promise<unknown>;
  count: (opts?: { where?: Record<string, unknown> }) => Promise<number>;
}

const SYNC_LOG_UID = 'api::elevenlabs-doc.elevenlabs-doc';

interface SyncLogRow {
  id: number;
  sourceKind: 'page-entry' | 'media-file';
  contentType: string | null;
  entryId: number | null;
  mediaFileId: number | null;
  ownerContentType: string | null;
  ownerEntryId: number | null;
  elDocType: 'text' | 'file';
  documentId: string;
  documentName: string;
  contentHash: string | null;
  syncedAt: string;
}

export interface SyncResult {
  documentName: string;
  status: 'created' | 'updated' | 'skipped' | 'deleted' | 'error';
  documentId?: string;
  error?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function buildDocName(uid: string, entry: Record<string, unknown> | null): string {
  const short = uid.replace(/^api::/, '').split('.')[0];
  if (!entry) return `${config.docNamePrefix}${short}`;
  const slug = (entry.slug as string | undefined) ?? `id-${entry.id}`;
  return `${config.docNamePrefix}${short}:${slug}`;
}

function isSingleType(strapi: Strapi, uid: string): boolean {
  return strapi.contentTypes[uid]?.kind === 'singleType';
}

async function getLogRowByName(strapi: Strapi, documentName: string): Promise<SyncLogRow | null> {
  const row = (await strapi.db.query(SYNC_LOG_UID).findOne({ where: { documentName } })) as SyncLogRow | null;
  return row ?? null;
}

async function deleteLogRow(strapi: Strapi, id: number): Promise<void> {
  await strapi.db.query(SYNC_LOG_UID).delete({ where: { id } });
}

async function upsertLogRow(strapi: Strapi, data: Omit<SyncLogRow, 'id'>): Promise<void> {
  const existing = await getLogRowByName(strapi, data.documentName);
  if (existing) {
    await strapi.db.query(SYNC_LOG_UID).update({ where: { id: existing.id }, data });
  } else {
    await strapi.db.query(SYNC_LOG_UID).create({ data });
  }
}

// ── Agent attachment ─────────────────────────────────────────────────

async function refreshAgentKnowledgeBase(strapi: Strapi): Promise<void> {
  const agentId = getAgentId();
  const allRows = (await strapi.db.query(SYNC_LOG_UID).findMany({})) as SyncLogRow[];
  const locators: client.KnowledgeBaseLocator[] = allRows.map((r) => ({
    id: r.documentId,
    name: r.documentName,
    type: r.elDocType,
    usage_mode: 'auto',
  }));
  await client.setAgentKnowledgeBase(agentId, locators);
  strapi.log.info(`[elevenlabs-sync] agent ${agentId} now references ${locators.length} doc(s)`);
}

// ── Single-entry sync (text only for Phase 1) ────────────────────────

export async function syncEntry(strapi: Strapi, uid: string, documentId?: string): Promise<SyncResult> {
  if (!config.contentTypes.includes(uid as never)) {
    return { documentName: uid, status: 'error', error: `Content type not in sync allow-list: ${uid}` };
  }

  const populate = buildDeepPopulate(strapi, uid);
  let entry: Record<string, unknown> | null = null;

  if (isSingleType(strapi, uid)) {
    entry = (await strapi.documents(uid).findFirst({ populate, status: 'published' })) as Record<string, unknown> | null;
  } else if (documentId) {
    entry = (await strapi.documents(uid).findOne({ documentId, populate, status: 'published' })) as Record<string, unknown> | null;
  } else {
    return { documentName: uid, status: 'error', error: 'documentId required for collection entries' };
  }

  const docName = buildDocName(uid, entry);
  const existingRow = await getLogRowByName(strapi, docName);

  if (!entry) {
    // Entry not published / deleted — clean up if we have a record.
    if (existingRow) {
      try {
        await client.deleteDoc(existingRow.documentId);
      } catch (err) {
        strapi.log.warn(`[elevenlabs-sync] failed to delete remote doc ${existingRow.documentId}: ${(err as Error).message}`);
      }
      await deleteLogRow(strapi, existingRow.id);
      await refreshAgentKnowledgeBase(strapi);
      return { documentName: docName, status: 'deleted' };
    }
    return { documentName: docName, status: 'skipped' };
  }

  const markdown = renderEntryMarkdown({ strapi, uid, entry, publicUrl: buildPublicUrl(uid, entry) });
  const hash = sha256(markdown);

  if (existingRow && existingRow.contentHash === hash) {
    return { documentName: docName, status: 'skipped', documentId: existingRow.documentId };
  }

  // Delete prior remote doc (if any), then create fresh.
  if (existingRow) {
    try {
      await client.deleteDoc(existingRow.documentId);
    } catch (err) {
      strapi.log.warn(`[elevenlabs-sync] failed to delete prior doc ${existingRow.documentId}: ${(err as Error).message}`);
    }
  }

  const created = await client.createTextDoc({ text: markdown, name: docName });

  await upsertLogRow(strapi, {
    sourceKind: 'page-entry',
    contentType: uid,
    entryId: (entry.id as number) ?? null,
    mediaFileId: null,
    ownerContentType: null,
    ownerEntryId: null,
    elDocType: 'text',
    documentId: created.id,
    documentName: docName,
    contentHash: hash,
    syncedAt: new Date().toISOString(),
  });

  await refreshAgentKnowledgeBase(strapi);
  return { documentName: docName, status: existingRow ? 'updated' : 'created', documentId: created.id };
}

function buildPublicUrl(uid: string, entry: Record<string, unknown>): string {
  const base = getSiteUrl();
  const slug = entry.slug as string | undefined;
  const short = uid.replace(/^api::/, '').split('.')[0];
  // Heuristic — matches the Phase 1 frontend route shape. Phase 2 plugin
  // would let consumers configure the route mapping.
  if (uid.endsWith('-page.' + uid.split('.').pop())) return `${base}/${short.replace(/-page$/, '')}`;
  if (slug) return `${base}/${short}/${slug}`;
  return `${base}/${short}`;
}

// ── Bulk operations ──────────────────────────────────────────────────

export async function syncAllDelta(strapi: Strapi): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  for (const uid of config.contentTypes) {
    if (isSingleType(strapi, uid)) {
      results.push(await safeSync(strapi, uid));
    } else {
      const populate = buildDeepPopulate(strapi, uid);
      const entries = (await strapi.documents(uid).findMany({ populate, status: 'published' })) as Array<{
        documentId?: string;
        id?: number;
      }>;
      for (const e of entries) {
        if (!e.documentId) continue;
        results.push(await safeSync(strapi, uid, e.documentId));
      }
    }
  }
  return results;
}

async function safeSync(strapi: Strapi, uid: string, documentId?: string): Promise<SyncResult> {
  try {
    return await syncEntry(strapi, uid, documentId);
  } catch (err) {
    return { documentName: `${uid}${documentId ? ':' + documentId : ''}`, status: 'error', error: (err as Error).message };
  }
}

export async function clearAll(strapi: Strapi): Promise<{ deleted: number }> {
  const remote = await client.listDocsByPrefix(config.docNamePrefix);
  let deleted = 0;
  for (const doc of remote) {
    try {
      await client.deleteDoc(doc.id);
      deleted += 1;
    } catch (err) {
      strapi.log.warn(`[elevenlabs-sync] failed to delete ${doc.id}: ${(err as Error).message}`);
    }
  }
  // Wipe local log.
  const rows = (await strapi.db.query(SYNC_LOG_UID).findMany({})) as Array<{ id: number }>;
  for (const r of rows) await deleteLogRow(strapi, r.id);
  // Detach everything from the agent.
  try {
    await client.setAgentKnowledgeBase(getAgentId(), []);
  } catch (err) {
    strapi.log.warn(`[elevenlabs-sync] failed to clear agent KB: ${(err as Error).message}`);
  }
  return { deleted };
}

export async function syncAllFull(strapi: Strapi): Promise<SyncResult[]> {
  await clearAll(strapi);
  return syncAllDelta(strapi);
}
