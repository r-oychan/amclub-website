/**
 * Sync orchestrator. Walks page entries (or single-type singletons), renders
 * them to markdown, pushes to ElevenLabs KB, attaches to the agent, and
 * tracks state in the elevenlabs-doc collection so subsequent runs can skip
 * unchanged entries via a hash-based delta check.
 */

import crypto from 'node:crypto';
import * as client from './client';
import {
  PLUGIN_ID,
  SYNC_LOG_UID,
  getEffectiveAllowList,
  getPluginConfig,
  getResolvedAgentId,
  getSiteUrl,
} from '../utils';
import { buildDeepPopulate } from './populate';
import { renderEntryMarkdown } from './markdown';
import { harvestFiles, type HarvestedFile } from './harvest';

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
  plugin: (id: string) => { config: <T>(key?: string) => T };
  store: (opts: { type: string; name: string }) => {
    get: (opts: { key: string }) => Promise<unknown>;
    set: (opts: { key: string; value: unknown }) => Promise<unknown>;
  };
};

interface DbQuery {
  findOne: (opts: { where: Record<string, unknown> }) => Promise<unknown>;
  findMany: (opts?: { where?: Record<string, unknown>; limit?: number; start?: number }) => Promise<unknown[]>;
  create: (opts: { data: Record<string, unknown> }) => Promise<unknown>;
  update: (opts: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
  delete: (opts: { where: Record<string, unknown> }) => Promise<unknown>;
  count: (opts?: { where?: Record<string, unknown> }) => Promise<number>;
}

interface SyncLogRow {
  id: number;
  sourceKind: 'page-entry' | 'media-file';
  contentType: string | null;
  entryId: number | null;
  mediaFileId: number | null;
  ownerContentType: string | null;
  ownerEntryId: number | null;
  elDocType: 'text' | 'file';
  elDocumentId: string;
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

function docPrefix(strapi: Strapi): string {
  return getPluginConfig(strapi as never).docNamePrefix;
}

function buildDocName(strapi: Strapi, uid: string, entry: Record<string, unknown> | null): string {
  const short = uid.replace(/^api::/, '').split('.')[0];
  const prefix = docPrefix(strapi);
  if (!entry) return `${prefix}${short}`;
  const slug = (entry.slug as string | undefined) ?? `id-${entry.id}`;
  return `${prefix}${short}:${slug}`;
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
  const agentId = getResolvedAgentId(strapi as never);
  if (!agentId) {
    strapi.log.warn(`[${PLUGIN_ID}] no agent id configured — skipping agent attachment`);
    return;
  }
  const allRows = (await strapi.db.query(SYNC_LOG_UID).findMany({})) as SyncLogRow[];
  const toLocator = (r: SyncLogRow): client.KnowledgeBaseLocator => ({
    id: r.elDocumentId,
    name: r.documentName,
    type: r.elDocType,
    usage_mode: 'auto',
  });
  let locators = allRows.map(toLocator);
  // Docs attached to the agent outside this plugin (no doc-name prefix, e.g.
  // the master FAQ repository) are not in the sync log — carry them over so
  // a sync doesn't silently detach them.
  const manual = await listManualAttachments(strapi, agentId, locators);
  try {
    await client.setAgentKnowledgeBase(strapi as never, agentId, [...manual, ...locators]);
  } catch (err) {
    // A single dead document id makes the whole PATCH 404. Verify each row
    // with a direct GET (authoritative — never the lagging search index),
    // drop rows whose doc is truly gone, and retry once with the survivors.
    strapi.log.warn(
      `[${PLUGIN_ID}] agent attach failed (${(err as Error).message.slice(0, 120)}) — validating sync-log rows`,
    );
    const alive: SyncLogRow[] = [];
    for (const r of allRows) {
      if (await client.docExists(strapi as never, r.elDocumentId)) {
        alive.push(r);
      } else {
        strapi.log.warn(
          `[${PLUGIN_ID}] dropping stale sync-log row "${r.documentName}" — remote doc ${r.elDocumentId} no longer exists`,
        );
        await deleteLogRow(strapi, r.id);
      }
    }
    locators = alive.map(toLocator);
    await client.setAgentKnowledgeBase(strapi as never, agentId, [...manual, ...locators]);
  }
  strapi.log.info(
    `[${PLUGIN_ID}] agent ${agentId} now references ${locators.length} synced + ${manual.length} manual doc(s)`,
  );
}

async function listManualAttachments(
  strapi: Strapi,
  agentId: string,
  synced: client.KnowledgeBaseLocator[],
): Promise<client.KnowledgeBaseLocator[]> {
  const prefix = docPrefix(strapi);
  const agent = await client.getAgent(strapi as never, agentId);
  const attached = agent.conversation_config?.agent?.prompt?.knowledge_base ?? [];
  return attached.filter((d) => !d.name.startsWith(prefix) && !synced.some((l) => l.id === d.id));
}

// ── Single-entry sync ────────────────────────────────────────────────

/**
 * Remove an entry from the ElevenLabs KB by uid + slug. Used by the
 * content-expiry cron (cms/src/index.ts) when an event/promotion passes
 * its date — Strapi still holds the entry (URL stays alive) but the KB
 * should drop it so the chatbot stops referencing expired info.
 * Idempotent: no-op when no log row exists for the doc name.
 */
export async function unsyncEntryBySlug(
  strapi: Strapi,
  uid: string,
  slug: string,
): Promise<SyncResult> {
  const docName = buildDocName(strapi, uid, { slug, id: 0 } as unknown as Record<string, unknown>);
  const existingRow = await getLogRowByName(strapi, docName);
  if (!existingRow) return { documentName: docName, status: 'skipped' };

  try { await client.deleteDoc(strapi as never, existingRow.elDocumentId); }
  catch (err) { strapi.log.warn(`[${PLUGIN_ID}] failed to delete remote doc ${existingRow.elDocumentId}: ${(err as Error).message}`); }
  await deleteLogRow(strapi, existingRow.id);
  await refreshAgentKnowledgeBase(strapi);
  return { documentName: docName, status: 'deleted' };
}

export async function syncEntry(strapi: Strapi, uid: string, documentId?: string): Promise<SyncResult> {
  const allow = await getEffectiveAllowList(strapi as never);
  if (!allow.includes(uid)) {
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

  const docName = buildDocName(strapi, uid, entry);
  const existingRow = await getLogRowByName(strapi, docName);

  if (!entry) {
    if (existingRow) {
      try { await client.deleteDoc(strapi as never, existingRow.elDocumentId); }
      catch (err) { strapi.log.warn(`[${PLUGIN_ID}] failed to delete remote doc ${existingRow.elDocumentId}: ${(err as Error).message}`); }
      await deleteLogRow(strapi, existingRow.id);
      await refreshAgentKnowledgeBase(strapi);
      return { documentName: docName, status: 'deleted' };
    }
    return { documentName: docName, status: 'skipped' };
  }

  const markdown = renderEntryMarkdown({ strapi, uid, entry, publicUrl: buildPublicUrl(strapi, uid, entry) });
  const hash = sha256(markdown);

  if (existingRow && existingRow.contentHash === hash) {
    return { documentName: docName, status: 'skipped', documentId: existingRow.elDocumentId };
  }

  if (existingRow) {
    try { await client.deleteDoc(strapi as never, existingRow.elDocumentId); }
    catch (err) { strapi.log.warn(`[${PLUGIN_ID}] failed to delete prior doc ${existingRow.elDocumentId}: ${(err as Error).message}`); }
  }

  const created = await client.createTextDoc(strapi as never, { text: markdown, name: docName });

  await upsertLogRow(strapi, {
    sourceKind: 'page-entry',
    contentType: uid,
    entryId: (entry.id as number) ?? null,
    mediaFileId: null,
    ownerContentType: null,
    ownerEntryId: null,
    elDocType: 'text',
    elDocumentId: created.id,
    documentName: docName,
    contentHash: hash,
    syncedAt: new Date().toISOString(),
  });

  await syncAttachedFiles(strapi, uid, entry);
  await refreshAgentKnowledgeBase(strapi);
  return { documentName: docName, status: existingRow ? 'updated' : 'created', documentId: created.id };
}

// ── PDF / file-doc syncing ───────────────────────────────────────────

async function syncAttachedFiles(strapi: Strapi, ownerUid: string, entry: Record<string, unknown>): Promise<void> {
  const files = await harvestFiles(strapi as never, ownerUid, entry);
  const ownerEntryId = (entry.id as number) ?? null;
  const fileNamesAfter = new Set<string>();

  for (const f of files) {
    try {
      const name = buildFileDocName(strapi, ownerUid, entry, f);
      fileNamesAfter.add(name);
      await syncOneFile(strapi, ownerUid, ownerEntryId, name, f);
    } catch (err) {
      strapi.log.warn(`[${PLUGIN_ID}] file ${f.name}: ${(err as Error).message}`);
    }
  }

  const ownedRows = (await strapi.db.query(SYNC_LOG_UID).findMany({
    where: { sourceKind: 'media-file', ownerContentType: ownerUid, ownerEntryId },
  })) as SyncLogRow[];
  for (const row of ownedRows) {
    if (fileNamesAfter.has(row.documentName)) continue;
    try { await client.deleteDoc(strapi as never, row.elDocumentId); }
    catch (err) { strapi.log.warn(`[${PLUGIN_ID}] failed to drop orphan ${row.elDocumentId}: ${(err as Error).message}`); }
    await deleteLogRow(strapi, row.id);
  }
}

async function syncOneFile(
  strapi: Strapi,
  ownerUid: string,
  ownerEntryId: number | null,
  documentName: string,
  file: HarvestedFile,
): Promise<void> {
  const fileHash = `${file.size}:${file.updatedAt}`;
  const existing = await getLogRowByName(strapi, documentName);
  if (existing && existing.contentHash === fileHash) return;

  if (existing) {
    try { await client.deleteDoc(strapi as never, existing.elDocumentId); }
    catch (err) { strapi.log.warn(`[${PLUGIN_ID}] failed to delete prior file doc ${existing.elDocumentId}: ${(err as Error).message}`); }
  }

  const buffer = await fetchUploadBuffer(file.url);
  const created = await client.createFileDoc(strapi as never, {
    file: buffer,
    filename: file.name,
    mime: file.mime,
    name: documentName,
  });

  await upsertLogRow(strapi, {
    sourceKind: 'media-file',
    contentType: null,
    entryId: null,
    mediaFileId: file.id,
    ownerContentType: ownerUid,
    ownerEntryId,
    elDocType: 'file',
    elDocumentId: created.id,
    documentName,
    contentHash: fileHash,
    syncedAt: new Date().toISOString(),
  });
}

async function fetchUploadBuffer(url: string): Promise<Buffer> {
  const absolute = url.startsWith('http') ? url : `http://localhost:${process.env.PORT ?? 1337}${url}`;
  const res = await fetch(absolute);
  if (!res.ok) throw new Error(`fetch ${absolute} → ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

function buildFileDocName(strapi: Strapi, ownerUid: string, entry: Record<string, unknown>, file: HarvestedFile): string {
  const short = ownerUid.replace(/^api::/, '').split('.')[0];
  const slug = (entry.slug as string | undefined) ?? `id-${entry.id}`;
  const baseName = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  return `${docPrefix(strapi)}${short}:${slug}:file:${baseName}`;
}

function buildPublicUrl(strapi: Strapi, uid: string, entry: Record<string, unknown>): string {
  const base = getSiteUrl(strapi as never);
  const slug = entry.slug as string | undefined;
  const short = uid.replace(/^api::/, '').split('.')[0];
  if (uid.endsWith('-page.' + uid.split('.').pop())) return `${base}/${short.replace(/-page$/, '')}`;
  if (slug) return `${base}/${short}/${slug}`;
  return `${base}/${short}`;
}

// ── Bulk operations ──────────────────────────────────────────────────

export async function syncAllDelta(strapi: Strapi): Promise<SyncResult[]> {
  const allow = await getEffectiveAllowList(strapi as never);
  const results: SyncResult[] = [];
  for (const uid of allow) {
    try {
      if (isSingleType(strapi, uid)) {
        results.push(await safeSync(strapi, uid));
        continue;
      }
      // findMany is OUTSIDE safeSync — if the populate object Strapi
      // sees is rejected by query validation (most common cause of
      // "Cannot read properties of undefined (reading 'attributes')"
      // in the bulk path), the whole loop dies before any individual
      // sync runs. Wrap the per-uid block so one bad content type
      // produces an error row instead of taking the whole job down.
      const populate = buildDeepPopulate(strapi, uid);
      const entries = (await strapi.documents(uid).findMany({ populate, status: 'published' })) as Array<{
        documentId?: string;
        id?: number;
      }>;
      for (const e of entries) {
        if (!e.documentId) continue;
        results.push(await safeSync(strapi, uid, e.documentId));
      }
    } catch (err) {
      const e = err as Error;
      strapi.log.error(
        `[${PLUGIN_ID}] syncAllDelta failed for content type ${uid}: ${e.message}\n${e.stack ?? ''}`,
      );
      results.push({ documentName: uid, status: 'error', error: `findMany ${uid}: ${e.message}` });
    }
  }
  return results;
}

async function safeSync(strapi: Strapi, uid: string, documentId?: string): Promise<SyncResult> {
  try {
    return await syncEntry(strapi, uid, documentId);
  } catch (err) {
    // Log full stack to container logs so we can chase failures that the
    // admin UI only surfaces as a one-liner. The compact `error` field
    // returned in the SyncResult is what the admin sees.
    const e = err as Error;
    strapi.log.error(
      `[${PLUGIN_ID}] syncEntry failed for ${uid}${documentId ? ':' + documentId : ''}: ${e.message}\n${e.stack ?? ''}`,
    );
    return {
      documentName: `${uid}${documentId ? ':' + documentId : ''}`,
      status: 'error',
      error: e.message,
    };
  }
}

export async function clearAll(strapi: Strapi): Promise<{ deleted: number }> {
  const prefix = docPrefix(strapi);
  const remote = await client.listDocsByPrefix(strapi as never, prefix);
  let deleted = 0;
  for (const doc of remote) {
    try { await client.deleteDoc(strapi as never, doc.id); deleted += 1; }
    catch (err) { strapi.log.warn(`[${PLUGIN_ID}] failed to delete ${doc.id}: ${(err as Error).message}`); }
  }
  const rows = (await strapi.db.query(SYNC_LOG_UID).findMany({})) as Array<{ id: number }>;
  for (const r of rows) await deleteLogRow(strapi, r.id);
  const agentId = getResolvedAgentId(strapi as never);
  if (agentId) {
    try {
      const manual = await listManualAttachments(strapi, agentId, []);
      await client.setAgentKnowledgeBase(strapi as never, agentId, manual);
    } catch (err) { strapi.log.warn(`[${PLUGIN_ID}] failed to clear agent KB: ${(err as Error).message}`); }
  }
  return { deleted };
}

export async function syncAllFull(strapi: Strapi): Promise<SyncResult[]> {
  await clearAll(strapi);
  return syncAllDelta(strapi);
}
