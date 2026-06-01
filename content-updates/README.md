# Content Updates Log

Tracks every content change made directly against **production** (the `main`-branch / live Strapi instance) so the same change can later be replayed on `dev` (and, where needed, `uat`) to keep all three environments in sync.

## Why this exists

The site is live. The client edits content directly in prod `/admin`, and we sometimes do too. `dev` and `uat` Strapi databases are separate — they do not pick up prod edits automatically. Without a written record we lose track of what diverged, and re-seeding dev from `content-inventory.json` overwrites legitimate edits.

This folder is the bridge: write down every prod content change here, then replay it onto dev when we next sync.

## Scope

**In scope** — anything edited in prod Strapi `/admin` or pushed to prod via a one-off script:

- Text / copy edits on any page or component
- Image / PDF uploads or replacements
- New entries in collection types (events, news, dining promotions, etc.)
- Entry deletions or unpublishings
- Field re-ordering, component additions/removals inside dynamic zones
- CTA href / link changes

**Out of scope** — these go through the normal `dev → uat → main` PR flow, not this log:

- Schema changes (new content type, new field, field rename) — those are code
- Seed-script edits — those are code
- Frontend / infra code changes

## Workflow

### 1. When a prod content change happens

Create a new file in `entries/` using the template:

```
entries/YYYY-MM-DD-<short-slug>.md
```

`YYYY-MM-DD` = date of the prod change. `<short-slug>` = kebab-case description, e.g. `home-hero-copy`, `event-spring-gala-published`, `dining-grillhouse-pdf-replaced`. Keep slugs short and unique within the day.

Fill out the template fields. Be specific enough that the change can be reproduced by reading only this file.

Then add a one-line entry to [`log.md`](./log.md) at the top of the table.

### 2. When we sync dev (later, on explicit request)

1. Open `log.md`, find every entry with `dev: pending`.
2. Walk each entry file in chronological order.
3. Apply the change to dev (via `/admin` or a script) exactly as recorded.
4. Flip the entry's `dev:` field to `applied` and add the date applied.
5. Update the row in `log.md`.

`uat` follows the same pattern with its own column — use only if/when we decide to sync uat.

### 3. When the change should become permanent

If a prod content change represents the new canonical content (not just a temporary edit), it must eventually be ported into the matching `scripts/seed-*.mjs` so a fresh environment reproduces it. Record that port in the entry's **Seed script status** section. Until ported, the change exists only in live databases and this log.

## Hard rules (active for this thread)

- **Do not touch dev right now.** This thread is for recording prod changes only. Replay happens on explicit instruction, in a separate session.
- One entry per logical change. If you edit five fields on the home page in one sitting, that's one entry. If you publish three unrelated events, that's three entries.
- Never edit an entry after the day it was written, except to flip `dev:` / `uat:` / seed-port status. If the prod change was wrong and got reverted, write a new entry describing the revert and link back.
- Image / PDF uploads: also copy the file into `media/` under the correct subfolder and reference the local path in the entry. Replay on dev will re-upload from that local copy.

## Files

- [`log.md`](./log.md) — chronological index, one row per entry. Read this first.
- [`entries/TEMPLATE.md`](./entries/TEMPLATE.md) — copy this when creating a new entry.
- `entries/*.md` — individual change records.
