/**
 * Right-side panel injected into the Content Manager edit view.
 * Shows a "Sync to ElevenLabs" button for entries whose content type is
 * in the sync allow-list. Calls /elevenlabs-sync/sync-entry through
 * Strapi's useFetchClient so admin auth is handled automatically
 * (cookies or localStorage depending on the "remember me" toggle).
 */

import { useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

const SYNCABLE_UIDS = new Set([
  'api::home-page.home-page',
  'api::about-page.about-page',
  'api::dining-page.dining-page',
  'api::fitness-page.fitness-page',
  'api::kids-page.kids-page',
  'api::membership-page.membership-page',
  'api::event-spaces-page.event-spaces-page',
  'api::whats-on-page.whats-on-page',
  'api::contact-us-page.contact-us-page',
  'api::gallery-page.gallery-page',
  'api::news-page.news-page',
  'api::event.event',
  'api::news-article.news-article',
  'api::restaurant.restaurant',
  'api::venue.venue',
  'api::facility.facility',
  'api::committee-member.committee-member',
  'api::faq-item.faq-item',
  'api::testimonial.testimonial',
  'api::gallery-album.gallery-album',
]);

interface PanelContext {
  model: string;
  document?: { documentId?: string; publishedAt?: string | null };
  documentId?: string;
}

interface PanelDescriptor {
  title: string;
  content: React.ReactNode;
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
        '/api/elevenlabs-sync/sync-entry',
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
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: status === 'error' ? '#d02b20' : status === 'success' ? '#328048' : '#666687',
          }}
        >
          {message}
        </p>
      )}
      {!isPublished && (
        <p style={{ margin: 0, fontSize: 11, color: '#666687' }}>
          Only published entries can be synced.
        </p>
      )}
    </div>
  );
}

export const ElevenLabsSyncPanel = (ctx: PanelContext): PanelDescriptor | null => {
  const uid = ctx.model;
  if (!SYNCABLE_UIDS.has(uid)) return null;

  const documentId = ctx.document?.documentId ?? ctx.documentId;
  const isPublished = !!ctx.document?.publishedAt;

  return {
    title: 'ElevenLabs',
    content: <SyncBody uid={uid} documentId={documentId} isPublished={isPublished} />,
  };
};
