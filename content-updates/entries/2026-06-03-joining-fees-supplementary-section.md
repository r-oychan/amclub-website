---
date: 2026-06-03
environment: dev
content_type: joining-fees-page (CMS schema + frontend + content)
entry: "Add Supplementary Membership Categories section to /membership/joining-fees on dev"
author: dev (Claude) on 2026-06-03
dev: applied (schema + frontend pushed; content patch pending dev CMS CI rebuild — auto-retries via scheduled wakeup)
uat: pending
seed: ported (patch-2026-06-03-joining-fees-supplementary.mjs)
---

## Applied to dev

New section on `/membership/joining-fees` rendered between "Nominee Application / Re-nomination Fee" and "Refund Policy", titled **Supplementary Membership Categories**, with four cards in a 4-column grid:

1. **Junior Membership** — open to Members' children aged 12-24 with monthly fees + sub-section about children under 12 + 2 CTAs (APPLY NOW + REGISTER HERE).
2. **Visiting Membership** — visitor accommodations up to 90 days per calendar year, broken into four Types (A/B/C/D) each with its own eligibility, fees, and Register link.
3. **Dependent Senior Citizen Restricted Membership** — Members' parents aged 65+, GC approval required, T&Cs apply.
4. **Absent and Resignation Status** — Absentee Status info + 2 CTAs (Absent Status Application Form + Resignation Advisory Form).

Mimics the existing **Individual Membership Categories** section's layout (centred heading + optional subheading + card grid).

## Changes

### CMS schema (`cms/src/api/joining-fees-page/content-types/joining-fees-page/schema.json`)

Added three fields to the joining-fees-page single-type:
- `supplementaryHeading` (string)
- `supplementarySubheading` (text)
- `supplementaryCards` (repeatable `shared.priced-card`)

Reuses the existing `shared.priced-card` component so admin authors get a familiar editor. The supplementary section ignores the pricing-tier fields and reads only `name`, `description`, `cta`, `secondaryCta`.

### Frontend (`frontend/src/data/joiningFees.ts` + `frontend/src/pages/JoiningFeesPage.tsx`)

- New `SupplementaryCard` TS type (4 fields).
- `JOINING_FEES_FALLBACK` extended with empty supplementary values — the section hides when there are no cards, so prod (which doesn't have these fields populated) is unaffected.
- New `SupplementaryCardView` component:
  - Heading + ReactMarkdown body (remarkBreaks + rehypeRaw plugins, same setup as event/venue bodies).
  - Bold/italic/links rendered with project styles.
  - 0, 1, or 2 stacked CTA pills at the bottom of the card.
- New `<section>` between nominationFee and refund. 4-column grid (`lg:grid-cols-4`) following the screenshot's layout.
- New `normalizeSupplementaryCards` helper handles the Strapi → frontend mapping.

### Content population (`scripts/patch-2026-06-03-joining-fees-supplementary.mjs`)

PUT to `/joining-fees-page` with the heading + 4 cards. Each card's `description` carries the multi-paragraph copy with markdown formatting:
- `**Bold**` for sub-headings within a card (e.g. "Type A", "Restrictions:").
- `\n\n` for paragraph breaks (renders as `<p>` thanks to remark-breaks + standard markdown).
- `\n` for line breaks within a paragraph (renders as `<br>` thanks to remark-breaks).
- `[Register here](url)` for the inline Register links inside Visiting Membership's four Type sections.
- `_italic_` for the T&C caveat on the Dependent Senior card.

## URLs supplied vs. placeholder

| Card | CTA | URL |
|---|---|---|
| Junior Membership | APPLY NOW | `https://amclub.jotform.com/253623954879979` ✓ supplied |
| Junior Membership | REGISTER HERE (under-12 family registration) | `#` (placeholder) |
| Visiting Membership | Type A "Register here" | `#` (placeholder) |
| Visiting Membership | Type B "Register here" | `#` (placeholder) |
| Visiting Membership | Type C "Register here" | `#` (placeholder) |
| Visiting Membership | Type D "Register here" | `#` (placeholder) |
| Dependent Senior | REGISTER HERE | `#` (placeholder) |
| Absent & Resignation | Absent Status Application Form | `#` (placeholder) |
| Absent & Resignation | Resignation Advisory Form | `#` (placeholder) |

All `#` placeholders are editable in dev `/admin` once URLs are supplied. Or send them my way and I'll patch in one go.

## Deploy sequence

1. Push schema + frontend code to `dev` branch ✓ done in commit 3932717.
2. GitHub Actions rebuilds the dev CMS container with the new schema fields (~5-10 min) and the dev frontend container.
3. Patch script populates the content via PUT — currently failing with 400 "Invalid key supplementaryHeading" because step 2 is still in flight. Scheduled to retry in 8 min.

## Visiting Membership card design note

The user's reference screenshot shows Visiting Membership with four labelled Type sections, each with its own pill-style "REGISTER HERE" button (per-Type buttons inside one card). The existing `shared.priced-card` schema only carries one `cta` and one `secondaryCta` (two pill buttons total), so the four Type-specific buttons live inline within the description as markdown links instead of as separate pill CTAs.

Visual outcome: heading + intro paragraph, then four Type sub-blocks each showing the description, fees in bold, and an underlined "Register here" link. Functional but visually flatter than the screenshot.

To match the screenshot exactly, the schema would need a richer card component (e.g. `shared.tiered-card` with a repeatable `tiers` array, each with its own description + CTA). Out of scope for this batch — flagging as a possible follow-up if the inline-link rendering doesn't read well in the live design.

## Related

- [[2026-05-31-markdown-event-bodies]] — established the ReactMarkdown rendering pattern used in `SupplementaryCardView`.
- [[2026-06-01-remark-breaks-single-newline-fix]] / [[2026-06-01-rehype-raw-and-visiting-form]] — the plugin chain (remarkBreaks + rehypeRaw) the card descriptions rely on.
