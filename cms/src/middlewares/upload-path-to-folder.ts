/**
 * Bridges the blob-path mechanism (cms/providers/upload-azure-folders)
 * to Strapi's Media Library admin folders. Without this, files uploaded
 * via the content API with a `path` field land in the right blob folder
 * BUT show up flat under "API Uploads" in the admin UI, because folder
 * organisation is a separate DB concept (`upload_folders` table).
 *
 * This middleware intercepts POST /api/upload. When the body carries a
 * `path` (e.g. `dining/restaurants`), it:
 *   1. Walks the path, creating Strapi folders for any missing segment.
 *   2. Sets `fileInfo.folder = <leafFolderId>` so the admin UI shows
 *      the file inside the matching folder hierarchy.
 *
 * The `path` field stays on the body — our upload-azure-folders provider
 * still reads it via metas.path for blob routing. Blob path and admin
 * folder stay in sync because they're both derived from the same input.
 */

import type { Context } from 'koa';

interface Folder {
  id: number;
  name: string;
  pathId: number;
  path: string;
}

const memoCache = new Map<string, number>();

async function nextPathId(strapi: any): Promise<number> {
  const rows = await strapi.db.query('plugin::upload.folder').findMany({
    select: ['pathId'],
    orderBy: { pathId: 'desc' },
    limit: 1,
  });
  return (rows[0]?.pathId ?? 0) + 1;
}

async function ensureFolder(strapi: any, fullPath: string): Promise<number | null> {
  const cacheKey = fullPath;
  const cached = memoCache.get(cacheKey);
  if (cached) return cached;

  const segments = fullPath.split('/').map((s) => s.trim()).filter(Boolean);
  if (segments.length === 0) return null;

  let parentId: number | null = null;
  let parentPath = '';
  for (const seg of segments) {
    // Strapi folder uniqueness is (name, parent). Need to query with
    // parent: null for top-level.
    const where: any = { name: seg };
    where.parent = parentId === null ? null : { id: parentId };
    let folder = (await strapi.db.query('plugin::upload.folder').findOne({ where })) as Folder | null;
    if (!folder) {
      const pathId = await nextPathId(strapi);
      const path = `${parentPath}/${pathId}`;
      folder = (await strapi.db.query('plugin::upload.folder').create({
        data: { name: seg, parent: parentId, pathId, path },
      })) as Folder;
    }
    parentId = folder.id;
    parentPath = folder.path;
  }
  if (parentId) memoCache.set(cacheKey, parentId);
  return parentId;
}

function patchFileInfo(body: any, folderId: number) {
  if (!body) return;
  const setOnObj = (obj: any) => {
    if (obj && typeof obj === 'object') obj.folder = folderId;
  };
  if (body.fileInfo === undefined || body.fileInfo === null) {
    body.fileInfo = { folder: folderId };
    return;
  }
  if (typeof body.fileInfo === 'string') {
    try {
      const parsed = JSON.parse(body.fileInfo);
      if (Array.isArray(parsed)) parsed.forEach(setOnObj);
      else setOnObj(parsed);
      body.fileInfo = JSON.stringify(parsed);
    } catch {
      // Not JSON — leave alone.
    }
  } else if (Array.isArray(body.fileInfo)) {
    body.fileInfo.forEach(setOnObj);
  } else {
    setOnObj(body.fileInfo);
  }
}

export default () => {
  return async (ctx: Context, next: () => Promise<any>) => {
    const isUploadPost =
      ctx.method === 'POST' && (ctx.path === '/api/upload' || ctx.path === '/api/upload/');
    if (!isUploadPost) return next();
    const body: any = (ctx.request as any).body;
    const pathStr = body?.path;
    if (typeof pathStr === 'string' && pathStr.length > 0) {
      try {
        const folderId = await ensureFolder(strapi, pathStr);
        if (folderId) patchFileInfo(body, folderId);
      } catch (e) {
        strapi.log.warn(`[upload-path-to-folder] ${(e as Error).message}`);
      }
    }
    await next();
  };
};
