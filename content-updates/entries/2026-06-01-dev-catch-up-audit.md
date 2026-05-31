---
date: 2026-06-01
environment: dev
content_type: meta — audit + replay of multiple prior batches against dev env
entry: "Walk the log + bring dev fully in sync — recreate 6 missing events, replay 3 missing Strapi patches, verify code/assets/text/nav on dev branch"
author: dev (Claude) on 2026-06-01
dev: applied (06-01)
uat: pending
seed: n/a (re-runs of existing scripts)
---

## Applied to dev

User asked for a sweep ensuring everything in the log has actually landed on dev. Walked through all 31 prior entries against the 4 categories called out (newline rendering, images + PDFs, text edits, nav change) and replayed whatever was still stale.

## Audit result

### ✓ Already correct on dev (no action)

- **Item 1 — markdown + newline rendering**: `react-markdown@^10.1.0` and `remark-breaks@^4.0.0` both in `frontend/package.json`. Both `EventDetailPage.tsx` and `VenueDetailPage.tsx` import `remarkBreaks` and pass it via `remarkPlugins`. Single-`\n` line break behaviour matches prod.
- **Item 2 — images + PDFs**: spot-checked 13 of the file-level assets ported by prior batches (wedding hero, event-spaces venue/wedding cards, Galbraith capacity chart, Bowling rates + party package, fitness rates PDF, Tradewinds menu, camp-cancellation PDF, recreational classes hero, Christopher Ellis headshot, both club-wide promo source images, 4th of July hero). All present on the dev branch.
- **Item 3 — text edits in `subpages.ts`**: Gourmet Pantry phone fallback `6739 4407`, niche-group 15K `A minimum of $15,000`, Galbraith venueCard capacity `Up to 230 pax` (weddings + corporate-functions), Bowling Alley venueCard `30 pax`, Galbraith subpage `230 pax`, Bowling Alley subpage `30 pax`, recreational-classes new paragraph + Cancellation/Temporary Suspension Form CTA — all present.
- **Item 4 — nav change**: `DEFAULT_HEADER` Fitness & Wellness → Activities column → `Pilates` at index 2 (between Multi-Purpose Court and Squash). Present.
- **KidsPage `fallbackPartyPackages` legacy blob URLs**: all 3 already repointed to local `/images/kids/kids-parties/*.jpeg`.
- **Strapi spot-checks that were already correct on dev**: `moreActivities` items order (Pilates as 3rd), Grillhouse + Tiki Bar `operatingHoursSections` (2 sections, 3 rows), Union Bar Sports Screening CTA + operating hours, `event-spaces-page.distinctiveSpaces` capacities (Galbraith `3,400 Square Feet`, Bowling Alley `30 pax`) + all 4 Learn More CTAs wired, club-wide June Monthly + Celebrate Dad dining-promotions.

### Re-applied — dev had been reseeded since the 05-22/05-25 batches

The dev env Strapi DB has been wiped/reseeded at least twice since these initial batches landed, so a few Strapi-side states had reverted. Re-ran the originating patches against dev:

- **`patch-gourmet-pantry-phone.mjs --env=dev`**: dev's `restaurant.locationContact.phone` was back at `6739 4361`; PUT to `6739 4407`. ✓
- **`patch-about-committee-2026-05-25.mjs --env=dev`**: `michelle-reeb` slug present again, `christopher-ellis` absent. Re-uploaded `gc-christopher-ellis.png` (new media id 2259), updated the entry in place, deleted Rachael Gartman. ✓
- **`patch-fitness-and-union-bar-2026-05-25.mjs --only=2 --env=dev`**: `fitness-page.gym.ctas[0]` was back at "Personal Training & Group Fitness Classes" → old PDF path. PUT to "Personal Training & Group Fitness Rates 2026" → `/documents/fitness/personal-training-group-fitness-rates-2026.pdf`. ✓

### Recreated — events absent on dev

The 8 events from the 2026-05-22 What's On batch had disappeared from dev (we'd flagged the gap on 05-31). Recreated 6 of them by re-running `patch-whats-on-2026-05-22.mjs --env=dev --only=<n>` per event:
- Op 3 → `basketball-finals-live-screening-union-bar-2026`
- Op 4 → `football-fever-night-union-bar-2026`
- Op 5 → `smokin-sundays-grillhouse-2026-06`
- Op 8 → `heroes-and-sidekicks-fathers-day-2026`
- Op 9 → `camp-eagle-explorers-summer-2026`
- Op 10 → `fourth-of-july-celebration-2026`

(Op 6 `sip-and-serve-french-open-2026` already existed; op 7 `tiny-art-explorers-2026-06` left absent — duplicates `tiny-art-explorers-program-36/37` which already exist; op 11 Shaken Not Sorry update already correct on dev; op 12 unpublish is n/a since the event doesn't exist; op 13 Delicious Spread link already correct.)

After recreate, re-ran subsequent patches to apply all the refinement that's accumulated since:
- `patch-event-categories-2026-05-29.mjs --env=dev` — Basketball + Football category corrected to `dining`; Sip & Serve category set to `fitness-wellness` (it had been recreated without a category).
- `patch-2026-05-30-batch.mjs --env=dev` — deleted Seasonal Brews / Toast to Mom / Heartwarming Mother's Day Feast (recreated by reseed), refreshed Grillhouse + Tiki Bar hours, recreated June Monthly + Celebrate Dad promotions (dev media ids 2256 + 2257), Union Bar idempotent verify, deleted club-wide-may-monthly-promo (recreated by reseed), distinctiveSpaces capacities + Learn More.
- `patch-2026-05-31-batch.mjs --env=dev` — body cleanups applied to all 6 recreated events, hero image uploaded for 4th of July (dev media id 2258).
- `patch-2026-06-01-image-and-body-fix.mjs --env=dev` — Camp Eagle body cleaned; 4th of July image already correct.
- `patch-2026-06-01-event-body-cleanup.mjs --env=dev` — basketball "View the schedule here." stripped (no-op since 05-31 body already clean); heroes "[Register here](…)." stripped.
- `patch-2026-06-01-event-body-trim.mjs --env=dev` — Heroes session combine, Camp Eagle drop Venue lines, 4th of July drop date/time prefix, Celebrate Dad clear `time`.

### Still n/a on dev

- **`sundays-served-right-the-2nd-floor`**: event still doesn't exist on dev. Was originally a delete/unpublish target from the 05-22 batch and a body relaunch from the 05-30 batch. Since it's absent the "hide it" / "rename body" ops are effectively done. Leave as-is unless content team explicitly wants it on dev.
- **`tiny-art-explorers-2026-06`**: event left absent. Dev already has `tiny-art-explorers-program-36` (May) and `tiny-art-explorers-program-37` (June) covering both themes; the `-2026-06` duplicate from the 05-22 batch isn't needed.

## Log impact

Every row in `log.md` that previously showed `dev: pending` or `dev: partial` from the 2026-05-22 → 2026-05-31 batches now reads `applied (06-01)` (or `n/a` with reason for Sundays Served Right). The two persistent n/a notes remain documented.

## Verification snapshot (dev)

```
Gourmet Pantry phone: 6739 4407
Christopher Ellis present: true | photo: gc-christopher-ellis.png
Rachael Gartman absent: true
Fitness gym ctas[0]: Personal Training & Group Fitness Rates 2026 → /documents/fitness/personal-training-group-fitness-rates-2026.pdf
moreActivities order: Golf Activities | Multi-Purpose Court | Pilates | Squash
Grillhouse sections: Grillhouse Operating Hours (rows=2), Tiki Bar Operating Hours (rows=1)
Union Bar ctas: View Menu | Sports Screening Schedule
distinctiveSpaces:
  The Galbraith Ballroom: ["3,400 Square Feet"] cta→ /event-spaces/the-gallbrainth-ballroom
  Thinkspace: [...]                              cta→ /event-spaces/thinkspace
  The Bowling Alley: ["30 pax"]                  cta→ /event-spaces/bowling-alley
  The Quad Studios: ["Up to 50 pax"]             cta→ /kids/the-quad-studios
Club-wide promotions: June Monthly Promotions | Celebrate Dad This Father's Day
Events (all 6 recreated with cleaned bodies):
  basketball-finals-live-screening-union-bar-2026 ✓
  football-fever-night-union-bar-2026             ✓
  smokin-sundays-grillhouse-2026-06               ✓
  heroes-and-sidekicks-fathers-day-2026           ✓ (Sessions combined onto one line)
  camp-eagle-explorers-summer-2026                ✓ (Venue lines dropped, no image, no inline Registers)
  fourth-of-july-celebration-2026                 ✓ (hero image attached, body trimmed)
```

## Lesson for future

The dev env Strapi DB is unstable — it has been reseeded multiple times in the last 10 days, wiping content-update writes. Until the reseed cadence stabilises, the periodic "audit + replay" pattern in this entry is what keeps dev in sync. Every patch script in `scripts/patch-*.mjs` is idempotent, so a wholesale re-run is always safe.

## Related

All prior `2026-05-22` → `2026-06-01` entries — this entry closes their `dev: pending`/`partial` rows.
