import { factories } from '@strapi/strapi';
import { QID, buildSubmission, departmentFor, type AssistantRequest } from '../utils/talk2us';

const UID = 'api::assistant-request.assistant-request';

export interface SubmitResult {
  ok: boolean;
  reference: string | null;
  department: string;
  duplicate: boolean;
  error?: string;
}

interface JotformConfig {
  apiKey: string;
  apiBase: string;
  formId: string;
  tag: string;
}

/** Env-only, per environment. `null` = not configured on this deployment. */
export function readJotformConfig(env: NodeJS.ProcessEnv = process.env): JotformConfig | null {
  const apiKey = (env.JOTFORM_API_KEY ?? '').trim();
  const formId = (env.JOTFORM_TALK2US_FORM_ID ?? '').trim();
  if (!apiKey || !formId) return null;
  return {
    apiKey,
    formId,
    // The Club is on Jotform Enterprise, so the API lives on its own domain.
    apiBase: (env.JOTFORM_API_BASE ?? 'https://api.jotform.com').replace(/\/+$/, ''),
    tag: (env.ASSISTANT_REQUEST_TAG ?? '').trim(),
  };
}

interface JotformEnvelope<T> { responseCode?: number; message?: string; content?: T }

async function jotform<T>(cfg: JotformConfig, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${cfg.apiBase}${path}`, {
    ...init,
    headers: { APIKEY: cfg.apiKey, ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(10_000),
  });
  const body = (await res.json().catch(() => ({}))) as JotformEnvelope<T>;
  if (!res.ok || body.responseCode !== 200 || body.content === undefined) {
    throw new Error(`Jotform ${init.method ?? 'GET'} ${path} failed: ${res.status} ${body.message ?? ''}`.trim());
  }
  return body.content;
}

/** The Talk2Us! ID is an auto-increment field, only visible by reading the submission back. */
async function readTalk2usId(cfg: JotformConfig, submissionId: string): Promise<string | null> {
  const content = await jotform<{ answers?: Record<string, { answer?: unknown }> }>(cfg, `/submission/${submissionId}`);
  const answer = content.answers?.[QID.talk2usId]?.answer;
  return typeof answer === 'string' && answer ? answer : null;
}

export default factories.createCoreService(UID, ({ strapi }) => ({
  async submitToTalk2us(req: AssistantRequest): Promise<SubmitResult> {
    const department = departmentFor(req.category);
    const docs = strapi.documents(UID);

    // The LLM may retry a tool call it thinks timed out. The same conversation
    // filing the same category + message again is a retry, not a new request.
    if (req.conversationId) {
      const [existing] = await docs.findMany({
        filters: { conversationId: req.conversationId, category: req.category, message: req.message, outcome: 'submitted' },
        limit: 1,
      });
      if (existing) {
        return { ok: true, reference: (existing.talk2usId as string | null) ?? null, department, duplicate: true };
      }
    }

    const log = {
      channel: req.channel,
      conversationId: req.conversationId,
      callerId: req.callerId,
      category: req.category,
      subject: req.subject,
      memberName: req.memberName,
      membershipNo: req.membershipNo,
      email: req.email,
      contactPhone: req.contactPhone,
      message: req.message,
    };

    const cfg = readJotformConfig();
    if (!cfg) {
      await docs.create({ data: { ...log, outcome: 'failed', error: 'Jotform is not configured on this environment' } });
      return { ok: false, reference: null, department, duplicate: false, error: 'not_configured' };
    }

    let submissionId: string;
    try {
      const created = await jotform<{ submissionID: string }>(cfg, `/form/${cfg.formId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(buildSubmission(req, cfg.tag)).toString(),
      });
      submissionId = String(created.submissionID);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      strapi.log.error(`[assistant-request] Talk2Us submission failed: ${message}`);
      await docs.create({ data: { ...log, outcome: 'failed', error: message } });
      return { ok: false, reference: null, department, duplicate: false, error: 'submission_failed' };
    }

    // The submission exists at this point; a failed read-back only costs the reference number.
    const talk2usId = await readTalk2usId(cfg, submissionId).catch((err: unknown) => {
      strapi.log.warn(`[assistant-request] could not read Talk2Us ID for ${submissionId}: ${err instanceof Error ? err.message : err}`);
      return null;
    });

    await docs.create({ data: { ...log, outcome: 'submitted', jotformSubmissionId: submissionId, talk2usId } });
    return { ok: true, reference: talk2usId, department, duplicate: false };
  },
}));
