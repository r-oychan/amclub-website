---
date: 2026-05-22
environment: prod
content_type: event
entry: "Shaken, Not Sorry 2.0"
author: client (recorded 2026-05-22)
dev: pending
uat: pending
seed: pending
---

## Applied to prod

Updated on 2026-05-22 via `scripts/patch-whats-on-2026-05-22.mjs` (op #11). Verified live.
- Replaced longDescription from the `Bespoke Cocktails` heading onward with the new `Signature Cocktails` + Happy Hour list + Bar Snacks list.
- Intro paragraph **preserved verbatim** — it still contains the lowercase descriptive phrase "Bespoke cocktails, an exclusive Bar Snack Menu…". If you want that rephrased too, edit in /admin or extend the patch.
- Trademark symbols (™, ®) and the vegetarian footnote asterisk are preserved.

## What changed

Updated the body content of the existing "Shaken, Not Sorry 2.0" event. Re-labelled "Bespoke Cocktails" as "Signature Cocktails" and replaced the cocktails/snacks content block with the new detailed list (Happy Hour menu + Bar Snacks).

## Fields touched

### `event.longDescription` (existing entry: Shaken, Not Sorry 2.0)

- **Type:** richtext
- **Before:** previous body included a section titled `Bespoke Cocktails ...` (capture verbatim from current dev/prod before overwriting)
- **After:** the `Bespoke Cocktails` section becomes:
  ```
  Signature Cocktails

  Happy Hour (8:00PM – 9:00PM)

  Old Fashioned — Buffalo Trace™ bourbon whiskey, demerara syrup & Angostura® aromatic bitters
  Classic Lime Margarita on the Rocks — Código 1530® Reposado Tequila, orange liqueur, fresh lime juice & agave nectar
  Ladies Night Negroni — Aperol®, Gin Mare®, sweet vermouth & grapefruit juice
  Barrel-Aged Negroni — Tanqueray® London Dry Gin, sweet vermouth & Campari®
  G&T — Tanqueray® London Dry Gin & premium tonic water
  Kumartini — Grey Goose® Vodka & dry vermouth

  French 75 à la Mode — Tanqueray® London Dry Gin, fresh lemon juice & champagne
  Paloma — Código 1530® Blanco Tequila, grapefruit juice, fresh lime juice & soda water

  Bar Snacks
  8:00PM – 11:15PM (last orders at 11:00PM)

  Stuffed Dates — Pt Reyes blue cheese, prosciutto & hot honey drizzle
  S&P Fish Street Taco — Tajin mangonada salsa, sunny-side-up quail egg & lime
  Ultimate Black Truffle Grilled Cheese Bites* — Griddled sourdough, aged cheddar, candied thick-cut bacon, goat cheese & tomato bisque dip
    *Vegetarian version available upon request
  Truffle House Fries — With umami aioli
  Bite-sized Spicy Fried Steak Fingers — Buttermilk batter, sriracha honey syrup, toasted sesame & spiked remoulade
  Baked Brie en Croûte — Honey drizzle & house sourdough crostini
  House Hummus — Grilled naan & crisp vegetable sticks
  ```
  > Trademark symbols (™, ®) and the asterisk footnote should be preserved verbatim. Time format `8:00PM` (no space, uppercase) per project rule.

## Media added / replaced

_(none)_

## Media removed

_(none)_

## Replay instructions (for dev)

**Path A — `/admin`:**

1. Content Manager → Event → find "Shaken, Not Sorry 2.0".
2. Open `longDescription`, locate the `Bespoke Cocktails` section.
3. Rename heading to `Signature Cocktails`.
4. Replace the items beneath with the Happy Hour list + Bar Snacks list above. Preserve trademark symbols and the vegetarian asterisk footnote.
5. Save → Publish.

## Seed script status

- **Target script:** `scripts/seed-events.mjs` (entry for "Shaken, Not Sorry 2.0")
- **Port status:** pending — if seed has a hard-coded version of this event, update there too.

## Verification

- "Shaken, Not Sorry 2.0" event detail on prod renders the new heading "Signature Cocktails" and the full Happy Hour + Bar Snacks lists. Trademark symbols visible. Vegetarian footnote visible.

## Related

- Linked entries: none
