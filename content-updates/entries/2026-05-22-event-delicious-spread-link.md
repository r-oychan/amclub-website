---
date: 2026-05-22
environment: prod
content_type: event
entry: "A Delicious Spread (The 2nd Floor)"
author: client (recorded 2026-05-22)
dev: pending
uat: pending
seed: pending
---

## Applied to prod

Updated on 2026-05-22 via `scripts/patch-whats-on-2026-05-22.mjs` (op #13). Verified live.
- `ctas` array PUT with the Register CTA href set to `https://forms.office.com/r/yDrPtgvgbF`.
- Existing label `Register Here`, variant `primary`, icon `calendar` preserved.
- Previous href was `https://forms.office.com/r/h9s4kycJXS?origin=lprLink`.

## What changed

Updated the registration link on the existing "A Delicious Spread" event at The 2nd Floor.

## Fields touched

### `event.ctas` (registration CTA on entry "A Delicious Spread")

- **Type:** `shared.link` component
- **Before:** previous registration URL (capture from current entry before overwriting)
- **After:** `https://forms.office.com/r/yDrPtgvgbF`

> Field may also exist as a `reservation` string on `event` (the schema has a `reservation` field). Check which holds the active link and update whichever is in use.

## Media added / replaced

_(none)_

## Media removed

_(none)_

## Replay instructions (for dev)

**Path A — `/admin`:**

1. Content Manager → Event → find "A Delicious Spread" (location: The 2nd Floor).
2. Update the registration CTA URL (and/or `reservation` field) to `https://forms.office.com/r/yDrPtgvgbF`.
3. Leave label text unchanged unless prod changed it too.
4. Save → Publish.

## Seed script status

- **Target script:** `scripts/seed-events.mjs`
- **Port status:** pending

## Verification

- "A Delicious Spread" event detail on prod — registration CTA opens `https://forms.office.com/r/yDrPtgvgbF`.

## Related

- Linked entries: [[2026-05-22-event-sundays-served-right-hide]] — sibling 2nd Floor event hidden in same batch.
