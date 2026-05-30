---
date: 2026-05-30
environment: prod + dev
content_type: event-spaces-page (singleton, distinctiveSpaces component) + subpages.ts fallback
entry: "Event venue capacity updates (Galbraith + Bowling Alley) + Bowling Alley operating hours reformat"
author: dev (Claude) on 2026-05-30
dev: applied (05-30)
uat: pending
seed: ported (patch-2026-05-30-batch.mjs op 8 + subpages.ts edit)
---

## Applied to prod + dev

Three updates landed in one batch:

1. **Strapi event-spaces-page** (`distinctiveSpaces.items`) — capacity strings for the venue cards on the main `/event-spaces` page. Applied via `patch-2026-05-30-batch.mjs --only=8`.
2. **subpages.ts (Galbraith subpage)** — `capacity` field on the `/event-spaces/the-gallbrainth-ballroom` detail page.
3. **subpages.ts (Bowling Alley subpage)** — added `capacity`, replaced free-form `hours:` string with structured `operatingHoursSections` matching the dining-page pattern.

Frontend code change ships on the next prod deploy.

## Op-by-op summary

| Surface | Field | Before | After |
|---|---|---|---|
| Strapi event-spaces-page → distinctiveSpaces.items[Galbraith] | `capacity` | `["3400 sqm"]` | `["3,400 Square Feet"]` |
| Strapi event-spaces-page → distinctiveSpaces.items[Bowling Alley] | `capacity` | `["Up to 50 pax"]` | `["30 pax"]` |
| `subpages.ts:1722` (Galbraith subpage) | `capacity` | `'200+ pax'` | `'230 pax'` |
| `subpages.ts:1761` (Bowling Alley subpage) | `capacity` | _(not set)_ | `'30 pax'` |
| `subpages.ts:1761` (Bowling Alley subpage) | `hours` (string) | `'Mon-Thu 12pm-7pm, Fri 12pm-8pm, Sat 10:30am-8pm, Sun 9:30am-7pm'` | _removed_ |
| `subpages.ts:1761` (Bowling Alley subpage) | `operatingHoursSections` | _(none)_ | one "Opening Hours" section with 4 rows (Mon-Thu, Fri, Sat, Sun) |

Other distinctiveSpaces items (`Thinkspace`, `The Quad Studios`) preserved unchanged.

## Strapi op detail

`PUT /event-spaces-page` with body `{ data: { distinctiveSpaces: <full component> } }`. Loop over current items; for the two Galbraith / Bowling Alley items, replace `capacity`. For unchanged items, strip the component `id` (Strapi v5 quirk) and preserve `name`, `capacity`, `description`, `image` (sent as media id when present).

Verified live on prod:
```
The Galbraith Ballroom : ["3,400 Square Feet"]
The Bowling Alley      : ["30 pax"]
```

## subpages.ts op detail — Bowling Alley operating hours format

Bowling Alley previously stored its schedule as a comma-separated single-line string (`hours: 'Mon-Thu 12pm-7pm, ...'`). Converted to the same shape Grillhouse and Union Bar use — one `operatingHoursSections[0]` titled "Opening Hours" with 4 rows. Format matches the 2026-05-30 Grillhouse style (`12:00PM – 7:00PM`, no space before AM/PM, en-dash) per user direction.

The `hours:` string field was removed since the structured `operatingHoursSections` is now the source of truth on the detail page. The other bowling-alley entry in `subpages.ts:1102` (fitness section, slug `bowling-alley`, parent `Fitness & Wellness`) was **not** touched — it's a different surface (the fitness landing card) with its own `hours:` string containing Regular Days + Term Break schedule. Flagged as separate future cleanup.

## Replay instructions

```bash
# Strapi (idempotent)
SEED_ENV=uat node scripts/patch-2026-05-30-batch.mjs --only=8

# Frontend code — arrives via dev → uat → main promotion (or via cherry-pick).
```

## Verification

After next prod frontend deploy:
- `/event-spaces` → distinctive spaces section: Galbraith shows "3,400 Square Feet"; Bowling Alley shows "30 pax".
- `/event-spaces/the-gallbrainth-ballroom` → capacity reads "230 pax".
- `/event-spaces/bowling-alley` → capacity reads "30 pax"; Operating Hours table shows 4 structured rows.

## Related

- Linked entries:
  - [[2026-05-30-dining-cleanup-and-restaurant-hours]] — same-day batch, Grillhouse + Tiki Bar hours rebuild used the same `11:00AM – 9:00PM` format.
  - [[2026-05-25-galbraith-capacity-chart-link]] — sibling Galbraith subpage fix.
  - [[2026-05-25-bowling-alley-rates-and-package-links]] — sibling Bowling Alley subpage fix.
