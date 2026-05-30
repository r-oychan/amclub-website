---
date: 2026-05-31
environment: prod + dev (partial — see "Dev gap")
content_type: event + event-spaces-page (distinctiveSpaces) + subpages.ts fallback
entry: "Strip date prefixes from event bodies + add Heroes/Camp Eagle CTAs + Sundays Served mailto CTA + camp-eagle hero image + event-spaces Learn More wiring + wedding/corporate-functions Galbraith+Bowling capacity"
author: dev (Claude) on 2026-05-31
dev: partial (05-31) — see dev gap below
uat: pending
seed: ported (patch-2026-05-31-batch.mjs + subpages.ts edits)
---

## Applied to prod (full) + dev (partial)

Three patch-script ops + four `subpages.ts` edits, covering 14 user-listed items.

### Strapi ops (`patch-2026-05-31-batch.mjs`)
- **Op 1**: nine event content updates (date-prefix removal, structured copy, CTAs for register/mailto actions).
- **Op 2**: upload + attach camp-eagle hero image (`media/events/event-camp-eagle-explorers-summer-2026.jpg`, renamed from `eb84ae_…~mv2.jpg`).
- **Op 3**: wire Learn More CTAs on `event-spaces-page.distinctiveSpaces.items` (was defaulting to `#`).

### Frontend code (`subpages.ts`)
- Wedding-celebration hero image path repaired (was `/uploads/package_wedding_1fc9c3830f.jpg` — file never existed locally).
- Wedding-celebration Galbraith venueCard capacity: `Up to 40 pax` → `Up to 230 pax`.
- Corporate-functions Galbraith venueCard capacity: `Up to 40 pax` → `Up to 230 pax`.
- Corporate-functions Bowling Alley venueCard capacity: `Up to 28 pax` → `30 pax`.

## Op-by-op (mapping user items 1–14)

| Item | What | Prod | Dev |
|---|---|---|---|
| 1 | basketball-finals — strip `"June 3 – 19, 2026"` prefix | ✓ | ✗ event not on dev |
| 2 | football-fever — strip `"Sunday, May 31, 2026 \| 12:00AM"` prefix; double-newline before Beverage Specials | ✓ | ✗ event not on dev |
| 3 | smokin-sundays-grillhouse-2026-06 — strip date; restructure Food + Beverage specials with one blank line between entries | ✓ | ✗ event not on dev |
| 4 | sip-and-serve — strip `"Friday, May 29, 2026 / 7:00PM – 9:30PM / Tennis Courts"` prefix | ✓ | ✓ |
| 5 | tiny-art-explorers-program-37 — strip `"Thursdays, 3:00 PM – 3:45 PM"`; restructure | ✓ | ✓ |
| 6 | heroes-and-sidekicks — strip date; restructure; add Register CTA (URL provided) | ✓ (longDescription + 1 CTA) | ✗ event not on dev |
| 7 | camp-eagle — strip date range; restructure; add 2 Register CTAs (4-7 yo + 8+ yo URLs) | ✓ (longDescription + 2 CTAs) | ✗ event not on dev |
| 8 | camp-eagle hero image | ✓ uploaded media id 366, attached | ✗ event not on dev |
| 9 | celebrate-dad-this-fathers-day-union-bar — strip `"Sunday, June 21, 2026"` prefix | ✓ | ✓ |
| 10 | sundays-served-right — add `mailto:2ndfloor@amclub.org.sg` CTA (inline link not possible, see render note) | ✓ CTA added | ✗ event not on dev |
| 11 | wedding-celebration broken image + Galbraith 230 pax | ✓ subpages.ts | ✓ (will arrive on dev port) |
| 12 | event-spaces "Learn More" links not reachable | ✓ all 4 distinctiveSpaces items wired | ✓ |
| 13 | (duplicate of 11) wedding-celebration Galbraith 230 pax | ✓ | ✓ (via item 11) |
| 14 | corporate-functions Galbraith 230 pax + Bowling Alley 30 pax | ✓ subpages.ts | ✓ (will arrive on dev port) |

## Render note (items 6, 7, 10)

`EventDetailPage.tsx:244–252` renders each `longDescription` paragraph as plain `<p>{text}</p>` — **no markdown**, no auto-linking. So inline `[here](url)` or bare emails are not clickable. Action items live as **CTAs** instead:
- Heroes & Sidekicks: 1 CTA `Register` → user-supplied form URL.
- Camp Eagle: 2 CTAs `Register (4-7 yo)` + `Register (8 yo and above)` → two distinct form URLs per age group.
- Sundays Served Right: 1 CTA `Email The 2nd Floor` → `mailto:2ndfloor@amclub.org.sg`. The email also stays in the body as descriptive text but is not clickable from there.

If the user wants inline links rendered, that's a frontend change — swap the `<p>{p}</p>` for a markdown renderer (or a small autolinker for `mailto:` and `http(s)://`). Flagged for future work.

## Learn More wiring detail (Op 3 / item 12)

`event-spaces-page.distinctiveSpaces.items[].cta` was unset for all four items. `EventSpacesPage.tsx:97` defaults `cta.href` to `'#'` when not provided — hence dead Learn More buttons. Wired:

| Distinctive Space | Learn More href |
|---|---|
| The Galbraith Ballroom | `/event-spaces/the-gallbrainth-ballroom` (slug typo preserved — exists as-is in `subpages.ts:1722`) |
| Thinkspace | `/event-spaces/thinkspace` |
| The Bowling Alley | `/event-spaces/bowling-alley` |
| The Quad Studios | `/kids/the-quad-studios` (cross-section — Quad Studios doesn't have an event-spaces subpage; it does have a kids subpage at `subpages.ts:1301`) |

## Media

- **Added**: `media/events/event-camp-eagle-explorers-summer-2026.jpg` (renamed from `media/eb84ae_22959a4cb0514221ad557b25164a7f2c~mv2.jpg`). Uploaded to prod Strapi as media id 366 and attached to the camp-eagle event.
- **Copied to deploy folder**: `frontend/public/images/event-spaces/package-wedding.jpg` (canonical lives at `media/event-spaces/package-wedding.jpg` — already tracked).

## Dev gap (important)

Between the 2026-05-25 sync (when all 8 batch-1 events were created on dev) and 2026-05-31, the dev env Strapi was apparently re-seeded — only 16 events remain there now, and basketball-finals / football-fever / smokin-sundays-Jun / heroes-and-sidekicks / camp-eagle / sundays-served-right are all absent. The patch script gracefully skipped each missing slug.

**Net dev result for ops 1+2:** 3 events updated (sip-and-serve, tiny-art-explorers-program-37, celebrate-dad-this-fathers-day-union-bar). 6 events not present, so the content cleanup + Heroes/Camp Eagle CTAs + Camp Eagle image attach don't land on dev today.

**To resolve on dev later** (out of scope for this batch): either re-run `scripts/patch-whats-on-2026-05-22.mjs` against `SEED_ENV=dev` to recreate the missing events, then re-run this script — or accept that dev is divergent until next reseed.

Op 3 (Learn More wiring) **did** apply on dev — `event-spaces-page` distinctiveSpaces is shared content type that exists on both envs.

## Replay instructions

```bash
SEED_ENV=uat node scripts/patch-2026-05-31-batch.mjs
SEED_ENV=uat node scripts/patch-2026-05-31-batch.mjs --only=2  # camp-eagle image only
```

Idempotent: re-running is safe (longDescription equality check + slug-based deduplication of upload).

## Verification

After next prod frontend deploy:
- `/whats-on/basketball-finals-live-screening-union-bar-2026` — body no longer starts with "June 3 – 19, 2026".
- `/whats-on/football-fever-night-union-bar-2026` — body starts with "Catch the European Club…"; Beverage Specials block separated by a blank line.
- `/whats-on/heroes-and-sidekicks-fathers-day-2026` — Register CTA visible and works.
- `/whats-on/camp-eagle-explorers-summer-2026` — hero image renders; both Register CTAs point at distinct URLs.
- `/whats-on/sundays-served-right-the-2nd-floor` — "Email The 2nd Floor" CTA opens mail client.
- `/event-spaces` — four Learn More buttons in distinctiveSpaces section all navigate to a real detail page.
- `/event-spaces/wedding-celebration` — hero image loads; Galbraith venueCard shows "Up to 230 pax".
- `/event-spaces/corporate-functions` — Galbraith venueCard shows "Up to 230 pax"; Bowling Alley shows "30 pax".

## Related

- Linked entries:
  - [[2026-05-22-event-basketball-finals-screening]], [[2026-05-22-event-football-fever-night]], etc. — original event creation entries; this batch reformats their bodies.
  - [[2026-05-30-event-venue-capacity-and-hours]] — sibling event-spaces capacity update; this batch finishes the wedding/corporate venueCards left out.
  - [[2026-05-22-event-heroes-and-sidekicks-fathers-day]] — original entry flagged "Register CTA URL missing"; this batch closes that gap.
