---
date: 2026-05-26
environment: prod (frontend code only — no Strapi writes)
content_type: subpages.ts fallback + frontend static assets
entry: "Sweep remaining `amclubdata28a57492` legacy blob URLs from subpages.ts"
author: dev (Claude) on 2026-05-26
dev: pending (will arrive via dev plot-back commit)
uat: pending
seed: n/a (frontend code, no Strapi data)
---

## Applied to main (code change)

Replaced every remaining `amclubdata28a57492.blob.core.windows.net/...` reference in `frontend/src/data/subpages.ts` — 13 occurrences across 10 unique assets — with local paths under `/images/event-spaces/` (or `/documents/event-spaces/` for the PDF). Copied the asset files from `media/event-spaces/` (where canonicals already lived) into `frontend/public/images/event-spaces/` so the new paths actually serve.

This is the third pass at this pattern — the bowling-alley batch on 2026-05-25 fixed the 2 URLs in that subpage's CTAs; this sweep covers everything else.

## Mechanism (background)

`amclubdata28a57492` is the **legacy pre-promotion dev tenant's** blob storage account. After the dev → uat → prod tenant split, the account was decommissioned (or at least is no longer accessible from prod's tenant). The dev/main copy of `subpages.ts` still carried hardcoded image/document URLs into that account, so any page rendering venueCards / packageCards / extra-section CTAs that referenced them hit broken links.

Storage account names per env (per the `reference_pulumi_state_storage` memory and Container App custom domain inspection):
- legacy (pre-split): `amclubdata28a57492` ❌ no longer serving
- dev: `amclubdevdata...` (current)
- uat: `amclubuatdata...` (current)
- prod: `amclubproddata...` (current)

The right fix is to migrate this content to Strapi (per `feedback_no_hardcoded_subpages`), but that's a bigger refactor. Repointing to local static assets restores the visible behavior immediately.

## Fields touched

### `frontend/src/data/subpages.ts` — 13 occurrences replaced (10 unique URLs)

| Old URL fragment | New path |
|---|---|
| `venue_galbraith_wedding_db3a81af1f.jpg` (x2 — lines 1585, 1680) | `/images/event-spaces/venue-galbraith-wedding.jpg` |
| `venue_2nd_floor_wedding_75f86eb499.jpg` | `/images/event-spaces/venue-2nd-floor-wedding.jpg` |
| `wedding_package_classic_3f7ac22fc3.jpg` | `/images/event-spaces/wedding/wedding-package-classic.jpg` |
| `wedding_package_signature_6d772ce68d.jpg` | `/images/event-spaces/wedding/wedding-package-signature.jpg` |
| `wedding_package_prestige_e7474f1a37.jpg` | `/images/event-spaces/wedding/wedding-package-prestige.jpg` |
| `venue_thinkspace_adult_library_e682b190f4.jpg` (x2) | `/images/event-spaces/venue-thinkspace-adult-library.jpg` |
| `venue_bowling_4120_1c684f909e.jpg` | `/images/event-spaces/venue-bowling-4120.jpg` |
| `capacity_chart_72e78149a2.pdf` | `/documents/event-spaces/capacity-chart.pdf` |
| `thinkspace_services_flyer_9a83799195.jpg` (x2) | `/images/event-spaces/thinkspace-services-flyer.jpg` |
| `boardroom_7f09a0e833.jpg` | `/images/event-spaces/boardroom.jpg` |

Surface areas affected:
- **Weddings** subpage (slug `weddings`): venueCards Galbraith + 2nd Floor; packageCards Classic + Signature + Prestige.
- **Corporate Functions** subpage (slug `corporate-functions`): venueCards Galbraith + Thinkspace + Bowling.
- **Parties** subpage (slug `parties`): "View Capacity Chart" CTA href.
- **Thinkspace** subpage (slug `thinkspace`): hero image + flyer CTA.
- **Boardroom** subpage (slug `boardroom-bundle` or similar): hero image + flyer CTA.

## Media added / replaced

Copied 9 unique image files from `media/event-spaces/` (already tracked in git as canonicals) into the deployed-asset folders:

- `frontend/public/images/event-spaces/venue-galbraith-wedding.jpg`
- `frontend/public/images/event-spaces/venue-2nd-floor-wedding.jpg`
- `frontend/public/images/event-spaces/venue-thinkspace-adult-library.jpg`
- `frontend/public/images/event-spaces/venue-bowling-4120.jpg`
- `frontend/public/images/event-spaces/thinkspace-services-flyer.jpg`
- `frontend/public/images/event-spaces/boardroom.jpg`
- `frontend/public/images/event-spaces/wedding/wedding-package-classic.jpg`
- `frontend/public/images/event-spaces/wedding/wedding-package-signature.jpg`
- `frontend/public/images/event-spaces/wedding/wedding-package-prestige.jpg`

The capacity-chart.pdf path (`/documents/event-spaces/capacity-chart.pdf`) was already populated from the Galbraith batch on 2026-05-25 — no new copy needed.

## Media removed

_(none — none of the old blob URLs pointed at files anywhere in the local repo)_

## Replay instructions

**No Strapi action needed.** Pure frontend code change.

- **dev branch:** same edits + same 9 file copies + same typecheck. Already done in companion commit on dev.
- **uat:** arrives via normal promotion when uat is next deployed.

## Long-term debt

All `subpages.ts` event-space content still violates `feedback_no_hardcoded_subpages`. The proper home for venueCards / packageCards is Strapi (dev has `event-space` and `event-spaces-page` content types that could host this). This sweep only restores correctness of the asset references; the deeper migration is its own work item.

`scripts/data/event-spaces-data.json` also contains legacy `amclubdata28a57492` URLs (per earlier grep) — that's a seed-data file, separate concern, can be updated as part of the eventual CMS migration.

## Verification

After next prod frontend deploy:
- `/event-spaces/weddings` — venue cards + package cards all render their images.
- `/event-spaces/corporate-functions` — same.
- `/event-spaces/parties` — "View Capacity Chart" opens the PDF.
- `/event-spaces/thinkspace` — hero image + flyer CTA work.
- `/event-spaces/boardroom-bundle` (or equivalent slug) — hero image + flyer CTA work.

## Related

- Linked entries:
  - [[2026-05-25-bowling-alley-rates-and-package-links]] — same pattern, first pass at the same problem.
  - [[2026-05-25-galbraith-capacity-chart-link]] — sibling fix for a `#` placeholder.
