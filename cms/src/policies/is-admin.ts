/**
 * Custom policy that gates a content-api route on the admin session token,
 * mirroring what @strapi/admin's `admin` auth strategy does internally.
 *
 * Needed because Strapi's per-route `auth.strategies: ['admin']` only
 * resolves strategies from the route's own `type` pool — and content-api
 * routes don't have 'admin' in that pool. Without this, every call from
 * the admin UI to a /api/* route returns 401 even with a valid bearer.
 */

interface PolicyContext {
  request: { header: Record<string, string | undefined> };
  state: { user?: unknown };
}

export default async function isAdminPolicy(ctx: PolicyContext): Promise<boolean> {
  const auth = ctx.request.header.authorization;
  if (!auth) return false;
  const parts = auth.split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return false;
  const token = parts[1];

  const sm = (strapi as unknown as { sessionManager?: (scope: string) => { validateAccessToken: (t: string) => { isValid: boolean; payload?: { sessionId: string; userId: string } }; isSessionActive: (sid: string) => Promise<boolean> } }).sessionManager;
  if (!sm) return false;
  const result = sm('admin').validateAccessToken(token);
  if (!result.isValid || !result.payload) return false;

  const active = await sm('admin').isSessionActive(result.payload.sessionId);
  if (!active) return false;

  const rawUserId = result.payload.userId;
  const numericUserId = Number(rawUserId);
  const userId = Number.isFinite(numericUserId) && String(numericUserId) === rawUserId ? numericUserId : rawUserId;

  const user = await strapi.db.query('admin::user').findOne({ where: { id: userId } });
  if (!user || user.isActive !== true) return false;

  ctx.state.user = user;
  return true;
}
