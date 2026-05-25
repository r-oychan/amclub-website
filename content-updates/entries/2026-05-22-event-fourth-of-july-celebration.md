---
date: 2026-05-22
environment: prod
content_type: event
entry: "4th of July Celebration @ the Club"
author: client (recorded 2026-05-22)
dev: pending
uat: pending
seed: pending
---

## Applied to prod

Created on 2026-05-22 via `scripts/patch-whats-on-2026-05-22.mjs` (op #10). Verified live.
- Slug: `fourth-of-july-celebration-2026`
- Category: Member Engagement
- Image: not set.
- Promo code `FOJ250TAC` and the inclusive-tickets disclaimer are in longDescription. Tickets CTA points to aasingapore.com.

## What changed

Created a new published event on the What's On page.

## Fields touched

### `event.title`
- **After:** `4th of July Celebration @ the Club`

### `event.date`
- **After:** `2026-07-04`

### `event.time`
- **After:** `4:00PM – 9:00PM`

### `event.location`
- **After:** `The American Club` (confirm — message says "@ the Club")

### `event.description` / `event.longDescription`
- **After:**
  ```
  Saturday, July 4, 2026
  4:00PM – 9:00PM

  $29 per person
  (enter code FOJ250TAC upon checkout to enjoy $10 off entry fee)

  The prices listed above are inclusive of $10 worth of F&B and activity* tickets.

  Get your tickets here: https://www.aasingapore.com/events-1/americas-250th-birthday-bash
  ```

### `event.ctas`
- **After:** one CTA — label `Get your tickets` → URL `https://www.aasingapore.com/events-1/americas-250th-birthday-bash`

### `event.image`
- **After:** TBD — capture if uploaded.

### Publish state
- **After:** Published

## Media added / replaced

- _(image TBD)_

## Media removed

_(none)_

## Replay instructions (for dev)

Create event. Promo code `FOJ250TAC` must appear verbatim in body.

## Seed script status

- **Target script:** `scripts/seed-events.mjs`
- **Port status:** pending

## Verification

- Ticket CTA opens the AAS Singapore page. Promo code displays correctly.

## Related

- Linked entries: none
