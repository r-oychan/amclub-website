# Home Page — Design-Token Audit

**Date:** 2026-04-30 (last updated 2026-05-06)
**Scope:** Home page only (`/home`).
**Companion doc:** `home.md` covers *content* drift (text/images vs Framer); this doc covers *design-token* drift (typography, color, spacing, rendering).

**Status note (2026-05-06):** several fixes from §3 have shipped. Updated table in §3 reflects what is now in `dev`. New findings from the iteration (hero subheading font face, hero CTA weight rule) added in §F.

## Source-of-truth decision

Confirmed with the user: when sources disagree, **the designer's handover at https://amclub.craft.me/handover wins**. Where the handover is silent (spacing, radii, shadows, component anatomy) the Framer prototype / `DESIGN.md` apply.

---

## 1. Handover spec, verbatim

Extracted live from craft.me on 2026-04-30.

### Typography

| Element | Usage | Family | Size / LH | Weight | Letter-spacing |
|---|---|---|---|---|---|
| H1 | Page Header | Noto Serif | 3.2rem / 1.0 | Light Italic | -0.04em |
| H2 (serif) | Section Title | Noto Serif | 2.2rem / 1.2 | Light Italic | -0.02em |
| H2 (sans) | Section Title | Lato | 1.5rem / 1.2 | Bold | -0.02em |
| H3 | Paragraph Title | Lato | 1.1rem / 1.4 | Bold | 0 |
| Body | Body paragraph | Lato | 1.2rem / 1.4 | Light / Regular | 0 |
| Small | Caption | Lato | 0.8rem / 1.6 | Regular | 0 |
| CTA link | All-caps text link | Lato | 0.9rem / 1.4 | Bold | 0.04em |
| CTA button | All-caps button label | Lato | 0.85rem / 1.1 | Regular | 0.04em |

### Colors

| Token | Hex | Usage |
|---|---|---|
| Primary (Navy) | `#001E62` | CTAs, links, page title, nav |
| Secondary (Teal) | `#6BBBAE` | Accent |
| Secondary (Rouge) | `#DF4661` | Accent |
| Dark (Charcoal) | `#3F4452` | Text, headings |
| Light (Cream) | `#F5F4F2` | Backgrounds |

### Breakpoints

Mobile 320–767 · Tablet 768–1199 · Desktop L 1200–1439 · Desktop XL 1440+.

### Out of scope of the handover

Spacing scale, radii, shadows, component anatomy. The handover defers to the Framer prototype for those.

---

## 2. Findings

### A. Font rendering — RESOLVED 2026-04-30

The Services H2 (`From shared experiences to lasting bonds…`) was rendering visibly heavier and darker than the Framer prototype despite identical computed CSS:

| Property | Framer | Ours (before) |
|---|---|---|
| `font-family` | `"Noto Serif", serif` | `"Noto Serif", serif` ✓ |
| `font-weight` | 200 | 200 ✓ |
| `font-size` | 59.2px | 59.2px ✓ |
| `letter-spacing` | -2.368px (-0.04em) | -2.368px ✓ |
| `font-style` | italic | italic ✓ |
| `font-feature-settings` | `"cv01","cv05","cv09","cv11","ss03"` | same ✓ |
| `color` | `rgb(245,244,242)` | same ✓ |
| **`-webkit-font-smoothing`** | **`antialiased`** | **`auto`** (= `subpixel-antialiased` on macOS Chrome) |

Subpixel antialiasing on macOS Chrome thickens strokes with color subpixels for sharpness, making text read heavier than its grayscale-rendered counterpart. Framer (and most design-led sites) opt out with `antialiased`.

**Fix applied:** added `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;` to the `body` rule in `frontend/src/index.css:24-29`. Affects every text element on every page.

### B. Typography drift (open)

Implementation tracks `DESIGN.md`/Framer numbers, not the handover. Drifts by token:

| # | Issue | Handover says | Repo currently | Where |
|---|---|---|---|---|
| 1 | Hero H1 weight | Light Italic (300) | `font-bold` (700) | `frontend/src/components/blocks/Hero.tsx:49` |
| 2 | Hero H1 size | 3.2rem | `text-4xl sm:text-5xl md:text-6xl` (≈3.75rem max) | `Hero.tsx:49` |
| 3 | Section H2 weight | Light Italic (300) | ExtraLight (200) | `frontend/src/index.css:49` |
| 4 | Section H2 size | 2.2rem flat | 2.4rem mobile, **3.7rem ≥1200px** | `index.css:47, 67-71` |
| 5 | Section H2 tracking | -0.02em | -0.04em | `index.css:51` |
| 6 | H2 sans variant | Lato 1.5rem Bold -0.02em | Not defined | n/a |
| 7 | Body size | 1.2rem (≈19.2px) | `text-[17.6px]` (1.1rem) widely | `AboutSection.tsx`, `FeatureGrid.tsx`, `CardGrid.tsx`, others |
| 8 | CTA tracking (hero) | 0.04em | `tracking-[0.1em]` | `Hero.tsx:53` |
| 9 | CTA tracking (about) | 0.04em | `tracking-[0.2em]` | `AboutSection.tsx:171` |
| 10 | Arbitrary px sprawl | Clean rem scale | `text-[14.4px]`, `[17.6px]`, `[25.6px]`, `[28.8px]`, `[26.56px]`, `[19.2px]` | many `blocks/*.tsx` files |

Note: the section H2's `font-feature-settings: "cv01","cv05","cv09","cv11","ss03"` (`index.css:52`) was briefly removed during this audit, then restored after live inspection of Framer confirmed Framer uses the **same** stylistic alternates. The swash glyphs are intentional and correct.

### C. Tailwind theme drift

`frontend/src/index.css` defines color tokens under `@theme` but **defines zero typography tokens** — no `--text-*`, `--font-weight-*`, `--tracking-*`. Result: typography is enforced ad hoc per component using arbitrary Tailwind values, which is why the same "section heading" reads differently across `Hero`, `AboutSection`, `FeatureGrid`, `TabsSection`, `FaqAccordion`. Promoting the handover typography scale into `@theme` would let components use semantic class names (`text-headline-md`, `font-light-italic`) and eliminate the px sprawl.

### D. Fonts loaded vs. used

`frontend/index.html:10` loads **Inter 300–700** alongside Noto Serif and Lato. Inter is **not referenced** by the handover, by `DESIGN.md`, or anywhere on the home page. Removing it is a free perf win (one fewer font request, smaller CSS).

The Google Fonts URL uses `&display=swap`. Framer self-hosts each face with `font-display: swap` for 300/400/600/700 italic and **no `font-display`** (= block) for 200 italic — meaning Framer guarantees no FOUT for the critical headline weight. If a layout-shift / FOUT regression shows up, mirror Framer's pattern by self-hosting italic 200 with `font-display: block`.

### E. Color tokens

Handover lists **4** swatches. `index.css:4-11` exposes **8** (`primary`, `primary-dark`, `primary-light`, `accent`, `secondary`, `bg`, `text-dark`, `text-light`). The extras (`primary-overlay`, `primary-strong`) named in `DESIGN.md` aren't actually wired into Tailwind — components reach for arbitrary opacity (`bg-primary/60`, `bg-white/[0.77]`, `border-primary/15`) instead. Handover is silent on this so it's not a violation, just inconsistent — would benefit from being collapsed to the handover's 4 named tokens with explicit opacity ramps.

### F. Component-specific weight rules (discovered 2026-05-06)

The handover spec maps "CTA" to one row (Bold 0.9rem) and "CTA button label" to another (Regular 0.85rem), but the home page actually uses **two different CTA styles** based on context:

| Context | Component | Computed in Framer | Rule |
|---|---|---|---|
| Hero photo overlay (white pill) | `Button variant="white"` | Lato **Regular 400**, 13.6px, 0.04em | Hero CTA inverts color *and* drops weight to Regular |
| In-section text link with arrow | `SectionHeader` cta + `AboutSection` cta | Lato **Bold 700**, 14.4px, 0.04em | Default for "EXPLORE MEMBERSHIP", "DISCOVER OUR STORY", "VIEW FEATURED CLUB EVENTS" |

**Hero / Hero-Carousel slide subheading is sans-serif, not serif.** Pre-fix, `HeroCarousel.tsx` was rendering slide subtitles as Noto Serif Italic SemiBold with `ss03`/`cv01-11` alternates — i.e. the same family as the H1 title. Framer's slide subhead is plain **Lato Regular 400 at 20.8px / lh 1.4**. The handover's Body row (Lato 1.2rem Light/Regular 1.4) is the closest spec match.

**funFact wrapper opacity** — Framer dims the entire "Did You Know?" block (rouge accent bar + title + body) via a wrapper at `opacity: 0.567`. Mirroring that on our cream background read as visibly washed out, so the production decision (`AboutSection.tsx:154`) is to render at **full opacity, no dim**. This is an intentional deviation from Framer's exact computed style for legibility on our background.

---

## 3. Recommended fixes

| # | Fix | Files | Status | Commit |
|---|---|---|---|---|
| 1 | `-webkit-font-smoothing: antialiased` on body | `frontend/src/index.css:24-31` | ✅ DONE | `f4be53f` |
| 2 | FeatureGrid card description → Lato 300, dim to 70% on dark | `FeatureGrid.tsx:163-165` | ✅ DONE | `2ca6428` |
| 3 | funFact title default-weight, body Lato 300, both `leading-[1.4]`; opacity left at 100% (Framer's 57% reads washed on cream) | `AboutSection.tsx:152-164` | ✅ DONE | `2ca6428`, `908e10b` |
| 4 | HeroCarousel slide subheading → Lato Regular 400 (was Noto Serif italic SemiBold + ss03 alternates), 4 code paths | `HeroCarousel.tsx` (subtitle blocks) | ✅ DONE | `908e10b` |
| 5 | Button white variant → Regular 400 (was inheriting `font-bold` from base); dropped `tracking-wide` from base; Hero pill CTA tracking 0.1em→0.04em + size 14px→13.6px | `Button.tsx:16-23`, `Hero.tsx:53` | ✅ DONE | `908e10b` |
| 6 | Hero H1 → Light Italic 300, 3.2rem | `Hero.tsx:49` | open | — |
| 7 | Section H2 → 300 weight, 2.2rem flat, -0.02em tracking; remove `@media (min-width:1200px)` size override | `index.css:45-71` | open | — |
| 8 | Add `.heading-h2-sans` (Lato 1.5rem Bold -0.02em) | `index.css` | open | — |
| 9 | Promote handover typography into Tailwind v4 `@theme` (kills the `text-[17.6px]` arbitrary-value sprawl) | `index.css:3-18` | open | — |
| 10 | Normalize remaining CTA tracking to 0.04em | `AboutSection.tsx:171` (other section CTAs already correct) | open | — |
| 11 | Remove Inter from Google Fonts URL | `frontend/index.html:10` | open | — |
| 12 | Reconcile `DESIGN.md` `display-hero`/`headline-lg` to match handover (5.6rem→3.2rem, 600→300, 3.7rem→2.2rem, 200→300, -0.04em→-0.02em on H2) | `DESIGN.md` | open | — |

Fixes 6 + 7 will visibly shrink the H1/H2 in viewport — please review at 1440 / 1200 / 768 / 375 before merging.

---

## 4. Critical files

- `DESIGN.md` (root) — design system reference, currently contradicts handover on H1/H2 size+weight
- `frontend/index.html` — Google Fonts URL (Inter unused)
- `frontend/src/index.css` — Tailwind v4 `@theme`, global heading classes, body rule
- `frontend/src/pages/HomePage.tsx` — section composition
- Home blocks: `frontend/src/components/blocks/Hero.tsx`, `AboutSection.tsx`, `CardGrid.tsx`, `FeatureGrid.tsx`, `TabsSection.tsx`, `TestimonialSlider.tsx`, `FaqAccordion.tsx`
- Shared: `frontend/src/components/shared/Button.tsx`, `SectionHeader.tsx`, `SectionLabel.tsx`

## 5. Reference screenshots

- `frontend/audits/framer-home-1440.jpeg` — Framer baseline at 1440
- `frontend/audits/deployed-home-1440-cms.jpeg` — deployed home at 1440 (pre-smoothing-fix)
- `screenshots/clone/framer-services-1440-2026-04-30.png` — fresh Framer Services capture used during this audit

After fix #1 lands in production, capture a new `deployed-home-1440-cms-postfix.jpeg` and diff against the Framer baseline to confirm the Services H2 weight now matches.

## 6. Verification

1. Reload the deployed home page after fix #1 deploys; visually compare Services H2 to the Framer prototype at 1440. Strokes should appear thinner and lighter, matching Framer.
2. Run `cd frontend && npm run typecheck && npm run lint && npm run build` to confirm no regressions.
3. For the open fixes (#2–#8): each should be its own PR with before/after screenshots at 1440 / 1200 / 768 / 375.
4. After fixes #2–#3 land, run `npx @google/design.md lint DESIGN.md` to confirm DESIGN.md still validates after reconciliation.
