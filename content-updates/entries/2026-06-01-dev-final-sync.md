---
date: 2026-06-01
environment: dev
content_type: meta — final dev sync of the remaining open rows
entry: "Create Sundays Served Right on dev in its post-relaunch state; confirm start-application is covered by the subpages.ts fallback (dev has no matching content-type record)"
author: dev (Claude) on 2026-06-01
dev: applied (06-01)
uat: pending
seed: ported (patch-2026-06-01-create-sundays-served-on-dev.mjs)
---

## Applied to dev

Closing the last two open rows on dev after walking the log:

### Row 1 — Sundays Served Right @ The 2nd Floor (was n/a on dev across 3 rows)

Three rows had referenced this event as `n/a (event absent on dev)`:
- `2026-05-22 event-sundays-served-right-hide` — original ask was to unpublish (now moot — see below).
- `2026-05-30 dining-cleanup-and-restaurant-hours` — wanted to relaunch with date 06-28 and a body starting "Unwind".
- `2026-06-01 event-images-and-monthly-dues` — wanted to attach the new hero image.

Rather than try to apply three superseded ops onto a missing event, created the event directly in its **final intended state** via `scripts/patch-2026-06-01-create-sundays-served-on-dev.mjs`. Single POST with the cumulative end state from all three batches:

```
title:           Sundays Served Right @ The 2nd Floor
slug:            sundays-served-right-the-2nd-floor
date:            2026-06-28
time:            11:30 AM – 2:30 PM
location:        The 2nd Floor
category:        dining
image:           event-sundays-served-right-the-2nd-floor.jpg (dev media id 2273)
ctas:            Email The 2nd Floor → mailto:2ndfloor@amclub.org.sg
longDescription: Unwind on Sunday with a relaxed semi-buffet lunch at The 2nd Floor.
                 Enjoy a curated spread of starters, mains, and desserts crafted for
                 a leisurely afternoon with family and friends.

                 For reservations and enquiries, contact The 2nd Floor at 6739 4329
                 or [2ndfloor@amclub.org.sg](mailto:2ndfloor@amclub.org.sg).
publishedAt:     now()
```

Net effect: the dev event now matches what prod ends up at after walking 05-22 → 05-30 → 06-01.

#### Note on the 05-22 "hide / unpublish" row

The 2026-05-22 row that asked to **unpublish** Sundays Served Right is now superseded by the 2026-05-30 relaunch (date changed, body rewritten, event kept active). On prod that row still reads `pending — manual /admin click required` because the original prod event was never unpublished — but the 05-30 relaunch made that intent obsolete. On dev the event now exists in its relaunched state from day one, so the 05-22 unpublish ask is `superseded` rather than `pending`. Marking accordingly.

### Row 2 — start-application Visiting Membership Application Form

The 06-01 Strapi PUT to `/facilities/<start-application-doc>/downloads.items` failed on dev with a 404 — dev's content-type tree doesn't expose `start-application` via `/facilities` (or any other plausible collection: `membership-facilities`, `event-spaces`, `fitness-facilities`, etc. — all return either 404 for the endpoint or empty for the slug).

The frontend `VenueDetailPage` merge falls back to `subpages.ts` when the CMS call returns nothing useful. Dev's `subpages.ts` already carries the Visiting Membership Application Form (`subpages.ts:1884`, on the `dev` branch since the 06-01 batch port). So the page surfaces the form via fallback once the dev frontend container redeploys.

No further dev action needed for this row — the form will appear after the next dev frontend deploy. If dev ever grows a Strapi record at this slug, re-running `patch-2026-06-01-start-application-form.mjs --env=dev` will push the same items list into it.

## Log impact

Three rows updated:
- `2026-05-22 event-sundays-served-right-hide` → dev: `superseded by 2026-05-30 relaunch` (was `n/a`).
- `2026-05-30 dining-cleanup-and-restaurant-hours` → dev: `applied (06-01)` for Sundays Served Right too (was partial).
- `2026-06-01 event-images-and-monthly-dues` → dev: `applied (06-01)` fully (Sundays Served image now attached).
- `2026-06-01 rehype-raw-and-visiting-form` → dev: `applied (06-01)` (start-application via fallback; not Strapi).

## Verification

```bash
SEED_ENV=dev node --input-type=module -e "
  import { initEnv, api } from './scripts/seed-helpers.mjs';
  const ctx = initEnv();
  const r = await api(ctx, '/events?filters[slug][\$eq]=sundays-served-right-the-2nd-floor&populate=*&pagination[limit]=1');
  const e = r.data[0];
  console.log(e?.title, '/', e?.date, '/', e?.image?.name, '/ has mailto:', /mailto/.test(e?.longDescription));
"
# → Sundays Served Right @ The 2nd Floor / 2026-06-28 / event-sundays-served-right-the-2nd-floor.jpg / has mailto: true
```

## Related

- [[2026-06-01-dev-catch-up-audit]] — the earlier broader dev replay; this entry closes the two rows that survived that audit.
- [[2026-05-30-dining-cleanup-and-restaurant-hours]] — relaunch source.
- [[2026-06-01-event-images-and-monthly-dues]] — image attach source.
- [[2026-06-01-rehype-raw-and-visiting-form]] — Visiting Form Strapi side.
