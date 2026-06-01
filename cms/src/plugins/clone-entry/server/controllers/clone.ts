// Single POST /api/clone-entry/clone endpoint. Authenticates via the
// admin session (Strapi v5 admin uses session cookies for plugin
// content-api calls). Body: { uid, documentId }. Returns the new
// entry's documentId so the admin UI can redirect.

import type { Context } from 'koa';

interface CloneBody {
  uid?: string;
  documentId?: string;
}

export default {
  async clone(ctx: Context) {
    const { uid, documentId } = (ctx.request.body ?? {}) as CloneBody;
    if (!uid) return ctx.badRequest('Missing uid');
    if (!documentId) return ctx.badRequest('Missing documentId');

    const sanitizedUid = String(uid).trim();
    if (!/^api::[a-z0-9-]+\.[a-z0-9-]+$/.test(sanitizedUid)) {
      return ctx.badRequest('Invalid uid format');
    }

    const { cloneEntry } = (strapi as any).plugin('clone-entry').service('clone');
    try {
      const result = await cloneEntry(strapi, {
        uid: sanitizedUid,
        documentId: String(documentId),
        user: (ctx.state as any).user,
      });
      ctx.body = result;
    } catch (e) {
      const msg = (e as Error).message ?? String(e);
      strapi.log.warn(`[clone-entry] failed ${sanitizedUid}/${documentId}: ${msg}`);
      return ctx.internalServerError(msg);
    }
  },
};
