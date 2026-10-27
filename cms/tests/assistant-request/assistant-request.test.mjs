import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { afterEach, test } from 'node:test';

const require = createRequire(import.meta.url);
const talk2us = require('../../src/api/assistant-request/utils/talk2us.ts');
const createService = require('../../src/api/assistant-request/services/assistant-request.ts').default;

const valid = {
  member_name: 'Jane Tan',
  membership_number: 'A1234',
  email: ' Jane.Tan@Example.com ',
  category: 'membership',
  subject: 'membership renewal',
  enquiry: 'Would like to know how to renew my family membership.',
  channel: 'sip_trunk',
  conversation_id: 'conv_123',
  caller_id: '+6591234567',
};

test('validateRequest normalises a phone-call request', () => {
  const r = talk2us.validateRequest(valid);
  assert.equal(r.ok, true);
  assert.equal(r.value.email, 'jane.tan@example.com');
  assert.equal(r.value.category, 'Membership');
  assert.equal(r.value.subject, 'Membership Renewal');
  assert.equal(r.value.contactPhone, '+6591234567', 'falls back to caller id');
});

test('validateRequest rejects unknown categories and missing contact', () => {
  const r = talk2us.validateRequest({ member_name: 'Jo', enquiry: 'Please help me with something.', category: 'Golf' });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.startsWith('category')));
  assert.ok(r.errors.some((e) => e.includes('email address or contact phone')));
});

test('validateRequest ignores unresolved ElevenLabs placeholders', () => {
  const r = talk2us.validateRequest({ ...valid, email: '', caller_id: '{{system__caller_id}}', channel: 'None' });
  assert.equal(r.ok, false, 'no email and no real caller id means no way to reply');
  const web = talk2us.validateRequest({ ...valid, caller_id: '{{system__caller_id}}', channel: 'None' });
  assert.equal(web.value.callerId, null);
  assert.equal(web.value.channel, null);
});

test('subject falls back to Others only where the form offers it', () => {
  const m = talk2us.validateRequest({ ...valid, subject: 'Something odd' });
  assert.equal(m.value.subject, 'Others');
  const a = talk2us.validateRequest({ ...valid, category: 'Accounts', subject: 'Something odd' });
  assert.equal(a.value.subject, null);
  const d = talk2us.validateRequest({ ...valid, category: 'Dining', subject: 'Anything' });
  assert.equal(d.value.subject, null, 'Dining has no subject field');
});

test('buildSubmission maps to Talk2Us qids, tags the message, never grants marketing consent', () => {
  const { value } = talk2us.validateRequest(valid);
  const fields = talk2us.buildSubmission(value, '[DEV TEST]');
  assert.equal(fields['submission[30]'], 'Jane Tan');
  assert.equal(fields['submission[3]'], 'Questions or Suggestions');
  assert.equal(fields['submission[10]'], 'Membership');
  assert.equal(fields['submission[19]'], 'Membership Renewal');
  assert.equal(fields['submission[18]'], 'No');
  assert.match(fields['submission[4]'], /^\[DEV TEST\] Would like/);
  assert.match(fields['submission[4]'], /phone call/);
  assert.match(fields['submission[4]'], /Contact phone: \+6591234567/);
});

// ── service ─────────────────────────────────────────────────────────

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.JOTFORM_API_KEY;
  delete process.env.JOTFORM_TALK2US_FORM_ID;
  delete process.env.JOTFORM_API_BASE;
});

function fakeStrapi(existing = []) {
  const created = [];
  const uid = 'api::assistant-request.assistant-request';
  const schema = require('../../src/api/assistant-request/content-types/assistant-request/schema.json');
  const strapi = {
    contentType: () => ({ ...schema, uid }),
    log: { error() {}, warn() {} },
    documents: () => ({
      findMany: async () => existing,
      create: async ({ data }) => { created.push(data); return data; },
    }),
  };
  return { strapi, created };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

test('service submits to Jotform, reads back the Talk2Us ID and logs it', async () => {
  process.env.JOTFORM_API_KEY = 'k';
  process.env.JOTFORM_TALK2US_FORM_ID = '999';
  process.env.JOTFORM_API_BASE = 'https://club.jotform.test/API/';
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url, init });
    if (init.method === 'POST') return jsonResponse({ responseCode: 200, content: { submissionID: '555' } });
    return jsonResponse({ responseCode: 200, content: { answers: { 31: { answer: 'T2US-000900' } } } });
  };
  const { strapi, created } = fakeStrapi();
  const svc = createService({ strapi });
  const r = await svc.submitToTalk2us(talk2us.validateRequest(valid).value);

  assert.deepEqual(r, { ok: true, reference: 'T2US-000900', department: 'Membership', duplicate: false });
  assert.equal(calls[0].url, 'https://club.jotform.test/API/form/999/submissions');
  assert.equal(calls[0].init.headers.APIKEY, 'k');
  assert.match(calls[0].init.body, /submission%5B10%5D=Membership/);
  assert.equal(created[0].outcome, 'submitted');
  assert.equal(created[0].talk2usId, 'T2US-000900');
});

test('service treats a repeat from the same conversation as a retry', async () => {
  process.env.JOTFORM_API_KEY = 'k';
  process.env.JOTFORM_TALK2US_FORM_ID = '999';
  globalThis.fetch = async () => { throw new Error('must not call Jotform'); };
  const { strapi, created } = fakeStrapi([{ talk2usId: 'T2US-000901' }]);
  const r = await createService({ strapi }).submitToTalk2us(talk2us.validateRequest(valid).value);
  assert.deepEqual(r, { ok: true, reference: 'T2US-000901', department: 'Membership', duplicate: true });
  assert.equal(created.length, 0);
});

test('service logs a failure and never reports success when Jotform errors', async () => {
  process.env.JOTFORM_API_KEY = 'k';
  process.env.JOTFORM_TALK2US_FORM_ID = '999';
  globalThis.fetch = async () => jsonResponse({ responseCode: 401, message: 'You are not authorized' }, 401);
  const { strapi, created } = fakeStrapi();
  const r = await createService({ strapi }).submitToTalk2us(talk2us.validateRequest(valid).value);
  assert.equal(r.ok, false);
  assert.equal(r.error, 'submission_failed');
  assert.equal(created[0].outcome, 'failed');
  assert.match(created[0].error, /401/);
});

test('service refuses cleanly when Jotform is not configured', async () => {
  const { strapi, created } = fakeStrapi();
  const r = await createService({ strapi }).submitToTalk2us(talk2us.validateRequest(valid).value);
  assert.equal(r.error, 'not_configured');
  assert.equal(created[0].outcome, 'failed');
});
