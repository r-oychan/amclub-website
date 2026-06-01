---
date: 2026-05-25
environment: prod (frontend code, no Strapi write)
content_type: frontend static fallback (subpages.ts)
entry: "Private Events & Catering > Galbraith Ballroom > View Capacity Chart — link was '#'"
author: dev (Claude) on 2026-05-25
dev: pending (will arrive via git push)
uat: pending
seed: n/a (frontend code, no seed)
---

## Applied to main

Fixed the broken "View Capacity Chart" CTA on `/event-spaces/the-gallbrainth-ballroom`. Frontend code change; takes effect on the next prod frontend deploy. The capacity-chart PDF was already in the repo at `frontend/public/documents/event-spaces/capacity-chart.pdf` and serves at `/documents/event-spaces/capacity-chart.pdf` — only the link target needed correcting.

## Mechanism (diagnosed before edit)

- The Galbraith Ballroom does NOT have a `facility` entry in Strapi (verified across `the-galbraith-ballroom`, `the-gallbrainth-ballroom`, `galbraith-ballroom` slugs — all 404).
- The page is rendered entirely from the **frontend `subpages.ts` fallback** at `frontend/src/data/subpages.ts:1725` (slug `the-gallbrainth-ballroom`, note the misspelling — preserved to avoid breaking any existing deep links).
- Two CTAs in that entry pointed to `'#'`: "View Capacity Chart" and "Enquire Now". Both were broken.

The capacity-chart PDF was already present at `frontend/public/documents/event-spaces/capacity-chart.pdf` (~242 KB, dated 19 May) — the same file used by the "Parties" entry at `subpages.ts:1670`. No new asset needed.

## Fields touched

### `frontend/src/data/subpages.ts:1737` — Galbraith Ballroom CTAs

- **Before:**
  ```ts
  ctas: [
    { label: 'View Capacity Chart', href: '#' },
    { label: 'Enquire Now', href: '#' },
  ],
  ```
- **After:**
  ```ts
  ctas: [
    { label: 'View Capacity Chart', href: '/documents/event-spaces/capacity-chart.pdf', isExternal: true },
    { label: 'Enquire Now', href: 'mailto:catering@amclub.org.sg', isExternal: true },
  ],
  ```

The "Enquire Now" link was also `'#'` (also broken). Fixed in the same edit using the same `mailto:catering@amclub.org.sg` href the "Parties" entry uses — clear precedent within the file.

## Files (no media changes)

The chart PDF already exists at `frontend/public/documents/event-spaces/capacity-chart.pdf` and `media/event-spaces/capacity-chart.pdf` (canonical). No upload, no media addition.

## Orphan flagged

`media/membership/Capacity Chart.pdf` exists locally — wrong location (`membership/` instead of `event-spaces/`) and wrong naming (spaces + Title Case). Not referenced anywhere in the frontend or Strapi. Recommend deleting to avoid future confusion. Out of scope for this batch.

## Long-term debt

The whole `subpages.ts` hardcoded-content pattern violates the project memory `feedback_no_hardcoded_subpages`. Galbraith Ballroom should be a `facility` entry in Strapi with `ctas` populated. Migration:
1. Create `facility` entry with slug `the-galbraith-ballroom` (fixing the typo) — copy the description, capacity, CTAs.
2. Upload `capacity-chart.pdf` to Strapi media; reference its blob URL in the CTA.
3. Remove the `subpages.ts` entry (or keep as fallback only).
4. Add a slug redirect `the-gallbrainth-ballroom → the-galbraith-ballroom` so deep links don't break.

Out of scope for this batch — flagged as future work.

## Replay / promotion

- **prod:** takes effect on next `push` to `main` (CI rebuilds the frontend container; new bundle ships).
- **dev / uat:** same edit needs to land on those branches. If `subpages.ts` was deleted on `dev` (see commit `ed88536 feat: flip all remaining types to draftAndPublish + delete subpages.ts`), the fix is already moot there — the dev approach migrates this content to Strapi instead. **For uat:** depends on whether `uat` has the subpages.ts deletion yet; if not, apply the same edit.

## Verification

After next prod deploy:
- Visit https://www.amclub.org.sg/event-spaces/the-gallbrainth-ballroom → "View Capacity Chart" should open the PDF; "Enquire Now" should open a mail client to `catering@amclub.org.sg`.

## Related

- Linked entries: none. Related future work: migrate Galbraith Ballroom (and the rest of `subpages.ts`) to Strapi-managed facilities.
