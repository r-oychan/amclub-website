/**
 * Talk2Us! form contract — validation and field mapping, kept free of Strapi
 * so it can be unit-tested directly.
 *
 * The question ids (qids) below belong to the live Jotform form
 * "The American Club Talk2us! Feedback Form". Read them with
 * GET /form/{id}/questions if the form is ever rebuilt.
 *
 * Department routing lives in the form, not here: Jotform's email conditions
 * notify a department inbox based on the Category answer (q10). Picking the
 * category IS the department classification, which is why it is validated
 * against the form's exact option list.
 *
 * The Jotform API skips the form's own required-field and captcha checks, so
 * every rule the form would enforce has to be enforced here instead.
 */

export const QID = {
  memberName: '30',
  membershipNo: '11',
  email: '6',
  feedbackType: '3',
  category: '10',
  message: '4',
  marketingConsent: '18',
  talk2usId: '31',
} as const;

/** Category option → department inbox the form notifies (from the form's email conditions). */
export const DEPARTMENT_BY_CATEGORY = {
  Accounts: 'Accounts',
  'Thinkspace & Library': 'Front Desk',
  Concierge: 'Front Desk',
  Dining: 'Food & Beverage',
  Facilities: 'Facilities',
  'Fitness & Leisure': 'Fitness & Leisure',
  Membership: 'Membership',
  Partnership: 'Marketing',
  'Retail (Essentials/The Gourmet Pantry)': 'Essentials',
  'sên Spa': 'Spa',
  'TAC Connect': 'Technology',
  Technology: 'Technology',
  'Youth & Family': 'Youth',
  Others: 'Marketing',
} as const;

export type Category = keyof typeof DEPARTMENT_BY_CATEGORY;
export const CATEGORIES = Object.keys(DEPARTMENT_BY_CATEGORY) as Category[];

/** Categories the form follows up with a conditional "subject" dropdown. */
export const SUBJECT_FIELDS: Partial<Record<Category, { qid: string; options: string[] }>> = {
  Membership: {
    qid: '19',
    options: ['Absentee / Resignation', 'Family Membership', 'Membership Renewal', 'Niche Group / VIP Membership', 'Refer a friend', 'Replacement Card', 'Others'],
  },
  Accounts: {
    qid: '20',
    options: ['Billing Dispute', 'Payment', 'Update Contact Details', 'Update GIRO arrangement'],
  },
  Concierge: {
    qid: '21',
    options: ['Car / Parking Matters', 'Driver / Helper Pass', 'Lost and Found', 'Service'],
  },
  'Thinkspace & Library': {
    qid: '27',
    options: ['Book Titles Suggestions', 'Ideas or Improvements', 'Others'],
  },
};

/** Body sent by the ElevenLabs webhook tool. Snake case because the LLM fills it. */
export interface AssistantRequestInput {
  member_name?: unknown;
  membership_number?: unknown;
  email?: unknown;
  contact_phone?: unknown;
  category?: unknown;
  subject?: unknown;
  enquiry?: unknown;
  // Injected from ElevenLabs system dynamic variables, not by the LLM.
  channel?: unknown;
  conversation_id?: unknown;
  caller_id?: unknown;
}

export interface AssistantRequest {
  memberName: string;
  membershipNo: string | null;
  email: string | null;
  contactPhone: string | null;
  category: Category;
  subject: string | null;
  message: string;
  channel: string | null;
  conversationId: string | null;
  callerId: string | null;
}

export type ValidationResult =
  | { ok: true; value: AssistantRequest }
  | { ok: false; errors: string[] };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9]{6,15}$/;

function text(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim().replace(/\s+/g, ' ');
  return t ? t.slice(0, max) : null;
}

/** ElevenLabs sends literal placeholders like "{{system__caller_id}}" or "None" when a variable is unset. */
function systemVar(v: unknown, max: number): string | null {
  const t = text(v, max);
  if (!t || t.includes('{{') || /^(none|null|undefined|unknown)$/i.test(t)) return null;
  return t;
}

function phone(v: unknown): string | null {
  const t = systemVar(v, 40);
  if (!t) return null;
  const compact = t.replace(/[\s()-]/g, '');
  return PHONE_RE.test(compact) ? compact : null;
}

function matchOption<T extends string>(v: unknown, options: readonly T[]): T | null {
  const t = text(v, 200)?.toLowerCase();
  if (!t) return null;
  return options.find((o) => o.toLowerCase() === t) ?? null;
}

export function validateRequest(input: AssistantRequestInput): ValidationResult {
  const errors: string[] = [];

  const memberName = text(input.member_name, 100);
  if (!memberName || memberName.length < 2) errors.push('member_name is required');

  const message = typeof input.enquiry === 'string' ? input.enquiry.trim().slice(0, 4000) : '';
  if (message.length < 10) errors.push('enquiry must describe the request (at least 10 characters)');

  const category = matchOption(input.category, CATEGORIES);
  if (!category) errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);

  let email: string | null = null;
  const rawEmail = text(input.email, 200);
  if (rawEmail) {
    email = rawEmail.replace(/\s/g, '').toLowerCase();
    if (!EMAIL_RE.test(email)) errors.push('email is not a valid address');
  }

  const callerId = phone(input.caller_id);
  const contactPhone = phone(input.contact_phone) ?? callerId;
  if (!email && !contactPhone) errors.push('an email address or contact phone number is required');

  if (errors.length > 0 || !memberName || !category) return { ok: false, errors };

  // A subject outside the form's list is not worth failing a member's request
  // over: fall back to "Others" where the form offers it, else leave it blank.
  const subjectField = SUBJECT_FIELDS[category];
  const subject = subjectField
    ? matchOption(input.subject, subjectField.options) ?? (subjectField.options.includes('Others') ? 'Others' : null)
    : null;

  return {
    ok: true,
    value: {
      memberName,
      membershipNo: text(input.membership_number, 30),
      email,
      contactPhone,
      category,
      subject,
      message,
      channel: systemVar(input.channel, 40),
      conversationId: systemVar(input.conversation_id, 100),
      callerId,
    },
  };
}

function channelLabel(channel: string | null): string {
  if (!channel) return 'digital assistant';
  if (/sip|phone|twilio|telnyx/i.test(channel)) return 'phone call';
  return 'website chat';
}

/**
 * Map a validated request onto Jotform `submission[qid]` fields.
 * `tag` prefixes the message (e.g. "[DEV TEST]") so staff can tell
 * non-production submissions apart — dev/UAT post to the live form.
 */
export function buildSubmission(req: AssistantRequest, tag = ''): Record<string, string> {
  const footer = [
    `Submitted by Eli, the Club's digital assistant (${channelLabel(req.channel)}).`,
    req.contactPhone ? `Contact phone: ${req.contactPhone}` : null,
    req.conversationId ? `Conversation: ${req.conversationId}` : null,
  ].filter(Boolean).join('\n');

  const fields: Record<string, string> = {
    [QID.memberName]: req.memberName,
    [QID.membershipNo]: req.membershipNo ?? 'Not provided',
    [QID.feedbackType]: 'Questions or Suggestions',
    [QID.category]: req.category,
    [QID.message]: `${tag ? `${tag.trim()} ` : ''}${req.message}\n\n${footer}`,
    // Marketing use needs explicit consent, which the assistant never asks for.
    [QID.marketingConsent]: 'No',
  };
  if (req.email) fields[QID.email] = req.email;
  const subjectField = SUBJECT_FIELDS[req.category];
  if (subjectField && req.subject) fields[subjectField.qid] = req.subject;

  return Object.fromEntries(Object.entries(fields).map(([qid, v]) => [`submission[${qid}]`, v]));
}

export function departmentFor(category: Category): string {
  return DEPARTMENT_BY_CATEGORY[category];
}
