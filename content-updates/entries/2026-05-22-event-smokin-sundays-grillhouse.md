---
date: 2026-05-22
environment: prod
content_type: event
entry: "Smokin' Sundays @ Grillhouse"
author: client (recorded 2026-05-22)
dev: pending
uat: pending
seed: pending
---

## Applied to prod

Created on 2026-05-22 via `scripts/patch-whats-on-2026-05-22.mjs` (op #5). Verified live.
- Slug: `smokin-sundays-grillhouse-2026-06`
- Category: Dining
- Image: not set — upload in /admin.
- Note: a separate existing event `Smokin' Sundays at Grillhouse` (slug ending in `-grillhouse`, date 2026-10-11) remains untouched. The new June 21 entry uses a distinct slug.

## What changed

Created a new published event on the What's On page.

## Fields touched

### `event.title`
- **After:** `Smokin' Sundays @ Grillhouse`

### `event.date`
- **After:** `2026-06-21`

### `event.location`
- **After:** `Grillhouse`

### `event.description` / `event.longDescription`
- **After:**
  ```
  Sunday, June 21, 2026

  Food Specials
  Alabama White Sauce Half Baby Chicken with Roasted Potatoes $20
  Cajun Grilled Salmon with Alabama White Sauce $22
  Smokey Three Baked Beans with Corn Bread $14

  Beverage Specials
  Mint Julep Swizzle $12
  Coconut Lime Cooler $6
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

Create event with above content. Format the Food Specials and Beverage Specials as two grouped lists in richtext.

## Seed script status

- **Target script:** `scripts/seed-events.mjs`
- **Port status:** pending

## Verification

- Event detail renders both Food Specials and Beverage Specials blocks distinctly.

## Related

- Linked entries: none
