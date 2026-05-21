---
date: 2026-05-22
environment: prod
content_type: event
entry: "Camp Eagle Explorers Summer 2026"
author: client (recorded 2026-05-22)
dev: pending
uat: pending
seed: pending
---

## Applied to prod

Created on 2026-05-22 via `scripts/patch-whats-on-2026-05-22.mjs` (op #9). Verified live.
- Slug: `camp-eagle-explorers-summer-2026`
- Category: Kids
- Image: not set.
- One Register CTA created using the long Office Forms URL (same form for both age groups, per batch 1).

## What changed

Created a new published event on the What's On page.

## Fields touched

### `event.title`
- **After:** `Camp Eagle Explorers Summer 2026`

### `event.date`
- **After:** `2026-06-08` (camp start)

### `event.time`
- **After:** see body (two age groups have different times)

### `event.location`
- **After:** `The American Club & various locations around Singapore`

### `event.description` / `event.longDescription`
- **After:**
  ```
  June 8 – August 7, 2026
  Members: $140 per day | $700 per week
  Guests: $160 per day | $800 per week

  4-7 years old
  Time: 9:00 AM – 3:00 PM
  Venue: The American Club & various locations around Singapore

  Register here

  8 years old and above
  Time: 8:30 AM – 3:00 PM
  Venue: The American Club & various locations around Singapore

  Register here
  ```
  Both "Register here" CTAs point to:
  `https://forms.office.com/pages/responsepage.aspx?id=tNI3gQWbQ0ue5Ad0V1MxKig5SVI1jCxHmIfXpkheevZUQVBNREpQRUc1TUdIR1RYUk1IRUFPRDMyUyQlQCN0PWcu&route=shorturl`

  > User supplied a single link applied to both "Register here" lines. Confirm with content team whether 4-7 yo and 8+ yo should actually share the same form (likely yes per the message).

### `event.ctas`
- **After:** one CTA — label `Register`, URL = the Office Forms link above. (Or two identical CTAs if the prod entry duplicated them.)

### `event.image`
- **After:** TBD — capture if uploaded.

### Publish state
- **After:** Published

## Media added / replaced

- _(image TBD)_

## Media removed

_(none)_

## Replay instructions (for dev)

Create event. Use the long Office Forms URL exactly as given (it's a tokenized link — do not modify).

## Seed script status

- **Target script:** `scripts/seed-events.mjs`
- **Port status:** pending

## Verification

- Both "Register here" CTAs open the registration form. Pricing, times, and venue render correctly.

## Related

- Linked entries: none
