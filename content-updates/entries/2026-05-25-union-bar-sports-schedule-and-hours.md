---
date: 2026-05-25
environment: prod
content_type: restaurant
entry: "Union Bar — add Sports Screening Schedule CTA + populate operating hours"
author: dev (Claude) on 2026-05-25
dev: pending
uat: pending
seed: ported (patch-fitness-and-union-bar-2026-05-25.mjs, op 1)
---

## Applied to prod

Applied 2026-05-25 via `scripts/patch-fitness-and-union-bar-2026-05-25.mjs` op #1 against `SEED_ENV=prod`. Verified live:
- `restaurant.ctas` now has 3 entries — appended "Sports Screening Schedule" alongside existing View Menu + Promotions.
- `restaurant.operatingHoursSections[0].rows` now has 2 rows (Sun–Thu, Fri/Sat/PH) with last-beverage notes.

`restaurant` has `draftAndPublish: true`. The entry was already published; PUT preserved that.

## Fields touched

### `restaurant.ctas` (entry: Union Bar, documentId `tu8o2w37ulmbs4g765t2lwjy`)

Appended one new CTA. Existing entries preserved verbatim (label, href, icon, variant).

- **New CTA appended:**
  - `label`: `Sports Screening Schedule`
  - `href`: `https://docs.google.com/presentation/d/1Ruk_oS8bijGO1Osuuuc4cL3aGc7DknzVmMRqsyN7gZ8/edit?slide=id.g36c0dd5bddb_0_2#slide=id.g36c0dd5bddb_0_2`
  - `isExternal: true`, `bordered: false`, `variant: primary`, `icon: arrow`

### `restaurant.operatingHoursSections` (entry: Union Bar)

Replaced the existing empty "Opening Hours" section with a populated one.

- **Before:** `[{ title: 'Opening Hours' }]` (no rows)
- **After:**
  ```json
  [
    {
      "title": "Opening Hours",
      "rows": [
        { "dayRange": "Sunday to Thursday", "time": "12:00 PM – 11:00 PM", "lastOrder": "Last beverage order at 10:30 PM" },
        { "dayRange": "Friday, Saturday & Eve of PH", "time": "12:00 PM – 12:00 AM", "lastOrder": "Last beverage order at 11:30 PM" }
      ]
    }
  ]
  ```

Time format follows project memory (`feedback_time_format`): uppercase `AM`/`PM`, no periods, space before the marker. En-dash (`–`) between start and end.

## Fallback fix on main (frontend code)

`frontend/src/data/subpages.ts:420` also had a broken "Sports Screening Schedule" CTA that pointed at `/menus/union-bar-menu.pdf` (the same path as View Menu — a copy/paste leftover from when the schedule didn't exist as a separate doc). Updated to the same Google Slides URL.

The CMS value drives the live page (via `api.ctas?.length ? api.ctas : fallback?.ctas` in `VenueDetailPage.tsx:347`); the subpages.ts entry is shadowed but kept in sync to prevent drift.

## Media added / replaced

_(none — no asset changes)_

## Replay instructions

```bash
SEED_ENV=dev node scripts/patch-fitness-and-union-bar-2026-05-25.mjs --only=1
SEED_ENV=uat node scripts/patch-fitness-and-union-bar-2026-05-25.mjs --only=1
```

Script is idempotent — re-running on a target where state already matches is a no-op.

## Verification

- https://www.amclub.org.sg/dining/union-bar → "Sports Screening Schedule" CTA opens the Google Slides; the Operating Hours section now lists both day-range rows with last-beverage notes.

## Related

- Linked entries: none.
