import { factories } from '@strapi/strapi';
import type { Context } from 'koa';
import { validateRequest, type AssistantRequest, type AssistantRequestInput } from '../utils/talk2us';
import type { SubmitResult } from '../services/assistant-request';

interface AssistantRequestService {
  submitToTalk2us(req: AssistantRequest): Promise<SubmitResult>;
}

// Response bodies are read by the voice agent's LLM, so every outcome carries
// a plain-English `message` telling it what to say next.
export default factories.createCoreController('api::assistant-request.assistant-request', ({ strapi }) => ({
  async submit(ctx: Context) {
    ctx.set('Cache-Control', 'no-store');

    const result = validateRequest((ctx.request.body ?? {}) as AssistantRequestInput);
    if ('errors' in result) {
      ctx.status = 422;
      ctx.body = {
        ok: false,
        error: 'invalid_request',
        details: result.errors,
        message: 'The request was not submitted. Collect the missing or invalid details from the member, then try again.',
      };
      return;
    }

    const service = strapi.service('api::assistant-request.assistant-request') as unknown as AssistantRequestService;
    const outcome = await service.submitToTalk2us(result.value);

    if (!outcome.ok) {
      ctx.status = outcome.error === 'not_configured' ? 503 : 502;
      ctx.body = {
        ok: false,
        error: outcome.error,
        message: 'The request could NOT be submitted. Do not tell the member it was sent. Apologise and give them the Front Desk instead: info@amclub.org.sg or +65 6737 3411.',
      };
      return;
    }

    ctx.body = {
      ok: true,
      reference: outcome.reference,
      department: outcome.department,
      duplicate: outcome.duplicate,
      message: outcome.reference
        ? `Submitted. Tell the member their reference number is ${outcome.reference} and that the ${outcome.department} team will follow up.`
        : `Submitted. Tell the member the ${outcome.department} team will follow up.`,
    };
  },
}));
