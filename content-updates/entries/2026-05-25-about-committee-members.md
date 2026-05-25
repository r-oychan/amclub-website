---
date: 2026-05-25
environment: prod
content_type: committee-member (collection)
entry: "About page Governing Committee — replace Michelle Reeb with Christopher Ellis, remove Rachael Gartman"
author: dev (Claude) on 2026-05-25
dev: pending
uat: pending
seed: ported (patch-about-committee-2026-05-25.mjs)
---

## Applied to prod

Applied 2026-05-25 via `scripts/patch-about-committee-2026-05-25.mjs` (ops #1 and #2). Verified live:
- `christopher-ellis` slug exists, documentId `mnaws0nftypc089vgzgx3zkl` (same record as the old Michelle entry — replaced in place to preserve `order=13` and the committee position).
- `michelle-reeb` slug → 404 (replaced).
- `rachael-gartman` slug → 404 (deleted).

`committee-member` has `draftAndPublish: false`, so changes are immediately live (no publish step).

## What changed

### Op 1 — Michelle Reeb → Christopher Ellis (same role, new photo)

Replaced the Michelle Reeb committee-member in place. The record's `documentId` is preserved so the row keeps its `order: 13` slot; only `name`, `slug`, and `photo` change.

### Op 2 — Remove Rachael Gartman

Permanently deleted the Rachael Gartman committee-member entry.

## Fields touched

### `committee-member` entry `mnaws0nftypc089vgzgx3zkl` (was Michelle, now Christopher)

| Field | Before | After |
|---|---|---|
| `name` | `Michelle Reeb` | `Christopher Ellis` |
| `slug` | `michelle-reeb` | `christopher-ellis` |
| `role` | `American Association of Singapore Representative` | unchanged |
| `memberType` | `general-committee` | unchanged |
| `order` | `13` | unchanged |
| `bio` | empty | unchanged (empty) |
| `photo` | `gc-michelle-reeb.png` (Strapi media id 254) | `gc-christopher-ellis.png` (Strapi media id 363) |

### `committee-member` entry `pcrdhs7qq18c2yp3jv9z54f5` (Rachael Gartman)

DELETED. For reference, prior state:
- `name`: Rachael Gartman
- `slug`: rachael-gartman
- `role`: US Embassy Representative
- `order`: 16
- `photo`: gc-rachael-gartman.png (Strapi media id 257)

## Media added / replaced

- `media/about/gc-christopher-ellis.png` — uploaded to prod Strapi (media id 363) as `gc-christopher-ellis.png`. The user-supplied file `media/about/Christopher Ellis.png` was renamed to lowercase-hyphens + `gc-` prefix to match the existing committee-member photo naming convention (`gc-<firstname>-<lastname>.png`).

## Media now orphaned (flagged for follow-up cleanup)

These two files are no longer referenced by any committee-member entry. Kept in Strapi media library + local `media/about/` for now so the change is reversible. Delete after the next env sync confirms nothing else relies on them.

- Strapi media id 254 — `gc-michelle-reeb.png` (was Michelle's photo)
- Strapi media id 257 — `gc-rachael-gartman.png` (was Rachael's photo)
- `media/about/gc-michelle-reeb.png` — local
- `media/about/gc-rachael-gartman.png` — local

## Replay instructions (for dev / uat)

```bash
# dev
SEED_ENV=dev  node scripts/patch-about-committee-2026-05-25.mjs

# uat
SEED_ENV=uat  node scripts/patch-about-committee-2026-05-25.mjs

# single op (re-run safety)
SEED_ENV=dev  node scripts/patch-about-committee-2026-05-25.mjs --only=1
SEED_ENV=dev  node scripts/patch-about-committee-2026-05-25.mjs --only=2
```

The script is idempotent: it skips ops whose target state already exists.

## Seed script status

- **Captured in:** `scripts/patch-about-committee-2026-05-25.mjs`
- **Long-term seed:** if a future `scripts/seed-committee-members.mjs` is created, it should reflect this post-batch state (Christopher in slot 13, no Rachael).

## Verification

- Open https://www.amclub.org.sg/about → Governing Committee section → Christopher Ellis appears in Michelle's previous slot with the new photo. Rachael Gartman no longer listed.
- Hard refresh may be needed past CDN.

## Related

- Linked entries: none.
