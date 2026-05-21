---
date: 2026-05-22
environment: prod
content_type: event
entry: "Sundays Served Right (The 2nd Floor)"
author: client (recorded 2026-05-22)
dev: pending
uat: pending
seed: pending
---

## What changed

Hid the "Sundays Served Right" event from the What's On page.

> Mechanism: most likely **unpublished** (toggled draftAndPublish off) so it no longer renders, while keeping the entry data intact. Confirm with content team if they instead deleted the entry or used a "visible" / `featured` flag.

## Fields touched

### Publish state (entry: "Sundays Served Right" at The 2nd Floor)

- **Before:** Published
- **After:** Draft (unpublished)

> If a different mechanism was used (e.g. deletion, hidden flag, archived category), record it here on confirmation.

## Media added / replaced

_(none)_

## Media removed

_(none — entry data preserved if unpublished)_

## Replay instructions (for dev)

**Path A — `/admin`:**

1. Content Manager → Event → find "Sundays Served Right" (location: The 2nd Floor).
2. Click "Unpublish".
3. Confirm it disappears from the public What's On page.

Do **not** delete the entry unless the prod entry was actually deleted — verify mechanism first.

## Seed script status

- **Target script:** `scripts/seed-events.mjs`
- **Port status:** n/a (visibility toggle, not seed content) — but if the seed re-publishes the event on next run, gate it behind a flag or remove it from the seed array.

## Verification

- "Sundays Served Right" no longer appears in the What's On listing on prod.

## Related

- Linked entries: [[2026-05-22-event-delicious-spread-link]] — sibling 2nd Floor event being updated in same batch.
