---
date: 2026-05-25
environment: prod (frontend code only — no Strapi entry exists for bowling-alley)
content_type: frontend static assets + subpages.ts fallback
entry: "event-spaces/bowling-alley — fix broken Rates + Party Packages CTAs"
author: dev (Claude) on 2026-05-25
dev: pending (will arrive via dev branch port)
uat: pending
seed: n/a (frontend code, no Strapi data)
---

## Applied to main (code change)

Repointed the two broken CTAs on `/event-spaces/bowling-alley` to local static assets and copied the canonical files into the deployed-asset folder so they actually serve. Frontend code change; takes effect on the next prod deploy.

## Mechanism (diagnosed before edit)

- The Bowling Alley does NOT have a `facility` or `venue` entry in Strapi on prod (`/facilities?filters[slug][$containsi]=bowling` → 0 matches; same for `/venues`).
- The page renders entirely from `frontend/src/data/subpages.ts:1763` (slug `bowling-alley`, parent section `event-spaces`).
- Two CTAs there pointed at the **old dev-tenant blob storage** `amclubdata28a57492.blob.core.windows.net/...` (a legacy account from the pre-promotion environment). Those URLs don't resolve from prod's tenant. The assets the user actually wants live locally under `media/event-spaces/`.

## Fields touched

### `frontend/src/data/subpages.ts:1776–1786` — Bowling Alley CTAs

- **Before:**
  ```ts
  { label: 'Rates', href: 'https://amclubdata28a57492.blob.core.windows.net/media/uploads/bowling_alley_rates_95e27a91a0.jpg', isExternal: true },
  { label: 'Party Packages', href: 'https://amclubdata28a57492.blob.core.windows.net/media/uploads/bowling_alley_party_package_13a9e56910.pdf', isExternal: true },
  ```
- **After:**
  ```ts
  { label: 'Rates', href: '/documents/event-spaces/bowling-alley-rates.jpg', isExternal: true },
  { label: 'Party Packages', href: '/documents/event-spaces/bowling-alley-party-package.pdf', isExternal: true },
  ```

The third CTA (`Book A Lane → mailto:youth@amclub.org.sg`) was already correct and is preserved.

## Media added / replaced

Copied existing canonicals into the deployed-asset folder so they serve at the new hrefs:

- **Added:** `frontend/public/documents/event-spaces/bowling-alley-rates.jpg` (~SHA `6ba5f0db…`). Source: `media/event-spaces/bowling-alley-rates.jpg` (already tracked in the repo).
- **Added:** `frontend/public/documents/event-spaces/bowling-alley-party-package.pdf` (~SHA `96667bbf…`). Source: `media/event-spaces/bowling-alley-party-package.pdf` (already tracked).

`media/event-spaces/` is the canonical home for these assets per the project memory `feedback_media_and_naming`.

## Media removed

- `media/kids/kids-party/The Bowling Alley Party Package.pdf` — duplicate of the canonical (same SHA `96667bbf…`), wrong folder, bad naming. Untracked, removed locally.

## Replay instructions

**No Strapi action needed.** Pure frontend code change.

- **Dev branch:** the same edits land via `git checkout origin/main -- <files>` (subpages.ts + the two PDFs into `frontend/public/documents/event-spaces/`) — see the dev plot-back commit. If dev's `subpages.ts` line numbers differ, the same string replacements apply (the old blob URLs are unique).
- **uat:** same approach when uat is next promoted.

## Verification

After next prod frontend deploy:
- https://www.amclub.org.sg/event-spaces/bowling-alley → "Rates" opens the JPG; "Party Packages" opens the PDF; "Book A Lane" still opens the mail client.

## Long-term debt

`subpages.ts` hardcoded content for Bowling Alley violates `feedback_no_hardcoded_subpages`. Should eventually migrate to a `facility` (or `event-space` on dev) entry with `ctas` stored in CMS. Out of scope for this batch.

## Related

- Linked entries: [[2026-05-25-galbraith-capacity-chart-link]] — same pattern (`subpages.ts` event-space CTA referencing a missing static asset path), same fix shape.
