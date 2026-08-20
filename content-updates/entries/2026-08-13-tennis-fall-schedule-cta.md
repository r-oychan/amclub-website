---
date: 2026-08-13
environment: prod
content_type: fitness-facility (tennis) — imagePanels
entry: "Seed tennis imagePanels into prod CMS; replace Summer Term schedule CTA with Fall Term 2026 Schedule"
author: prod (Claude) on 2026-08-13
prod: applied (08-13)
dev: applied (08-13)
uat: applied (08-13)
seed: ported (patch-2026-08-13-tennis-fall-schedule.mjs)
---

## Trigger

User added a CTA to the Tennis Programs panel via prod `/admin` and it never appeared on
`https://amclub.org.sg/fitness/tennis`.

## Root cause

The prod `fitness-facility` tennis entry had **`imagePanels: []`**. `VenueDetailPage.tsx:638` does:

```ts
imagePanels: apiPanels?.length ? apiPanels : fallback?.imagePanels,
```

so with the CMS array empty the page rendered the hardcoded fallback in
`frontend/src/data/subpages.ts:934-971`. The Tennis Programs panel, its socials table, the
schedule button and Tennis Etiquette were all coming from that TS file, **not** Strapi — so no
admin edit to that panel could ever surface.

Prod's entry was last written 2026-08-07 09:21 UTC (draft and published identical), so the user's
edit did not persist either. Caching was ruled out: no cache headers, `x-powered-by: Strapi`,
cache-busted requests returned identical data.

**Environment drift:** dev and uat both had 2 panels; prod had 0. This was true of **all 14 prod
fitness facilities** — the panels were never carried over in the UAT→prod reconciliation. Only
tennis is fixed here; the other 13 remain on the hardcoded fallback.

## Applied to prod

1. **Seeded the two tennis panels into the prod CMS** (Tennis Programs + Tennis Etiquette),
   reproducing the `subpages.ts` fallback content exactly so the page is visually unchanged:
   headings, socials `operatingHours` (4 sections), body, footnote, 4 etiquette bullets,
   `imagePosition` left/right, and both panel images.
   - Images uploaded from `media/fitness/detail/{tennis-program,tennis-etiquette}.jpeg` and verified
     **byte-identical** (sha256) to the static assets previously served at
     `/images/fitness/…`, so no visual regression.
   - Landed at `/uploads/fitness/detail/tennis_program_ec2a4c39de.jpeg` and
     `…/tennis_etiquette_0cd2236d5c.jpeg`.
2. **CTA on the Tennis Programs panel is now exactly one button:**
   - **Added** `Fall Term 2026 Schedule` → `/uploads/Tennis_Fall_Programs_2026_f423abe4c6.pdf`
   - **Removed** `Summer Term 2026 Schedule` → `/uploads/documents/fitness/tennis_summer_term_schedule_2026.pdf`
     (superseded; the PDF itself is left in the media library, only the button is dropped)

Label wording `Fall Term 2026 Schedule` was chosen by the user to match the Summer button's word
order, rather than the requested "Fall Term Schedule 2026".

## Gotcha: Strapi v5 component ids across document versions

Reading `imagePanels` off the published entry and PUTting them back with `?status=published` fails:

```
400 ApplicationError: Some of the provided components in imagePanels are not related to the entity
```

The component ids belong to a different document version. Fix is to **deep-strip `id`/`documentId`
from the write payload** so Strapi recreates the components (see `stripComponentIds` in the patch
script). Media relations must be reduced to a bare numeric id *before* stripping, or they are lost.

## Verification

- Prod API returns 2 panels, Programs panel `ctas` = `["Fall Term 2026 Schedule"]`.
- All panel fields survived the component rebuild: imageAlt, subheading, body, footnote,
  4 `operatingHours` sections (rows 1/1/2/1), 4 etiquette bullets, both images.
- Live page: only the Fall button renders, `Summer Term` absent from page text, socials rows and
  etiquette bullets intact, zero broken images.
- Fall PDF: `200 application/pdf`, 393,135 bytes.
- `/fitness`, `/fitness/gym`, `/fitness/squash`, `/fitness/pilates`, `/fitness/tennis` → all 200.
- Patch script re-run is a clean no-op (idempotent).

## Replayed to dev + uat (2026-08-13)

Both applied via the same script. Verified: `Fall Term 2026 Schedule` is the only CTA, "Summer Term"
absent from page text, socials rows and etiquette bullets intact, no broken images. Re-running on
all three environments is now a clean no-op.

The PDF was pulled off prod into `media/documents/fitness/tennis-fall-programs-2026.pdf` (renamed to
the lowercase-hyphen convention) and uploaded per environment, so each has its own blob:

| env | Fall PDF href |
|---|---|
| dev | `/uploads/documents/fitness/tennis_fall_programs_2026_b684b0bdc2.pdf` |
| uat | `/uploads/documents/fitness/tennis_fall_programs_2026_c65f45fb3a.pdf` |
| prod | `/uploads/Tennis_Fall_Programs_2026_f423abe4c6.pdf` (uploaded via `/admin`; left as-is) |

All three return `200 application/pdf`, 393,135 bytes.

### Two portability bugs found and fixed while replaying

1. **Superseded CTA was matched by exact href.** Strapi appends a per-upload hash, so uat's Summer
   button was `…schedule_2026_6417fa564c.pdf` while dev/prod were `…schedule_2026.pdf`. The exact
   match missed on uat and would have left **two** buttons. Now matched by label + filename stem.
2. **Fall href was hardcoded to prod's blob.** Now the script uploads the repo copy into the target
   environment and builds the CTA from the returned URL. It reuses an existing Fall CTA's href when
   one is already present, so prod's `/admin`-uploaded link is not silently re-pointed.

Note: dev's old Summer PDF href 404s. That was already broken before this change (no files were
deleted); removing the CTA that pointed at it is a net fix.

## No deployment needed

The code is identical across `dev`, `uat` and `main` — `git diff origin/main..dev` over
`imagePanels.ts`, `ImageTextPanels.tsx` and `VenueDetailPage.tsx` is empty — and all three
environments were verified rendering panels **from the CMS** (panel images resolve to `/uploads/…`,
not the `/images/…` static fallback). This is a pure content change; promoting code will not carry
or clobber it, and the CTA does not depend on any unreleased frontend work.
