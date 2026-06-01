---
date: 2026-06-01
environment: prod + dev (partial — sundays-served-right absent on dev)
content_type: event hero images + joining-fees Monthly Dues PDF + sip-and-serve category
entry: "Attach 14 What's On hero images per user mapping; replace Monthly Dues PDF; flip Sip & Serve category Fitness→Dining"
author: dev (Claude) on 2026-06-01
dev: partial (06-01) — see below
uat: pending
seed: ported (patch-2026-06-01-event-images.mjs + monthly-dues.pdf swap)
---

## Applied to prod + dev

The user dropped 14 banner JPGs and the Monthly Dues PDF into `media/unsorted/` (subfolders `dining/`, `kids/`, `member-engagement/`). Mapped each file to its event slug, renamed to project canonical (`event-<slug>.jpg`), and shipped via `scripts/patch-2026-06-01-event-images.mjs`.

### Filename mapping (source → canonical)

| Source (`media/unsorted/<sub>/…`) | Renamed to (`media/events/…`) | Event slug |
|---|---|---|
| `dining/tennis-mixed-tennis-social-sip-serve-2026-digital-edm-web-banner.jpg` | `event-sip-and-serve-french-open-2026.jpg` | `sip-and-serve-french-open-2026` |
| `dining/football-fever-night-2026-ub-digital-edm-web-banner.jpg` | `event-football-fever-night-union-bar-2026.jpg` | `football-fever-night-union-bar-2026` |
| `dining/basketball-finals-2026-digital-edm-web-banner.jpg` | `event-basketball-finals-live-screening-union-bar-2026.jpg` | `basketball-finals-live-screening-union-bar-2026` |
| `kids/tiny-art-explorers-jun26-thequad-digital-edm-web-banner.jpg` | `event-tiny-art-explorers-program-37.jpg` | `tiny-art-explorers-program-37` (June theme) |
| `kids/camp-eagle-explorers-summer-2026-digital-edm-web-banner.jpg` | `event-camp-eagle-explorers-summer-2026.jpg` | `camp-eagle-explorers-summer-2026` |
| `kids/heroes-n-sidekicks-kids-fathers-day-activity.jpg` | `event-heroes-and-sidekicks-fathers-day-2026.jpg` | `heroes-and-sidekicks-fathers-day-2026` |
| `dining/father-s-day-2026-individual-digital-a-delicious-spread-for-dad-tsdf.jpg` | `event-a-delicious-spread-for-dad-the-2nd-floor.jpg` | `a-delicious-spread-for-dad-the-2nd-floor` |
| `dining/grillhouse-smokin-sundays-june-digital-edm-web-banner.jpg` | `event-smokin-sundays-grillhouse-2026-06.jpg` | `smokin-sundays-grillhouse-2026-06` |
| `dining/father-s-day-2026-individual-digital-a-toast-dad-this-father-s-day-grillhouse.jpg` | `event-celebrate-dad-this-fathers-day-grillhouse.jpg` | `celebrate-dad-this-fathers-day-grillhouse` (titled "A Toast to Dad … @ Grillhouse") |
| `dining/father-s-day-2026-individual-digital-a-treat-for-dad-this-father-s-day-central.jpg` | `event-a-treat-for-dad-this-fathers-day-central.jpg` | `a-treat-for-dad-this-fathers-day-central` |
| `dining/father-s-day-2026-individual-digital-celebrate-dad-this-father-s-day-tw.jpg` | `event-celebrate-dad-this-fathers-day-tradewinds.jpg` | `celebrate-dad-this-fathers-day-tradewinds` |
| `dining/father-s-day-2026-individual-digital-raise-a-glass-to-dad-ub.jpg` | `event-celebrate-dad-this-fathers-day-union-bar.jpg` | `celebrate-dad-this-fathers-day-union-bar` (titled "Raise a Glass to Dad @ Union Bar") |
| `dining/sundays-served-right-digital-edm-web-banner.jpg` | `event-sundays-served-right-the-2nd-floor.jpg` | `sundays-served-right-the-2nd-floor` |
| `member-engagement/4th-of-july-at-the-club-digital-edm-web-banner.jpg` | `event-fourth-of-july-celebration-2026.jpg` | `fourth-of-july-celebration-2026` |

### Strapi op detail

`patch-2026-06-01-event-images.mjs` for each event:
1. Look up the event by slug.
2. If existing media's filename + size both match local → skip (true idempotency).
3. Otherwise:
   a. DELETE the old media (so the Strapi media library doesn't accumulate orphans).
   b. Hunt for any other media in the library already using the target filename (e.g. left over from a partially-applied run) and delete that too.
   c. POST `/api/upload` with the renamed local file → new media id.
   d. PUT `/events/<docId>` with `image: <new id>`.

Size-based check (`Math.abs(localKB - remoteKB) < 1`) is what lets the script truly replace 3 events whose existing images had the same filename but different bytes (tiny-art-program-37, celebrate-dad-tradewinds, 4th of July). All three replaced cleanly.

### Sip & Serve category correction

User's mapping listed Sip & Serve under Dining; prod still had it at `fitness-wellness` (set on 2026-05-29 because Tennis Courts venue). PUT `category` → `dining` documentId. Same on dev.

### Monthly Dues PDF (item 5 from earlier batch — now unblocked)

- Renamed `media/unsorted/Individual Membership Categories-Monthly-Dues.pdf` → `media/membership/individual-membership-monthly-dues.pdf` (lowercase-hyphens, correct folder per `feedback_media_and_naming`).
- Copied to `frontend/public/documents/membership/monthly-dues.pdf` — matches the existing href on `joining-fees-page.ctas` (`/documents/membership/monthly-dues.pdf`). So no Strapi change needed; the file swap is the entire fix.
- SHA `153700718e…` — same bytes in both locations.

### Cleanup

`media/unsorted/` now empty and removed (`rmdir` chain). All 15 source files have a permanent home under `media/events/` or `media/membership/`.

## Per-env outcome

**prod**: ✓ All 14 events have new hero images attached (new media ids 368–381). Sip & Serve category flipped. Monthly Dues PDF replaced.

**dev**: ✓ 13 / 14 events updated (new media ids 2260–2272). `sundays-served-right-the-2nd-floor` is absent on dev (same long-standing gap documented in the dev-catch-up-audit entry — when dev's events backlog is next rebuilt, re-running this script will catch it up). Sip & Serve category flipped on dev too.

## Old media deleted (Strapi library cleanup)

Prior media items that no longer point at anything (replaced by new artwork):
- prod media id 8 (tiny-art-explorers-program-37 — original seed file)
- prod media id 4 (celebrate-dad-this-fathers-day-tradewinds — original seed file)
- prod media id 367 (fourth-of-july-celebration-2026 — the 06-01 file from the eb84ae source that was actually for 4th of July)
- dev media ids 2111, 2107, 2258 (same set on dev side)

## Verification

After CDN refresh:
- `/whats-on` listing pages — all 14 events render their new artwork in the card grid.
- `/whats-on/sip-and-serve-french-open-2026` — appears under the Dining category filter.
- `/membership/joining-fees` → Monthly Dues CTA opens the new PDF.

## Related

- Linked entries:
  - [[2026-06-01-content-batch-2]] — the batch where these 2 items got flagged as blocked; this entry unblocks both.
  - [[2026-06-01-camp-eagle-image-and-body-fix]] — set up the file naming convention this batch follows.
  - [[2026-05-26-legacy-blob-url-sweep]] — sibling effort to stop using broken external image URLs.
