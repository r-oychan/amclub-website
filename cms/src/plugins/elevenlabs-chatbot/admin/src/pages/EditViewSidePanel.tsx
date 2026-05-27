/**
 * Right-side panel in the Content Manager edit view. Shows a "Sync to
 * ElevenLabs" button for entries whose content type is in the plugin's
 * runtime allow-list (fetched on mount).
 */

import { useEffect, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { Box, Button, Flex, Typography } from '@strapi/design-system';

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

function SyncBody({
  uid,
  documentId,
  isPublished,
}: {
  uid: string;
  documentId?: string;
  isPublished: boolean;
}) {
  const { post } = useFetchClient();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  async function handleSync() {
    setStatus('loading');
    setMessage('Syncing…');
    try {
      const { data } = await post<{
        status: string;
        documentName: string;
        documentId?: string;
        error?: string;
      }>('/api/elevenlabs-chatbot/sync-entry', { uid, documentId });
      setStatus(data.error ? 'error' : 'success');
      setMessage(data.error ?? `${data.status}: ${data.documentName}`);
    } catch (err) {
      setStatus('error');
      const e = err as { response?: { data?: { error?: { message?: string } } } } & Error;
      setMessage(e.response?.data?.error?.message ?? e.message ?? String(err));
    }
  }

  return (
    <Flex direction="column" gap={2} alignItems="stretch">
      <Button
        onClick={handleSync}
        loading={status === 'loading'}
        disabled={!isPublished}
        size="S"
        fullWidth
      >
        {status === 'loading' ? 'Syncing…' : 'Sync to ElevenLabs'}
      </Button>
      {message && (
        <Typography
          variant="pi"
          textColor={status === 'error' ? 'danger600' : status === 'success' ? 'success600' : 'neutral600'}
        >
          {message}
        </Typography>
      )}
      {!isPublished && (
        <Typography variant="pi" textColor="neutral600">
          Only published entries can be synced.
        </Typography>
      )}
    </Flex>
  );
}

function PanelGate({
  uid,
  documentId,
  isPublished,
}: {
  uid: string;
  documentId?: string;
  isPublished: boolean;
}) {
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

  if (allow === null)
    return (
      <Box>
        <Typography variant="pi" textColor="neutral600">Loading…</Typography>
      </Box>
    );
  if (!allow.has(uid))
    return (
      <Box>
        <Typography variant="pi" textColor="neutral600">Not in sync allow-list.</Typography>
      </Box>
    );
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
