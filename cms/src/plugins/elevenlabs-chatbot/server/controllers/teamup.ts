/**
 * Admin endpoints for the Teamup integration.
 *
 *   GET  /teamup/subcalendars  — list calendars so the admin UI can offer
 *                                checkboxes instead of hand-typed ids.
 *   POST /teamup/sync          — pull the window and reconcile into the KB.
 *   GET  /teamup/preview       — dry run: what WOULD be pushed, without
 *                                writing anything. Lets staff sanity-check
 *                                the whitelist and window before syncing.
 *
 * The calendar key and token both come from env (TEAMUP_CALENDAR_KEY /
 * TEAMUP_TOKEN) — nothing calendar-identifying is typed on the settings page.
 */

import { PLUGIN_ID, readRuntimeSettings, getSiteUrl } from '../utils';
import type * as TeamupService from '../services/teamup';

interface Ctx {
  query: Record<string, string | undefined>;
  body: unknown;
  status: number;
  badRequest: (msg: string) => void;
  throw: (status: number, msg: string) => void;
}

interface StrapiArg { strapi: unknown }

function svc(): typeof TeamupService {
  return strapi.plugin(PLUGIN_ID).service('teamup') as typeof TeamupService;
}

/** Human-readable reason the integration can't run, or null when it can. */
function missingConfig(): string | null {
  const c = svc().teamupConfigured();
  const missing = [!c.calendarKey && 'TEAMUP_CALENDAR_KEY', !c.token && 'TEAMUP_TOKEN'].filter(Boolean);
  return missing.length ? `Missing env var(s): ${missing.join(', ')}` : null;
}

export default ({ strapi: _ }: StrapiArg) => ({
  async subcalendars(ctx: Ctx): Promise<void> {
    const missing = missingConfig();
    if (missing) return ctx.badRequest(missing);
    try {
      ctx.body = { subcalendars: await svc().listSubcalendars() };
    } catch (err) {
      // Surface upstream failures as an error status rather than a 200 with an
      // empty list — a silently empty calendar grid reads as "no calendars
      // exist" instead of "the call failed", which is how a bad key first
      // presented in the admin UI.
      ctx.throw(502, `Teamup: ${(err as Error).message}`);
    }
  },

  async preview(ctx: Ctx): Promise<void> {
    const missing = missingConfig();
    if (missing) return ctx.badRequest(missing);
    const settings = await readRuntimeSettings(strapi as never);
    try {
      const s = svc();
      const { events, window } = await s.fetchEvents(settings.teamup);
      const names = new Map<number, string>();
      try { for (const c of await s.listSubcalendars()) names.set(c.id, c.name); } catch { /* names are cosmetic */ }
      const series = s.collapseSeries(events);
      ctx.body = {
        window,
        fetched: events.length,
        series: series.length,
        recurring: series.filter((x) => x.recurring).length,
        oneOff: series.filter((x) => !x.recurring).length,
        sample: series.slice(0, 8).map((x) => ({
          title: x.title,
          occurrences: x.occurrences.length,
          recurring: x.recurring,
          markdown: s.renderSeriesMarkdown(x, names, getSiteUrl(strapi as never)),
        })),
      };
    } catch (err) {
      ctx.throw(502, `Teamup preview failed: ${(err as Error).message}`);
    }
  },

  async sync(ctx: Ctx): Promise<void> {
    const missing = missingConfig();
    if (missing) return ctx.badRequest(missing);
    try {
      ctx.body = await svc().syncTeamup(strapi as never);
    } catch (err) {
      ctx.throw(502, `Teamup sync failed: ${(err as Error).message}`);
    }
  },
});
