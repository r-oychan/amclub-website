---
date: 2026-05-22
environment: prod
content_type: restaurant
entry: "The Gourmet Pantry"
author: client (recorded 2026-05-22)
dev: pending
uat: pending
seed: pending
---

## What changed

Updated The Gourmet Pantry phone number.

## Fields touched

### `restaurant.phone` (entry: The Gourmet Pantry)

- **Type:** string
- **Before:** previous phone number (unknown — capture from current dev value before overwriting)
- **After:** `6739 4407`

> The restaurant content type also has a `locationContact` component (`blocks.location-contact`) which may carry a phone field — confirm during replay whether both `phone` and `locationContact.phone` exist on this entry and update both for consistency.

## Media added / replaced

_(none)_

## Media removed

_(none)_

## Replay instructions (for dev)

**Path A — `/admin`:**

1. Content Manager → Restaurant → The Gourmet Pantry → set `phone` to `6739 4407`.
2. If `locationContact` component exists on this entry and has a phone field, update it to the same value.
3. Save → Publish.

## Seed script status

- **Target script:** the restaurant seed (likely `scripts/seed-detail-skeletons.mjs` or a dining-outlets seed — confirm)
- **Port status:** pending

## Verification

- Gourmet Pantry detail page on prod displays `6739 4407` wherever the phone is shown (likely in location/contact block and any "tap to call" CTA).

## Related

- Prod commit / PR / admin event: n/a (direct admin edit)
- Linked entries: none
