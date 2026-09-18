/**
 * Validates an admin session token on a content-api route.
 *
 * The /api/* route pool doesn't include the 'admin' strategy, so the
 * usual auth.strategies: ['admin'] route-config fails. This policy
 * pairs with `auth: false` on the route to manually verify the bearer
 * via strapi.sessionManager('admin').
 *
 * ── Why this throws instead of returning false ──
 *
 * A policy that returns `false` becomes a PolicyError, which Strapi maps to
 * HTTP 403 (see @strapi/core/services/server/policy.js). That is the wrong
 * status for an *expired* token, and it silently breaks the admin UI:
 * Strapi's own fetch client only refreshes the access token on a **401**
 * (@strapi/admin .../utils/getFetchClient.js — "Only attempt refresh for 401
 * errors on non-auth paths"). Admin access tokens last 30 minutes by default
 * (accessTokenLifespan, admin bootstrap). So on a 403 the client never
 * refreshes: core Strapi routes keep working while every plugin route starts
 * failing, and the page looks broken until a manual reload + re-login.
 *
 * So: authentication problems (absent, malformed, expired or revoked
 * credentials) throw UnauthorizedError → 401 → the client refreshes and
 * transparently retries. Only a genuine *authorization* failure — a valid
 * session belonging to a deactivated account, where retrying cannot help —
 * returns false → 403.
 */

import { errors } from '@strapi/utils';

const { UnauthorizedError } = errors;

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
  if (!auth) throw new UnauthorizedError('Missing admin session token');

  const parts = auth.split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    throw new UnauthorizedError('Malformed Authorization header — expected "Bearer <token>"');
  }
  const token = parts[1];

  // Reached via globalThis (not the bare `strapi` global) so this file also
  // compiles standalone in the test harness, which has no Strapi ambient types.
  const s = (globalThis as unknown as { strapi: StrapiWithSessions }).strapi;
  if (!s.sessionManager) throw new UnauthorizedError('Session manager unavailable');

  const result = s.sessionManager('admin').validateAccessToken(token);
  if (!result.isValid || !result.payload) {
    // Covers an expired access token, which is by far the common case.
    throw new UnauthorizedError('Admin session token is invalid or expired');
  }

  const active = await s.sessionManager('admin').isSessionActive(result.payload.sessionId);
  if (!active) throw new UnauthorizedError('Admin session is no longer active — please sign in again');

  const rawUserId = result.payload.userId;
  const numericUserId = Number(rawUserId);
  const userId =
    Number.isFinite(numericUserId) && String(numericUserId) === rawUserId ? numericUserId : rawUserId;

  const user = (await s.db.query('admin::user').findOne({ where: { id: userId } })) as
    | { isActive?: boolean }
    | null;

  // Authenticated but not permitted: a refresh would change nothing, so 403.
  if (!user || user.isActive !== true) return false;

  ctx.state.user = user;
  return true;
}
