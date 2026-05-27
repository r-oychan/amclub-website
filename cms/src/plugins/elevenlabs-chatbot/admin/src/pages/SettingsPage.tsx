/**
 * Single admin page for the plugin. Three sections:
 *   1. Look & feel — chatbotEnabled, voiceVisible, position, color, title.
 *   2. Sync allow-list — checkboxes per content type, persisted on save.
 *   3. Sync controls — Sync delta / Sync full / Clear all + live status table.
 *
 * Uses @strapi/design-system primitives so the page themes correctly in
 * both light and dark admin modes.
 *
 * Bulk operations run as background jobs; this page polls /status every 3 s
 * while a job is running.
 */

import { useEffect, useMemo, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Grid,
  Main,
  SingleSelect,
  SingleSelectOption,
  Table,
  Tbody,
  Td,
  TextInput,
  Th,
  Thead,
  Toggle,
  Tr,
  Typography,
} from '@strapi/design-system';

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

type BannerVariant = 'success' | 'warning' | 'danger' | 'neutral';

const BANNER_BG: Record<BannerVariant, string> = {
  success: 'success100',
  warning: 'warning100',
  danger: 'danger100',
  neutral: 'neutral100',
};
const BANNER_TEXT: Record<BannerVariant, string> = {
  success: 'success700',
  warning: 'warning700',
  danger: 'danger700',
  neutral: 'neutral800',
};

function Banner({ variant, children }: { variant: BannerVariant; children: React.ReactNode }) {
  return (
    <Box
      background={BANNER_BG[variant]}
      hasRadius
      padding={4}
      marginBottom={4}
    >
      <Typography textColor={BANNER_TEXT[variant]}>{children}</Typography>
    </Box>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box background="neutral0" hasRadius shadow="tableShadow" padding={6} marginBottom={5}>
      <Typography variant="delta" tag="h2">
        {title}
      </Typography>
      <Box paddingTop={4}>{children}</Box>
    </Box>
  );
}

export const SettingsPage = () => {
  const { get, post, put } = useFetchClient();
  const [settings, setSettings] = useState<RuntimeSettings | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [result, setResult] = useState<{ variant: BannerVariant; text: string } | null>(null);

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
      setResult({ variant: 'danger', text: `Failed to load: ${formatError(err)}` });
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
      setResult({ variant: 'success', text: 'Settings saved.' });
      await refresh();
    } catch (err) {
      setResult({ variant: 'danger', text: `Save failed: ${formatError(err)}` });
    } finally {
      setSavingSettings(false);
    }
  }

  async function runSyncAll(mode: 'delta' | 'full') {
    if (
      mode === 'full' &&
      !confirm(
        `Wipe every ${status?.configured.docNamePrefix ?? ''}* doc from ElevenLabs and re-push all published entries. Continue?`,
      )
    )
      return;
    setBusy(mode);
    setResult(null);
    try {
      const { data } = await post<StartResponse>('/api/elevenlabs-chatbot/sync-all', { mode });
      setResult(
        data.started
          ? { variant: 'success', text: `Sync ${mode} started — polling for progress…` }
          : { variant: 'danger', text: data.reason ?? 'Job rejected' },
      );
      await refresh();
    } catch (err) {
      setResult({ variant: 'danger', text: `Sync ${mode} failed: ${formatError(err)}` });
    } finally {
      setBusy(null);
    }
  }

  async function runClearAll() {
    if (
      !confirm(
        `Delete every ${status?.configured.docNamePrefix ?? ''}* doc and detach from agent. Chatbot loses all knowledge until next sync. Continue?`,
      )
    )
      return;
    setBusy('clear');
    setResult(null);
    try {
      const { data } = await post<StartResponse>('/api/elevenlabs-chatbot/clear-all', {});
      setResult(
        data.started
          ? { variant: 'success', text: 'Clear started — polling for progress…' }
          : { variant: 'danger', text: data.reason ?? 'Clear rejected' },
      );
      await refresh();
    } catch (err) {
      setResult({ variant: 'danger', text: `Clear failed: ${formatError(err)}` });
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
    <Main>
      <Box padding={8}>
        <Box marginBottom={4}>
          <Typography variant="alpha" tag="h1">
            ElevenLabs Chatbot
          </Typography>
          <Box paddingTop={2}>
            <Typography textColor="neutral600">
              Push CMS content to the chatbot's knowledge base, configure the on-site bubble, and trigger bulk syncs.
            </Typography>
          </Box>
        </Box>

        {status && (
          <Banner
            variant={status.configured.apiKeySet && status.configured.agentIdSet ? 'success' : 'warning'}
          >
            <strong>Status:</strong>{' '}
            {status.configured.apiKeySet && status.configured.agentIdSet ? (
              <>
                Configured — prefix <code>{status.configured.docNamePrefix}</code>, autoSync{' '}
                {status.configured.autoSyncOnPublish ? 'on' : 'off'}, {status.configured.contentTypes.length} content
                type(s) in allow-list
              </>
            ) : (
              <>
                Missing env / plugin config:{' '}
                {!status.configured.apiKeySet && <code>ELEVENLABS_API_KEY </code>}
                {!status.configured.agentIdSet && <code>ELEVENLABS_AGENT_ID</code>}
              </>
            )}
          </Banner>
        )}

        {result && <Banner variant={result.variant}>{result.text}</Banner>}

        {job && (
          <Banner variant={job.error ? 'danger' : jobRunning ? 'warning' : 'success'}>
            <strong>{jobRunning ? 'Running' : job.error ? 'Failed' : 'Finished'}:</strong> {job.kind}
            {job.mode ? ` (${job.mode})` : ''} — started {new Date(job.startedAt).toLocaleTimeString()}
            {job.finishedAt && <>, finished {new Date(job.finishedAt).toLocaleTimeString()}</>}
            {job.counts && <> — {JSON.stringify(job.counts)}</>}
            {typeof job.deleted === 'number' && <> — deleted {job.deleted}</>}
            {job.error && (
              <>
                <br />
                {job.error}
              </>
            )}
          </Banner>
        )}

        {settings && (
          <Section title="Look & feel">
            <Grid.Root gap={4}>
              <Grid.Item col={6} s={12} direction="column" alignItems="stretch">
                <Flex direction="column" gap={1} alignItems="flex-start">
                  <Typography variant="pi" fontWeight="bold">
                    Chatbot enabled (kill switch)
                  </Typography>
                  <Toggle
                    onLabel="On"
                    offLabel="Off"
                    checked={settings.chatbotEnabled}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSettings({ ...settings, chatbotEnabled: e.target.checked })
                    }
                  />
                </Flex>
              </Grid.Item>
              <Grid.Item col={6} s={12} direction="column" alignItems="stretch">
                <Flex direction="column" gap={1} alignItems="flex-start">
                  <Typography variant="pi" fontWeight="bold">
                    Voice mode visible
                  </Typography>
                  <Toggle
                    onLabel="Shown"
                    offLabel="Hidden"
                    checked={settings.voiceVisible}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSettings({ ...settings, voiceVisible: e.target.checked })
                    }
                  />
                </Flex>
              </Grid.Item>
              <Grid.Item col={6} s={12} direction="column" alignItems="stretch">
                <Flex direction="column" gap={1} alignItems="stretch">
                  <Typography variant="pi" fontWeight="bold">
                    Bubble position
                  </Typography>
                  <SingleSelect
                    value={settings.bubblePosition}
                    onChange={(v: string) =>
                      setSettings({
                        ...settings,
                        bubblePosition: v as RuntimeSettings['bubblePosition'],
                      })
                    }
                  >
                    <SingleSelectOption value="bottom-right">Bottom right</SingleSelectOption>
                    <SingleSelectOption value="bottom-left">Bottom left</SingleSelectOption>
                  </SingleSelect>
                </Flex>
              </Grid.Item>
              <Grid.Item col={6} s={12} direction="column" alignItems="stretch">
                <Flex direction="column" gap={1} alignItems="stretch">
                  <Typography variant="pi" fontWeight="bold">
                    Accent color (hex)
                  </Typography>
                  <Flex gap={2} alignItems="center">
                    <input
                      type="color"
                      value={normalizeHex(settings.accentColor)}
                      onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                      style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', background: 'transparent' }}
                    />
                    <Box flex={1}>
                      <TextInput
                        aria-label="Accent color hex"
                        value={settings.accentColor}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setSettings({ ...settings, accentColor: e.target.value })
                        }
                      />
                    </Box>
                  </Flex>
                </Flex>
              </Grid.Item>
              <Grid.Item col={12} direction="column" alignItems="stretch">
                <Flex direction="column" gap={1} alignItems="stretch">
                  <Typography variant="pi" fontWeight="bold">
                    Panel title
                  </Typography>
                  <TextInput
                    aria-label="Panel title"
                    value={settings.panelTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSettings({ ...settings, panelTitle: e.target.value })
                    }
                  />
                </Flex>
              </Grid.Item>
            </Grid.Root>
          </Section>
        )}

        {settings && status && (
          <Section title={`Sync allow-list (${settings.contentTypeAllowList.length})`}>
            <Box paddingBottom={3}>
              <Typography variant="pi" textColor="neutral600">
                Tick content types to include in publish-time auto-sync and bulk syncs.
              </Typography>
            </Box>
            <Grid.Root gap={2}>
              {status.availableContentTypes.map((ct) => (
                <Grid.Item key={ct.uid} col={6} s={12} alignItems="center" gap={2}>
                  <Checkbox
                    checked={allowSet.has(ct.uid)}
                    onCheckedChange={() => toggleAllow(ct.uid)}
                  >
                    <Typography variant="pi">
                      <code>{ct.uid}</code>{' '}
                      <Typography variant="pi" textColor="neutral600" tag="span">
                        ({ct.kind})
                      </Typography>
                    </Typography>
                  </Checkbox>
                </Grid.Item>
              ))}
            </Grid.Root>
          </Section>
        )}

        <Flex gap={2} wrap="wrap" marginBottom={5}>
          <Button onClick={saveSettings} loading={savingSettings} disabled={!settings} variant="success-light">
            {savingSettings ? 'Saving…' : 'Save settings'}
          </Button>
          <Button
            onClick={() => runSyncAll('delta')}
            disabled={buttonsDisabled}
            loading={busy === 'delta'}
          >
            Sync all (delta)
          </Button>
          <Button
            onClick={() => runSyncAll('full')}
            disabled={buttonsDisabled}
            loading={busy === 'full'}
            variant="secondary"
          >
            Sync all (full)
          </Button>
          <Button
            onClick={runClearAll}
            disabled={buttonsDisabled}
            loading={busy === 'clear'}
            variant="danger"
          >
            Clear all
          </Button>
          <Button onClick={refresh} disabled={!!busy} variant="tertiary">
            Refresh
          </Button>
        </Flex>

        <Section title={`Synced documents (${status?.docs.length ?? 0})`}>
          <Table colCount={4} rowCount={(status?.docs.length ?? 0) + 1}>
            <Thead>
              <Tr>
                <Th><Typography variant="sigma">Document name</Typography></Th>
                <Th><Typography variant="sigma">Type</Typography></Th>
                <Th><Typography variant="sigma">EL doc ID</Typography></Th>
                <Th><Typography variant="sigma">Synced</Typography></Th>
              </Tr>
            </Thead>
            <Tbody>
              {status?.docs.length === 0 && (
                <Tr>
                  <Td colSpan={4}>
                    <Box padding={4}>
                      <Typography textColor="neutral600">No documents synced yet.</Typography>
                    </Box>
                  </Td>
                </Tr>
              )}
              {status?.docs.map((d) => (
                <Tr key={d.id}>
                  <Td><Typography variant="pi"><code>{d.documentName}</code></Typography></Td>
                  <Td><Typography variant="pi">{d.elDocType}</Typography></Td>
                  <Td><Typography variant="pi" textColor="neutral600"><code>{d.elDocumentId}</code></Typography></Td>
                  <Td><Typography variant="pi">{new Date(d.syncedAt).toLocaleString()}</Typography></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Section>
      </Box>
    </Main>
  );
};

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
