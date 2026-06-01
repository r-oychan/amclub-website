---
date: 2026-06-01
environment: prod + dev (partial)
content_type: event (4 body trims) + KidsPage.tsx fallback
entry: "Heroes sessions onto 2 lines; Camp Eagle drop Venue lines; 4th of July drop date/time prefix + Get tickets line; Celebrate Dad clear date duplicated in time; fix broken Parties Made Easy images"
author: dev (Claude) on 2026-06-01
dev: partial (06-01) — see below
uat: pending
seed: ported (patch-2026-06-01-event-body-trim.mjs + KidsPage.tsx + corrected patch-2026-05-31-batch.mjs)
---

## Applied to prod + dev (partial)

Four Strapi event body trims (`scripts/patch-2026-06-01-event-body-trim.mjs`) + one frontend image fix (KidsPage `fallbackPartyPackages`).

### Strapi ops — events

| # | Slug | Field | Change |
|---|---|---|---|
| 1 | `heroes-and-sidekicks-fathers-day-2026` | `longDescription` | Combine the two Session lines onto one (using ` · ` separator, matching the `time` field style). Block now renders as 2 lines: sessions / venue. |
| 2 | `camp-eagle-explorers-summer-2026` | `longDescription` | Drop the duplicated `Venue: The American Club & various locations around Singapore` line from both age groups (redundant — `event.location` already carries this). |
| 3 | `fourth-of-july-celebration-2026` | `longDescription` | Drop the leading `Saturday, July 4, 2026 / 4:00PM – 9:00PM` block (already in `event.date` + `event.time`) and the trailing `Get your tickets here.` (Get Tickets CTA already covers it). |
| 4 | `celebrate-dad-this-fathers-day-union-bar` | `time` | `"Sunday, June 21, 2026"` → `null`. Event has no actual time-of-day; the duplicated date was leaking into the time slot. `event.date` (`2026-06-21`) is the source of truth. |

### Frontend — KidsPage fallbackPartyPackages images

Item 5: the **/kids** page "Parties Made Easy" section was rendering broken images because the `fallbackPartyPackages` constant in `frontend/src/pages/KidsPage.tsx:127–164` pointed at the legacy `amclubdata28a57492` blob storage (same dead account we swept everywhere else on 2026-05-26) for two images plus a `${STRAPI_URL}/uploads/…` path for the third.

Replaced all three with the local paths the deployed assets actually serve from (matching `subpages.ts:1533/1543/1553`):
- Quad Studio → `/images/kids/kids-parties/quad-studio.jpeg`
- Bowling Alley → `/images/kids/kids-parties/bowling-alley.jpeg`
- Union Bar → `/images/kids/kids-parties/union-bar.jpeg`

The `subpages.ts` copy of these paths was already correct — only the KidsPage fallback was carrying the broken legacy URLs. CMS data takes over when Strapi returns `partyPackages`, but until then this fallback drives what shows.

## Source script corrected

`scripts/patch-2026-05-31-batch.mjs` updated so a fresh replay arrives at today's cleaned state:
- Heroes & Sidekicks — `longDescription` reflects the single-line Session block.
- Camp Eagle — `longDescription` no longer carries the `Venue:` lines (matches the 06-01 trim).

## Dev outcome

- **Op 1 (Heroes), Op 2 (Camp Eagle), Op 3 (4th of July)**: events still absent on dev (same inter-batch reseed gap documented earlier). Script logged `skip`.
- **Op 4 (Celebrate Dad)**: ✓ `time` field cleared on dev.
- **KidsPage image fix**: arrives on dev via the branch port.

## Verification

After CDN refresh / next deploy:
- `/whats-on/heroes-and-sidekicks-fathers-day-2026` — the time/venue block now spans 2 lines: `Session 1: 1:00 PM – 2:30 PM · Session 2: 3:00 PM – 4:30 PM` / `The Quad Studios`.
- `/whats-on/camp-eagle-explorers-summer-2026` — both age groups show just `Time: 9:00 AM – 3:00 PM` and `Time: 8:30 AM – 3:00 PM` without the duplicate Venue line.
- `/whats-on/fourth-of-july-celebration-2026` — body starts with `$29 per person…` and ends at `…F&B and activity* tickets.` (no leading date+time, no trailing Get tickets line).
- `/whats-on/celebrate-dad-this-fathers-day-union-bar` — the Date & Time block no longer shows "Sunday, June 21, 2026" beneath the actual date.
- `/kids` Parties Made Easy section — all three card images render correctly.

## Related

- Linked entries:
  - [[2026-05-26-legacy-blob-url-sweep]] — original sweep that missed the KidsPage fallback (it was inside a `.tsx` constant, not `subpages.ts`, so the file-by-file sweep didn't catch it).
  - [[2026-06-01-camp-eagle-image-and-body-fix]] — same-day Camp Eagle body change; the corrected 05-31 source bundles both edits.
  - [[2026-06-01-event-body-redundant-cta-text]] — sibling cleanup pass.
