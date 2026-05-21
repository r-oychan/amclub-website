---
date: 2026-05-22
environment: prod
content_type: event
entry: "Tiny Art Explorers June 2026"
author: client (recorded 2026-05-22)
dev: pending
uat: pending
seed: pending
---

## What changed

Created a new published event on the What's On page (recurring weekly Thursdays in June 2026).

## Fields touched

### `event.title`
- **After:** `Tiny Art Explorers June 2026`

### `event.date`
- **After:** `2026-06-04` (first session — represent the series start; the schema has a single `date` field so use the first Thursday and put all dates in the body)

### `event.time`
- **After:** `3:00PM – 3:45PM`

### `event.location`
- **After:** `The Quad Poolside`

### `event.description` / `event.longDescription`
- **After:**
  ```
  Thursdays, 3:00 PM – 3:45 PM
  The Quad Poolside

  For kids aged 3-6 years old
  Member: $3 | Guest: $5

  Theme for June 2026: Father's Day

  June 4, 2026: Summer Foam Sunglasses
  June 11, 2026: Make A Star Tie
  June 18, 2026: Daddy Rocks Card
  June 25, 2026: World Cup Soccer Art

  Registration required via the TAC Book app at least one day in advance: Click on Sessions > Quad > Tiny Art Explorer
  ```
  > Time format note: project rule is `3:00PM` (no space, uppercase), but user supplied `3:00 PM`. Normalize to `3:00PM – 3:45PM` on replay unless content team prefers the spaced version on this page.

### `event.image`
- **After:** TBD — capture if uploaded.

### Publish state
- **After:** Published

## Media added / replaced

- _(image TBD)_

## Media removed

_(none)_

## Replay instructions (for dev)

Create event with above content. Schema only allows a single date — use `2026-06-04` and embed the four dates in the richtext body as shown.

## Seed script status

- **Target script:** `scripts/seed-events.mjs`
- **Port status:** pending

## Verification

- Event detail lists all four Thursday sessions and the registration instructions.

## Related

- Linked entries: none
