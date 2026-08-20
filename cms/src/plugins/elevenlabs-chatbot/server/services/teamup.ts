/**
 * Teamup calendar → ElevenLabs knowledge base.
 *
 * The club's operational calendar lives in Teamup. Members ask the bot
 * "what's on this weekend" / "when is Pilates", so a rolling window of the
 * calendar is pushed into the KB as text docs.
 *
 * THE SHAPE PROBLEM: a 60-day window returns ~1,900 event occurrences but
 * only ~120 distinct titles — the calendar is dominated by weekly recurring
 * classes and court bookings. Pushing one doc per occurrence would flood the
 * KB with near-identical records and bury the one-off events members actually
 * ask about. So occurrences are COLLAPSED into one doc per series, carrying
 * the recurrence pattern plus the first/last date in the window:
 *
 *   Pilates Matwork — every Wednesday, 8:00 AM – 9:00 AM, Quad Studio
 *   Runs 20 Aug 2026 – 15 Oct 2026 (9 sessions in this window)
 *
 * One-off events keep their exact date and are rendered individually.
 */

import * as client from './client';
import { refreshAgentKnowledgeBase } from './sync';
import {
  PLUGIN_ID,
  SYNC_LOG_UID,
  getSiteUrl,
  getTeamupCalendarKey,
  getTeamupToken,
  readRuntimeSettings,
  type TeamupSettings,
} from '../utils';

const TEAMUP_API = 'https://api.teamup.com';
/** Doc-name segment marking Teamup-sourced docs; used for stale cleanup. */
export const TEAMUP_DOC_SEGMENT = 'teamup';

export interface TeamupEvent {
  id: string;
  series_id?: number | null;
  title: string;
  start_dt: string;
  end_dt: string;
  all_day?: boolean;
  location?: string | null;
  who?: string | null;
  notes?: string | null;
  rrule?: string | null;
  subcalendar_ids?: number[];
}

export interface TeamupSubcalendar {
  id: number;
  name: string;
  active?: boolean;
}

interface Strapi {
  db: { query: (uid: string) => {
    findOne: (o: { where: Record<string, unknown> }) => Promise<unknown>;
    findMany: (o?: { where?: Record<string, unknown> }) => Promise<unknown[]>;
    create: (o: { data: Record<string, unknown> }) => Promise<unknown>;
    update: (o: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
    delete: (o: { where: Record<string, unknown> }) => Promise<unknown>;
  } };
  log: { info: (...a: unknown[]) => void; warn: (...a: unknown[]) => void };
  plugin: (id: string) => { config: <T>(key?: string) => T };
  config: { get: <T>(k: string, d?: T) => T };
  store: (o: { type: string; name: string }) => {
    get: (o: { key: string }) => Promise<unknown>;
    set: (o: { key: string; value: unknown }) => Promise<unknown>;
  };
  contentTypes: Record<string, unknown>;
}

export interface TeamupSyncResult {
  window: { from: string; to: string };
  fetched: number;
  series: number;
  created: number;
  updated: number;
  skipped: number;
  deleted: number;
  errors: string[];
}

// ── Auth ─────────────────────────────────────────────────────────────
// The Teamup API token is a SECRET and lives in env only — never in the
// plugin store, which is world-readable to any admin and ends up in DB
// backups. The calendar key (a non-secret path segment) is a setting.
function teamupToken(): string {
  const t = getTeamupToken();
  if (!t) throw new Error('Missing TEAMUP_TOKEN env var');
  return t;
}

function calendarKey(): string {
  const k = getTeamupCalendarKey();
  if (!k) throw new Error('Missing TEAMUP_CALENDAR_KEY env var');
  return k;
}

/** Both env vars present? Used by the admin UI to explain what is missing. */
export function teamupConfigured(): { token: boolean; calendarKey: boolean } {
  return { token: !!getTeamupToken(), calendarKey: !!getTeamupCalendarKey() };
}

async function teamupGet<T>(path: string): Promise<T> {
  const res = await fetch(`${TEAMUP_API}${path}`, {
    headers: { Accept: 'application/json', 'Teamup-Token': teamupToken() },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Teamup GET ${path} → ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 300)}` : ''}`);
  }
  return (await res.json()) as T;
}

export async function listSubcalendars(): Promise<TeamupSubcalendar[]> {
  const r = await teamupGet<{ subcalendars: TeamupSubcalendar[] }>(`/${calendarKey()}/subcalendars`);
  return r.subcalendars ?? [];
}

// ── Window + fetch ───────────────────────────────────────────────────

/** Club days roll over in Singapore, not UTC — containers run in UTC. */
function sgtToday(): Date {
  const iso = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
  return new Date(`${iso}T00:00:00Z`);
}

const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

export function computeWindow(s: Pick<TeamupSettings, 'daysBefore' | 'daysAfter'>): { from: string; to: string } {
  const today = sgtToday();
  const from = new Date(today);
  from.setUTCDate(from.getUTCDate() - Math.max(0, s.daysBefore));
  const to = new Date(today);
  to.setUTCDate(to.getUTCDate() + Math.max(0, s.daysAfter));
  return { from: isoDate(from), to: isoDate(to) };
}

export async function fetchEvents(s: TeamupSettings): Promise<{ events: TeamupEvent[]; window: { from: string; to: string } }> {
  const window = computeWindow(s);
  const params = new URLSearchParams({ startDate: window.from, endDate: window.to });
  for (const id of s.subcalendarIds) params.append('subcalendarId[]', String(id));
  const r = await teamupGet<{ events: TeamupEvent[] }>(`/${calendarKey()}/events?${params.toString()}`);
  return { events: r.events ?? [], window };
}

// ── Series collapsing ────────────────────────────────────────────────

export interface CollapsedSeries {
  key: string;
  title: string;
  occurrences: TeamupEvent[];
  recurring: boolean;
}

/**
 * Group occurrences into series.
 *
 * Teamup gives recurring occurrences a shared `series_id`, but not always —
 * some recurring rows carry only an `rrule` and an id of the form
 * "<masterId>-rid-<timestamp>". So the grouping key falls back through:
 * series_id → master id parsed off the occurrence id → title+time signature.
 * Anything that ends up alone in its bucket is treated as a one-off.
 */
export function collapseSeries(events: TeamupEvent[]): CollapsedSeries[] {
  const buckets = new Map<string, CollapsedSeries>();
  for (const e of events) {
    const masterId = e.id.includes('-rid-') ? e.id.split('-rid-')[0] : null;
    const key = e.series_id
      ? `s${e.series_id}`
      : masterId
        ? `m${masterId}`
        : `t${e.title}|${e.start_dt.slice(11, 16)}|${e.location ?? ''}`;
    const existing = buckets.get(key);
    if (existing) existing.occurrences.push(e);
    else buckets.set(key, { key, title: e.title, occurrences: [e], recurring: false });
  }
  for (const b of buckets.values()) {
    b.occurrences.sort((a, z) => a.start_dt.localeCompare(z.start_dt));
    b.recurring = b.occurrences.length > 1 || !!b.occurrences[0].rrule;
  }
  return Array.from(buckets.values()).sort(
    (a, z) => a.occurrences[0].start_dt.localeCompare(z.occurrences[0].start_dt) || a.title.localeCompare(z.title),
  );
}

// ── Rendering ────────────────────────────────────────────────────────

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Teamup timestamps carry a +08:00 offset; slice rather than re-zone. */
const dPart = (dt: string): string => dt.slice(0, 10);
const tPart = (dt: string): string => dt.slice(11, 16);

function prettyDate(dt: string): string {
  const [y, m, d] = dPart(dt).split('-').map(Number);
  const day = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${day}, ${d} ${MONTHS[m - 1]} ${y}`;
}

/** 24h "18:30" → "6:30 PM". Uppercase AM/PM is the project's house style. */
function prettyTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Distinct weekdays the series lands on, in week order. */
function weekdaysOf(occ: TeamupEvent[]): string[] {
  const seen = new Set<number>();
  for (const e of occ) seen.add(weekdayIndex(e.start_dt));
  return [...seen].sort((a, b) => a - b).map((i) => DAYS[i]);
}

function weekdayIndex(dt: string): number {
  const [y, m, d] = dPart(dt).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${dPart(b)}T00:00:00Z`) - Date.parse(`${dPart(a)}T00:00:00Z`)) / 86400000);
}

/**
 * Describe how often a series runs, from the ACTUAL occurrence gaps rather
 * than from the weekday alone.
 *
 * Saying "every Wednesday" for a club that meets on two Wednesdays five weeks
 * apart is a confident falsehood — precisely the failure mode this pipeline
 * exists to avoid. When the spacing doesn't fit a clean weekly/fortnightly/
 * monthly pattern, list the real dates instead of inventing a cadence.
 */
function describeCadence(occ: TeamupEvent[]): string {
  const days = weekdaysOf(occ);
  if (occ.length === 1) return prettyDate(occ[0].start_dt);

  const gaps: number[] = [];
  for (let i = 1; i < occ.length; i += 1) gaps.push(daysBetween(occ[i - 1].start_dt, occ[i].start_dt));
  const sorted = [...gaps].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const maxGap = sorted[sorted.length - 1];

  // Several sessions a week: gaps alternate (e.g. 2,5,2,5) but never exceed a week.
  if (days.length === 7 && maxGap <= 8) return 'Every day';
  if (days.length > 1 && maxGap <= 8) return `Every ${days.join(', ')}`;
  if (days.length === 1 && median >= 6 && median <= 8) return `Every ${days[0]}`;
  if (days.length === 1 && median >= 13 && median <= 16) return `Every other ${days[0]}`;
  if (median >= 27 && median <= 32) return `Monthly, on a ${days[0]}`;
  // Irregular — enumerate rather than guess.
  if (occ.length <= 6) return `On ${occ.map((e) => prettyDate(e.start_dt)).join('; ')}`;
  return `${occ.length} sessions on ${days.join(', ')} (dates vary)`;
}

/** One time range if every occurrence shares it, else null. */
function commonTimeRange(occ: TeamupEvent[]): string | null {
  if (occ[0].all_day) return occ.every((e) => e.all_day) ? 'All day' : null;
  const set = new Set(occ.map((e) => `${tPart(e.start_dt)}-${tPart(e.end_dt)}`));
  if (set.size !== 1) return null;
  return `${prettyTime(tPart(occ[0].start_dt))} – ${prettyTime(tPart(occ[0].end_dt))}`;
}

export function renderSeriesMarkdown(
  s: CollapsedSeries,
  subcalNames: Map<number, string>,
  siteUrl: string,
): string {
  const first = s.occurrences[0];
  const last = s.occurrences[s.occurrences.length - 1];
  const lines: string[] = [`## ${s.title}`, ''];

  const cadence = describeCadence(s.occurrences);
  const time = commonTimeRange(s.occurrences);
  lines.push(`**When:** ${cadence}${time ? `, ${time}` : ''}`);
  if (!time) {
    // Times differ between sessions — stating one would misinform, so give
    // the per-session breakdown (capped) instead.
    const shown = s.occurrences.slice(0, 8);
    for (const e of shown) {
      const t = e.all_day ? 'All day' : `${prettyTime(tPart(e.start_dt))} – ${prettyTime(tPart(e.end_dt))}`;
      lines.push(`- ${prettyDate(e.start_dt)}: ${t}`);
    }
    if (s.occurrences.length > shown.length) lines.push(`- …and ${s.occurrences.length - shown.length} more`);
  }
  if (s.occurrences.length > 1) {
    lines.push(
      `**Runs:** ${prettyDate(first.start_dt)} to ${prettyDate(last.start_dt)} ` +
        `(${s.occurrences.length} session${s.occurrences.length === 1 ? '' : 's'} in this period)`,
    );
  }

  if (first.location) lines.push(`**Where:** ${first.location}`);
  if (first.who) lines.push(`**Who:** ${first.who}`);
  const cals = (first.subcalendar_ids ?? []).map((id) => subcalNames.get(id)).filter(Boolean);
  if (cals.length) lines.push(`**Calendar:** ${cals.join(', ')}`);

  const notes = (first.notes ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (notes) lines.push('', notes);

  // Per-chunk Source line — RAG retrieves chunks, and the widget renders this
  // as the citation chip. Teamup events have no public detail page, so the
  // calendar page is the closest landing spot.
  lines.push('', `Source: [What's On](${siteUrl}/whats-on)`);
  return lines.join('\n');
}

export function buildSeriesDocName(prefix: string, s: CollapsedSeries): string {
  const slug = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'event';
  return `${prefix}${TEAMUP_DOC_SEGMENT}:${slug}:${s.key}`;
}

// ── Sync ─────────────────────────────────────────────────────────────

interface SyncLogRow {
  id: number;
  sourceKind: string;
  elDocumentId: string;
  documentName: string;
  contentHash: string | null;
}

function sha256(s: string): string {
  // Lazy require keeps this module importable from the admin type-check pass.
  return require('node:crypto').createHash('sha256').update(s).digest('hex');
}

function docPrefix(strapi: Strapi): string {
  return strapi.config.get<{ docNamePrefix?: string }>(`plugin::${PLUGIN_ID}`)?.docNamePrefix ?? 'am-club:';
}

/**
 * Pull the configured window from Teamup and reconcile it into the KB.
 *
 * Reconciliation is by doc name: anything under the `<prefix>teamup:` segment
 * that is no longer in the window gets deleted. That is what expires past
 * events — no separate cron needed, because each run recomputes the window
 * from today and drops whatever fell out of the back of it.
 */
export async function syncTeamup(strapi: Strapi): Promise<TeamupSyncResult> {
  const settings = await readRuntimeSettings(strapi as never);
  const t = settings.teamup;
  const result: TeamupSyncResult = {
    window: { from: '', to: '' },
    fetched: 0, series: 0, created: 0, updated: 0, skipped: 0, deleted: 0, errors: [],
  };
  if (!t.enabled) { result.errors.push('Teamup sync is disabled in settings'); return result; }
  const cfg = teamupConfigured();
  if (!cfg.calendarKey) { result.errors.push('Missing TEAMUP_CALENDAR_KEY env var'); return result; }
  if (!cfg.token) { result.errors.push('Missing TEAMUP_TOKEN env var'); return result; }

  const { events, window } = await fetchEvents(t);
  result.window = window;
  result.fetched = events.length;

  const subcalNames = new Map<number, string>();
  try {
    for (const c of await listSubcalendars()) subcalNames.set(c.id, c.name);
  } catch (e) {
    strapi.log.warn(`[${PLUGIN_ID}] could not load subcalendar names: ${(e as Error).message}`);
  }

  const series = collapseSeries(events);
  result.series = series.length;

  const prefix = docPrefix(strapi);
  const siteUrl = getSiteUrl(strapi as never);
  const q = strapi.db.query(SYNC_LOG_UID);
  const wanted = new Set<string>();

  for (const s of series) {
    const documentName = buildSeriesDocName(prefix, s);
    wanted.add(documentName);
    const text = renderSeriesMarkdown(s, subcalNames, siteUrl);
    const hash = sha256(text);
    try {
      const existing = (await q.findOne({ where: { documentName } })) as SyncLogRow | null;
      if (existing && existing.contentHash === hash) { result.skipped += 1; continue; }
      if (existing) {
        // Text docs are immutable in the ElevenLabs API — replace, don't edit.
        try { await client.deleteDoc(strapi as never, existing.elDocumentId); }
        catch (e) { strapi.log.warn(`[${PLUGIN_ID}] teamup: stale doc delete failed: ${(e as Error).message}`); }
      }
      const created = await client.createTextDoc(strapi as never, { text, name: documentName });
      if (existing) {
        await q.update({ where: { id: existing.id }, data: { elDocumentId: created.id, contentHash: hash, syncedAt: new Date().toISOString() } });
        result.updated += 1;
      } else {
        await q.create({ data: {
          sourceKind: 'teamup-series',
          contentType: null, entryId: null, mediaFileId: null,
          ownerContentType: null, ownerEntryId: null,
          elDocType: 'text',
          elDocumentId: created.id,
          documentName,
          contentHash: hash,
          syncedAt: new Date().toISOString(),
        } });
        result.created += 1;
      }
      // Attaching a doc does not build its retrieval index — without this the
      // doc is invisible to RAG (the exact gap that hid 17 events on prod).
      try { await client.requestRagIndex(strapi as never, created.id); }
      catch (e) { strapi.log.warn(`[${PLUGIN_ID}] teamup: index request failed for ${documentName}: ${(e as Error).message}`); }
    } catch (e) {
      result.errors.push(`${s.title}: ${(e as Error).message.slice(0, 160)}`);
    }
  }

  // Expire anything that dropped out of the window (past events, cancellations).
  const teamupPrefix = `${prefix}${TEAMUP_DOC_SEGMENT}:`;
  const rows = (await q.findMany({ where: { sourceKind: 'teamup-series' } })) as SyncLogRow[];
  for (const row of rows) {
    if (!row.documentName.startsWith(teamupPrefix)) continue;
    if (wanted.has(row.documentName)) continue;
    try { await client.deleteDoc(strapi as never, row.elDocumentId); }
    catch (e) { strapi.log.warn(`[${PLUGIN_ID}] teamup: failed to drop ${row.elDocumentId}: ${(e as Error).message}`); }
    await q.delete({ where: { id: row.id } });
    result.deleted += 1;
  }

  // New/removed docs only reach the agent when its knowledge_base list is
  // re-PATCHed — creating the doc alone leaves it detached.
  if (result.created || result.updated || result.deleted) {
    try { await refreshAgentKnowledgeBase(strapi as never); }
    catch (e) { result.errors.push(`agent attach: ${(e as Error).message.slice(0, 160)}`); }
  }

  strapi.log.info(
    `[${PLUGIN_ID}] teamup ${window.from}→${window.to}: ${result.fetched} events → ${result.series} series ` +
      `(+${result.created} ~${result.updated} =${result.skipped} -${result.deleted})`,
  );
  return result;
}
