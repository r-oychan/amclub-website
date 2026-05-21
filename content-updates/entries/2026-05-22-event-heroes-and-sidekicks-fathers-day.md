---
date: 2026-05-22
environment: prod
content_type: event
entry: "Heroes & Sidekicks: Kids' Father's Day Activity"
author: client (recorded 2026-05-22)
dev: pending
uat: pending
seed: pending
---

## What changed

Created a new published event on the What's On page.

## Fields touched

### `event.title`
- **After:** `Heroes & Sidekicks: Kids' Father's Day Activity`

### `event.date`
- **After:** `2026-06-21` (Sunday)

### `event.time`
- **After:** `Session 1: 1:00PM – 2:30PM / Session 2: 3:00PM – 4:30PM`
  > Single string field; multi-session info packed in. Adjust to whatever format the prod entry actually uses.

### `event.location`
- **After:** `The Quad Studios`

### `event.description` / `event.longDescription`
- **After:**
  ```
  Sunday, June 21, 2026
  Session 1: 1:00 PM – 2:30 PM
  Session 2: 3:00 PM – 4:30 PM
  The Quad Studios

  Step inside the Hero Training Grounds for a playful Father's Day adventure filled with creative crafts, fun challenges, and superhero moments. Kids will create personalized gifts, complete hero missions, and celebrate the everyday heroes they call Dad.

  Member: $40 for dad & child
  Guest: $45 for dad & child

  Additional $10 for Sidekick Lounge Access
  Relax with refreshments and a casual lounge space while the little heroes complete their missions.

  Register here.

  Terms and Conditions:
  A 48-hour cancellation policy applies. Members will be charged for the full event fee for no-shows or cancellations made less than 48 hours before the event
  ```
  > "Register here." link target — not provided by user; check prod entry for the actual URL and capture here before replay.

### `event.ctas`
- **After:** one CTA — label `Register`, URL TBD (capture from prod).

### `event.image`
- **After:** TBD — capture if uploaded.

### Publish state
- **After:** Published

## Media added / replaced

- _(image TBD)_

## Media removed

_(none)_

## Replay instructions (for dev)

Create event. **Before replay**, fetch the prod entry to capture (a) the exact `Register here` URL, (b) the hero image filename. Without those, replay will be incomplete.

## Seed script status

- **Target script:** `scripts/seed-events.mjs`
- **Port status:** pending

## Verification

- Event detail shows both sessions, pricing tiers, T&Cs, and a working Register CTA.

## Related

- Linked entries: none
