/**
 * Re-implementation of the same session-validation policy used by
 * elevenlabs-chatbot. The /api/* route pool doesn't include the 'admin'
 * strategy, so we manually verify the bearer via strapi.sessionManager.
 * Once both plugins ship together stably this could move into a shared
 * utility — kept inline for plugin isolation today.
 */

interface PolicyContext {
  request: { header: Record<string, string | undefined> };
  state: { user?: unknown };
}

interface StrapiWithSessions {
  sessionManager?: (scope: string) => {
    validateAccessToken: (t: string) => { isValid: boolean; payload?: { sessionId: string; userId: string } };
    isSessionActive: (sid: string) => Promise<boolean>;
  };
  db: { query: (uid: string) => { findOne: (opts: { where: Record<string, unknown> }) => Promise<unknown> } };
}

export default async function isAdminPolicy(ctx: PolicyContext): Promise<boolean> {
  const auth = ctx.request.header.authorization;
  if (!auth) return false;
  const parts = auth.split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return false;
  const token = parts[1];

  const s = strapi as unknown as StrapiWithSessions;
  if (!s.sessionManager) return false;
  const result = s.sessionManager('admin').validateAccessToken(token);
  if (!result.isValid || !result.payload) return false;

  const active = await s.sessionManager('admin').isSessionActive(result.payload.sessionId);
  if (!active) return false;

  const rawUserId = result.payload.userId;
  const numericUserId = Number(rawUserId);
  const userId =
    Number.isFinite(numericUserId) && String(numericUserId) === rawUserId ? numericUserId : rawUserId;

  const user = (await s.db.query('admin::user').findOne({ where: { id: userId } })) as
    | { isActive?: boolean }
    | null;
  if (!user || user.isActive !== true) return false;

  ctx.state.user = user;
  return true;
}
