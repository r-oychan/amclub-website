---
date: 2026-06-01
environment: prod (dev skipped — both affected events absent on dev)
content_type: event (camp-eagle + fourth-of-july)
entry: "Move misattributed hero image from Camp Eagle to 4th of July; strip duplicate Register here inline links from Camp Eagle body"
author: dev (Claude) on 2026-06-01
dev: n/a (events absent)
uat: pending
seed: ported (patch-2026-06-01-image-and-body-fix.mjs + corrected patch-2026-05-31-batch.mjs)
---

## Applied to prod

User flagged that the hero image attached to **Camp Eagle Explorers Summer 2026** on 2026-05-31 was actually the **4th of July Celebration** artwork. Three fixes shipped together via `scripts/patch-2026-06-01-image-and-body-fix.mjs`:

1. **Camp Eagle**: detached the image (back to the no-image state it had before the 2026-05-31 batch).
2. **Camp Eagle longDescription**: removed the two inline `[Register here](…)` lines — both age groups already have their own CTA buttons (`Register (4-7 yo)` + `Register (8 yo and above)`), so the duplicate inline links were redundant.
3. **4th of July**: deleted the misnamed media (`event-camp-eagle-explorers-summer-2026.jpg`, id 366), renamed the local source to `event-fourth-of-july-celebration-2026.jpg`, re-uploaded under the correct name (id 367), and attached to the 4th of July event.

## Op-by-op detail

### 1+2 — Camp Eagle Explorers Summer 2026 (documentId `su1b66jzwmywwd8id4xloffn`)

PUT `/events/<docId>` with:
```json
{
  "image": null,
  "longDescription": "Members: $140 per day | $700 per week\nGuests: $160 per day | $800 per week\n\n\n4-7 years old\nTime: 9:00 AM – 3:00 PM\nVenue: The American Club & various locations around Singapore\n\n\n8 years old and above\nTime: 8:30 AM – 3:00 PM\nVenue: The American Club & various locations around Singapore"
}
```

CTAs unchanged — both `Register (4-7 yo)` and `Register (8 yo and above)` stay as the action buttons.

### 3 — 4th of July Celebration @ the Club (documentId `g947pwfeligfu2zfy2cqnm3f`)

- Looked up the misnamed media by `name=event-camp-eagle-explorers-summer-2026.jpg`, got id 366.
- `DELETE /api/upload/files/366` → 200.
- `POST /api/upload` with the renamed local file → new media id 367.
- `PUT /events/<docId>` with `{ image: 367 }`.

### Source script corrected

`scripts/patch-2026-05-31-batch.mjs` updated so future replays do the right thing:
- Op 2 now targets `fourth-of-july-celebration-2026` (was `camp-eagle-explorers-summer-2026`) and references `media/events/event-fourth-of-july-celebration-2026.jpg` (renamed from the camp-eagle filename).
- Camp Eagle entry in `EVENT_PATCHES` no longer carries the `[Register here](…)` inline lines.

So `SEED_ENV=<env> node scripts/patch-2026-05-31-batch.mjs` and `… patch-2026-06-01-image-and-body-fix.mjs` now arrive at the same final state regardless of starting point.

## Media renamed

- `media/events/event-camp-eagle-explorers-summer-2026.jpg` → `media/events/event-fourth-of-july-celebration-2026.jpg`
  (same bytes — only the filename was wrong all along).

## Dev status

Both `camp-eagle-explorers-summer-2026` and `fourth-of-july-celebration-2026` are absent on dev (vanished in the inter-batch reseed we documented in [[2026-05-31-event-content-cleanup-and-event-spaces-fixes]]). The 06-01 patch script skipped both with `not found`. Once dev's events backlog is rebuilt, re-running `patch-2026-05-31-batch.mjs --env=dev` will attach the image to the right event and skip the now-removed Register here lines.

## Verification

- `/whats-on/camp-eagle-explorers-summer-2026` — no hero image; body no longer contains "Register here" lines; the two Register CTAs (4-7 yo + 8+ yo) are still visible.
- `/whats-on/fourth-of-july-celebration-2026` — hero image now renders the correct artwork (the file the user supplied as `eb84ae_22959a4cb0514221ad557b25164a7f2c~mv2.jpg`).

## Related

- Linked entries:
  - [[2026-05-31-event-content-cleanup-and-event-spaces-fixes]] — original batch that mis-attached the image.
  - [[2026-05-22-event-camp-eagle-explorers-summer]] / [[2026-05-22-event-fourth-of-july-celebration]] — original event creation entries.
