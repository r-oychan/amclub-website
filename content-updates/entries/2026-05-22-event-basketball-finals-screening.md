---
date: 2026-05-22
environment: prod
content_type: event
entry: "Basketball Finals Live Screening @ Union Bar"
author: client (recorded 2026-05-22)
dev: pending
uat: pending
seed: pending
---

## Applied to prod

Created on 2026-05-22 via `scripts/patch-whats-on-2026-05-22.mjs` (op #3). Verified live.
- Slug: `basketball-finals-live-screening-union-bar-2026`
- Category: Member Engagement (best-guess; recategorize in /admin if needed)
- Image: **not set** — no asset in batch 1. Upload in /admin and attach.
- Date stored: `2026-06-03` (start of June 3–19 range; full range in longDescription).

## What changed

Created a new published event on the What's On page.

## Fields touched

### `event.title`
- **Type:** string
- **Before:** (did not exist)
- **After:** `Basketball Finals Live Screening @ Union Bar`

### `event.slug`
- **Type:** uid (auto from title)
- **After:** `basketball-finals-live-screening-union-bar` (verify auto-generated value)

### `event.date`
- **Type:** date
- **After:** `2026-06-03` (start of range — confirm with content team whether to use start, end, or repeating)

### `event.description` / `event.longDescription`
- **Type:** text / richtext
- **After:**
  ```
  June 3 – 19, 2026

  Catch the Basketball Finals 2026 live at Union Bar and enjoy the excitement of the game with fellow fans, great food, and drinks.

  View the schedule here.
  ```
  The "View the schedule here." phrase links to:
  `https://docs.google.com/presentation/d/1Ruk_oS8bijGO1Osuuuc4cL3aGc7DknzVmMRqsyN7gZ8/edit?slide=id.g36c0dd5bddb_0_2#slide=id.g36c0dd5bddb_0_2`

### `event.location`
- **After:** `Union Bar`

### `event.ctas` (repeatable `shared.link`)
- **After:** one CTA — label: `View the schedule` → URL: the Google Slides link above.

### `event.image`
- **After:** TBD — confirm whether the content team uploaded a hero image; if so, capture filename and mirror under `media/events/`.

### Publish state
- **After:** Published

## Media added / replaced

- _(image TBD — capture filename if one was uploaded to prod)_

## Media removed

_(none)_

## Replay instructions (for dev)

**Path A — `/admin`:**

1. Content Manager → Event → Create new entry.
2. Fill the fields above. Date: `2026-06-03`.
3. Add CTA via the `ctas` component with the Google Slides URL.
4. Upload the same hero image (if used in prod) under `media/events/` first, then attach.
5. Save → Publish.

## Seed script status

- **Target script:** `scripts/seed-events.mjs`
- **Port status:** pending

## Verification

- What's On page (prod) shows this event in the listing during the relevant date range.
- Clicking through opens the event detail with the schedule link working.

## Related

- Linked entries: none
