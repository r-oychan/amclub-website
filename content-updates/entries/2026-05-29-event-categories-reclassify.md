---
date: 2026-05-29
environment: prod + dev
content_type: event
entry: "Reclassify 8 events from the 2026-05-22 batch to their final categories"
author: dev (Claude) on 2026-05-29
dev: applied (05-29)
uat: pending
seed: ported (patch-event-categories-2026-05-29.mjs)
---

## Applied to prod + dev

Applied 2026-05-29 via `scripts/patch-event-categories-2026-05-29.mjs` against both `SEED_ENV=prod` and `SEED_ENV=dev`. Net changes: 2 events moved category, 6 events confirmed already on the right category, 1 event no longer exists on dev.

When the 8 new events were created on 2026-05-22, the patch script assigned best-guess categories noted as "recategorize in /admin if needed". This entry locks in the final classification the user supplied on 2026-05-29.

## Final categorization

| Event slug | Old category | Final category |
|---|---|---|
| `basketball-finals-live-screening-union-bar-2026` | Member Engagement | **Dining** ← moved |
| `football-fever-night-union-bar-2026` | Member Engagement | **Dining** ← moved |
| `smokin-sundays-grillhouse-2026-06` | Dining | Dining (unchanged) |
| `sip-and-serve-french-open-2026` | Fitness & Wellness | Fitness & Wellness (unchanged) |
| `tiny-art-explorers-2026-06` | Kids | Kids (unchanged) |
| `heroes-and-sidekicks-fathers-day-2026` | Kids | Kids (unchanged) |
| `camp-eagle-explorers-summer-2026` | Kids | Kids (unchanged) |
| `fourth-of-july-celebration-2026` | Member Engagement | Member Engagement (unchanged) |

## Per-env outcome

**prod:** 2 PUTs, 6 no-ops. All 8 slugs found.

**dev:** 2 PUTs, 5 no-ops, **1 skip** — `fourth-of-july-celebration-2026` was deleted from dev between 2026-05-25 and 2026-05-29 (was confirmed present on the 05-25 sync, absent by the 05-29 verification). No category change needed since the event is gone; flagging here in case the deletion was unintended. Verified via title + slug variant search — no match for "4th of July" or "Fourth of July" anywhere on dev events.

## Fields touched

For each affected event:

### `event.category` (relation → `event-category.documentId`)

- **basketball-finals-live-screening-union-bar-2026**: documentId pointed at `Member Engagement` → now `Dining`. Strapi v5 PUT with `{ data: { category: <dining documentId> } }`.
- **football-fever-night-union-bar-2026**: same change.

Six other events had matching current and desired categories; script issued no PUT.

## Replay instructions

```bash
# uat (when ready)
SEED_ENV=uat node scripts/patch-event-categories-2026-05-29.mjs

# Idempotent — safe to re-run on prod / dev; will skip events already in
# the correct category.
```

## Verification

```bash
SEED_ENV=prod node --input-type=module -e "
  import { initEnv, api } from './scripts/seed-helpers.mjs';
  const ctx = initEnv();
  for (const s of ['basketball-finals-live-screening-union-bar-2026','football-fever-night-union-bar-2026']) {
    const r = await api(ctx, \`/events?filters[slug][\$eq]=\${s}&populate[category]=true&pagination[limit]=1\`);
    console.log(s, '→', r.data[0]?.category?.name);
  }
"
```

Should print `Dining` for both. Public site at /whats-on — these events now appear under the Dining category filter.

## Related

- Linked entries:
  - [[2026-05-22-event-basketball-finals-screening]] — original creation entry.
  - [[2026-05-22-event-football-fever-night]] — original creation entry.
  - Both notes flagged "Category: Member Engagement (best-guess; recategorize in /admin if needed)". This entry resolves that.
