/**
 * "Clone" side panel on the Content Manager edit view. Shows on every
 * collection-type entry. Click → POST /api/clone-entry/clone with
 * { uid, documentId } → redirect to the new entry. Singletons are
 * filtered out (cloning a singleton makes no sense).
 *
 * Mirrors the elevenlabs-chatbot side panel pattern so plugins look
 * consistent in the right column.
 */

import { useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Flex, Typography } from '@strapi/design-system';

interface PanelContext {
  activeTab?: 'draft' | 'published' | null;
  collectionType?: string;
  document?: { documentId?: string } | null;
  documentId?: string;
  model: string;
}

interface PanelDescription {
  title: string;
  content: React.ReactNode;
}

interface CloneResponse {
  uid: string;
  documentId: string;
  slug?: string;
  status: string;
}

function CloneBody({ uid, documentId }: { uid: string; documentId?: string }) {
  const { post } = useFetchClient();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  async function handleClone() {
    if (!documentId) {
      setStatus('error');
      setMessage('Save the entry first before cloning.');
      return;
    }
    setStatus('loading');
    setMessage('Cloning…');
    try {
      const { data } = await post<CloneResponse>('/api/clone-entry/clone', { uid, documentId });
      setStatus('success');
      setMessage(`Created draft ${data.documentId.slice(0, 6)}…`);
      // Redirect to the new entry's edit view. content-manager URL
      // shape: /content-manager/<kind>/<uid>/<documentId>
      navigate(`/content-manager/collection-types/${uid}/${data.documentId}`);
    } catch (err) {
      setStatus('error');
      const e = err as { response?: { data?: { error?: { message?: string } } } } & Error;
      setMessage(e.response?.data?.error?.message ?? e.message ?? String(err));
    }
  }

  return (
    <Flex direction="column" gap={2} alignItems="stretch">
      <Button onClick={handleClone} loading={status === 'loading'} disabled={!documentId} size="S" fullWidth>
        {status === 'loading' ? 'Cloning…' : 'Clone entry'}
      </Button>
      {message && (
        <Typography
          variant="pi"
          textColor={status === 'error' ? 'danger600' : status === 'success' ? 'success600' : 'neutral600'}
        >
          {message}
        </Typography>
      )}
    </Flex>
  );
}

export const CloneEditViewSidePanel = (ctx: PanelContext): PanelDescription | null => {
  const uid = ctx?.model;
  if (typeof uid !== 'string' || !uid.startsWith('api::')) return null;
  // Only show on collection types — singletons can't be cloned.
  if (ctx.collectionType && ctx.collectionType !== 'collection-types') return null;

  const documentId = ctx.document?.documentId ?? ctx.documentId;
  return {
    title: 'Clone',
    content: (
      <Box>
        <CloneBody uid={uid} documentId={documentId} />
        <Box paddingTop={2}>
          <Typography variant="pi" textColor="neutral600">
            Creates a new draft. Slug gets <code>-copy</code> suffix; title gets <em>(copy)</em>. Media + relations are linked, not duplicated.
          </Typography>
        </Box>
      </Box>
    ),
  };
};
