/**
 * Tests for the admin-session policy guarding the plugin's /api routes.
 *
 * The status code is the whole point, not a detail. Strapi's admin fetch
 * client refreshes an expired access token ONLY on a 401
 * (@strapi/admin .../utils/getFetchClient.js). A policy that returns `false`
 * yields a PolicyError → 403, so an expired token — which happens every 30
 * minutes, the default accessTokenLifespan — used to kill the settings page
 * until a manual reload. Authentication failures must therefore THROW
 * UnauthorizedError (401); only a genuine authorization failure returns false.
 *
 * Run:  node --test cms/tests/is-admin-policy.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const OUT = process.env.TEAMUP_TEST_BUILD;
if (!OUT) throw new Error('set TEAMUP_TEST_BUILD to the compiled server dir');
const policy = require(`${OUT}/policies/is-admin.js`).default;
const { errors } = require('@strapi/utils');

const ctx = (authHeader) => ({ request: { header: authHeader ? { authorization: authHeader } : {} }, state: {} });

/** Install a fake global strapi for one call. */
function withStrapi({ valid = true, active = true, user = { isActive: true } }, fn) {
  const prev = globalThis.strapi;
  globalThis.strapi = {
    sessionManager: () => ({
      validateAccessToken: () => (valid ? { isValid: true, payload: { sessionId: 's1', userId: '1' } } : { isValid: false }),
      isSessionActive: async () => active,
    }),
    db: { query: () => ({ findOne: async () => user }) },
  };
  return Promise.resolve(fn()).finally(() => { globalThis.strapi = prev; });
}

const is401 = async (promise, label) => {
  await assert.rejects(promise, (e) => e instanceof errors.UnauthorizedError, label);
};

test('missing Authorization header → 401, not 403', async () => {
  await withStrapi({}, () => is401(policy(ctx(null)), 'no header'));
});

test('malformed Authorization header → 401', async () => {
  await withStrapi({}, () => is401(policy(ctx('Token abc')), 'wrong scheme'));
  await withStrapi({}, () => is401(policy(ctx('Bearer')), 'no token part'));
});

test('EXPIRED/invalid access token → 401 so the client refreshes and retries', async () => {
  await withStrapi({ valid: false }, () => is401(policy(ctx('Bearer stale')), 'expired token'));
});

test('revoked session → 401', async () => {
  await withStrapi({ active: false }, () => is401(policy(ctx('Bearer x')), 'inactive session'));
});

test('valid token but deactivated account → false (403), since retrying cannot help', async () => {
  await withStrapi({ user: { isActive: false } }, async () => {
    assert.equal(await policy(ctx('Bearer x')), false);
  });
  await withStrapi({ user: null }, async () => {
    assert.equal(await policy(ctx('Bearer x')), false);
  });
});

test('valid admin session → true, and ctx.state.user is populated', async () => {
  await withStrapi({}, async () => {
    const c = ctx('Bearer good');
    assert.equal(await policy(c), true);
    assert.deepEqual(c.state.user, { isActive: true });
  });
});
