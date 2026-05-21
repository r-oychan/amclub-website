---
date: 2026-05-22
environment: prod
content_type: frontend static asset (NOT Strapi)
entry: "Tradewinds menu PDF — frontend/public/menus/tradewinds-menu.pdf"
author: dev (Claude) on 2026-05-22
dev: pending
uat: pending
seed: n/a
---

## What changed

Replaced the Tradewinds menu PDF on the live site.

> Originally framed as "Tradewinds menu update in Strapi". Investigation showed the menu lives as a static frontend asset, NOT a CMS field. See "Mechanism" below.

## Mechanism (verified 2026-05-22)

The Tradewinds menu link is rendered from THREE places, all pointing to the same static path `/menus/tradewinds-menu.pdf`:

1. **Strapi `restaurant.ctas[0].href`** (Tradewinds entry, documentId `d5ffaqysdqbih88mybe2pb7e`) — stores the relative string `"/menus/tradewinds-menu.pdf"`, NOT a Strapi media URL. `restaurant.menuUrl` is `null` and unused.
2. **`frontend/src/data/subpages.ts:346`** — hardcoded `{ label: 'View Menu', href: '/menus/tradewinds-menu.pdf', isExternal: true }` (violates the project memory `feedback_no_hardcoded_subpages` — long-term migration debt).
3. **`frontend/src/pages/DiningPromotionsPage.tsx:72`** — slug → menu URL map for the promotion pages.

All three resolve to the same static file at `frontend/public/menus/tradewinds-menu.pdf`, which is served by the deployed frontend container.

**The dining home page (`/dining`) does NOT have a separate Tradewinds menu link** — its `dining-page.clubFavorites` cards are `TAC2Go!` + `Bottles2Go!`, no Tradewinds card. The Tradewinds menu surfaces via the restaurant card → detail page only.

## Files touched

### `frontend/public/menus/tradewinds-menu.pdf`
- **Before:** 19 May version (~496 KB)
- **After:** new content from the 2026-05-22 menu (~SHA `20cf633e…`)
- **Source:** `media/dining/tradewinds/tradewinds-menu.pdf` (canonical copy in media/)

### `media/dining/tradewinds/tradewinds-menu.pdf`
- **Before:** older copy
- **After:** same new content as the public/menus version (matching SHA)

### `media/dining/tradewinds/[080526, 12.20PM] TW Menu.pdf`
- **Deleted** — the upload-time-stamped filename violated the project naming rule. Content preserved under the canonical `tradewinds-menu.pdf` name.

## Replay instructions (for dev)

1. Pull the change on `dev` branch (or cherry-pick the relevant commit).
2. Frontend rebuilds via CI; the dev container redeploys with the new PDF.
3. No Strapi action needed on dev — the menu link stays as `"/menus/tradewinds-menu.pdf"`.

## Seed script status

- **Target script:** n/a (static asset, no seed)
- **Port status:** n/a

## Verification

After frontend redeploy:
- Visit https://www.amclub.org.sg/dining/tradewinds and click "View Menu" → PDF should be the new 080526 version.
- Same on the dining promotion page when a tradewinds promotion is clicked.

## Long-term debt flagged

The `subpages.ts:346` hardcoding violates `feedback_no_hardcoded_subpages`. Same pattern exists for all 6 restaurant menus. Migrating all 6 to CMS-managed menus (upload to Strapi, store URL in `restaurant.menuUrl`, remove `subpages.ts` entries) is its own work item — out of scope for this batch.

## Related

- Linked entries: none. Future menu refactor will live as its own entry.
