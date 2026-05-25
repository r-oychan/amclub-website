---
date: 2026-05-25
environment: prod
content_type: fitness-page (singleton) + frontend static asset + subpages.ts fallback
entry: "Fitness home page — gym Personal Training & Group Fitness Rates 2026 PDF"
author: dev (Claude) on 2026-05-25
dev: pending
uat: pending
seed: ported (patch-fitness-and-union-bar-2026-05-25.mjs, op 2)
---

## Applied to prod

Replaced the gym CTA's Personal Training PDF on the fitness home page with the new 2026 rates card. Three surfaces updated in this batch:

1. **Strapi `fitness-page.gym.ctas[0]`** — applied 2026-05-25 via patch script op #2 against `SEED_ENV=prod`.
2. **Static frontend asset** — new PDF copied to `frontend/public/documents/fitness/personal-training-group-fitness-rates-2026.pdf` (held for next git push).
3. **`frontend/src/data/subpages.ts`** — gym subpage CTAs updated to match (held for next git push).

## What changed

The CTA was previously "Personal Training & Group Fitness Classes" pointing at `personal-training-group-fitness-class.pdf` (the older "Classes" document). Replaced both the label and the href to use the new rate card the client supplied (`media/fitness/Personal Training & Group Fitness Rates 2026.pdf`), renamed to lowercase-hyphens convention.

## Fields touched

### Prod Strapi: `fitness-page.gym.ctas[0]`

- **Before:**
  ```json
  { "label": "Personal Training & Group Fitness Classes", "href": "/documents/fitness/personal-training-group-fitness-class.pdf", "isExternal": true, "bordered": true, "variant": "outline", "icon": "arrow" }
  ```
- **After:**
  ```json
  { "label": "Personal Training & Group Fitness Rates 2026", "href": "/documents/fitness/personal-training-group-fitness-rates-2026.pdf", "isExternal": true, "bordered": true, "variant": "outline", "icon": "arrow" }
  ```
The other two ctas on `gym` (Group Fitness Class Schedule, Learn More) are preserved as-is.

### `frontend/src/data/subpages.ts` (gym subpage)

- Line 843 label `Personal Training & Group Fitness Classes` → `Personal Training & Group Fitness Rates 2026`.
- Line 843 + 869 href `/documents/fitness/personal-training-group-fitness-class.pdf` → `/documents/fitness/personal-training-group-fitness-rates-2026.pdf` (both occurrences — replaceAll).

## Media added / replaced

- **Added:** `media/fitness/personal-training-group-fitness-rates-2026.pdf` (canonical lowercase-hyphens). Same file copied to `frontend/public/documents/fitness/personal-training-group-fitness-rates-2026.pdf` (deployed asset). SHA `f8460734…`.

## Media removed

- `frontend/public/documents/fitness/personal-training-group-fitness-class.pdf` — old PDF, replaced by the rates file. No remaining references.
- `media/fitness/Personal Training & Group Fitness Class.pdf` — older orphan with bad naming (spaces, Title Case). Not referenced anywhere.
- `media/fitness/Personal Training & Group Fitness Rates 2026.pdf` — the user-supplied source filename (also bad naming). Content preserved under the lowercase-hyphens canonical.

## Replay instructions

```bash
# CMS (idempotent)
SEED_ENV=dev node scripts/patch-fitness-and-union-bar-2026-05-25.mjs --only=2
SEED_ENV=uat node scripts/patch-fitness-and-union-bar-2026-05-25.mjs --only=2

# Code (cherry-pick the main commit, or merge)
```

## Verification

After next prod frontend deploy:
- https://www.amclub.org.sg/fitness → gym section → "Personal Training & Group Fitness Rates 2026" CTA opens the new PDF.
- https://www.amclub.org.sg/fitness/gym → top CTAs → same.

## Related

- Linked entries: [[2026-05-25-gym-team-remove-zack-desmond]] — sibling gym page edit in same batch.
