# MembershipPage Audit — Framer ↔ Local

Captured 2026-04-28 at 1440×900 from `https://tactesting.framer.website/membership`.
Reference: `framer-membership-1440.jpeg`.

## Section order (8 blocks)

1. Hero (compact — heading "Membership" + subheading + image bg)
2. CtaBanner "Join Our Community" (with START YOUR APPLICATION)
3. TextBlock "A Home Away From Home" (heading + body, no image)
4. FeatureGrid — 6 features in 3-col grid (no images per item)
5. CtaBanner "Find the Right Membership for You" (with bg image, 2 CTAs)
6. CardGrid — 3 cards (Refer / Eagle Rewards / Reciprocal Clubs) with images
7. FaqAccordion (4 placeholder questions)
8. CtaBanner "Begin Your Membership Journey" (2 CTAs)

## Diff

| Section | Local | Framer | Action |
|---|---|---|---|
| Hero | compact, no bg image | full-width bg image (`zsDU30XC8mIt1DXN0SPMvCGYY.jpg`) | 🔁 add Framer image to hero |
| Join CTA decorative collage | not present | 4 images flank the CTA (`ki1APTKs`, `K6DoyAS`, `FfQ1mhh`, `tm55uzU2`) | defer; match local for now (CtaBanner schema has no images field) |
| TextBlock | heading + body (no image) | matches | ✅ |
| FeatureGrid 6 items | no images | no images | ✅ |
| Find Right CTA bg | none | bg image `ZU4Q31tLGrkQ` | defer (cta-banner schema has no bg image) |
| CardGrid 3 cards | no images | each card has image (`DQx7ewvx`, `i6XU5m8b`, `bdz4bVfeQ`) | 🔁 add images |
| FAQ | 4 questions empty | placeholder | ✅ ship empty (D8) |
| Final CTA | matches | matches | ✅ |

## Schema changes needed

- `shared.feature-item`: add optional `cta` (component shared.link)
- `blocks.cta-banner`: add `light` to variant enum
- `blocks.text-block`: change `body` from `blocks` (rich text) to `text`
- `api::membership-page`: refactor from Dynamic Zone to explicit fields
- New `membership-page` controller for deep populate

## Future work (not blocking)

- Extend `blocks.cta-banner` with optional `backgroundImage` and a `decorativeImages: media[]` for the JoinCta collage. Track in `CMS-MIGRATION.md` Q-list.
