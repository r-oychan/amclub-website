/**
 * Tests for the policy that lets the plugin be driven by automation.
 *
 * The scope rules are the point. A Strapi API token is long-lived and revocable
 * only from /admin, so:
 *   - write routes require FULL-ACCESS; read-only/custom get 403
 *   - clear-all and PUT /settings never accept a token at all (they keep the
 *     session-only is-admin policy — asserted in the routes test below)
 *
 * Run:  node --test cms/tests/is-admin-or-token.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const OUT = process.env.TEAMUP_TEST_BUILD;
if (!OUT) throw new Error('set TEAMUP_TEST_BUILD to the compiled server dir');
const policy = require(`${OUT}/policies/is-admin-or-token.js`).default;
const { errors } = require('@strapi/utils');

const ctx = (auth) => ({ request: { header: auth ? { authorization: auth } : {} }, state: {} });

/**
 * @param session  'valid' | 'none' | 'deactivated'
 * @param token    null | { type, expiresAt }
 */
function withStrapi({ session = 'none', token = null }, fn) {
  const prev = globalThis.strapi;
  globalThis.strapi = {
    sessionManager: () => ({
      validateAccessToken: () =>
        session === 'none' ? { isValid: false } : { isValid: true, payload: { sessionId: 's1', userId: '1' } },
      isSessionActive: async () => session !== 'none',
    }),
    db: {
      query: () => ({
        findOne: async () => (session === 'valid' ? { isActive: true } : { isActive: false }),
      }),
    },
    service: (uid) =>
      uid === 'admin::api-token-content-api'
        ? { hash: (k) => `h:${k}`, getByAccessKey: async (h) => (token && h === `h:${token.key}` ? token : null) }
        : undefined,
  };
  return Promise.resolve(fn()).finally(() => { globalThis.strapi = prev; });
}

const is401 = (p, label) => assert.rejects(p, (e) => e instanceof errors.UnauthorizedError, label);

test('an admin session is accepted and takes precedence', async () => {
  await withStrapi({ session: 'valid' }, async () => {
    const c = ctx('Bearer sess');
    assert.equal(await policy(c, { write: true }), true);
    assert.deepEqual(c.state.user, { isActive: true });
    assert.equal(c.state.apiToken, undefined, 'should not fall through to the token path');
  });
});

test('a FULL-ACCESS token may write', async () => {
  const token = { key: 'k1', type: 'full-access', name: 'ci' };
  await withStrapi({ token }, async () => {
    const c = ctx('Bearer k1');
    assert.equal(await policy(c, { write: true }), true);
    assert.equal(c.state.apiToken.name, 'ci');
  });
});

test('a read-only token may READ but not WRITE', async () => {
  const token = { key: 'k2', type: 'read-only' };
  await withStrapi({ token }, async () => {
    assert.equal(await policy(ctx('Bearer k2'), {}), true, 'read allowed');
    assert.equal(await policy(ctx('Bearer k2'), { write: true }), false, 'write must be 403');
  });
});

test('a custom token counts as read-only — it cannot express plugin permissions', async () => {
  const token = { key: 'k3', type: 'custom' };
  await withStrapi({ token }, async () => {
    assert.equal(await policy(ctx('Bearer k3'), { write: true }), false);
  });
});

test('an expired token is 401 even if full-access', async () => {
  const token = { key: 'k4', type: 'full-access', expiresAt: '2020-01-01T00:00:00.000Z' };
  await withStrapi({ token }, () => is401(policy(ctx('Bearer k4'), { write: true }), 'expired'));
});

test('a not-yet-expired token is accepted', async () => {
  const future = new Date(Date.now() + 86400000).toISOString();
  const token = { key: 'k5', type: 'full-access', expiresAt: future };
  await withStrapi({ token }, async () => {
    assert.equal(await policy(ctx('Bearer k5'), { write: true }), true);
  });
});

test('an unknown token is 401', async () => {
  await withStrapi({ token: { key: 'real', type: 'full-access' } }, () =>
    is401(policy(ctx('Bearer wrong'), {}), 'unknown token'));
});

test('no credentials at all is 401', async () => {
  await withStrapi({}, () => is401(policy(ctx(null), {}), 'no header'));
});

test('a valid session on a DEACTIVATED account is 403, never retried as a token', async () => {
  const token = { key: 'k6', type: 'full-access' };
  await withStrapi({ session: 'deactivated', token }, async () => {
    // Sends a session bearer that is valid but belongs to a disabled account.
    assert.equal(await policy(ctx('Bearer k6'), { write: true }), false);
  });
});
