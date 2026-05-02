/**
 * Typed wrapper around the ElevenLabs ConvAI API endpoints we use for KB sync.
 * Each function reads the API key on every call so failures surface immediately
 * if the env var goes missing in some environment.
 */

import { config, getApiKey } from './config';

export type ElDocType = 'text' | 'file' | 'url' | 'folder';
export type UsageMode = 'auto' | 'prompt';

export interface KbDocSummary {
  id: string;
  name: string;
  type: ElDocType;
  metadata?: { created_at_unix_secs?: number; last_updated_at_unix_secs?: number; size_bytes?: number };
}

export interface KnowledgeBaseLocator {
  id: string;
  name: string;
  type: ElDocType;
  usage_mode?: UsageMode;
}

interface CreateTextResponse {
  id: string;
  name: string;
}

interface CreateFileResponse {
  id: string;
  name: string;
}

interface ListResponse {
  documents: KbDocSummary[];
  next_cursor?: string | null;
  has_more?: boolean;
}

interface AgentResponse {
  agent_id: string;
  conversation_config?: {
    agent?: {
      prompt?: {
        knowledge_base?: KnowledgeBaseLocator[];
      };
    };
  };
}

function api(path: string): string {
  return `${config.apiBaseUrl}${path}`;
}

async function request<T>(path: string, init: RequestInit & { _isMultipart?: boolean }): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('xi-api-key', getApiKey());
  if (!init._isMultipart) headers.set('Content-Type', 'application/json');

  const res = await fetch(api(path), { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`ElevenLabs ${init.method ?? 'GET'} ${path} failed: ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 500)}` : ''}`);
  }
  // Some DELETEs return arbitrary JSON. Always parse what's there.
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export async function createTextDoc(args: { text: string; name: string }): Promise<CreateTextResponse> {
  return request<CreateTextResponse>('/v1/convai/knowledge-base/text', {
    method: 'POST',
    body: JSON.stringify({ text: args.text, name: args.name }),
  });
}

export async function createFileDoc(args: { file: Buffer; filename: string; mime: string; name: string }): Promise<CreateFileResponse> {
  const form = new FormData();
  // Strapi runs on Node ≥ 20 so global Blob/FormData are available.
  form.append('file', new Blob([new Uint8Array(args.file)], { type: args.mime }), args.filename);
  form.append('name', args.name);
  return request<CreateFileResponse>('/v1/convai/knowledge-base/file', {
    method: 'POST',
    body: form,
    _isMultipart: true,
  });
}

export async function listDocsByPrefix(prefix: string): Promise<KbDocSummary[]> {
  const out: KbDocSummary[] = [];
  let cursor: string | null | undefined = undefined;
  do {
    const params = new URLSearchParams();
    params.set('search', prefix);
    params.set('page_size', '100');
    if (cursor) params.set('cursor', cursor);
    const url = `/v1/convai/knowledge-base?${params.toString()}`;
    const res: ListResponse = await request<ListResponse>(url, { method: 'GET' });
    out.push(...res.documents.filter((d) => d.name.startsWith(prefix)));
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);
  return out;
}

export async function deleteDoc(documentId: string): Promise<void> {
  await request<unknown>(`/v1/convai/knowledge-base/${documentId}?force=true`, { method: 'DELETE' });
}

export async function getAgent(agentId: string): Promise<AgentResponse> {
  return request<AgentResponse>(`/v1/convai/agents/${agentId}`, { method: 'GET' });
}

export async function setAgentKnowledgeBase(agentId: string, knowledgeBase: KnowledgeBaseLocator[]): Promise<void> {
  await request<unknown>(`/v1/convai/agents/${agentId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      conversation_config: {
        agent: {
          prompt: {
            knowledge_base: knowledgeBase,
          },
        },
      },
    }),
  });
}
