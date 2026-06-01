---
date: 2026-06-01
environment: prod + dev
content_type: event (tiny-art-explorers-*)
entry: "Remove the May 28 duplicate Tiny Art Explorers entry; attach the June banner to the June 4 entry. Recreate the June 4 entry on dev where it had been absent."
author: dev (Claude) on 2026-06-01
dev: applied (06-01)
uat: pending
seed: ported (patch-2026-06-01-tiny-art-may28-cleanup.mjs)
---

## Applied to prod + dev

User flagged that there were two Tiny Art Explorers entries showing for June:
- `tiny-art-explorers-program-37` — `date: 2026-05-28`, had the June Father's Day body content + the June hero banner attached (date was stale, body was correct).
- `tiny-art-explorers-2026-06` — `date: 2026-06-04`, had the June Father's Day body content but **no hero image**.

Ask: remove the May 28 entry, move the hero image to the June 4 entry. Done via `scripts/patch-2026-06-01-tiny-art-may28-cleanup.mjs`.

## Op detail

### Op 1 — Delete `tiny-art-explorers-program-37` (the May 28 duplicate)

- prod: deleted event docId `a53nn8yh1kb31e3lm6s111ca` + its media id 371 (`event-tiny-art-explorers-program-37.jpg`).
- dev: deleted event docId `yo3jdbjunqao5v4g2q03f58d` + its media id 2263.
- Defensive sweep for any orphan media with the old filename — none found.

### Op 2 — Attach hero image to `tiny-art-explorers-2026-06`

The local file `media/events/event-tiny-art-explorers-program-37.jpg` was renamed in this commit to `media/events/event-tiny-art-explorers-2026-06.jpg` (matching the surviving slug). Then:

- prod: uploaded → media id 382, attached to existing event docId `j8qdq0974ks4kwgz9op6l7uo`.
- dev: `tiny-art-explorers-2026-06` was **absent on dev** (a long-standing gap from the inter-batch reseed). One-off inline call created the event directly from prod's full data (title, body, date, time, location, kids category) and attached the freshly uploaded image (media id 2274, event docId `lgwmnrgget76479632ofq04p`).

## End state

| env | event | date | image |
|---|---|---|---|
| prod | `tiny-art-explorers-program-36` | 2026-05-21 | `event-tiny-art-explorers-program-36.jpg` (unchanged) |
| prod | `tiny-art-explorers-2026-06` | 2026-06-04 | `event-tiny-art-explorers-2026-06.jpg` ✓ new |
| dev | `tiny-art-explorers-2026-06` | 2026-06-04 | `event-tiny-art-explorers-2026-06.jpg` ✓ new |

(dev never had `program-36` after the reseed; not recreating because the May 21 session has already passed.)

## Note — `tiny-art-explorers-2026-06` was previously marked `n/a` on dev

The 2026-05-22 batch row for "tiny-art-explorers-2026-06" had `dev: n/a` because dev was using `-program-36` + `-program-37` to cover both months. With `-program-37` now removed and `-2026-06` recreated on dev, this entry **closes** the original 05-22 row too — log updated.

## Verification

```bash
SEED_ENV=prod node --input-type=module -e "
  import { initEnv, api } from './scripts/seed-helpers.mjs';
  const ctx = initEnv();
  const r = await api(ctx, '/events?filters[title][\$containsi]=Tiny%20Art&populate[image]=true&publicationState=preview&pagination[limit]=10&sort=date:asc');
  for (const e of r.data) console.log(e.slug, e.date, e.image?.name);
"
# prod →
#   tiny-art-explorers-program-36 2026-05-21 event-tiny-art-explorers-program-36.jpg
#   tiny-art-explorers-2026-06    2026-06-04 event-tiny-art-explorers-2026-06.jpg
```

After CDN refresh: `/whats-on` shows one June Tiny Art listing (the 06-04 entry), with the banner artwork; the stale May 28 card is gone.

## Related

- [[2026-06-01-event-images-and-monthly-dues]] — the batch that originally attached the June banner to the wrong slug (program-37 instead of 2026-06). This entry corrects that.
- [[2026-05-22-event-tiny-art-explorers-june]] — original 06-04 entry creation. The `dev: n/a` line on that row is now stale; updated alongside this change.
