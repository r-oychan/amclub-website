---
date: 2026-06-01
environment: prod (dev skipped — both events absent)
content_type: event (basketball-finals + heroes-and-sidekicks)
entry: "Strip redundant inline 'View the schedule here.' / 'Register here.' from two event bodies where CTAs already cover the action"
author: dev (Claude) on 2026-06-01
dev: n/a (events absent)
uat: pending
seed: ported (patch-2026-06-01-event-body-cleanup.mjs + corrected patch-2026-05-31-batch.mjs)
---

## Applied to prod

Two body cleanups continuing today's "CTA covers it — drop the inline duplicate" thread (same as the camp-eagle inline-register removal earlier today). Applied via `scripts/patch-2026-06-01-event-body-cleanup.mjs`.

### Op 1 — basketball-finals-live-screening-union-bar-2026

- **Before:**
  ```
  Catch the Basketball Finals 2026 live at Union Bar and enjoy the excitement of the game with fellow fans, great food, and drinks.

  View the schedule here.
  ```
- **After:**
  ```
  Catch the Basketball Finals 2026 live at Union Bar and enjoy the excitement of the game with fellow fans, great food, and drinks.
  ```

`View Schedule` CTA (Google Slides URL) unchanged — still the action button.

### Op 2 — heroes-and-sidekicks-fathers-day-2026

Stripped the inline `[Register here](https://forms.office.com/Pages/…).` paragraph that sat just before the Terms and Conditions block. `Register` CTA unchanged — still the action button.

## Source script corrected

`scripts/patch-2026-05-31-batch.mjs` updated so the `EVENT_PATCHES` entries for these two events match the cleaned state. A fresh replay of either script on any env arrives at the same final body.

## Dev status

Both events are still absent on dev (per the inter-batch reseed documented earlier today and in [[2026-05-31-event-content-cleanup-and-event-spaces-fixes]]). Script logged `skip` for both. When dev's event backlog is rebuilt the patches will land cleanly via the corrected 05-31 script.

## Verification

- `/whats-on/basketball-finals-live-screening-union-bar-2026` — body ends with "…great food, and drinks." (no trailing "View the schedule here.").
- `/whats-on/heroes-and-sidekicks-fathers-day-2026` — body jumps from the Sidekick Lounge paragraph straight to "Terms and Conditions:" (no inline `Register here` link).
- Both `View Schedule` and `Register` CTA buttons still render in the CTA panel.

## Related

- Linked entries:
  - [[2026-06-01-camp-eagle-image-and-body-fix]] — same pattern (stripped 2× inline Register here from Camp Eagle today).
  - [[2026-05-31-markdown-event-bodies]] — the original markdown migration that added inline links; these are the spots the team decided didn't need them.
