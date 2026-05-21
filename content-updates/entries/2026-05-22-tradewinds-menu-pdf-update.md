---
date: 2026-05-22
environment: prod
content_type: restaurant + dining-page
entry: "Tradewinds (restaurant) + Dining Page (singleton) — menu PDF surfaced on both"
author: client (recorded in 1st batch on 2026-05-22)
dev: pending
uat: pending
seed: pending
---

## What changed

Replaced the Tradewinds menu PDF with the new "[080526, 12.20PM] TW Menu.pdf" on (a) the Tradewinds restaurant detail page and (b) the Dining home page card/link that points to the Tradewinds menu.

> Note: User originally referred to "tailwind menu" / "tailwind main page" — confirmed as **Tradewinds** (the restaurant). Same asset on two surfaces.

## Fields touched

### `restaurant.menuUrl` (entry: Tradewinds)

- **Type:** string (URL to the uploaded PDF in Strapi media library)
- **Before:** previous Tradewinds menu PDF URL (whatever was there pre-2026-05-22)
- **After:** URL of the newly-uploaded `[080526, 12.20PM] TW Menu.pdf`

### `dining-page.clubFavorites` → Tradewinds card menu link (singleton: Dining Page)

- **Type:** link/CTA pointing to Tradewinds menu
- **Before:** prior menu link
- **After:** same new PDF URL as above

> Verify exact field name during replay — the dining-page singleton uses `blocks.card-grid` for `clubFavorites`; the Tradewinds card's menu link should be updated to the new PDF.

## Media added / replaced

- `media/dining/tradewinds/[080526, 12.20PM] TW Menu.pdf` — uploaded to Strapi media library. **Project naming rule** says lowercase-hyphens; recommend renaming to e.g. `tradewinds-menu-2026-05-08.pdf` next time we touch this asset (rename file + reupload + update both references).

## Media removed

- Previous Tradewinds menu PDF (filename TBD — check Strapi media library "Used by" history). Should be deleted from `media/dining/tradewinds/` once replay across envs is confirmed.

## Replay instructions (for dev)

**Path A — `/admin`:**

1. Upload `media/dining/tradewinds/[080526, 12.20PM] TW Menu.pdf` to dev Strapi media library.
2. Content Manager → Restaurant → Tradewinds → set `menuUrl` to the new PDF's URL → Save → Publish.
3. Content Manager → Dining Page (singleton) → in `clubFavorites` card-grid, find the Tradewinds card → update its menu CTA/link to the new PDF URL → Save → Publish.
4. Confirm both surfaces render the new PDF.

## Seed script status

- **Target script:** `scripts/seed-dining-page.mjs` (and the Tradewinds restaurant seed — likely `scripts/seed-detail-skeletons.mjs` or similar)
- **Port status:** pending
- **Notes:** When porting, also fix the filename to lowercase-hyphens per project rules and update both surface references.

## Verification

- Tradewinds restaurant detail page on prod: menu link/button opens the new PDF.
- Dining home page on prod: the Tradewinds card's "View Menu" (or equivalent) opens the same new PDF.

## Related

- Prod commit / PR / admin event: n/a (direct admin upload)
- Linked entries: none
