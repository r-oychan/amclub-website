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
  Textarea,
  TextInput,
  Th,
  Thead,
  Toggle,
  Tr,
  Typography,
} from '@strapi/design-system';

interface TeamupSettings {
  enabled: boolean;
  subcalendarIds: number[];
  daysBefore: number;
  daysAfter: number;
}

interface RuntimeSettings {
  chatbotEnabled: boolean;
  voiceVisible: boolean;
  bubblePosition: 'bottom-right' | 'bottom-left';
  accentColor: string;
  panelTitle: string;
  contentTypeAllowList: string[];
  excludedFilePatterns: string[];
  teamup: TeamupSettings;
}

interface Subcalendar {
  id: number;
  name: string;
  active?: boolean;
}

interface TeamupPreview {
  window: { from: string; to: string };
  fetched: number;
  series: number;
  recurring: number;
  oneOff: number;
  sample: Array<{ title: string; occurrences: number; recurring: boolean; markdown: string }>;
}

interface TeamupSyncResult {
  window: { from: string; to: string };
  fetched: number;
  series: number;
  created: number;
  updated: number;
  skipped: number;
  deleted: number;
  errors: string[];
}

interface JobState {
  kind: 'sync-all' | 'clear-all' | 'index-check' | 'index-build';
  mode?: 'delta' | 'full';
  startedAt: string;
  finishedAt?: string;
  counts?: Record<string, number>;
  deleted?: number;
  unindexed?: string[];
  failures?: string[];
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
  // What the server last confirmed it has stored. Preview/sync read the STORED
  // values, so the buttons must be gated on this — not on the edited form.
  const [savedSettings, setSavedSettings] = useState<RuntimeSettings | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [result, setResult] = useState<{ variant: BannerVariant; text: string } | null>(null);

  const job = status?.job ?? null;
  const jobRunning = !!job && !job.finishedAt;
  const buttonsDisabled = !!busy || jobRunning;

  // Key order can differ between the server payload and locally-spread objects,
  // so compare a key-sorted serialisation rather than raw JSON.stringify.
  const stable = (v: unknown): string =>
    JSON.stringify(v, (_k, val) =>
      val && typeof val === 'object' && !Array.isArray(val)
        ? Object.fromEntries(Object.entries(val as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
        : val,
    );
  const unsaved = !!settings && !!savedSettings && stable(settings) !== stable(savedSettings);
  // Teamup sync bails server-side when the STORED enabled flag is false.
  const teamupStoredEnabled = savedSettings?.teamup.enabled ?? false;
  const teamupBlocked = unsaved || !teamupStoredEnabled;

  async function refresh() {
    try {
      const [statusRes, settingsRes] = await Promise.all([
        get<StatusResponse>('/api/elevenlabs-chatbot/status'),
        get<RuntimeSettings>('/api/elevenlabs-chatbot/settings'),
      ]);
      setStatus(statusRes.data);
      setSettings(settingsRes.data);
      setSavedSettings(settingsRes.data);
    } catch (err) {
      setResult({ variant: 'danger', text: `Failed to load: ${formatError(err)}` });
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!settings) return;
    void loadSubcalendars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!settings]);

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
      setSavedSettings(data);
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

  async function runIndexAll(build: boolean) {
    setBusy(build ? 'index-build' : 'index-check');
    setResult(null);
    try {
      const { data } = await post<StartResponse>('/api/elevenlabs-chatbot/index-all', { build });
      setResult(
        data.started
          ? {
              variant: 'success',
              text: `${build ? 'Index build' : 'Index check'} started — polling for progress…`,
            }
          : { variant: 'danger', text: data.reason ?? 'Job rejected' },
      );
      await refresh();
    } catch (err) {
      setResult({ variant: 'danger', text: `Index job failed: ${formatError(err)}` });
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

  // ── Teamup ──
  const [subcals, setSubcals] = useState<Subcalendar[] | null>(null);
  const [preview, setPreview] = useState<TeamupPreview | null>(null);

  // The calendar key lives in TEAMUP_CALENDAR_KEY, so there is nothing to type
  // before loading — fetch the list as soon as the page opens.
  const [subcalError, setSubcalError] = useState<string | null>(null);

  async function loadSubcalendars(manual = false) {
    if (manual) setBusy('teamup-cals');
    try {
      const { data } = await get<{ subcalendars: Subcalendar[] }>('/api/elevenlabs-chatbot/teamup/subcalendars');
      setSubcals(data.subcalendars);
      setSubcalError(null);
      if (manual) setResult({ variant: 'success', text: `Loaded ${data.subcalendars.length} calendar(s).` });
    } catch (err) {
      const msg = formatError(err);
      setSubcals(null);
      setSubcalError(msg);
      if (manual) setResult({ variant: 'danger', text: `Could not load calendars: ${msg}` });
    } finally {
      if (manual) setBusy(null);
    }
  }

  async function runTeamupPreview() {
    setBusy('teamup-preview');
    setResult(null);
    try {
      const { data } = await get<TeamupPreview>('/api/elevenlabs-chatbot/teamup/preview');
      setPreview(data);
      setResult({
        variant: 'success',
        text: `${data.fetched} events in ${data.window.from} → ${data.window.to} collapse to ${data.series} document(s) (${data.recurring} recurring, ${data.oneOff} one-off). Nothing was pushed.`,
      });
    } catch (err) {
      setResult({ variant: 'danger', text: `Preview failed: ${formatError(err)}` });
    } finally {
      setBusy(null);
    }
  }

  async function runTeamupSync() {
    if (!confirm('Push the current Teamup window to the chatbot knowledge base? Events that fell outside the window will be removed.')) return;
    setBusy('teamup-sync');
    setResult(null);
    try {
      const { data } = await post<TeamupSyncResult>('/api/elevenlabs-chatbot/teamup/sync', {});
      const msg = `Teamup ${data.window.from} → ${data.window.to}: ${data.fetched} events → ${data.series} docs (+${data.created} new, ${data.updated} updated, ${data.skipped} unchanged, ${data.deleted} removed).`;
      setResult(
        data.errors.length
          ? { variant: 'warning', text: `${msg} ${data.errors.length} error(s): ${data.errors.slice(0, 3).join('; ')}` }
          : { variant: 'success', text: msg },
      );
      await refresh();
    } catch (err) {
      setResult({ variant: 'danger', text: `Teamup sync failed: ${formatError(err)}` });
    } finally {
      setBusy(null);
    }
  }

  function toggleSubcal(id: number) {
    if (!settings) return;
    const cur = new Set(settings.teamup.subcalendarIds);
    if (cur.has(id)) cur.delete(id);
    else cur.add(id);
    setSettings({ ...settings, teamup: { ...settings.teamup, subcalendarIds: [...cur].sort((a, b) => a - b) } });
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
                Configured — prefix <span style={{ fontFamily: 'monospace' }}>{status.configured.docNamePrefix}</span>
                , autoSync {status.configured.autoSyncOnPublish ? 'on' : 'off'},{' '}
                {status.configured.contentTypes.length} content type(s) in allow-list
              </>
            ) : (
              <>
                Missing env / plugin config:{' '}
                {!status.configured.apiKeySet && (
                  <span style={{ fontFamily: 'monospace' }}>ELEVENLABS_API_KEY </span>
                )}
                {!status.configured.agentIdSet && (
                  <span style={{ fontFamily: 'monospace' }}>ELEVENLABS_AGENT_ID</span>
                )}
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
            {job.unindexed && job.unindexed.length > 0 && (
              <>
                <br />
                <strong>Not indexed ({job.unindexed.length}):</strong>{' '}
                <span style={{ fontFamily: 'monospace' }}>
                  {job.unindexed.slice(0, 20).join(', ')}
                  {job.unindexed.length > 20 ? ` … +${job.unindexed.length - 20} more` : ''}
                </span>
              </>
            )}
            {job.failures && job.failures.length > 0 && (
              <>
                <br />
                <strong>Failures ({job.failures.length}):</strong>{' '}
                <span style={{ fontFamily: 'monospace' }}>{job.failures.slice(0, 5).join(' | ')}</span>
              </>
            )}
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

        {settings && (
          <>
          <Section title={`Excluded documents (${settings.excludedFilePatterns.length})`}>
            <Box paddingBottom={3}>
              <Typography textColor="neutral600" variant="pi">
                PDFs and other documents attached to a page are normally pushed to the knowledge base.
                Anything matching a pattern below is skipped instead — and if it was pushed before,
                it is removed on the next sync of its page. One pattern per line, matched
                case-insensitively against the file name and its URL. <code>*</code> works as a wildcard.
              </Typography>
              <Box paddingTop={2}>
                <Typography textColor="neutral600" variant="pi">
                  Use this for <strong>timetables and grids</strong>: the extractor flattens tables, so
                  rows and columns lose their pairing and the bot invents class times. Text-only
                  documents (menus, policies, forms) extract correctly — leave those indexed.
                </Typography>
              </Box>
            </Box>
            <Textarea
              aria-label="Excluded file patterns"
              placeholder={'group fitness schedule\n/uploads/documents/schedules/\n*timetable*.pdf'}
              value={settings.excludedFilePatterns.join('\n')}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setSettings({
                  ...settings,
                  excludedFilePatterns: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean),
                })
              }
            />
          </Section>

          <Section title="Teamup calendar">
            <Box paddingBottom={3}>
              <Typography textColor="neutral600" variant="pi">
                Pulls a rolling window of the Teamup calendar into the knowledge base so the bot can
                answer "what's on". Repeating events are collapsed into a single document describing
                the pattern and date range, rather than one document per occurrence. Each sync also
                removes events that have dropped out of the window, so past events stop being
                answered. The calendar and its credentials come from the
                <code>TEAMUP_CALENDAR_KEY</code> and <code>TEAMUP_TOKEN</code> environment variables —
                deploy-time config, nothing calendar-identifying is typed here.
              </Typography>
            </Box>
            <Grid.Root gap={4}>
              <Grid.Item col={12} s={12} direction="column" alignItems="stretch">
                <Flex direction="column" gap={1} alignItems="flex-start">
                  <Typography variant="pi" fontWeight="bold">Teamup sync enabled</Typography>
                  <Toggle
                    onLabel="On"
                    offLabel="Off"
                    checked={settings.teamup.enabled}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSettings({ ...settings, teamup: { ...settings.teamup, enabled: e.target.checked } })
                    }
                  />
                </Flex>
              </Grid.Item>
              <Grid.Item col={6} s={12} direction="column" alignItems="stretch">
                <Flex direction="column" gap={1} alignItems="stretch">
                  <Typography variant="pi" fontWeight="bold">Days before today</Typography>
                  <TextInput
                    aria-label="Days before today"
                    type="number"
                    value={String(settings.teamup.daysBefore)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSettings({
                        ...settings,
                        teamup: { ...settings.teamup, daysBefore: Math.max(0, Number(e.target.value) || 0) },
                      })
                    }
                  />
                </Flex>
              </Grid.Item>
              <Grid.Item col={6} s={12} direction="column" alignItems="stretch">
                <Flex direction="column" gap={1} alignItems="stretch">
                  <Typography variant="pi" fontWeight="bold">Days after today</Typography>
                  <TextInput
                    aria-label="Days after today"
                    type="number"
                    value={String(settings.teamup.daysAfter)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSettings({
                        ...settings,
                        teamup: { ...settings.teamup, daysAfter: Math.max(0, Number(e.target.value) || 0) },
                      })
                    }
                  />
                </Flex>
              </Grid.Item>
            </Grid.Root>

            <Box paddingTop={4}>
              <Flex gap={2} alignItems="center" marginBottom={3}>
                <Button variant="tertiary" onClick={() => void loadSubcalendars(true)} loading={busy === 'teamup-cals'} disabled={buttonsDisabled}>
                  Reload calendars
                </Button>
                <Typography variant="pi" textColor="neutral600">
                  {settings.teamup.subcalendarIds.length === 0
                    ? `No calendars ticked — all ${subcals ? subcals.length : ''} will be pulled.`
                    : `${settings.teamup.subcalendarIds.length} of ${subcals?.length ?? '?'} calendar(s) ticked.`}
                </Typography>
              </Flex>
              {subcalError && (
                <Box background="danger100" hasRadius padding={3} marginBottom={3}>
                  <Typography textColor="danger700" variant="pi">
                    Could not load calendars: {subcalError}
                  </Typography>
                </Box>
              )}
              {subcals && (
                <Grid.Root gap={2}>
                  {subcals.map((c) => (
                    <Grid.Item key={c.id} col={6} s={12} direction="column" alignItems="flex-start">
                      <Checkbox
                        checked={settings.teamup.subcalendarIds.includes(c.id)}
                        onCheckedChange={() => toggleSubcal(c.id)}
                      >
                        {c.name}
                      </Checkbox>
                    </Grid.Item>
                  ))}
                </Grid.Root>
              )}
            </Box>

            <Box paddingTop={4}>
              <Flex gap={2} wrap="wrap">
                <Button variant="secondary" onClick={() => void runTeamupPreview()} loading={busy === 'teamup-preview'} disabled={buttonsDisabled || teamupBlocked}>
                  Preview (no changes)
                </Button>
                <Button variant="default" onClick={() => void runTeamupSync()} loading={busy === 'teamup-sync'} disabled={buttonsDisabled || teamupBlocked}>
                  Sync Teamup now
                </Button>
              </Flex>
              <Box paddingTop={2}>
                <Typography variant="pi" textColor={unsaved || !teamupStoredEnabled ? 'danger600' : 'neutral600'}>
                  {unsaved
                    ? 'You have unsaved changes. Preview and sync read the stored settings — click “Save settings” first.'
                    : !teamupStoredEnabled
                      ? 'Teamup is disabled in the stored settings. Tick “Enable” above, then click “Save settings”.'
                      : 'Preview and sync read the stored settings.'}
                </Typography>
              </Box>
            </Box>

            {preview && (
              <Box paddingTop={4}>
                <Typography variant="pi" fontWeight="bold">
                  Preview {preview.window.from} → {preview.window.to}: {preview.fetched} events → {preview.series} documents
                </Typography>
                <Box paddingTop={2}>
                  {preview.sample.map((x) => (
                    <Box key={x.title} background="neutral100" hasRadius padding={3} marginBottom={2}>
                      <Typography variant="pi" fontWeight="bold">
                        {x.title} — {x.occurrences} occurrence(s), {x.recurring ? 'recurring' : 'one-off'}
                      </Typography>
                      <pre style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0', fontSize: 12 }}>{x.markdown}</pre>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Section>
          </>
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
                    <Typography variant="pi" textColor="neutral800" fontFamily="mono">
                      {ct.uid}{' '}
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
            onClick={() => runIndexAll(false)}
            disabled={buttonsDisabled}
            loading={busy === 'index-check'}
            variant="tertiary"
          >
            Check indexes
          </Button>
          <Button
            onClick={() => runIndexAll(true)}
            disabled={buttonsDisabled}
            loading={busy === 'index-build'}
            variant="secondary"
          >
            Build missing indexes
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
                <Th>
                  <Typography variant="sigma" textColor="neutral800">Document name</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma" textColor="neutral800">Type</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma" textColor="neutral800">EL doc ID</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma" textColor="neutral800">Synced</Typography>
                </Th>
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
                  <Td>
                    <Typography variant="pi" textColor="neutral800" fontFamily="mono">
                      {d.documentName}
                    </Typography>
                  </Td>
                  <Td>
                    <Typography variant="pi" textColor="neutral800">{d.elDocType}</Typography>
                  </Td>
                  <Td>
                    <Typography variant="pi" textColor="neutral600" fontFamily="mono">
                      {d.elDocumentId}
                    </Typography>
                  </Td>
                  <Td>
                    <Typography variant="pi" textColor="neutral800">
                      {new Date(d.syncedAt).toLocaleString()}
                    </Typography>
                  </Td>
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
