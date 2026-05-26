/**
 * Right-side panel in the Content Manager edit view. Shows a "Sync to
 * ElevenLabs" button for entries whose content type is in the plugin's
 * runtime allow-list (fetched on mount).
 */

import { useEffect, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

interface PanelContext {
  model: string;
  document?: { documentId?: string; publishedAt?: string | null };
  documentId?: string;
}

interface PanelDescriptor {
  title: string;
  content: React.ReactNode;
}

interface StatusResponse {
  configured: { contentTypes: string[] };
}

function SyncBody({ uid, documentId, isPublished }: { uid: string; documentId?: string; isPublished: boolean }) {
  const { post } = useFetchClient();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  async function handleSync() {
    setStatus('loading');
    setMessage('Syncing…');
    try {
      const { data } = await post<{ status: string; documentName: string; documentId?: string; error?: string }>(
        '/api/elevenlabs-chatbot/sync-entry',
        { uid, documentId },
      );
      setStatus(data.error ? 'error' : 'success');
      setMessage(data.error ?? `${data.status}: ${data.documentName}`);
    } catch (err) {
      setStatus('error');
      const e = err as { response?: { data?: { error?: { message?: string } } } } & Error;
      setMessage(e.response?.data?.error?.message ?? e.message ?? String(err));
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        onClick={handleSync}
        disabled={status === 'loading' || !isPublished}
        title={isPublished ? 'Push current entry to the ElevenLabs KB' : 'Publish the entry first'}
        style={{
          padding: '8px 12px',
          borderRadius: 4,
          border: '1px solid #4945FF',
          background: status === 'loading' || !isPublished ? '#9b9aff' : '#4945FF',
          color: 'white',
          cursor: status === 'loading' || !isPublished ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          fontSize: 12,
        }}
      >
        {status === 'loading' ? 'Syncing…' : 'Sync to ElevenLabs'}
      </button>
      {message && (
        <p style={{ margin: 0, fontSize: 11, color: status === 'error' ? '#d02b20' : status === 'success' ? '#328048' : '#666687' }}>
          {message}
        </p>
      )}
      {!isPublished && (
        <p style={{ margin: 0, fontSize: 11, color: '#666687' }}>Only published entries can be synced.</p>
      )}
    </div>
  );
}

function PanelGate({ uid, documentId, isPublished }: { uid: string; documentId?: string; isPublished: boolean }) {
  const { get } = useFetchClient();
  const [allow, setAllow] = useState<Set<string> | null>(null);
  useEffect(() => {
    let cancelled = false;
    get<StatusResponse>('/api/elevenlabs-chatbot/status')
      .then(({ data }) => {
        if (!cancelled) setAllow(new Set(data.configured.contentTypes));
      })
      .catch(() => {
        if (!cancelled) setAllow(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [get]);

  if (allow === null) return <p style={{ fontSize: 11, color: '#666687' }}>Loading…</p>;
  if (!allow.has(uid)) return <p style={{ fontSize: 11, color: '#666687' }}>Not in sync allow-list.</p>;
  return <SyncBody uid={uid} documentId={documentId} isPublished={isPublished} />;
}

export const EditViewSidePanel = (ctx: PanelContext): PanelDescriptor | null => {
  const uid = ctx.model;
  if (!uid?.startsWith('api::')) return null;

  const documentId = ctx.document?.documentId ?? ctx.documentId;
  const isPublished = !!ctx.document?.publishedAt;

  return {
    title: 'ElevenLabs',
    content: <PanelGate uid={uid} documentId={documentId} isPublished={isPublished} />,
  };
};
