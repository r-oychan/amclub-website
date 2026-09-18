/**
 * Accepts EITHER an admin session OR a Strapi API token.
 *
 * The plugin's routes previously took admin sessions only, so the sync could be
 * driven from the settings page and nowhere else — no curl, no CI, no scripted
 * verification. That is also why the only automated path was the cron.
 *
 * Auth precedence: admin session first (so the settings page keeps working and
 * keeps its 401-on-expiry refresh behaviour), then a Strapi API token.
 *
 * ── Why not simply drop `auth: false` and let Strapi's api-token strategy run?
 * Because these are content-api routes and that strategy rejects admin session
 * JWTs, which would break the admin UI. Validating both by hand is what lets
 * one route serve both callers.
 *
 * ── Token rules
 * Tokens are long-lived and revocable only in /admin, so scope is deliberately
 * narrow. `config.write` routes require a FULL-ACCESS token; read routes accept
 * any valid token. `custom` tokens cannot express plugin-route permissions —
 * they are not in the content-api permission registry — so they count as
 * read-only here rather than silently granting more than the operator chose.
 *
 * The genuinely destructive routes (clear-all, PUT /settings) keep the
 * session-only `is-admin` policy: a leaked token must not be able to wipe the
 * knowledge base or flip settings.
 */

import { errors } from '@strapi/utils';
import { bearerToken, tryAdminSession } from './is-admin';

const { UnauthorizedError } = errors;

interface PolicyContext {
  request: { header: Record<string, string | undefined> };
  state: { user?: unknown; apiToken?: unknown };
}

interface ApiTokenRow {
  id: number;
  name?: string;
  type?: string;
  expiresAt?: string | null;
}

interface ApiTokenService {
  hash: (accessKey: string) => string;
  getByAccessKey: (hash: string) => Promise<ApiTokenRow | null>;
}

interface StrapiWithTokens {
  service: (uid: string) => ApiTokenService | undefined;
}

/** Config shape supplied per-route: `{ write: true }` on mutating endpoints. */
interface PolicyConfig {
  write?: boolean;
}

export default async function isAdminOrTokenPolicy(
  ctx: PolicyContext,
  config?: PolicyConfig,
): Promise<boolean> {
  // 1. Admin session (the settings page).
  const session = await tryAdminSession(ctx);
  if (session.ok) {
    ctx.state.user = session.user;
    return true;
  }
  // A valid session on a deactivated account is a real authorization failure —
  // do not let it fall through and retry as a token.
  if (session.deactivated) return false;

  // 2. Strapi API token (automation).
  const token = bearerToken(ctx);
  if (!token) throw new UnauthorizedError('Missing credentials — send an admin session or API token');

  const svc = (globalThis as unknown as { strapi: StrapiWithTokens }).strapi.service(
    'admin::api-token-content-api',
  );
  if (!svc) throw new UnauthorizedError('API token service unavailable');

  const row = await svc.getByAccessKey(svc.hash(token));
  if (!row) throw new UnauthorizedError('Invalid admin session token or API token');

  if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
    throw new UnauthorizedError('API token expired');
  }

  // Authenticated, but a read-only/custom token may not mutate the KB → 403.
  if (config?.write && row.type !== 'full-access') return false;

  ctx.state.apiToken = row;
  return true;
}
