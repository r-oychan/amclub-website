<!--
Copy this file to entries/YYYY-MM-DD-<short-slug>.md and fill in.
Keep slug kebab-case and unique within the day.
-->

---
date: YYYY-MM-DD
environment: prod
content_type: <e.g. home-page | event | dining-promotion | venue>
entry: <singleton name OR collection entry id/slug/title>
author: <who made the prod change>
dev: pending          # pending | applied (YYYY-MM-DD) | n/a
uat: pending          # pending | applied (YYYY-MM-DD) | n/a
seed: pending         # pending | ported | n/a
---

## What changed

One-sentence summary of the change.

## Fields touched

For each field that was added, removed, or modified:

### `<field.path>`

- **Type:** text | richtext | media | relation | component | dynamic-zone | etc.
- **Before:**
  ```
  <verbatim previous value, or "(empty)" / "(did not exist)">
  ```
- **After:**
  ```
  <verbatim new value>
  ```

Repeat one block per field.

## Media added / replaced

- `media/<path/to/file.ext>` — uploaded to Strapi as `<Strapi filename>`, used by `<field.path>`.
- _(none)_ if no media touched.

## Media removed

- `media/<path/to/file.ext>` — was referenced by `<field.path>`, now orphaned. Delete after replay confirmed across envs.
- _(none)_ if no media removed.

## Replay instructions (for dev)

Pick **one** path and fill it in:

**Path A — `/admin` clicks.** Step-by-step what to do in the dev Strapi admin to reproduce. Include exact navigation (Content Manager → … → Save & Publish).

**Path B — script.** Provide an idempotent snippet (extension of `scripts/seed-*.mjs` or a one-off `scripts/patch-*.mjs`) that applies the change. Note any env vars / tokens required.

## Seed script status

- **Target script:** `scripts/seed-<page>.mjs` (or "new file: `scripts/seed-<x>.mjs`")
- **Port status:** pending | ported in commit `<sha>` | n/a (transient change)
- **Notes:** anything tricky about porting.

## Verification

How to confirm the change is live after replay (URL + what to look for). Optional screenshot path under `content-updates/entries/_screenshots/<slug>/`.

## Related

- Prod commit / PR / admin event: `<link or n/a>`
- Linked entries: `<other entry filenames, if this is a follow-up or revert>`
