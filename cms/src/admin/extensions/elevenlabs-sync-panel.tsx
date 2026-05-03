/**
 * Right-side panel injected into the Content Manager edit view.
 * Shows a "Sync to ElevenLabs" button for entries whose content type is
 * in the sync allow-list. POSTs to /api/elevenlabs-sync/sync-entry with
 * the admin session JWT (the admin frontend includes it automatically
 * via the fetchClient helper).
 */

import { useState } from 'react';

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
  model: string; // e.g. "api::home-page.home-page"
  document?: { documentId?: string; publishedAt?: string | null };
  documentId?: string;
}

interface PanelDescriptor {
  title: string;
  content: React.ReactNode;
}

function SyncBody({ uid, documentId, isPublished }: { uid: string; documentId?: string; isPublished: boolean }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  async function handleSync() {
    setStatus('loading');
    setMessage('Syncing…');
    try {
      const res = await fetch('/api/elevenlabs-sync/sync-entry', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getAdminAuth(),
        },
        body: JSON.stringify({ uid, documentId }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const errMsg = (data as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`;
        setStatus('error');
        setMessage(errMsg);
        return;
      }
      const result = data as { status: string; documentName: string; documentId?: string; error?: string };
      setStatus(result.error ? 'error' : 'success');
      setMessage(result.error ?? `${result.status}: ${result.documentName}`);
    } catch (err) {
      setStatus('error');
      setMessage((err as Error).message);
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

function getAdminAuth(): string {
  // Strapi admin stores the JWT in localStorage under "jwtToken" (or "sessionStorage").
  // Reading both supports both "stay logged in" toggle states.
  const fromLocal = localStorage.getItem('jwtToken') ?? '';
  const fromSession = sessionStorage.getItem('jwtToken') ?? '';
  const token = (fromLocal || fromSession).replace(/^"|"$/g, '');
  return token ? `Bearer ${token}` : '';
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
