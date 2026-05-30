---
date: 2026-05-30
environment: prod + dev
content_type: event + dining-promotion + restaurant
entry: "Q4 events cleanup, Sundays Served Right relaunch, promotions refresh, Grillhouse + Tiki Bar hours, Union Bar idempotent verify"
author: dev (Claude) on 2026-05-30
dev: applied (05-30)
uat: pending
seed: ported (patch-2026-05-30-batch.mjs)
---

## Applied to prod + dev

Applied 2026-05-30 via `scripts/patch-2026-05-30-batch.mjs` (six ops, env-aware for the dining-promotion schema split). Strapi writes; no frontend code changes.

## Op-by-op summary

| # | Op | Prod | Dev |
|---|---|---|---|
| 1 | Delete events with date in 2026-10-01..2026-12-31 | 9 deleted | 9 deleted |
| 2 | Sundays Served Right — date 2026-06-28, body starts with "Unwind" | ✓ updated, still published | n/a — event doesn't exist on dev |
| 3 | Delete dining-promotions (Seasonal Brews, A Toast to Mom, Heartwarming Mother's Day Feast) | 3 deleted | 3 deleted |
| 4 | Grillhouse & Tiki Bar — replace operatingHoursSections | ✓ updated (2 sections, 3 rows) | ✓ updated |
| 5 | Create 2 club-wide dining-promotions (June Monthly, Celebrate Dad) | ✓ both created | ✓ both created (after script fix) |
| 6 | Union Bar — idempotent verify Sports Screening + operating hours | = already correct (no-op) | = already correct (no-op) |
| 7 | Delete club-wide May Monthly Promotions | ✓ deleted | ✓ deleted |

## Fields touched — detail

### Op 1 — Event deletions (Oct–Dec 2026)
Hard DELETE on 9 entries by `documentId` after a date-range filter query. All slugs published before deletion.

Deleted from both prod + dev:
- 2026-10-11 Smokin' Sundays at Grillhouse
- 2026-10-19 Scarily Fun Friday Nights for the Kids!
- 2026-10-22 Kanonkop Wine Dinner
- 2026-10-30 Get Your Green Fix Salad Bar Buffet
- 2026-11-05 Pedal to Victory! A Spin Bike Time Challenge
- 2026-11-07 Classic & Contemporary: A Cocktail Masterclass Series
- 2026-12-04 Nostalgic Flavors of Singapore
- 2026-12-20 National Football League 2025 Live Screening
- 2026-12-30 Adult Team Tennis Challenge 2025

### Op 2 — Sundays Served Right relaunch
PUT on `events/xpinkowffyjyz1geo1yrvovh`:
- `date`: `2026-05-24` → `2026-06-28`
- `longDescription` (new):
  ```
  Unwind on Sunday with a relaxed semi-buffet lunch at The 2nd Floor. Enjoy a curated spread of starters, mains, and desserts crafted for a leisurely afternoon with family and friends.

  For reservations and enquiries, contact The 2nd Floor at 6739 4329 or 2ndfloor@amclub.org.sg.
  ```
  Stripped the leading `Sunday, May 24, 2026\n11:30 AM – 2:30 PM ` line per user spec ("remove the date. first word should be Unwind."). Time (`11:30 AM – 2:30 PM`) lives separately in `event.time` so no info is lost. Trailing reservation paragraph preserved verbatim.

Publication state preserved (entry remained published — `publishedAt` unchanged).

Effect: reverses item 12 of the 2026-05-22 batch (which had asked to unpublish — that was never executed because Strapi REST API doesn't expose unpublish). The entry is now active again with the new date.

### Op 3 — Dining-promotion deletions
Hard DELETE on 3 entries:
- `seasonal-brews` (slug, both envs)
- `a-toast-to-mom` (slug, both envs)
- `heartwarming-mothers-day-feast` (slug, both envs)

### Op 4 — Grillhouse & Tiki Bar operating hours
PUT on `restaurants/<grillhouse-docId>` (`xf5tkpjr49zy9a17udzgf1hu` on prod) replacing the entire `operatingHoursSections` array with:

```json
[
  { "title": "Grillhouse Operating Hours", "rows": [
      { "dayRange": "Sunday to Thursday", "time": "11:00AM – 9:00PM", "lastOrder": "Last order 8:30PM" },
      { "dayRange": "Friday & Saturday",  "time": "11:00AM – 9:30PM", "lastOrder": "Last order 9:00PM" } ] },
  { "title": "Tiki Bar Operating Hours", "rows": [
      { "dayRange": "Friday to Sunday",   "time": "11:30AM – 10:00PM", "lastOrder": "Last order 9:30PM" } ] }
]
```

Changes vs previous state:
- Grillhouse: consolidated Friday + Saturday (different starts and same close), aligned Saturday start to 11:00AM (was 8:30 AM), uniform format `11:00AM – 9:00PM` with no space before AM/PM per user spec.
- Tiki Bar: consolidated Friday + Saturday + Sunday into one row, end time 10:00PM (was 12:00 AM Fri-Sat / 11:00 PM Sun).

Format note: user wrote `11:00AM – 9:00PM` (no space before marker), matching their input verbatim. Other restaurants (e.g. Union Bar) use `12:00 PM – 11:00 PM` with spaces — kept both styles to match what was provided.

### Op 5 — 2 new club-wide dining-promotions

Schema-aware payload (see below). Both promotions created and published.

| slug | title | summary | image |
|---|---|---|---|
| `club-wide-june-monthly-promo` | June Monthly Promotions | _(empty — user said "without title")_ | `june-monthly-promo-overall.jpg` |
| `club-wide-celebrate-dad-fathers-day` | Celebrate Dad This Father's Day | Honor Dad with a curated selection of dining specials, great food, and good company across the Club. | `celebrate-dad-this-fathers-day-a2.jpg` |

**Title interpretation**: user wrote "without title" for #1 and `title: <text>` for #2. The schema requires `title`, so #1 was given the internal heading "June Monthly Promotions" (matching the May pattern) with `summary` left null — i.e. the displayed promotion is image-only without descriptive text under it. If "without title" meant something more literal, flip in /admin.

**Schema split**: prod and dev have diverged for `dining-promotion`. The patch script feature-detects which shape to send.
- Prod: `restaurantTag: 'club-wide'` (enum)
- Dev: `isClubWide: true` (boolean) + `restaurant: null` (relation kept null for club-wide). Reflects dev commit `5f3f18b feat(dining): dining-promotion enum → restaurant relation`.

### Op 7 — Delete club-wide May Monthly Promotions

Hard DELETE on `dining-promotions/club-wide-may-monthly-promo`. Prod documentId `kbbu433a80igj8reydkmz28y`, dev documentId `da00xccur1vjv3gg0u3cp4eu`. Added after the rest of the batch when the user followed up to remove the now-outdated May club-wide promo (June Monthly Promotions takes its place).

### Op 6 — Union Bar idempotent verify
Both envs already had the correct Sports Screening Schedule CTA (Google Slides URL) and the 2-row operating hours from the 2026-05-25 batch. Script logged `= already correct — skip` on both runs.

## Media added / replaced

Two promotion images uploaded to Strapi media library on both envs (prod media ids 364 + 365; dev media ids 436 + 437):
- `media/promotions/june-monthly-promo-overall.jpg` (renamed from `June Monthly Promo_Overall.jpg`)
- `media/promotions/celebrate-dad-this-fathers-day-a2.jpg` (renamed from `Celebrate Dad this father's day_A2.jpg`)

Both source filenames had spaces + Title Case + underscores violating `feedback_media_and_naming`. Renamed to lowercase-hyphens canonicals in the same change.

## Media removed

_(none — no orphans created by this batch)_

## Replay instructions

```bash
SEED_ENV=uat node scripts/patch-2026-05-30-batch.mjs
# Or any single op:
SEED_ENV=uat node scripts/patch-2026-05-30-batch.mjs --only=4
```

Idempotent: re-running on an env where state already matches is a no-op per op (event date-range query returns 0 if already cleaned, slug-based skip on creates, deep equality check on hours).

## Notes / out-of-scope

- The 2026-05-22 batch entry `event-sundays-served-right-hide` is now obsolete — the event has been kept (with a new date and body) instead of unpublished. The log row for that entry can be considered superseded by this one.
- "4th of July Celebration @ the Club" is still missing from dev (deleted between 05-25 and 05-29 per the 2026-05-29 categories entry); unrelated to this batch.

## Verification

```bash
SEED_ENV=prod node --input-type=module -e "
  import { initEnv, api } from './scripts/seed-helpers.mjs';
  const ctx = initEnv();
  const ev = await api(ctx, '/events?filters[date][\$gte]=2026-10-01&filters[date][\$lte]=2026-12-31&pagination[limit]=100');
  console.log('Oct-Dec events:', ev.data.length, '(expect 0)');
"
```

Public-site verification after CDN refresh:
- `/whats-on` should not list any Oct/Nov/Dec events.
- `/whats-on` should show Sundays Served Right with date 28 Jun 2026 and copy starting "Unwind on Sunday with…".
- `/dining/dining-promotion` should no longer show Seasonal Brews / Toast to Mom / Heartwarming Mother's. Should show 2 new club-wide promos.
- `/dining/grillhouse` should list Grillhouse Operating Hours (2 rows) + Tiki Bar Operating Hours (1 row).
- `/dining/union-bar` unchanged from the 2026-05-25 state.

## Related

- Linked entries:
  - [[2026-05-22-event-sundays-served-right-hide]] — superseded by Op 2.
  - [[2026-05-25-union-bar-sports-schedule-and-hours]] — Op 6 confirms.
  - [[2026-05-29-event-categories-reclassify]] — sibling cleanup of the same event set.
