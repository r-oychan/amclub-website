/**
 * Single admin page for the plugin. Three sections:
 *   1. Look & feel — chatbotEnabled, voiceVisible, position, color, title.
 *   2. Sync allow-list — checkboxes per content type, persisted on save.
 *   3. Sync controls — Sync delta / Sync full / Clear all + live status table.
 *
 * Bulk operations run as background jobs; this page polls /status every 3 s
 * while a job is running.
 */

import { useEffect, useMemo, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

type Mode = 'idle' | 'success' | 'error';

interface RuntimeSettings {
  chatbotEnabled: boolean;
  voiceVisible: boolean;
  bubblePosition: 'bottom-right' | 'bottom-left';
  accentColor: string;
  panelTitle: string;
  contentTypeAllowList: string[];
}

interface JobState {
  kind: 'sync-all' | 'clear-all';
  mode?: 'delta' | 'full';
  startedAt: string;
  finishedAt?: string;
  counts?: Record<string, number>;
  deleted?: number;
  error?: string;
}

interface StatusResponse {
  configured: {
    agentIdSet: boolean;
    apiKeySet: boolean;
    contentTypes: string[];
    docNamePrefix: string;
    autoSyncOnPublish: boolean;
  };
  availableContentTypes: Array<{ uid: string; kind: string; displayName: string }>;
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
  job: JobState | null;
}

interface StartResponse {
  started: boolean;
  reason?: string;
  job?: JobState;
}

const cellStyle: React.CSSProperties = { padding: '6px 12px', borderBottom: '1px solid #eaeaef', fontSize: 13 };
const headerStyle: React.CSSProperties = { ...cellStyle, fontWeight: 600, background: '#f6f6f9', textAlign: 'left' };
const btn = (background: string): React.CSSProperties => ({
  padding: '10px 18px', borderRadius: 4, border: 'none', background, color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
});
const btnDisabled: React.CSSProperties = { ...btn('#9b9aff'), cursor: 'not-allowed' };
const sectionStyle: React.CSSProperties = { background: 'white', padding: 20, borderRadius: 4, boxShadow: '0 1px 4px rgba(33,33,52,0.1)', marginBottom: 20 };

export const SettingsPage = () => {
  const { get, post, put } = useFetchClient();
  const [settings, setSettings] = useState<RuntimeSettings | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [result, setResult] = useState<{ mode: Mode; text: string } | null>(null);

  const job = status?.job ?? null;
  const jobRunning = !!job && !job.finishedAt;
  const buttonsDisabled = !!busy || jobRunning;

  async function refresh() {
    try {
      const [statusRes, settingsRes] = await Promise.all([
        get<StatusResponse>('/api/elevenlabs-chatbot/status'),
        get<RuntimeSettings>('/api/elevenlabs-chatbot/settings'),
      ]);
      setStatus(statusRes.data);
      setSettings(settingsRes.data);
    } catch (err) {
      setResult({ mode: 'error', text: `Failed to load: ${formatError(err)}` });
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!jobRunning) return;
    const t = setInterval(() => void refresh(), 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobRunning]);

  async function saveSettings() {
    if (!settings) return;
    setSavingSettings(true);
    setResult(null);
    try {
      const { data } = await put<RuntimeSettings>('/api/elevenlabs-chatbot/settings', settings);
      setSettings(data);
      setResult({ mode: 'success', text: 'Settings saved.' });
      await refresh();
    } catch (err) {
      setResult({ mode: 'error', text: `Save failed: ${formatError(err)}` });
    } finally {
      setSavingSettings(false);
    }
  }

  async function runSyncAll(mode: 'delta' | 'full') {
    if (mode === 'full' && !confirm(`Wipe every ${status?.configured.docNamePrefix ?? ''}* doc from ElevenLabs and re-push all published entries. Continue?`)) return;
    setBusy(mode);
    setResult(null);
    try {
      const { data } = await post<StartResponse>('/api/elevenlabs-chatbot/sync-all', { mode });
      setResult(data.started
        ? { mode: 'success', text: `Sync ${mode} started — polling for progress…` }
        : { mode: 'error', text: data.reason ?? 'Job rejected' });
      await refresh();
    } catch (err) {
      setResult({ mode: 'error', text: `Sync ${mode} failed: ${formatError(err)}` });
    } finally {
      setBusy(null);
    }
  }

  async function runClearAll() {
    if (!confirm(`Delete every ${status?.configured.docNamePrefix ?? ''}* doc and detach from agent. Chatbot loses all knowledge until next sync. Continue?`)) return;
    setBusy('clear');
    setResult(null);
    try {
      const { data } = await post<StartResponse>('/api/elevenlabs-chatbot/clear-all', {});
      setResult(data.started
        ? { mode: 'success', text: 'Clear started — polling for progress…' }
        : { mode: 'error', text: data.reason ?? 'Clear rejected' });
      await refresh();
    } catch (err) {
      setResult({ mode: 'error', text: `Clear failed: ${formatError(err)}` });
    } finally {
      setBusy(null);
    }
  }

  const allowSet = useMemo(() => new Set(settings?.contentTypeAllowList ?? []), [settings]);
  function toggleAllow(uid: string) {
    if (!settings) return;
    const next = new Set(allowSet);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    setSettings({ ...settings, contentTypeAllowList: Array.from(next).sort() });
  }

  return (
    <main style={{ padding: 32, maxWidth: 1100, margin: '0 auto', background: '#f6f6f9', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>ElevenLabs Chatbot</h1>
      <p style={{ color: '#666687', marginBottom: 24, fontSize: 14 }}>
        Push CMS content to the chatbot's knowledge base, configure the on-site bubble, and trigger bulk syncs.
      </p>

      {status && (
        <section
          style={{
            padding: 16,
            background: status.configured.apiKeySet && status.configured.agentIdSet ? '#eafbe7' : '#fff5f0',
            borderRadius: 4,
            marginBottom: 16,
            fontSize: 13,
            color: '#32324d',
          }}
        >
          <strong>Status:</strong>{' '}
          {status.configured.apiKeySet && status.configured.agentIdSet ? (
            <>Configured — prefix <code>{status.configured.docNamePrefix}</code>, autoSync {status.configured.autoSyncOnPublish ? 'on' : 'off'}, {status.configured.contentTypes.length} content type(s) in allow-list</>
          ) : (
            <>
              ⚠ Missing env / plugin config:{' '}
              {!status.configured.apiKeySet && <code>ELEVENLABS_API_KEY</code>}{' '}
              {!status.configured.agentIdSet && <code>ELEVENLABS_AGENT_ID</code>}
            </>
          )}
        </section>
      )}

      {result && (
        <p
          style={{
            padding: 12,
            background: result.mode === 'error' ? '#fbe7e7' : '#eafbe7',
            color: result.mode === 'error' ? '#d02b20' : '#328048',
            borderRadius: 4,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {result.text}
        </p>
      )}

      {job && (
        <section
          style={{
            padding: 12,
            background: job.error ? '#fbe7e7' : jobRunning ? '#fff8e1' : '#eafbe7',
            color: job.error ? '#d02b20' : '#32324d',
            borderRadius: 4,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <strong>{jobRunning ? '⏳ Running' : job.error ? '✗ Failed' : '✓ Finished'}:</strong>{' '}
          {job.kind}{job.mode ? ` (${job.mode})` : ''} — started {new Date(job.startedAt).toLocaleTimeString()}
          {job.finishedAt && <>, finished {new Date(job.finishedAt).toLocaleTimeString()}</>}
          {job.counts && <> — {JSON.stringify(job.counts)}</>}
          {typeof job.deleted === 'number' && <> — deleted {job.deleted}</>}
          {job.error && <><br />{job.error}</>}
        </section>
      )}

      {settings && (
        <section style={sectionStyle}>
          <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 12 }}>Look &amp; feel</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Chatbot enabled (kill switch)">
              <input
                type="checkbox"
                checked={settings.chatbotEnabled}
                onChange={(e) => setSettings({ ...settings, chatbotEnabled: e.target.checked })}
              />
            </Field>
            <Field label="Voice mode visible">
              <input
                type="checkbox"
                checked={settings.voiceVisible}
                onChange={(e) => setSettings({ ...settings, voiceVisible: e.target.checked })}
              />
            </Field>
            <Field label="Bubble position">
              <select
                value={settings.bubblePosition}
                onChange={(e) => setSettings({ ...settings, bubblePosition: e.target.value as RuntimeSettings['bubblePosition'] })}
                style={inputStyle}
              >
                <option value="bottom-right">Bottom right</option>
                <option value="bottom-left">Bottom left</option>
              </select>
            </Field>
            <Field label="Accent color (hex)">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={normalizeHex(settings.accentColor)}
                  onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                  style={{ width: 40, height: 32, border: 'none', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={settings.accentColor}
                  onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </Field>
            <Field label="Panel title">
              <input
                type="text"
                value={settings.panelTitle}
                onChange={(e) => setSettings({ ...settings, panelTitle: e.target.value })}
                style={inputStyle}
              />
            </Field>
          </div>
        </section>
      )}

      {settings && status && (
        <section style={sectionStyle}>
          <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 8 }}>Sync allow-list ({settings.contentTypeAllowList.length})</h2>
          <p style={{ color: '#666687', fontSize: 12, marginTop: 0, marginBottom: 12 }}>
            Tick content types to include in publish-time auto-sync and bulk syncs. Untick to stop pushing.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {status.availableContentTypes.map((ct) => (
              <label key={ct.uid} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={allowSet.has(ct.uid)} onChange={() => toggleAllow(ct.uid)} />
                <code style={{ fontSize: 11, color: '#666687' }}>{ct.uid}</code>
                <span style={{ color: '#666687', fontSize: 11 }}>({ct.kind})</span>
              </label>
            ))}
          </div>
        </section>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          onClick={saveSettings}
          disabled={savingSettings || !settings}
          style={savingSettings ? btnDisabled : btn('#328048')}
        >
          {savingSettings ? 'Saving…' : 'Save settings'}
        </button>
        <button
          onClick={() => runSyncAll('delta')}
          disabled={buttonsDisabled}
          style={buttonsDisabled ? btnDisabled : btn('#4945FF')}
          title="Push only entries whose content has changed since last sync"
        >
          {busy === 'delta' ? 'Starting…' : 'Sync all (delta)'}
        </button>
        <button
          onClick={() => runSyncAll('full')}
          disabled={buttonsDisabled}
          style={buttonsDisabled ? btnDisabled : btn('#7b79ff')}
          title="Wipe everything and re-sync every published entry"
        >
          {busy === 'full' ? 'Starting…' : 'Sync all (full)'}
        </button>
        <button
          onClick={runClearAll}
          disabled={buttonsDisabled}
          style={buttonsDisabled ? btnDisabled : btn('#d02b20')}
        >
          {busy === 'clear' ? 'Starting…' : 'Clear all'}
        </button>
        <button onClick={refresh} disabled={!!busy} style={busy ? btnDisabled : btn('#666687')}>Refresh</button>
      </div>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 8 }}>Synced documents ({status?.docs.length ?? 0})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                  No documents synced yet.
                </td>
              </tr>
            )}
            {status?.docs.map((d) => (
              <tr key={d.id}>
                <td style={cellStyle}><code>{d.documentName}</code></td>
                <td style={cellStyle}>{d.elDocType}</td>
                <td style={cellStyle}><code style={{ fontSize: 11, color: '#666687' }}>{d.elDocumentId}</code></td>
                <td style={cellStyle}>{new Date(d.syncedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  borderRadius: 4,
  border: '1px solid #dcdce4',
  fontSize: 13,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#32324d' }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

function normalizeHex(s: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    return '#' + s.slice(1).split('').map((c) => c + c).join('');
  }
  return '#000000';
}

function formatError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    return res?.data?.error?.message ?? (err as Error).message ?? String(err);
  }
  return err instanceof Error ? err.message : String(err);
}

export default SettingsPage;
