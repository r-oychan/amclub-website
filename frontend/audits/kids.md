# KidsPage — CMS Wiring Notes

Date: 2026-04-28.

## Section order

1. Hero (compact, bg image)
2. **QuadSection** — *local-only custom block, NOT CMS-driven yet*
3. Hangout (OverlaySection — image right of text panel, navy bg)
4. Kids' Parties (OverlaySection — image left of text panel, yellow bg with party-bg image)
5. Learning (ThreeColGrid — 2 cards: Seasonal Camps + Recreational Classes)
6. Safety (FeatureGrid centered, 3 features, no images)
7. Final CTA (CtaBanner)

## Schema work

New components:
- `blocks.overlay-section` (heading, description, image, imageAlt, textPosition, textVerticalAlign, textBgColor, textBgImage, textTheme, ctas)
- `blocks.three-col-grid` (heading, subheading, columns enum 2/3, variant, items)
- `shared.three-col-item` (heading, description, image, imageAlt, cta)

Edits:
- `blocks.feature-grid`: add `centered` boolean

Refactored `kids-page` schema from Dynamic Zone to explicit components; added deep-populate controller.

## Decisions

- **QuadSection stays hardcoded.** It uses inline SVGs and tightly coupled layout; CMS migration is non-trivial and out of scope for the simple-pages pass. Track as TODO in CMS-MIGRATION.md.
- Images uploaded to Strapi media library (so editors can swap via /admin), even though they were already available as runtime seed-media at `/uploads/pages/kids/`.
