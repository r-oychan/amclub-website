/**
 * Top-level admin page for ElevenLabs KB sync. Three buttons:
 *  - Sync all (delta)  → push only entries whose hash has changed
 *  - Sync all (full)   → wipe every am-club:* doc and re-push everything
 *  - Clear all         → wipe every am-club:* doc, no re-push (chatbot
 *                        loses all our content until next sync)
 *
 * Below the buttons: status table reading /api/elevenlabs-sync/status —
 * shows the current allow-list, env-var status, and every doc the sync
 * log knows about.
 */

import { useEffect, useState } from 'react';

interface StatusResponse {
  configured: {
    agentIdSet: boolean;
    apiKeySet: boolean;
    contentTypes: string[];
    docNamePrefix: string;
  };
  docs: Array<{
    id: number;
    sourceKind: 'page-entry' | 'media-file';
    contentType: string | null;
    elDocType: 'text' | 'file';
    elDocumentId: string;
    documentName: string;
    contentHash: string | null;
    syncedAt: string;
  }>;
}

interface SyncResult {
  documentName: string;
  status: 'created' | 'updated' | 'skipped' | 'deleted' | 'error';
  documentId?: string;
  error?: string;
}

interface SyncAllResponse {
  mode: 'delta' | 'full';
  counts: Record<string, number>;
  results: SyncResult[];
}

function getAdminAuth(): string {
  const fromLocal = localStorage.getItem('jwtToken') ?? '';
  const fromSession = sessionStorage.getItem('jwtToken') ?? '';
  const token = (fromLocal || fromSession).replace(/^"|"$/g, '');
  return token ? `Bearer ${token}` : '';
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAdminAuth(),
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = (data as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

const SyncAllPage = () => {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<{ mode: 'success' | 'error'; text: string } | null>(null);

  async function refresh() {
    try {
      const data = await api<StatusResponse>('/api/elevenlabs-sync/status');
      setStatus(data);
    } catch (err) {
      setResult({ mode: 'error', text: `Failed to load status: ${(err as Error).message}` });
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function runSyncAll(mode: 'delta' | 'full') {
    if (mode === 'full' && !confirm('Wipe every am-club:* doc from ElevenLabs and re-push all published entries. Continue?')) return;
    setBusy(mode);
    setResult(null);
    try {
      const data = await api<SyncAllResponse>('/api/elevenlabs-sync/sync-all', {
        method: 'POST',
        body: JSON.stringify({ mode }),
      });
      setResult({ mode: 'success', text: `Sync ${mode}: ${JSON.stringify(data.counts)}` });
      await refresh();
    } catch (err) {
      setResult({ mode: 'error', text: `Sync ${mode} failed: ${(err as Error).message}` });
    } finally {
      setBusy(null);
    }
  }

  async function runClearAll() {
    if (!confirm('Delete every am-club:* doc from ElevenLabs and detach from agent. The chatbot will lose all our content until you re-sync. Continue?')) return;
    setBusy('clear');
    setResult(null);
    try {
      const data = await api<{ deleted: number }>('/api/elevenlabs-sync/clear-all', { method: 'POST' });
      setResult({ mode: 'success', text: `Cleared ${data.deleted} doc(s)` });
      await refresh();
    } catch (err) {
      setResult({ mode: 'error', text: `Clear failed: ${(err as Error).message}` });
    } finally {
      setBusy(null);
    }
  }

  const cellStyle: React.CSSProperties = { padding: '6px 12px', borderBottom: '1px solid #eaeaef', fontSize: 13 };
  const headerStyle: React.CSSProperties = { ...cellStyle, fontWeight: 600, background: '#f6f6f9', textAlign: 'left' };
  const btn = (background: string): React.CSSProperties => ({
    padding: '10px 18px',
    borderRadius: 4,
    border: 'none',
    background,
    color: 'white',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  });
  const btnDisabled: React.CSSProperties = { ...btn('#9b9aff'), cursor: 'not-allowed' };

  return (
    <main style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>ElevenLabs Knowledge Base Sync</h1>
      <p style={{ color: '#666687', marginBottom: 24, fontSize: 14 }}>
        Push CMS content to the chatbot's knowledge base. Auto-syncs on publish; use these buttons for bulk operations.
      </p>

      {status && (
        <section
          style={{
            padding: 16,
            background: status.configured.apiKeySet && status.configured.agentIdSet ? '#eafbe7' : '#fff5f0',
            borderRadius: 4,
            marginBottom: 24,
            fontSize: 13,
            color: '#32324d',
          }}
        >
          <strong>Status:</strong>{' '}
          {status.configured.apiKeySet && status.configured.agentIdSet ? (
            <>Configured — {status.configured.contentTypes.length} content type(s), prefix <code>{status.configured.docNamePrefix}</code></>
          ) : (
            <>
              ⚠ Missing env vars:{' '}
              {!status.configured.apiKeySet && <code>ELEVENLABS_API_KEY</code>}{' '}
              {!status.configured.agentIdSet && <code>ELEVENLABS_AGENT_ID</code>}
            </>
          )}
        </section>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => runSyncAll('delta')}
          disabled={!!busy}
          style={busy ? btnDisabled : btn('#4945FF')}
          title="Push only entries whose content has changed since last sync"
        >
          {busy === 'delta' ? 'Syncing…' : 'Sync all (delta)'}
        </button>
        <button
          onClick={() => runSyncAll('full')}
          disabled={!!busy}
          style={busy ? btnDisabled : btn('#7b79ff')}
          title="Wipe everything from ElevenLabs and re-sync every published entry"
        >
          {busy === 'full' ? 'Syncing…' : 'Sync all (full)'}
        </button>
        <button
          onClick={runClearAll}
          disabled={!!busy}
          style={busy ? btnDisabled : btn('#d02b20')}
          title="Delete every am-club:* doc — chatbot will lose all knowledge until next sync"
        >
          {busy === 'clear' ? 'Clearing…' : 'Clear all'}
        </button>
        <button onClick={refresh} disabled={!!busy} style={busy ? btnDisabled : btn('#666687')}>
          Refresh
        </button>
      </div>

      {result && (
        <p
          style={{
            padding: 12,
            background: result.mode === 'error' ? '#fbe7e7' : '#eafbe7',
            color: result.mode === 'error' ? '#d02b20' : '#328048',
            borderRadius: 4,
            marginBottom: 24,
            fontSize: 13,
          }}
        >
          {result.text}
        </p>
      )}

      <h2 style={{ fontSize: 16, marginBottom: 8 }}>Synced documents ({status?.docs.length ?? 0})</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 4, overflow: 'hidden', boxShadow: '0 1px 4px rgba(33,33,52,0.1)' }}>
        <thead>
          <tr>
            <th style={headerStyle}>Document name</th>
            <th style={headerStyle}>Type</th>
            <th style={headerStyle}>EL doc ID</th>
            <th style={headerStyle}>Synced</th>
          </tr>
        </thead>
        <tbody>
          {status?.docs.length === 0 && (
            <tr>
              <td colSpan={4} style={{ ...cellStyle, color: '#666687', textAlign: 'center', padding: 24 }}>
                No documents synced yet. Click "Sync all (delta)" to push every published entry.
              </td>
            </tr>
          )}
          {status?.docs.map((d) => (
            <tr key={d.id}>
              <td style={cellStyle}>
                <code>{d.documentName}</code>
              </td>
              <td style={cellStyle}>{d.elDocType}</td>
              <td style={cellStyle}>
                <code style={{ fontSize: 11, color: '#666687' }}>{d.elDocumentId}</code>
              </td>
              <td style={cellStyle}>{new Date(d.syncedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};

export default SyncAllPage;
