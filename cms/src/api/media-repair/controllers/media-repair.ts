// Repair endpoint — bypasses Strapi v5's REST PUT path (where newly-added
// top-level media field relations silently fail to persist on this DB) by
// invoking the internal Documents API directly.
//
// POST /api/media-repair/attach
//   body: { uid: string, field: string, fileIds: number[], status?: 'draft'|'published' }
//
// Always targets the singletype's first entry (Strapi's singleton). Returns
// the updated document with the field populated, so a follow-up GET via the
// public API can confirm the morph was written.

interface Ctx {
  request: { body?: { uid?: string; field?: string; fileIds?: unknown; status?: string } };
  badRequest: (msg: string) => void;
  notFound: (msg: string) => void;
  internalServerError: (msg: string) => void;
  body: unknown;
}

export default {
  async health(ctx: Ctx) {
    ctx.body = { ok: true, ts: new Date().toISOString() };
  },

  async attach(ctx: Ctx) {
    const { uid, field, fileIds, status } = ctx.request.body ?? {};
    if (!uid || typeof uid !== 'string') return ctx.badRequest('uid (string) required');
    if (!field || typeof field !== 'string') return ctx.badRequest('field (string) required');
    if (!Array.isArray(fileIds)) return ctx.badRequest('fileIds (number[]) required');
    const ids = fileIds.map((x) => Number(x)).filter((n) => Number.isFinite(n));
    if (!ids.length) return ctx.badRequest('fileIds must be a non-empty number array');

    // strapi.documents() is the Strapi v5 internal API. It handles morph
    // relations differently from the REST controller (which is where the bug
    // lives). If this writes the morph rows correctly, we have a workaround.
    const strapi = (globalThis as any).strapi;
    const docs = strapi.documents(uid as any);

    // For singletypes there's exactly one entry; findFirst() returns it.
    const existing = await docs.findFirst({ status: status === 'draft' ? 'draft' : 'published' });
    if (!existing) return ctx.notFound(`no entry found for ${uid}`);

    try {
      const updated = await docs.update({
        documentId: existing.documentId,
        data: { [field]: ids } as Record<string, number[]>,
        status: status === 'draft' ? 'draft' : 'published',
        populate: { [field]: true },
      });
      ctx.body = {
        ok: true,
        uid,
        documentId: existing.documentId,
        field,
        requestedIds: ids,
        // Whatever shape Strapi gave back for this field — caller can inspect.
        result: (updated as Record<string, unknown>)?.[field] ?? null,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      strapi.log.error(`[media-repair] update ${uid}.${field} failed: ${msg}`);
      return ctx.internalServerError(msg);
    }
  },
};
