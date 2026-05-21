---
date: 2026-05-22
environment: prod
content_type: event
entry: "Sip & Serve: French Open Edition"
author: client (recorded 2026-05-22)
dev: pending
uat: pending
seed: pending
---

## Applied to prod

Created on 2026-05-22 via `scripts/patch-whats-on-2026-05-22.mjs` (op #6). Verified live.
- Slug: `sip-and-serve-french-open-2026`
- Category: Fitness & Wellness (Tennis Courts venue)
- Image: not set.
- No external CTA — TAC Book app registration instructions are inline in longDescription.

## What changed

Created a new published event on the What's On page.

## Fields touched

### `event.title`
- **After:** `Sip & Serve: French Open Edition`

### `event.date`
- **After:** `2026-05-29` (Friday)

### `event.time`
- **After:** `7:00PM – 9:30PM`

### `event.location`
- **After:** `Tennis Courts`

### `event.description` / `event.longDescription`
- **After:**
  ```
  Friday, May 29, 2026
  7:00PM – 9:30PM
  Tennis Courts

  $38 per person

  Register via the TAC Book app:
  Log into the TAC Book app > Click on Explore > Session > Tennis > Event
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

Create event with above content. No external CTA URL — registration is via the TAC Book app, described inline.

## Seed script status

- **Target script:** `scripts/seed-events.mjs`
- **Port status:** pending

## Verification

- Event detail renders the TAC Book app instruction line clearly (no broken link).

## Related

- Linked entries: none
