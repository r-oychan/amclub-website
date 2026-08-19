/**
 * Admin endpoints for the Teamup integration.
 *
 *   GET  /teamup/subcalendars  — list calendars so the admin UI can offer
 *                                checkboxes instead of hand-typed ids.
 *   POST /teamup/sync          — pull the window and reconcile into the KB.
 *   GET  /teamup/preview       — dry run: what WOULD be pushed, without
 *                                writing anything. Lets staff sanity-check
 *                                the whitelist and window before syncing.
 */

import { PLUGIN_ID, readRuntimeSettings, getSiteUrl } from '../utils';
import type * as TeamupService from '../services/teamup';

interface Ctx {
  query: Record<string, string | undefined>;
  body: unknown;
  badRequest: (msg: string) => void;
  throw: (status: number, msg: string) => void;
}

interface StrapiArg { strapi: unknown }

function svc(): typeof TeamupService {
  return strapi.plugin(PLUGIN_ID).service('teamup') as typeof TeamupService;
}

export default ({ strapi: _ }: StrapiArg) => ({
  async subcalendars(ctx: Ctx): Promise<void> {
    const settings = await readRuntimeSettings(strapi as never);
    const key = ctx.query.calendarKey || settings.teamup.calendarKey;
    if (!key) return ctx.badRequest('No Teamup calendar key configured');
    try {
      ctx.body = { subcalendars: await svc().listSubcalendars(key) };
    } catch (err) {
      ctx.body = { subcalendars: [], error: (err as Error).message };
    }
  },

  async preview(ctx: Ctx): Promise<void> {
    const settings = await readRuntimeSettings(strapi as never);
    const t = settings.teamup;
    if (!t.calendarKey) return ctx.badRequest('No Teamup calendar key configured');
    try {
      const s = svc();
      const { events, window } = await s.fetchEvents(t);
      const names = new Map<number, string>();
      try { for (const c of await s.listSubcalendars(t.calendarKey)) names.set(c.id, c.name); } catch { /* names are cosmetic */ }
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
    try {
      ctx.body = await svc().syncTeamup(strapi as never);
    } catch (err) {
      ctx.throw(502, `Teamup sync failed: ${(err as Error).message}`);
    }
  },
});
