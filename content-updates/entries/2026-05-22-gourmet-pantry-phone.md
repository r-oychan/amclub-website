---
date: 2026-05-22
environment: prod
content_type: restaurant + frontend static fallback
entry: "The Gourmet Pantry — phone number"
author: dev (Claude) on 2026-05-22
dev: pending
uat: pending
seed: pending
---

## What changed

Updated The Gourmet Pantry phone to `6739 4407` on both surfaces:
1. Prod Strapi `restaurant.locationContact.phone` (the value the live site actually renders)
2. Frontend static fallback `subpages.ts:454` (shadowed dead code, but kept in sync to avoid drift)

## Mechanism (verified 2026-05-22)

`VenueDetailPage.tsx:404–414` merges CMS data with `subpages.ts` fallback. For Gourmet Pantry:
- Strapi returns `locationContact = { locationLevel, phone, email }`
- Fallback `phone` lives at the top level of the subpage entry
- Lines 404–409 prefer `venue.locationContact` if any field is set → **Strapi wins** for this entry.

The displayed phone before this change was `6739 4361` (from Strapi). The `'6739 4340'` in `subpages.ts:454` was never displayed — but fixing it removes drift risk if the merge logic ever changes.

## Fields touched

### Prod Strapi: `restaurant.locationContact.phone` (entry: The Gourmet Pantry, documentId `xw8h044t7bi3q7bg66ekelfq`)

- **Before:** `6739 4361`
- **After:** `6739 4407`
- **Other locationContact fields preserved:** `locationLevel: "Level 1"`, `email: "pantry@amclub.org.sg"`

### `frontend/src/data/subpages.ts:454`

- **Before:** `phone: '6739 4340'`
- **After:** `phone: '6739 4407'`

## Applied

- **Prod Strapi:** applied 2026-05-22 via `scripts/patch-gourmet-pantry-phone.mjs` against `SEED_ENV=prod`. Live. Verified by reading back — new component id 24 with phone `6739 4407`.
- **`subpages.ts`:** edited locally. Holds until next frontend deploy.

## Strapi v5 quirk learned

Sending the existing component `id` in the PUT payload causes a 400: `"Some of the provided components in locationContact are not related to the entity"`. Omit the `id` and Strapi replaces the component in place. The patch script reflects this.

## Replay instructions (for dev)

```bash
SEED_ENV=dev node scripts/patch-gourmet-pantry-phone.mjs
```

Then pull the `subpages.ts` change on the dev branch. Frontend redeploys on dev pick up the fallback fix.

## Seed script status

- **Target script:** none of the existing seed scripts seed restaurants today; the patch is reproducible via `scripts/patch-gourmet-pantry-phone.mjs`.
- **Port status:** n/a (patch script is permanent and replayable).

## Verification

- Visit https://www.amclub.org.sg/dining/the-gourmet-pantry → contact section shows `6739 4407`. (May need a hard refresh past any CDN cache.)

## Related

- Linked entries: none.
