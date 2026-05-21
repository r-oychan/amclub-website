---
date: 2026-05-22
environment: prod
content_type: event
entry: "Football Fever Night @ Union Bar"
author: client (recorded 2026-05-22)
dev: pending
uat: pending
seed: pending
---

## What changed

Created a new published event on the What's On page.

## Fields touched

### `event.title`
- **After:** `Football Fever Night @ Union Bar`

### `event.date`
- **After:** `2026-05-31` (Sunday)

### `event.time`
- **After:** `12:00AM` (verify format — project rule: uppercase AM/PM, no periods)

### `event.location`
- **After:** `Union Bar`

### `event.description` / `event.longDescription`
- **After:**
  ```
  Sunday, May 31, 2026 | 12:00AM

  Catch the European Club football finals live at Union Bar as Paris Saint-Germain takes on Arsenal. Gather with fellow football fans and enjoy the excitement of the match live on screen.

  Predict the final score correctly and get a free burger on your next visit. Submit your entry by 12:00AM to qualify. T&Cs apply.

  Beverage Specials
  All Draft Beers Pint $10
  ```

### `event.image`
- **After:** TBD — capture if uploaded.

### Publish state
- **After:** Published

## Media added / replaced

- _(image TBD)_

## Media removed

_(none)_

## Replay instructions (for dev)

**Path A — `/admin`:** create event with the fields above, set date `2026-05-31`, time `12:00AM`, publish.

## Seed script status

- **Target script:** `scripts/seed-events.mjs`
- **Port status:** pending

## Verification

- Event appears on What's On page (prod) and detail page renders all body copy including the Beverage Specials block.

## Related

- Linked entries: none
