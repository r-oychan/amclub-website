// Push the repo's agent config to an environment's ElevenLabs agent:
//   1. agent/prompt.md                 → the agent's system prompt
//   2. submit_talk2us_request webhook  → POST <site>/api/assistant-requests/submit
//   3. Strapi custom API token         → ElevenLabs workspace secret, sent as the tool's Authorization header
//   4. voice on by default             → phone calls (SIP) cannot ask for voice the way the web widget does;
//                                        the widget still forces text-only for typed chat.
// Idempotent: re-running updates the tool, secret and prompt in place.
//
// Usage: node scripts/elevenlabs-configure-agent.mjs <dev|uat|prod> [--dry-run]
//
// Reads cms/.env.seed.<env> (falling back to process.env):
//   STRAPI_BASE_URL       site origin, e.g. https://dev.amclub.org.sg
//   ELEVENLABS_API_KEY    workspace key
//   ELEVENLABS_AGENT_ID   that environment's agent
//   ASSISTANT_TOOL_TOKEN  Strapi *custom* API token allowed only `assistant-request.submit`
//                         (omit to keep the secret already stored for this environment)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
const HOST_GUARD = {
  dev: /dev\.amclub\.org\.sg|amclub-dev-app/,
  uat: /uat\.amclub\.org\.sg|amclub-uat-app/,
  prod: /\/\/amclub\.org\.sg|amclub-prod-app/,
};
if (!HOST_GUARD[env ?? '']) {
  console.error('usage: node scripts/elevenlabs-configure-agent.mjs <dev|uat|prod> [--dry-run]');
  process.exit(1);
}

const envPath = join(ROOT, `cms/.env.seed.${env}`);
const envFile = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const get = (k) => envFile.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') || process.env[k];
const BASE = get('STRAPI_BASE_URL')?.replace(/\/+$/, '');
const API_KEY = get('ELEVENLABS_API_KEY');
const AGENT_ID = get('ELEVENLABS_AGENT_ID');
const TOOL_TOKEN = get('ASSISTANT_TOOL_TOKEN');
if (!BASE || !HOST_GUARD[env].test(BASE)) {
  console.error(`refusing: STRAPI_BASE_URL "${BASE}" does not look like the ${env} environment`);
  process.exit(1);
}
if (!API_KEY || !AGENT_ID) {
  console.error('missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID');
  process.exit(1);
}

const EL = 'https://api.elevenlabs.io/v1/convai';
async function el(method, path, body) {
  if (dryRun && method !== 'GET') {
    console.log(`[dry-run] ${method} ${path}`);
    return {};
  }
  const res = await fetch(`${EL}${path}`, {
    method,
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : {};
}

const toolUrl = `${BASE}/api/assistant-requests/submit`;
// Workspace-wide names, so they carry the environment's host.
const host = new URL(BASE).host;
const SECRET_NAME = `assistant-tool-token-${host}`;

// ── 1. secret ──────────────────────────────────────────────────────
const { secrets = [] } = await el('GET', '/secrets');
let secret = secrets.find((s) => s.name === SECRET_NAME);
if (TOOL_TOKEN) {
  const value = `Bearer ${TOOL_TOKEN}`;
  if (secret) {
    await el('PATCH', `/secrets/${secret.secret_id}`, { type: 'update', name: SECRET_NAME, value });
    console.log(`secret ${SECRET_NAME}: updated`);
  } else {
    secret = await el('POST', '/secrets', { type: 'new', name: SECRET_NAME, value });
    console.log(`secret ${SECRET_NAME}: created`);
  }
} else if (secret) {
  console.log(`secret ${SECRET_NAME}: kept (no ASSISTANT_TOOL_TOKEN given)`);
} else {
  console.error(`no secret ${SECRET_NAME} yet — set ASSISTANT_TOOL_TOKEN (Strapi custom token for assistant-request.submit)`);
  process.exit(1);
}

// ── 2. webhook tool ────────────────────────────────────────────────
const CATEGORIES = [
  'Accounts', 'Thinkspace & Library', 'Concierge', 'Dining', 'Facilities', 'Fitness & Leisure', 'Membership',
  'Partnership', 'Retail (Essentials/The Gourmet Pantry)', 'sên Spa', 'TAC Connect', 'Technology', 'Youth & Family', 'Others',
];
const toolConfig = {
  type: 'webhook',
  name: 'submit_talk2us_request',
  description:
    "Lodge a Talk2Us request with The American Club so the right department follows up with the member. " +
    'Only call after the member has agreed and confirmed the summary. Returns ok, a reference number, the department, ' +
    'and a message telling you what to say next.',
  response_timeout_secs: 20,
  api_schema: {
    url: toolUrl,
    method: 'POST',
    request_headers: { Authorization: { secret_id: secret?.secret_id ?? 'dry-run' } },
    request_body_schema: {
      type: 'object',
      required: ['member_name', 'category', 'enquiry'],
      properties: {
        member_name: { type: 'string', description: "Member's full name, as confirmed with them." },
        membership_number: { type: 'string', description: 'Membership number if the member gave one; leave empty otherwise.' },
        email: { type: 'string', description: 'Email address, confirmed by reading it back. Leave empty if they have none.' },
        contact_phone: {
          type: 'string',
          description: 'Best phone number to reach the member, only if different from the number they are calling from. Digits with country code, e.g. +6591234567.',
        },
        category: { type: 'string', enum: CATEGORIES, description: 'The department that should handle this, per the classification guide in your instructions.' },
        subject: {
          type: 'string',
          description:
            'Only for these categories, pick the closest: Membership → Absentee / Resignation, Family Membership, Membership Renewal, ' +
            'Niche Group / VIP Membership, Refer a friend, Replacement Card, Others. Accounts → Billing Dispute, Payment, ' +
            'Update Contact Details, Update GIRO arrangement. Concierge → Car / Parking Matters, Driver / Helper Pass, ' +
            'Lost and Found, Service. Thinkspace & Library → Book Titles Suggestions, Ideas or Improvements, Others. ' +
            'Leave empty for every other category.',
        },
        enquiry: {
          type: 'string',
          description: 'Clear summary of what the member needs, written for the staff member who will follow up. Include any dates, venues, amounts and names they mentioned.',
        },
        channel: { type: 'string', dynamic_variable: 'system__channel' },
        conversation_id: { type: 'string', dynamic_variable: 'system__conversation_id' },
        caller_id: { type: 'string', dynamic_variable: 'system__caller_id' },
      },
    },
  },
};

const { tools = [] } = await el('GET', '/tools');
const existingTool = tools.find((t) => t.tool_config?.name === toolConfig.name && t.tool_config?.api_schema?.url === toolUrl);
let toolId = existingTool?.id;
if (existingTool) {
  await el('PATCH', `/tools/${toolId}`, { tool_config: toolConfig });
  console.log(`tool ${toolConfig.name} (${toolId}): updated → ${toolUrl}`);
} else {
  toolId = (await el('POST', '/tools', { tool_config: toolConfig })).id ?? 'dry-run';
  console.log(`tool ${toolConfig.name} (${toolId}): created → ${toolUrl}`);
}

// ── 3. agent ───────────────────────────────────────────────────────
const agent = await el('GET', `/agents/${AGENT_ID}`);
const currentToolIds = agent.conversation_config?.agent?.prompt?.tool_ids ?? [];
const toolIds = [...new Set([...currentToolIds, toolId])];
const prompt = readFileSync(join(ROOT, 'agent/prompt.md'), 'utf8');

await el('PATCH', `/agents/${AGENT_ID}`, {
  conversation_config: {
    agent: { prompt: { prompt, tool_ids: toolIds } },
    conversation: { text_only: false },
  },
  platform_settings: {
    // The widget keeps choosing text vs voice per session.
    overrides: { conversation_config_override: { conversation: { text_only: true } } },
  },
});
console.log(`agent ${agent.name} (${AGENT_ID}): prompt ${prompt.length} chars, tools [${toolIds.join(', ')}], voice on by default`);
