---
date: 2026-06-01
environment: dev
content_type: fitness-facility (dev-only collection)
entry: "Create Golf fitness-facility on dev — /fitness/golf was 404'ing"
author: dev (Claude) on 2026-06-01
dev: applied (06-01)
uat: pending
seed: ported (patch-2026-06-01-dev-create-golf-facility.mjs)
---

## Applied to dev

Dev's `/fitness/golf` page was 404'ing because the `fitness-facilities` collection had no `golf` slug. Created the entry using prod's `/facilities` golf data, adapted to dev's `fitness-facility` schema.

## Why this needed a dev-only fix

prod and dev have **diverged content models for fitness** (see [[2026-05-31-event-content-cleanup-and-event-spaces-fixes]] for the broader pattern):

- **prod** still uses the legacy single `facility` collection. Golf has lived there since the initial seed (`scripts/seed-facilities.mjs`) — docId `iq6byvfl0vktd1sjaocrutt8`, name "Golf", slug "golf", served by `VenueDetailPage` via `/facilities`.
- **dev** migrated to a per-discipline structure: `fitness-facility` collection + per-discipline coach collections. The dev-only seed `scripts/seed-fitness-facilities.mjs` covers sên-spa, aquatics, gym, tennis, squash, pilates, bowling-alley, plus aquatics sub-entries — but **omits Golf** (and Multi-Purpose Court — see "Out of scope" below).

So Golf works on prod but 404s on dev. This patch closes the dev gap for Golf.

## Op detail

`patch-2026-06-01-dev-create-golf-facility.mjs`:

1. Look up `fitness-facilities?slug=golf` — if it exists, skip (idempotent).
2. Upload `media/fitness/golf.jpg` to dev media library (existing dedupe via `seed-helpers.uploadFile`).
3. POST `/fitness-facilities` with:
   - `name`: "Golf"
   - `slug`: "golf"
   - `description`: prod's golf description verbatim (For our Golf Enthusiasts, we offer off-site golf programs…)
   - `heroImage`: uploaded media id
   - `parentLabel`: "Fitness & Wellness"
   - `parentHref`: "/fitness"
   - `ctas`: `[{ label: 'Stay Updated', href: 'https://whatsapp.com/channel/0029VbB50Ow6LwHrEWWDAh3a', isExternal: true, variant: 'primary', icon: 'arrow' }]`
   - `order`: 100 (after the named facilities)
   - `publishedAt`: now (so it's live, not draft)

Created on dev as `iqguzg0tisxtk15nndz7gcwm` with image id 1968.

## Schema field translation prod ↔ dev

| prod `facility` field | dev `fitness-facility` field |
|---|---|
| `image` (media) | `heroImage` (media) |
| `description` (text) | `description` (text) — unchanged |
| `ctas` (`shared.link[]`) | `ctas` (`shared.link[]`) — unchanged |
| (no parent fields) | `parentLabel` / `parentHref` — added |
| `categoryLabel` "Golf" | n/a — dev doesn't carry this; the page heading uses `name` |
| `categoryIconSlug` | n/a |

Other fields prod doesn't populate for Golf (`dressCode`, `locationContact`, `hours`, etc.) stay null on dev too — Golf is off-site, no Club location.

## Out of scope (also missing on dev's seed)

**Multi-Purpose Court** is also missing from dev's `fitness-facilities` for the same reason. Not addressed here because the user only mentioned Golf. Same pattern would apply: lift the prod data and POST to dev's collection. Flagged as a future quick fix.

## Verification

```bash
SEED_ENV=dev node --input-type=module -e "
  import { initEnv, api } from './scripts/seed-helpers.mjs';
  const ctx = initEnv();
  const r = await api(ctx, '/fitness-facilities?filters[slug][\$eq]=golf&populate=*&pagination[limit]=1');
  const f = r.data[0];
  console.log(f.name, '/', f.slug, '/', f.heroImage?.name, '/', f.ctas[0]?.label);
"
# → Golf / golf / golf.jpg / Stay Updated
```

After CDN refresh: dev's `/fitness/golf` renders the description, hero image, and Stay Updated CTA.

## Related

- [[2026-06-01-membership-kids-fitness-batch]] — reordered `fitness-page.moreActivities` so Pilates is the 3rd box. Golf, Multi-Purpose Court, Pilates, Squash all link out from that grid; without this dev fitness-facility entry the Golf card's CTA went to a 404.
- [[2026-05-22-event-camp-eagle-explorers-summer]] — sibling dev-only recreation pattern.
