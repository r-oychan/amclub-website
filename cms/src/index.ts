// import type { Core } from '@strapi/strapi';
// Lifecycle hooks for ElevenLabs KB sync now live in the elevenlabs-chatbot plugin
// (cms/src/plugins/elevenlabs-chatbot). It registers its own bootstrap.

import { createHmac } from 'node:crypto';

const PUBLIC_FIND_TYPES = [
  'api::home-page.home-page',
  'api::about-page.about-page',
  'api::dining-page.dining-page',
  'api::fitness-page.fitness-page',
  'api::kids-page.kids-page',
  'api::membership-page.membership-page',
  'api::joining-fees-page.joining-fees-page',
  'api::referral-page.referral-page',
  // Membership/about subpages — these were granted ad-hoc in dev's admin and
  // never listed here, so fresh environments 403'd them (caught on the uat
  // rebuild: public GET worked on dev, Forbidden on uat).
  'api::niche-group-membership-page.niche-group-membership-page',
  'api::reciprocal-clubs-page.reciprocal-clubs-page',
  'api::start-application-page.start-application-page',
  'api::advertise-with-us-page.advertise-with-us-page',
  'api::event-spaces-page.event-spaces-page',
  'api::whats-on-page.whats-on-page',
  'api::header.header',
  'api::footer.footer',
  'api::site-config.site-config',
  'api::event.event',
  'api::event-category.event-category',
  'api::testimonial.testimonial',
  'api::faq-item.faq-item',
  'api::faq-category.faq-category',
  'api::faq-page.faq-page',
  'api::restaurant.restaurant',
  // Section 2 (Fitness) — per-discipline coach collections (replaced the
  // legacy `coach` collection, now removed).
  'api::aquatics-coach.aquatics-coach',
  'api::tennis-coach.tennis-coach',
  'api::pilates-instructor.pilates-instructor',
  'api::gym-trainer.gym-trainer',
  'api::committee-member.committee-member',
  'api::gallery-album.gallery-album',
  'api::gallery-page.gallery-page',
  'api::news-article.news-article',
  'api::news-page.news-page',
  'api::contact-us-page.contact-us-page',
  'api::dining-promotion.dining-promotion',
  'api::dining-promotions-page.dining-promotions-page',
  // Section 2 — replaces legacy `facility` for fitness venues. Other
  // sections (kids / event-spaces / membership / home-sub) currently
  // render from subpages.ts static fallback and will get their own
  // per-section collections later.
  'api::fitness-facility.fitness-facility',
  // Section 3 — replaces legacy `facility` rows for /kids/:slug.
  'api::kids-experience.kids-experience',
  // Section 4 — replaces legacy `venue` (deleted) + `facility` rows for
  // /event-spaces/:slug.
  'api::event-space.event-space',
];

async function grantPublicReadAccess(strapi: any) {
  const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });
  if (!publicRole) {
    strapi.log.warn('[bootstrap] public role not found, skipping permission setup');
    return;
  }

  const desiredActions: string[] = [];
  for (const uid of PUBLIC_FIND_TYPES) {
    desiredActions.push(`${uid}.find`, `${uid}.findOne`);
  }
  // upload plugin: allow finding files (so media URLs resolve when populated)
  desiredActions.push('plugin::upload.content-api.find', 'plugin::upload.content-api.findOne');

  let added = 0;
  for (const action of desiredActions) {
    const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
      where: { action, role: publicRole.id },
    });
    if (existing) continue;
    await strapi.db.query('plugin::users-permissions.permission').create({
      data: { action, role: publicRole.id },
    });
    added += 1;
  }
  if (added > 0) {
    strapi.log.info(`[bootstrap] granted public read access for ${added} action(s)`);
  }
}

// One-time backfill: existing media files seeded by the content migration
// script were uploaded with a default Blob (no type), so their mime ended up
// as 'application/octet-stream'. The Strapi admin Media Library filters by
// mime category and hides those rows, even though the public site still
// renders them via URL. This step re-detects the mime from the filename and
// updates each affected row. Self-disabling: once all rows are fixed, the
// query returns nothing and the function is a no-op.
const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  pdf: 'application/pdf',
};

function mimeFromFilename(filename: string): string | null {
  const dot = filename.lastIndexOf('.');
  if (dot < 0) return null;
  const ext = filename.slice(dot + 1).toLowerCase();
  return MIME_BY_EXT[ext] ?? null;
}

async function backfillUploadMimes(strapi: any) {
  const stale = await strapi.db.query('plugin::upload.file').findMany({
    where: { mime: 'application/octet-stream' },
    select: ['id', 'name', 'ext'],
  });
  if (stale.length === 0) return;

  let fixed = 0;
  for (const f of stale) {
    const mime = mimeFromFilename(f.name) ?? mimeFromFilename(f.ext ?? '');
    if (!mime) continue;
    await strapi.db.query('plugin::upload.file').update({
      where: { id: f.id },
      data: { mime },
    });
    fixed += 1;
  }
  strapi.log.info(`[bootstrap] backfilled mime on ${fixed}/${stale.length} upload row(s)`);
}

// Expiry-driven KB cleanup. Listing endpoints already hide past entries
// (see cms/src/utils/expiry-filter.ts), but the ElevenLabs chatbot KB
// holds an independent snapshot per entry. This cron iterates the two
// expiry-aware collections, finds rows whose date passed since the last
// tick, and asks the elevenlabs-chatbot plugin to drop them from the KB.
// Strapi keeps the entry rows themselves (URL stays alive).
//
// Hourly cadence is enough — KB hygiene doesn't need minute precision,
// and listing-side filtering already gives instant user-facing effect.
async function sweepExpiredKbDocs(strapi: any) {
  const today = new Date().toISOString().slice(0, 10);
  const targets: { uid: string; field: string }[] = [
    { uid: 'api::event.event', field: 'date' },
    { uid: 'api::dining-promotion.dining-promotion', field: 'validTo' },
  ];
  let dropped = 0;
  const unsync = strapi.plugin('elevenlabs-chatbot')?.service('sync')?.unsyncEntryBySlug;
  if (typeof unsync !== 'function') {
    strapi.log.warn('[expiry-cron] elevenlabs-chatbot.sync.unsyncEntryBySlug not available');
    return;
  }
  for (const { uid, field } of targets) {
    let rows: { slug?: string }[] = [];
    try {
      rows = await strapi.db.query(uid).findMany({
        where: { [field]: { $lt: today } },
        select: ['slug'],
        limit: 500,
      });
    } catch (e) {
      strapi.log.warn(`[expiry-cron] failed to query ${uid}: ${(e as Error).message}`);
      continue;
    }
    for (const r of rows) {
      if (!r.slug) continue;
      try {
        const res = await unsync(strapi, uid, r.slug);
        if (res?.status === 'deleted') dropped += 1;
      } catch (e) {
        strapi.log.warn(`[expiry-cron] ${uid}/${r.slug}: ${(e as Error).message}`);
      }
    }
  }
  if (dropped > 0) {
    strapi.log.info(`[expiry-cron] removed ${dropped} expired entr(ies) from ElevenLabs KB`);
  }
}

// Ensure a deterministic read-only API token named "preview" exists, whose
// access key equals env.PREVIEW_TOKEN. The frontend's Preview mode sends this
// token (handed to it by Strapi's preview handler URL) so it can fetch DRAFT
// content. We hash the raw value exactly as Strapi does (HMAC-SHA512 with the
// apiToken salt) and upsert the row — reproducible across deploys, no manual
// token creation in /admin. Read-only type → find/findOne on all types, nothing
// more. Skips quietly if PREVIEW_TOKEN is unset (e.g. local dev without it).
async function ensurePreviewToken(strapi: any) {
  const raw = process.env.PREVIEW_TOKEN;
  if (!raw) {
    strapi.log.info('[bootstrap] PREVIEW_TOKEN unset — skipping preview token');
    return;
  }
  const salt = strapi.config.get('admin.apiToken.salt') || process.env.API_TOKEN_SALT;
  if (!salt) {
    strapi.log.warn('[bootstrap] apiToken salt missing — cannot manage preview token');
    return;
  }
  const accessKey = createHmac('sha512', salt).update(raw).digest('hex');
  const existing = await strapi.db.query('admin::api-token').findOne({ where: { name: 'preview' } });
  if (!existing) {
    await strapi.db.query('admin::api-token').create({
      data: {
        name: 'preview',
        description: 'Read-only token for the frontend draft Preview (auto-managed by bootstrap).',
        type: 'read-only',
        accessKey,
        lifespan: null,
        expiresAt: null,
      },
    });
    strapi.log.info('[bootstrap] created read-only preview API token');
  } else if (existing.accessKey !== accessKey) {
    await strapi.db.query('admin::api-token').update({
      where: { id: existing.id },
      data: { accessKey, type: 'read-only' },
    });
    strapi.log.info('[bootstrap] refreshed preview API token key');
  }
}

// Document Service middleware: for a request that is BOTH asking for drafts
// (?status=draft) AND authenticated (Authorization header — an invalid token is
// rejected upstream, so reaching here means a valid one), flip the read status
// to 'draft'. This is the single chokepoint that overrides the hardcoded
// `status: 'published'` in every custom controller, so Preview shows unpublished
// content without editing ~20 controllers. Public (token-less) requests are
// untouched, so drafts never leak to the live site.
function registerPreviewStatusMiddleware(strapi: any) {
  const READ_ACTIONS = new Set(['findMany', 'findOne', 'findFirst', 'count']);
  strapi.documents.use((ctx: any, next: any) => {
    if (READ_ACTIONS.has(ctx.action)) {
      const req = strapi.requestContext?.get?.();
      // Only act on real HTTP requests that explicitly ask for drafts. Internal
      // calls (cron, bootstrap, the preview handler's own lookup) have no
      // request context and keep whatever status they passed.
      if (req && req.query?.status === 'draft') {
        const hasAuth = Boolean(req.request?.header?.authorization);
        // Authenticated (valid token — invalid ones are rejected upstream) →
        // serve drafts for Preview. Unauthenticated → force published, so a
        // public caller can never read drafts via ?status=draft.
        ctx.params = { ...ctx.params, status: hasAuth ? 'draft' : 'published' };
      }
    }
    return next();
  });
  strapi.log.info('[register] preview draft-status document middleware active');
}

// Admin edit-view layout fix: on environments whose content-manager
// configuration predates the schema reorder, `expiredAt` sits stranded at the
// bottom of the event edit view (next to featuredOnHomepage) instead of beside
// `date`, which it semantically overrides. The layout lives in the core store
// (NOT the schema), so a schema change alone doesn't move it on existing envs.
// This reconciles it on boot: move `expiredAt` into its own row directly after
// the row containing `date`. Idempotent — if it's already there (or no config
// row exists yet, meaning Strapi will generate the layout fresh from the
// already-correct schema order), it no-ops.
async function reorderEventEditLayout(strapi: any) {
  const key = 'plugin_content_manager_configuration_content_types::api::event.event';
  const row = await strapi.db.query('strapi::core-store').findOne({ where: { key } });
  if (!row?.value) return; // fresh env — layout will be generated from schema order
  const cfg = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
  const edit: { name: string; size: number }[][] = cfg?.layouts?.edit;
  if (!Array.isArray(edit)) return;

  const dateRowIdx = edit.findIndex((r) => r.some((f) => f.name === 'date'));
  if (dateRowIdx < 0) return;
  // Already in place? (same row as date, or the row right after it)
  const inDateRow = edit[dateRowIdx].some((f) => f.name === 'expiredAt');
  const inNextRow = edit[dateRowIdx + 1]?.some((f) => f.name === 'expiredAt');
  if (inDateRow || inNextRow) return;

  let field: { name: string; size: number } | null = null;
  for (const r of edit) {
    const i = r.findIndex((f) => f.name === 'expiredAt');
    if (i >= 0) { field = r.splice(i, 1)[0]; break; }
  }
  if (!field) return; // not in the layout at all — nothing to move

  const compact = edit.filter((r) => r.length > 0);
  const insertAt = compact.findIndex((r) => r.some((f) => f.name === 'date')) + 1;
  compact.splice(insertAt, 0, [field]);
  cfg.layouts.edit = compact;
  await strapi.db.query('strapi::core-store').update({
    where: { id: row.id },
    data: { value: JSON.stringify(cfg) },
  });
  strapi.log.info('[bootstrap] moved event expiredAt next to date in the edit layout');
}

export default {
  register({ strapi }: { strapi: any }) {
    try {
      registerPreviewStatusMiddleware(strapi);
    } catch (e) {
      strapi.log.error('[register] failed to register preview status middleware', e);
    }
  },
  async bootstrap({ strapi }: { strapi: any }) {
    try {
      await ensurePreviewToken(strapi);
    } catch (e) {
      strapi.log.error('[bootstrap] failed to ensure preview token', e);
    }
    try {
      await grantPublicReadAccess(strapi);
    } catch (e) {
      strapi.log.error('[bootstrap] failed to grant public read access', e);
    }
    try {
      await backfillUploadMimes(strapi);
    } catch (e) {
      strapi.log.error('[bootstrap] failed to backfill upload mimes', e);
    }
    try {
      await reorderEventEditLayout(strapi);
    } catch (e) {
      strapi.log.error('[bootstrap] failed to reorder event edit layout', e);
    }
    // Hourly content-expiry KB sweep. config/server.ts enables cron.
    try {
      strapi.cron.add({
        expiryKbSweep: {
          task: () => sweepExpiredKbDocs(strapi),
          options: { rule: '0 * * * *' },
        },
      });
      strapi.log.info('[bootstrap] registered hourly expiry KB sweep');
    } catch (e) {
      strapi.log.error('[bootstrap] failed to register expiry cron', e);
    }
  },
};
