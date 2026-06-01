/**
 * Typed wrapper around the ElevenLabs ConvAI API endpoints we use for KB sync.
 * Reads the API key + base URL from the plugin config on every call so a
 * missing env var surfaces immediately.
 */

import { getPluginConfig, getResolvedApiKey } from '../utils';

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

interface CreateTextResponse { id: string; name: string }
interface CreateFileResponse { id: string; name: string }
interface ListResponse { documents: KbDocSummary[]; next_cursor?: string | null; has_more?: boolean }
interface AgentResponse {
  agent_id: string;
  conversation_config?: { agent?: { prompt?: { knowledge_base?: KnowledgeBaseLocator[] } } };
}

type StrapiLike = Parameters<typeof getPluginConfig>[0];

function api(strapi: StrapiLike, path: string): string {
  return `${getPluginConfig(strapi).apiBaseUrl}${path}`;
}

function apiKey(strapi: StrapiLike): string {
  const key = getResolvedApiKey(strapi);
  if (!key) throw new Error('Missing ELEVENLABS_API_KEY (env var or plugin config)');
  return key;
}

async function request<T>(
  strapi: StrapiLike,
  path: string,
  init: RequestInit & { _isMultipart?: boolean },
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('xi-api-key', apiKey(strapi));
  if (!init._isMultipart) headers.set('Content-Type', 'application/json');

  const res = await fetch(api(strapi, path), { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `ElevenLabs ${init.method ?? 'GET'} ${path} failed: ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 500)}` : ''}`,
    );
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export async function createTextDoc(
  strapi: StrapiLike,
  args: { text: string; name: string },
): Promise<CreateTextResponse> {
  return request<CreateTextResponse>(strapi, '/v1/convai/knowledge-base/text', {
    method: 'POST',
    body: JSON.stringify({ text: args.text, name: args.name }),
  });
}

export async function createFileDoc(
  strapi: StrapiLike,
  args: { file: Buffer; filename: string; mime: string; name: string },
): Promise<CreateFileResponse> {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(args.file)], { type: args.mime }), args.filename);
  form.append('name', args.name);
  return request<CreateFileResponse>(strapi, '/v1/convai/knowledge-base/file', {
    method: 'POST',
    body: form,
    _isMultipart: true,
  });
}

export async function listDocsByPrefix(strapi: StrapiLike, prefix: string): Promise<KbDocSummary[]> {
  const out: KbDocSummary[] = [];
  let cursor: string | null | undefined = undefined;
  do {
    const params = new URLSearchParams();
    params.set('search', prefix);
    params.set('page_size', '100');
    if (cursor) params.set('cursor', cursor);
    const url = `/v1/convai/knowledge-base?${params.toString()}`;
    const res: ListResponse = await request<ListResponse>(strapi, url, { method: 'GET' });
    out.push(...res.documents.filter((d) => d.name.startsWith(prefix)));
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);
  return out;
}

export async function deleteDoc(strapi: StrapiLike, documentId: string): Promise<void> {
  await request<unknown>(strapi, `/v1/convai/knowledge-base/${documentId}?force=true`, { method: 'DELETE' });
}

export async function getAgent(strapi: StrapiLike, agentId: string): Promise<AgentResponse> {
  return request<AgentResponse>(strapi, `/v1/convai/agents/${agentId}`, { method: 'GET' });
}

export async function setAgentKnowledgeBase(
  strapi: StrapiLike,
  agentId: string,
  knowledgeBase: KnowledgeBaseLocator[],
): Promise<void> {
  await request<unknown>(strapi, `/v1/convai/agents/${agentId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      conversation_config: { agent: { prompt: { knowledge_base: knowledgeBase } } },
    }),
  });
}
