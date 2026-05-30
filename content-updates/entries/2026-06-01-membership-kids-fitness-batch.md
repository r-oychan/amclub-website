---
date: 2026-06-01
environment: prod + dev
content_type: subpages.ts + useHeaderData fallback + VenueDetailPage + fitness-page (Strapi) + static assets
entry: "5 items: niche-group 15K price, kids camps cancellation policy PDF, recreational-classes paragraph + CTA + image, header Pilates nav item, fitness-page Pilates box reorder"
author: dev (Claude) on 2026-06-01
dev: applied (06-01)
uat: pending
seed: ported (patch-2026-06-01-batch.mjs + frontend code)
---

## Applied to prod + dev

Mixed batch: 4 frontend code changes + 1 Strapi reorder + 2 asset swaps.

### Strapi
- **Op 1 (item 5)**: `fitness-page.moreActivities.items` reordered so Pilates is the 3rd box. Was `[Pilates, Golf Activities, Multi-Purpose Court, Squash]` → now `[Golf Activities, Multi-Purpose Court, Pilates, Squash]`. Applied to both prod and dev via `scripts/patch-2026-06-01-batch.mjs`.

### Frontend code
- **Item 1 (`subpages.ts:1965`)**: niche-group 15K Membership price `A minimum of $20,000` → `A minimum of $15,000`.
- **Item 3 (`subpages.ts:1359`)**: Recreational Classes — appended two new paragraphs to `description` (Quad/Quad Poolside/email registration line with `[youth@amclub.org.sg](mailto:…)` inline link + the 3% credit card surcharge note). Added 2nd CTA `Cancellation/Temporary Suspension Form` pointing at the user-supplied Microsoft Forms URL.
- **Item 4 (`useHeaderData.ts:173`)**: `DEFAULT_HEADER` → Fitness & Wellness → Activities column → added `Pilates → /fitness/pilates` at index 2 (between Multi-Purpose Court and Squash). Strapi `/header` endpoint returns 404 (singleton uninitialized), so the live nav is currently driven by this fallback. Once a Strapi `/header` entry exists, the fallback becomes a safety net; the same addition would need to be made there too.
- **VenueDetailPage markdown rendering** (`VenueDetailPage.tsx:578`): same upgrade we shipped for `EventDetailPage` on 2026-05-31 — `<p>{text}</p>` mapping replaced with `<ReactMarkdown>` so inline `[text](url)` renders as a real `<a>`. Required for the mailto link in item 3 to be clickable.

### Static assets (items 2 + 3)
- **Item 2 (cancellation policy PDF)**:
  - Source: `media/Camp-Cancellation-Policy-2026_.pdf` (bad naming).
  - Renamed to `media/kids/camp/camp-cancellation-policy-2026.pdf` (lowercase-hyphens + correct folder).
  - Copied to `frontend/public/documents/kids/camp-cancellation-policy.pdf` (overwrites the older May 19 version — same path the existing `Cancellation Policy` CTA already points at, so no subpages.ts change needed).
  - SHA `153700718e…` matches across both copies.
- **Item 3 (recreational-classes feature image)**:
  - Source: `media/Recreational class_DS.jpg` (bad naming).
  - Renamed to `media/kids/recreational-classes-feature.jpg`.
  - Copied to `frontend/public/images/kids/learning/recreational-classes.jpg` (overwrites — matches the existing `image` path).
  - SHA `0f1fe73c25…`.

## Per-item summary

| Item | Surface | Mechanism | Result |
|---|---|---|---|
| 1 — Niche-group 15K Membership price | subpages.ts (membership/niche-group-membership) | code edit | "A minimum of $15,000…" — code change ready for next deploy |
| 2 — Kids camps cancellation policy | static PDF | file swap | new PDF in place — code change ready for next deploy |
| 3 — Recreational-classes copy + CTA + image | subpages.ts + VenueDetailPage markdown + static JPG | code edit + asset swap + frontend upgrade | new paragraph with clickable email, new Cancellation CTA, new feature image — ready for next deploy |
| 4 — Header: Pilates under Fitness & Wellness Activities | useHeaderData DEFAULT_HEADER | code edit | added at index 2 (3rd item) — ready for next deploy |
| 5 — Fitness page: Pilates as 3rd box | Strapi fitness-page.moreActivities.items | PUT | applied live on prod + dev |

## Naming cleanups

Both user-supplied filenames violated `feedback_media_and_naming` (spaces, Title Case, trailing underscore). Renamed to lowercase-hyphens and placed under the matching site-structure folder before copying into the deploy target:
- `media/Camp-Cancellation-Policy-2026_.pdf` → `media/kids/camp/camp-cancellation-policy-2026.pdf`
- `media/Recreational class_DS.jpg` → `media/kids/recreational-classes-feature.jpg`

## Markdown extension to VenueDetailPage

The 2026-05-31 markdown upgrade only covered `EventDetailPage`. Item 3 needed the same on `VenueDetailPage` so `[youth@amclub.org.sg](mailto:…)` would actually render as a clickable link. Same component override pattern (custom `p` preserves the venue-page styling, custom `a` adds underline + new-tab handling for external URLs). No `react-markdown` reinstall — already on the dependency tree from the prior batch.

If you want this pattern applied to more surfaces (`restaurant.description`, `dining-promotion.summary`, `extraSections.content`, etc.), each is a one-block lift — out of scope here.

## Replay instructions

```bash
SEED_ENV=uat node scripts/patch-2026-06-01-batch.mjs
```

Idempotent — re-running on an env where the order already matches is a no-op.

## Verification

After the next prod frontend deploy:
- `/membership/niche-group-membership` — 15K Membership card shows "A minimum of $15,000…".
- `/kids/camps` — "Cancellation Policy" CTA opens the new 2026 PDF.
- `/kids/recreational-classes` — description now ends with the Quad/Quad Poolside line (with the email as a clickable mailto link) and the 3% surcharge note; new "Cancellation/Temporary Suspension Form" CTA opens the Microsoft Forms URL; hero image is the new `Recreational class_DS.jpg` content.
- Header → Fitness & Wellness dropdown → Activities column → Pilates appears as 3rd item (Golf, Multi-Purpose Court, Pilates, Squash).
- `/fitness` — under the "More Activities" section, the cards now render in order Golf Activities → Multi-Purpose Court → Pilates → Squash. (Live immediately on prod; no deploy needed for Strapi-only change.)

## Related

- Linked entries:
  - [[2026-05-31-markdown-event-bodies]] — established the `react-markdown` rendering pattern; this batch extends it to `VenueDetailPage`.
  - [[2026-05-25-fitness-gym-rates-pdf-update]] — sibling fitness page change.
