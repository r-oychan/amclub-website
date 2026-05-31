---
date: 2026-06-01
environment: prod + dev
content_type: event + dining-promotions-page + event-spaces-page + subpages.ts
entry: "Body formatting (FB Fever, Smokin' Sundays, Camp Eagle), Bowling capacity 'Up to 30 pax', dining-promotion subtitle June 2026, kids/camps description, Visiting Membership Application Form"
author: dev (Claude) on 2026-06-01
dev: applied (06-01)
uat: pending
seed: ported (patch-2026-06-01-content-batch-2.mjs + subpages.ts)
---

## Applied to prod + dev

Seven of nine items from today's batch — two are blocked on a missing `media/unclassified/` folder (see "Blocked" below).

### Strapi (`patch-2026-06-01-content-batch-2.mjs`)

| Item | Surface | Change |
|---|---|---|
| 1 | event `football-fever-night-union-bar-2026` | Tighten Beverage Specials block: `**Beverage Specials**\nAll Draft Beers Pint $10` (single `\n` between heading and item → `<br>` not `<p>`). |
| 2 | event `smokin-sundays-grillhouse-2026-06` | Restructure: `**Food Specials**` + 3 items as `<br>` rows, blank line, `**Beverage Specials**` + 2 items as `<br>` rows. |
| 3 | event `camp-eagle-explorers-summer-2026` | Insert visible blank line between age groups — explicit `<br />` after `Time: 9:00 AM – 3:00 PM` survives markdown's whitespace collapse. |
| 6 | `dining-promotions-page.subtitle` | `May 2026 Dining Promotions` → `June 2026 Dining Promotions` |
| 4a | `event-spaces-page.distinctiveSpaces.items[Bowling Alley].capacity` | `["30 pax"]` → `["Up to 30 pax"]` |

### Frontend code (`subpages.ts`)

| Item | Line | Change |
|---|---|---|
| 4b | 1697 | `corporate-functions` venueCard Bowling capacity `'30 pax'` → `'Up to 30 pax'` |
| 4c | 1771 | Bowling Alley subpage `capacity: '30 pax'` → `'Up to 30 pax'` |
| 7 | 1372 | `camps` subpage `description` rewritten — new full paragraph about seasonal camps + activities + final line "Check out the various camps available in the video below." |
| 8 | 1883 | `start-application` `downloads.items` — appended `Visiting Membership Application Form` → `https://amclub.jotform.com/260038799703970` |

### Markdown rendering note

- Items 1+2 leverage the `remark-breaks` plugin shipped earlier today: single `\n` → `<br>`, double `\n\n` → new `<p>` paragraph. So `**Food Specials**\nAlabama …` renders the heading on its own line with the first item directly underneath (no paragraph gap), and `\n\n` between sections gives the wider break before `**Beverage Specials**`.
- Item 3 uses an explicit `<br />` HTML tag mid-body. `react-markdown` passes inline HTML through, so the extra blank line between age-group blocks is visible regardless of how markdown collapses surrounding whitespace.

## Blocked — `media/unclassified/` not in repo

Both Part 1 (14 event hero image swaps) and item 5 (Monthly Dues PDF for joining-fees) reference assets in `media/unclassified/`. That folder doesn't exist locally:

```
$ find media -type d -iname "*unclassi*"
(no output)
```

**Not applied:**

- **Part 1 — event hero images (14 events)** — need the images dropped into `media/unclassified/`, paired with each event in the user's mapping. Once present, will rename to `event-<slug>.jpg` (lowercase-hyphens, per `feedback_media_and_naming`), upload to Strapi on both envs, and attach.
- **Item 5 — joining-fees Monthly Dues PDF** — need `media/unclassified/Individual Membership Categories-Monthly-Dues.pdf` (or similar). Will rename to `media/membership/individual-membership-monthly-dues.pdf`, copy into `frontend/public/documents/membership/monthly-dues.pdf` (matches the existing Strapi CTA href). No Strapi change needed if the href stays the same — file replacement suffices.

Surfaced at the end of today's response with the slug→event title mapping ready to use as soon as the files land.

## Slug corrections noted

User's text used a couple of nicknames that don't match prod slugs. Confirmed mapping for when the image swap proceeds:
- "A Toast to Dad … @ Grillhouse" → `celebrate-dad-this-fathers-day-grillhouse`
- "Raise a Glass to Dad @ Union Bar" → `celebrate-dad-this-fathers-day-union-bar`
- "Celebrate Dad … @ Tradewinds" → `celebrate-dad-this-fathers-day-tradewinds`
- "Smokin' Sunday @ GB" → `smokin-sundays-grillhouse-2026-06` (GB = Grillhouse)
- "Sunday Served Right @ TSF" → `sundays-served-right-the-2nd-floor` (TSF = The 2nd Floor)
- "Tiny Art Explorer" — three events exist (`-program-36`, `-program-37`, `-2026-06`). Need user to clarify which one to attach the image to.

## Verification

After CDN refresh / next deploy:
- `/whats-on/football-fever-night-union-bar-2026` — Beverage Specials heading sits directly above "All Draft Beers Pint $10" with no paragraph gap.
- `/whats-on/smokin-sundays-grillhouse-2026-06` — Food Specials + Beverage Specials are bold, items underneath each are line breaks.
- `/whats-on/camp-eagle-explorers-summer-2026` — visible empty line between the 4-7 yo block and the 8+ yo block.
- `/dining/dining-promotion` — subtitle reads "June 2026 Dining Promotions".
- `/event-spaces` distinctiveSpaces — Bowling card shows "Up to 30 pax".
- `/event-spaces/corporate-functions` — Bowling venueCard shows "Up to 30 pax".
- `/event-spaces/bowling-alley` — capacity shows "Up to 30 pax".
- `/kids/camps` — new descriptive paragraph above the video.
- `/membership/start-application` — Forms list ends with "Visiting Membership Application Form" → jotform link.

## Related

- Linked entries:
  - [[2026-06-01-remark-breaks-single-newline-fix]] — the rendering pieces items 1 + 2 depend on.
  - [[2026-05-30-event-venue-capacity-and-hours]] — original "30 pax" Bowling entry (now nudged to "Up to 30 pax").
