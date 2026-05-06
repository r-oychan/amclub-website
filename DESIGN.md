---
version: alpha
name: American Club Heritage
description: >
  Heritage members' club design system for The American Club Singapore — a cream-and-navy
  palette, Noto Serif italic display type, Lato body type, full-pill navy CTAs, and
  lifestyle photography as the visual hero. Extracted from the Framer prototype at
  https://tactesting.framer.website/home.
colors:
  primary: '#001E62'
  primary-strong: '#00164A'
  primary-overlay: '#051B4F'
  secondary: '#6BBBAE'
  tertiary: '#DF4661'
  neutral: '#F5F4F2'
  surface: '#FFFFFF'
  on-primary: '#FFFFFF'
  on-surface: '#3F4452'
  on-neutral: '#3F4452'
typography:
  display-hero:
    fontFamily: Noto Serif
    fontSize: 5.6rem
    fontWeight: 600
    fontStyle: italic
    lineHeight: 1
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Noto Serif
    fontSize: 3.7rem
    fontWeight: 200
    fontStyle: italic
    lineHeight: 1.1
    letterSpacing: -0.04em
  headline-md:
    fontFamily: Noto Serif
    fontSize: 2.4rem
    fontWeight: 300
    fontStyle: italic
    lineHeight: 1.1
    letterSpacing: -0.03em
  headline-sm:
    fontFamily: Noto Serif
    fontSize: 1.66rem
    fontWeight: 300
    fontStyle: italic
    lineHeight: 1.1
  body-lg:
    fontFamily: Lato
    fontSize: 1.3rem
    fontWeight: 400
    lineHeight: 1.4
  body-md:
    fontFamily: Lato
    fontSize: 1.1rem
    fontWeight: 300
    lineHeight: 1.4
  body-sm:
    fontFamily: Lato
    fontSize: 0.85rem
    fontWeight: 400
    lineHeight: 1.4
  eyebrow:
    fontFamily: Lato
    fontSize: 0.9rem
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0.04em
  link-caps:
    fontFamily: Lato
    fontSize: 0.9rem
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0.04em
  nav-link:
    fontFamily: Lato
    fontSize: 0.85rem
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: 0.04em
  cta-label:
    fontFamily: Lato
    fontSize: 0.85rem
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: 0.04em
rounded:
  none: 0px
  sm: 8px
  md: 16px
  full: 999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section-sm: 64px
  section-md: 96px
  section-lg: 128px
  gutter-mobile: 16px
  gutter-tablet: 24px
  gutter-desktop: 32px
  container-max: 1280px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.cta-label}'
    rounded: '{rounded.full}'
    padding: 12px 24px
  button-primary-hover:
    backgroundColor: '{colors.primary-strong}'
    textColor: '{colors.on-primary}'
  button-hero-invert:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.primary}'
    typography: '{typography.cta-label}'
    rounded: '{rounded.full}'
    padding: 12px 24px
  button-member-login:
    backgroundColor: '{colors.primary-strong}'
    textColor: '{colors.on-primary}'
    typography: '{typography.nav-link}'
    rounded: '{rounded.full}'
    padding: 8px 18px
  button-secondary-outline:
    backgroundColor: '{colors.neutral}'
    textColor: '{colors.primary}'
    typography: '{typography.cta-label}'
    rounded: '{rounded.full}'
    padding: 11px 23px
  eyebrow-teal:
    textColor: '{colors.secondary}'
    typography: '{typography.eyebrow}'
  eyebrow-rouge:
    textColor: '{colors.tertiary}'
    typography: '{typography.eyebrow}'
  eyebrow-navy:
    textColor: '{colors.primary}'
    typography: '{typography.eyebrow}'
  eyebrow-charcoal:
    textColor: '{colors.on-surface}'
    typography: '{typography.eyebrow}'
  eyebrow-on-primary:
    textColor: '{colors.on-primary}'
    typography: '{typography.eyebrow}'
  cta-link:
    textColor: '{colors.primary}'
    typography: '{typography.link-caps}'
  stats-number:
    textColor: '{colors.tertiary}'
    typography: '{typography.headline-md}'
  stats-label:
    textColor: '{colors.primary}'
    typography: '{typography.nav-link}'
  card-event:
    backgroundColor: '{colors.neutral}'
    textColor: '{colors.on-neutral}'
    rounded: '{rounded.sm}'
    padding: 16px
  event-category-pill:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.nav-link}'
    rounded: '{rounded.full}'
    padding: 6px 14px
  card-dining:
    backgroundColor: '{colors.neutral}'
    textColor: '{colors.on-neutral}'
    rounded: '{rounded.none}'
    padding: 32px
  card-service:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.sm}'
    padding: 32px
  faq-item:
    backgroundColor: '{colors.neutral}'
    textColor: '{colors.on-neutral}'
    rounded: '{rounded.sm}'
    padding: 16px
  nav-bar:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.neutral}'
    typography: '{typography.nav-link}'
    rounded: '{rounded.full}'
    padding: 16px
  footer:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    padding: 64px
  cta-banner:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    padding: 96px
  hero-overlay:
    backgroundColor: '{colors.primary-overlay}'
    textColor: '{colors.neutral}'
    padding: 64px
  input-field:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.on-surface}'
    typography: '{typography.body-md}'
    rounded: '{rounded.sm}'
    padding: 12px 16px
---

# Design System — The American Club Singapore

> **Source prototype:** https://tactesting.framer.website/home
> **Designer handover:** https://amclub.craft.me/handover (Mar 9, 2026 — Coin@maynami.com)
> **Site IA (Whimsical):** https://whimsical.com/tac-website-ia-Bj1APZvZ8P2iE2CZ3oaYLR
> **Format:** Stitch [DESIGN.md spec](https://github.com/google-labs-code/design.md), version `alpha`.
> **Lint:** `npx @google/design.md lint DESIGN.md`

## Overview

The American Club Singapore site is a **heritage members' club** rendered in a refined, photography-led, cream-and-navy palette — the digital equivalent of stepping out of Claymore Hill humidity into a hushed, marble-floored lobby. Where most Framer sites lean motion-first or product-screenshot-driven, TAC pulls in the opposite direction: *lifestyle photography is the hero*, typography acts as a quiet sommelier, and large blocks of cream (`#F5F4F2`) breathe between every section to evoke unhurried club leisure.

The defining typographic gesture is **Noto Serif Italic** for display and headline roles — set tight (`-0.04em` to `-0.02em`) so headlines like "*A Home Away From Home*" read like an embossed invitation rather than a marketing claim. The hero H1 pushes the weight up to SemiBold (600) for presence; section titles drop back to ExtraLight (200) for an airy, brochure-like rhythm; smaller headlines (stats, FAQ) run at Light (300). The body face is **Lato** at Light or Regular, with Bold reserved for eyebrow labels and caps-locked CTAs (`0.04em` tracking).

Color is dominated by a single deep navy (`#001E62`) — nav, footer, CTA banners, primary buttons, text links — punctuated by a soft cream background and two restrained accents (teal `#6BBBAE` and rouge `#DF4661`). Rouge is also the color of the giant stats numbers (`11,000+ Members`), the one place where an accent is given full size. There are no gradients, no glassmorphism, no neon glows. Depth comes from *photography* and *generous negative space*, not from shadows.

The overall mood is **considered, generational, hospitable** — a private club's brochure rebuilt for the web, not a SaaS landing page wearing a club's clothes.

**Key Characteristics**

- Cream canvas (`#F5F4F2`) — warm off-white, never pure `#FFFFFF` for full-page background
- Deep navy (`#001E62`) used as a structural color: nav, footer, full-bleed CTA bands, primary buttons, text-link color
- Noto Serif Italic across the entire display/headline stack — italic is not decoration, it's the brand voice
- Hero H1 at Noto Serif SemiBold Italic (600) for presence; section displays drop to ExtraLight (200) italic
- Lifestyle photography occupies ~50% of every page — families, members, dining, fitness, kids
- Floating dark-navy nav pill on Desktop XL with a centered eagle crest logo dividing left/right link groups
- Pill-shaped buttons (`rounded.full` = 999px) for every CTA — white-pill variant on hero, navy pill elsewhere
- All-caps eyebrow labels above every card title and section heading — color varies by section mood

## Colors

The palette is a single deep navy driving every structural element, against a warm cream that replaces pure white. Two accent hues — a restrained teal and a warmer rouge — are held back for eyebrow labels and, in one specific case, the giant stats numbers.

- **Primary (#001E62) — Club Navy.** The brand's spine. Used for nav background, footer, CTA banner backgrounds, primary buttons, text links, and most eyebrow labels. This is *the* color of the site — every page has it in quantity.
- **Primary Strong (#00164A) — Deep Navy.** The hover state for navy buttons, and the background of the `MEMBER LOGIN` CTA in the top nav.
- **Primary Overlay (#051B4F) — Hero Scrim.** The near-solid equivalent of the navy translucent overlay (`rgba(0, 29, 97, 0.75)`) painted over hero photography to anchor white H1 text.
- **Secondary (#6BBBAE) — Salon Teal.** Accent A for eyebrow labels (`SERVICES`, `MOMENTS`). Never a button, never a background fill.
- **Tertiary (#DF4661) — Club Rouge.** Accent B for eyebrow labels (`CASUAL PREMIUM FINE DINING`, dining categories). The *one* place rouge appears at scale is the stats counter: `11,000+`, `90+`, `77+` all render in rouge Noto Serif Light Italic.
- **Neutral (#F5F4F2) — Paper Cream.** The page background, full stop. Warm, linen-like, chosen so the site never feels like a blank dev canvas. Also the surface of card-text sides in dining zigzag rows.
- **Surface (#FFFFFF) — Card White.** Used only inside service cards where a lighter-than-cream tile is needed for contrast.
- **On Primary (#FFFFFF) — Headline/CTA Text on Navy.** Pure white for headings, buttons, and primary text against any navy surface. Body text on navy softens to `rgba(255, 255, 255, 0.77)` to reduce glare in footer columns.
- **On Surface / On Neutral (#3F4452) — Ink Charcoal.** Body copy, paragraph titles on cream, and eyebrow labels where navy/teal/rouge would be too loud (e.g., `ABOUT US`, `EXPERIENCE`, `FAQ`).

**Role conventions**

- Navy is the link color. Hovered links shift to Primary Strong `#00164A`. There is no separate "link blue."
- Teal and Rouge are reserved for **eyebrow labels** — never buttons, never link color, never a background. The *only* exception: rouge at display size in the stats counter.
- No success/warning/error semantic colors are defined on the marketing site. Member-portal flows will introduce them later.
- No gradients. No glassmorphism. Depth comes from photography, cream surfaces, and navy bands — not from blends.

## Typography

Two typefaces carry the entire system: **Noto Serif** as the brand voice (always italic, three weights), and **Lato** for everything else (Light, Regular, Bold).

- **Noto Serif Italic — the signature.** Every display, headline, and pull-quote is italic. Upright serif is never used. Weight varies by scale:
  - **Display hero (H1 on dark photography)** — SemiBold 600, 5.6rem, `-0.04em`. Reserved for the landing hero.
  - **Section headline (H1/H2 on cream)** — ExtraLight 200, 3.7rem, `-0.04em`. The airy, brochure-like title style used for "*Blending American Traditions…*," "*From memorable moments to unforgettable evenings*," "*Dine. Drink. Unwind.*"
  - **Mid headline (FAQ title, stats number, pull-quote)** — Light 300, 2.4rem, `-0.03em`.
  - **Feature-card headline** — Light 300, 1.66rem. Appears inside dark CTA bands and testimonial cards.

- **Lato — the supporting voice.** Three weights carry UI and body:
  - **Body large (hero subhead)** — Regular 400, 1.3rem / 1.4.
  - **Body default** — Light 300, 1.1rem / 1.4. Lato Light is preferred over Regular for long-form paragraphs — reinforces the unhurried atmosphere.
  - **Body small (footer fine print, captions)** — Regular 400, 0.85rem / 1.4.
  - **Eyebrow / Link-caps** — Bold 700, ALL CAPS, 0.9rem, `0.04em` tracking.
  - **Nav-link / CTA-label** — Regular 400, ALL CAPS, 0.85rem, `0.04em` tracking.

**Principles**

- **Italic is mandatory on headings.** A non-italic Noto Serif heading is off-brand. The italic axis is the visual fingerprint of the system.
- **Hero subheadings are sans, not serif.** The H1 hero title is Noto Serif italic; the subhead beneath it is plain **Lato Regular 400 at ~1.3rem / lh 1.4** — no italic, no `font-feature-settings`. Mixing serif italic into the subhead reads heavy and breaks the brochure rhythm.
- **Negative tracking on serif.** H1/H2 tighten to `-0.02em` to `-0.04em` for an engraved, invitation-card feel. Body stays at default `0`.
- **Caps + 0.04em = formality.** Every CTA label, nav link, eyebrow, and inline link arrow uses uppercase with positive letter-spacing. This is how the brand whispers instead of shouts.
- **Two faces, no exceptions.** Noto Serif and Lato only. No display fonts, no monospace on marketing pages, no decorative scripts.
- **Light is the default body weight.** Lato Light (300) reads airier than Regular and aligns with the brochure atmosphere.
- **Antialiased smoothing site-wide.** Apply `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;` on `body`. macOS Chrome's default subpixel rendering thickens strokes with color subpixels and makes Lato Light / Noto Serif ExtraLight look heavier than the design intends. Grayscale antialiasing matches the Framer prototype exactly.

## Layout

- **Base unit** — 8px. Spacing scale: 4, 8, 16, 24, 32, 48, 64, 96, 128px.
- **Section padding** — 96–128px vertical between major sections on desktop, 64px on mobile. Generous; never cramped.
- **Card internal padding** — 32–48px.
- **Inter-element gap inside cards** — 16–24px.
- **Max content width** — 1280px, centered.
- **Page gutters** — 32px (desktop), 24px (tablet), 16px (mobile).

Common page patterns on `/home`:

- Full-bleed hero, ~100vw × ~85vh, with navy overlay on the bottom 40% to anchor the white H1.
- 3-up stats counter (rouge numerals, navy ALL-CAPS label).
- 3-column feature grid inside a navy CTA band ("Family Experience / Business & Leisure / Everyday Concierge").
- Horizontal event-card carousel with navy category pills and cream cards.
- Zigzag dining/fitness/kids category rows (image/text alternating).
- Testimonial carousel with white quote type on navy.
- FAQ accordion on cream, with navy `+` toggles.
- Navy footer with eagle crest, address, three link columns.

**Whitespace philosophy**

- **Cream is breathing room.** The cream between sections is intentional negative space — never fill it with decorative elements.
- **Photography demands room.** Images get full-width treatment; text never crowds them.
- **Navy bands as punctuation.** One full-bleed navy CTA band per page acts as a visual rest stop. Two feels flat.
- **One focal action per screen.** Most sections have a single primary CTA. Two CTAs appear only on dining/retail cards (`READ MORE` + `VIEW MENU`).

## Elevation & Depth

This system rejects shadows as decoration. The cream-on-cream surface palette and full-bleed photography do the work that shadows would do in a flatter palette.

| Level | Treatment | Use |
|---|---|---|
| 0 — Flat | No shadow, cream surface | Page background, default sections |
| 1 — Subtle Card | No shadow; separation via white-on-cream contrast only | Service cards, FAQ items |
| 2 — Floating Nav | `rgba(0, 0, 0, 0.08) 0px 4px 16px` soft ambient shadow | Floating nav pill on Desktop L/XL |
| 3 — Hero Overlay | Navy translucent overlay `rgba(0, 29, 97, 0.75)` on bottom 40% of hero | Hero text legibility |
| 3 — Button Lift | `rgba(32, 99, 171, 0.07) 0px 20px 19px -12px` soft directional shadow | White-pill hero CTA only |

**Why no shadows.** Photography provides depth — a single member portrait carries more visual interest than any drop-shadow card. Navy bands provide hierarchy — full-bleed dark sections separate content blocks more cleanly than shadowed cards. Whitespace provides separation — 96–128px section padding means components don't need shadows to feel distinct.

**No glassmorphism, no backdrop-blur, no neumorphism, no glows.** The system is flat-with-photography, not flat-with-effects.

## Shapes

The shape language splits cleanly by surface type:

- **Square corners (0px)** — hero photography, dining/event card photography, full-bleed navy bands, section images. Square corners reinforce the editorial, brochure tone. Rounded corners on photography would read as SaaS.
- **Soft corners (8px)** — event cards, service cards, FAQ items, form inputs. Light softening where a tile needs a surface boundary.
- **Medium corners (16px)** — rare; reserved for stat blocks or feature-card outer containers when they warrant gentle separation.
- **Full pill (999px)** — every interactive button, every CTA, every category tag (dining category pills on event cards, member login button in nav). *All* buttons are fully rounded; partial radii are never used on interactive chrome.

## Components

### Buttons

- **Primary Pill (Navy)** — `button-primary`. Navy background, white Lato ALL-CAPS label at 0.85rem **Regular (400)**, full pill (`999px`), padding `12px 24px`. The default pill CTA — `READ MORE`, `VIEW MENU`. Hover: `primary-strong` (`#00164A`).
- **Hero Invert Pill (White)** — `button-hero-invert`. White background, navy label at **Lato Regular 400, 13.6px (~0.85rem), `0.04em` tracking**, shadow `rgba(32, 99, 171, 0.07) 0px 20px 19px -12px`. Reserved for the primary action on hero photography, where a navy pill would disappear into the overlay. Label: `REQUEST FOR A CLUB TOUR`. **Note:** the white pill is the one CTA that does *not* use Lato Bold — Regular is correct here. The hero photo + scrim already provides contrast; bold would over-shout.
- **Member Login Pill (Deep Navy)** — `button-member-login`. `primary-strong` (`#00164A`) background, white label, anchored to the right end of the floating nav bar. Padding `8px 18px` — a touch more compact to sit inside the nav pill.
- **Secondary Outline Pill** — `button-secondary-outline`. 1px navy border on cream background, navy label. Used as the second of a two-button pair on dining cards.
- **Inline Text Link (CTA)** — `cta-link`. **Lato Bold (700)** ALL-CAPS with right-arrow `→`, 14.4px (~0.9rem), `0.04em` tracking, navy color, no underline. E.g., `DISCOVER OUR STORY →`, `VIEW FEATURED CLUB EVENTS →`, `EXPLORE MEMBERSHIP →`. Hover: arrow nudges 4px right.
- **CTA weight rule.** Pill buttons use Lato **Regular 400**; inline text-link CTAs (with arrow) use Lato **Bold 700**. Same `0.04em` tracking on both.
- **Transitions** — 200ms ease on color and transform. No scale animations on hover — buttons are calm.

### Cards & Containers

- **Event Card** (`card-event`). Cream tile, 8px corners. Navy category pill top-left (e.g., `DINING`, `FITNESS & WELLNESS`, `KIDS`), a date in Lato (month + day on two lines), and an event title in Lato Bold. Carousel on the home page.
- **Dining / Retail Card** (`card-dining`, zigzag grid). Two-column row, alternating image-left/image-right. The image side is full-bleed photo (no padding, no rounding); the text side sits on cream with an eyebrow label (teal or rouge), an oversized Noto Serif Italic venue name, two short body lines, and a `READ MORE` + `VIEW MENU` button pair.
- **Service / Feature Card** (`card-service`). White tile on cream, no shadow, no border; 8px corners, 32–48px internal padding. Three of these sit in a row inside the "Services" navy CTA band on the home page.
- **FAQ Item** (`faq-item`). Cream background, navy `+` toggle on the right, Lato Bold question text. Expanded state reveals a thin 1px navy separator above the answer (Lato Light body).
- **Stats Counter** (`stats-number` + `stats-label`). No card chrome. A giant Noto Serif Light Italic number in *rouge* `#DF4661` (e.g., `11,000+`) with a navy Lato ALL-CAPS label beneath (`MEMBERS`).
- **Testimonial Card**. Photo-led card, white Noto Serif Light Italic pull-quote, member name in Lato Regular at the bottom, `WATCH MORE →` CTA. Carousel of 4 on `/home`.

### Navigation

- **Desktop XL (1440px+)** — full-width navy `#001E62` bar at the top of the viewport above the hero (at 1680px+), or a floating navy pill bar overlaid on the hero (1440–1679px). All 8 links visible, eagle crest logo centered between left group (Home, Dining & Retail, Fitness & Wellness, Kids) and right group (Private Events & Catering, Membership, What's On, Member Login CTA).
- **Desktop L (1200–1439px)** — same floating navy pill, narrower. All links remain visible.
- **Tablet (768–1199px) and Mobile (320–767px)** — hamburger menu; centered eagle logo, 48×48 hamburger icon at right, links hidden behind tap.
- **Link styling** — Lato Regular 0.85rem, cream `#F5F4F2`, ALL CAPS, `0.04em` tracking. Active page: thin 2px underline. Hover: underline animates left-to-right.
- **Sticky behavior** — nav remains fixed on scroll, with a subtle background opacity increase as page scrolls past hero.

### Footer

- Full-bleed navy `#001E62` block at the bottom of every page.
- **Left column** — eagle crest logo (white), club address `10 Claymore Hill Singapore, 229573`, `Tel: +65 6737 3411`, `Email: info@amclub.org.sg`.
- **Three link columns** in `rgba(255, 255, 255, 0.77)`:
  1. **Explore the Club** — Dining & Retail, Fitness & Wellness, Kids, Private Events & Catering, Membership, Events Calendar, About Us, Club News, Gallery, Advertising & Sponsorships, Contact Us
  2. **Member** — Login, Reciprocal Clubs, Refer a Friend, Eagles Reward Program
  3. **Legal** — Club Constitution, Club By-Laws, Data Protection, Privacy Statement
- Bottom bar: `© 2025 The American Club Singapore® All rights reserved.` in Lato Regular 0.75rem at reduced opacity.

### Forms & Inputs

Marketing pages are largely form-free. Where inputs appear (enquiry form):

- White background, 1px charcoal border, Lato Regular text.
- Focus state: 2px navy `#001E62` border, no glow/shadow.
- Labels above inputs in Lato Bold 0.9rem.
- Submit button: `button-primary`, full-width on mobile.

### Icons

Two distinct icon roles, two distinct sizes:

- **CTA arrow icons** (the `→` glyph trailing inline-arrow CTAs like `READ MORE`, `VIEW MENU`, `DISCOVER OUR STORY`): outer SVG **24×24**, with the actual stroke art occupying roughly **10.5×10.5** inside that viewBox — i.e. small icon, generous padding. The padding is intentional: it gives the arrow visual breathing room next to the bold all-caps label and keeps the click-target hit area large without scaling the visual mark. Default stroke-width 1.5, color `accent` (`#DF4661`) on light surfaces and `secondary` (`#6BBBAE`) on dark.
- **Category / type icons** (the small green `CAFE`, `LOUNGE`, `RESTAURANT` glyphs that sit beside the cuisine label on dining cards and the equivalent badges on facility/event-space cards): rendered SVG **26×26**, full-fill — the icon art occupies the entire box. Color is `secondary` (`#6BBBAE`) at 70% opacity to harmonize with the navy label without competing.
- **Other utility icons** (clock, phone, mail, calendar, map-pin in cards/footer): same 24×24 outer as CTAs, sized contextually by the consuming component.
- **Source** — all icons are SVG. Multi-color icons are not used. Stroke is always `currentColor` so the parent's text-color drives the icon color.

### Image Treatment

- **Photography is the hero.** Hero images, card images, and feature images all use full-bleed lifestyle photography — families, members dining, kids in pools, members at the gym.
- **No rounding on hero/card images.** Square corners preserve the editorial feel.
- **No filters / no overlays** except on hero text-bearing images, where navy translucent `rgba(0, 29, 97, 0.75)` is laid over the bottom 40% to anchor the H1.
- **Aspect ratios** — 16:9 hero, 4:3 dining/event cards, 1:1 team grid, 3:2 default.
- **Placeholder notice** — the Framer prototype currently uses placeholder imagery. Marketing to supply final shots before launch.

### Trust & Social Proof

- Member video testimonials with name, pull-quote, and `WATCH MORE` CTA (carousel of 4: Ronald Williams, Sarah Grey, Matthew Hallen, Joseph Gunner).
- Stats counters reinforce heritage: `11,000+ Members`, `90+ Nationalities`, `77+ Years of Heritage`.
- No customer logos, no review stars, no badges — the club's reputation is the proof.

## Do's and Don'ts

### Do

- Use **Cream `#F5F4F2`** as the page background, not pure white.
- Set H1 and H2 in **Noto Serif Italic** with negative letter-spacing — italic is mandatory.
- Use **SemiBold 600** italic for hero H1 only; **ExtraLight 200** italic for section display titles; **Light 300** italic for mid-size headlines (stats, FAQ, pull-quotes).
- Make every button a **full pill** (`rounded.full`) in **Navy `#001E62`** with white ALL-CAPS Lato label — except the hero primary, which inverts to a white pill with navy label.
- Reserve **Teal `#6BBBAE`** and **Rouge `#DF4661`** for small ALL-CAPS eyebrow labels only — with one exception: stats numbers may render in rouge at display size.
- Treat **photography as the centerpiece** — full-bleed, square corners, no filters.
- Use **ALL CAPS + 0.04em tracking** on every CTA, link, nav item, and eyebrow — formality through typography.
- Keep section padding **generous** (96–128px vertical) — cream space is not wasted space.
- Use the **navy footer and one navy CTA band per page** as visual anchors.
- Maintain the **floating navy pill nav** at Desktop L+ with the eagle crest centered between left/right link groups.

### Don't

- Use **pure white `#FFFFFF`** as the page background — it strips the warmth out of the design.
- Set headings in **upright (non-italic) Noto Serif** — the italic axis IS the brand.
- Use **rounded corners on hero images, card images, or full-bleed bands** — sharp corners are editorial, rounded corners read as SaaS.
- Introduce **a third accent color** beyond Teal and Rouge — the palette is locked.
- Apply **Teal or Rouge to buttons, links, or background fills** — they are text-only colors (stats number is the one display-size exception for rouge).
- Add **gradients, glows, glassmorphism, or backdrop-blur** — depth comes from photography.
- Use **drop shadows on cards** — separate cards through white-on-cream contrast and whitespace instead. The only shadow in the system is the soft lift on the white hero CTA.
- Crowd CTAs — most sections get **one primary CTA**; only dining cards get a second.
- Use **Bold or Regular weights on Noto Serif** — stay within ExtraLight/Light/SemiBold Italic.
- Set body text in **Regular by default** — Lato Light (300) is the preferred body weight.
- Replace the **eagle crest logo** with a wordmark — the crest is the brand identity.

## Responsive Behavior

### Breakpoints

| Name | Range | Nav Layout | Key Changes |
|---|---|---|---|
| **Mobile** | 320–767px | Hamburger | Single column, stacked zigzag becomes vertical, hero H1 drops to ~2.0rem |
| **Tablet** | 768–1199px | Hamburger | 2-column begins to appear, hero H1 ~2.6rem, eagle crest centered with hamburger right |
| **Desktop L** | 1200–1439px | Floating navy pill | All 8 nav links visible, full zigzag layouts, hero H1 ~3.0rem |
| **Desktop XL** | 1440px+ | Full-width navy bar (1680+) or floating pill (1440–1679) | Lobby ceiling visible behind nav at 1680+, hero H1 at full 5.6rem |

### Touch Targets

- All pill buttons: minimum 44px height (12px vertical padding + label) — meets WCAG 2.5.5.
- Hamburger icon: 48×48 tap target.
- Nav links on mobile drawer: 56px row height with full-width tap zone.
- FAQ accordion rows: 64px minimum, full-width tap.

### Collapsing Strategy

- **Navigation** — Floating navy pill (Desktop L+) → centered eagle + hamburger (Tablet/Mobile).
- **Zigzag card grids** — image-left/image-right alternation (Desktop) → image-on-top, text-below stack (Tablet/Mobile).
- **Feature grid (3-column)** — 3 across (Desktop) → 2 across (Tablet) → 1 across (Mobile).
- **Hero text** — 5.6rem → 3.0rem → 2.6rem → 2.0rem. Line-height held at 1.0–1.1.
- **Stats counter** — 3-across (Desktop) → 1-across stacked (Mobile). Each stat keeps its giant Noto Serif size.
- **Footer** — 4-column (Desktop) → 2-column (Tablet) → 1-column accordion (Mobile).
- **Section padding** — Reduces proportionally: 128px desktop → 96px tablet → 64px mobile.

### Image Behavior

- Hero images use `object-fit: cover` with focal point biased to subjects (faces, family groupings).
- Card images scale within their container, maintaining aspect ratios. No art-direction crops swap across breakpoints.
- Lazy-load all below-the-fold imagery.
- Serve WebP with JPEG fallback; `srcset` at 1x/2x.

### Reference Screenshots

| Viewport | File |
|---|---|
| 1680px (XL Desktop) | `screenshots/breakpoints/nav-1680-desktop-xl.png` |
| 1440px (Desktop XL) | `screenshots/breakpoints/nav-1440-desktop.png` |
| 1280px (Desktop L) | `screenshots/breakpoints/nav-1280-desktop-small.png` |
| 1200px (Desktop L) | `screenshots/breakpoints/nav-1200-check.png` |
| 1024px (Tablet) | `screenshots/breakpoints/nav-1024-tablet-landscape.png` |
| 768px (Tablet) | `screenshots/breakpoints/nav-768-tablet-portrait.png` |
| 375px (Mobile) | `screenshots/breakpoints/nav-375-mobile.png` |

Full-page captures at `screenshots/breakpoints/full-*.png`.

## Agent Prompt Guide

### Quick Color Reference

- Page background → **Cream** `#F5F4F2` (`colors.neutral`)
- Primary brand / nav / footer / buttons / links → **Navy** `#001E62` (`colors.primary`)
- Hover navy → **Navy Dark** `#00164A` (`colors.primary-strong`)
- Card surface on cream → **White** `#FFFFFF` (`colors.surface`)
- Body text on cream → **Charcoal** `#3F4452` (`colors.on-neutral`)
- Body text on navy → `rgba(255, 255, 255, 0.77)`
- Hero image overlay → `rgba(0, 29, 97, 0.75)` (solid ≈ `colors.primary-overlay`)
- Eyebrow accent A (Services, Moments) → **Teal** `#6BBBAE` (`colors.secondary`)
- Eyebrow accent B (dining categories) → **Rouge** `#DF4661` (`colors.tertiary`)
- Stats numerals → **Rouge** `#DF4661` at Noto Serif Light Italic

### Quick Typography Reference

- Hero H1 → `typography.display-hero` (Noto Serif SemiBold 600 Italic, 5.6rem, `-0.04em`, on dark photo)
- Section H1/H2 → `typography.headline-lg` (Noto Serif ExtraLight 200 Italic, 3.7rem, `-0.04em`, navy on cream)
- FAQ title / stats number / pull-quote → `typography.headline-md` (Noto Serif Light 300 Italic, 2.4rem, `-0.03em`)
- Feature-card title / testimonial quote → `typography.headline-sm`
- Body copy → `typography.body-md` (Lato Light 300, 1.1rem / 1.4)
- Eyebrow / link-caps → ALL CAPS, `0.04em` tracking, Lato Bold 700, 0.9rem

### Example Component Prompts

- "Build a hero with a full-bleed lifestyle photograph (square corners), a navy translucent overlay on the bottom 40% (`rgba(0, 29, 97, 0.75)`), an H1 in Noto Serif SemiBold Italic at 5.6rem with `-0.04em` letter-spacing in cream reading *A Home Away From Home*, a 1.3rem Lato Regular subhead below, and a **white pill CTA** (`button-hero-invert`) labeled `REQUEST FOR A CLUB TOUR` at the bottom."
- "Create a dining venue card row in a zigzag grid: left half is a full-bleed restaurant photo (no rounding), right half is on cream `#F5F4F2` with a teal or rouge ALL-CAPS eyebrow, a Noto Serif ExtraLight Italic venue name at 2.4–3.7rem, a 2-line Lato Light description, and two stacked navy pill buttons (`READ MORE` / `VIEW MENU`)."
- "Design a 3-up stats counter row on cream. Each column is a giant Noto Serif Light Italic number in **rouge** `#DF4661` (e.g., `11,000+`) with a navy Lato ALL-CAPS label beneath (`MEMBERS`). No card chrome, no shadows — typography and whitespace only."
- "Build a floating top nav pill: navy `#001E62` background, full pill radius, cream ALL-CAPS Lato Regular links at 0.85rem with `0.04em` tracking, eagle crest centered between left group (Home, Dining & Retail, Fitness & Wellness, Kids) and right group (Private Events & Catering, Membership, What's On), and a `MEMBER LOGIN` pill in `#00164A` at the right end. Soft `rgba(0, 0, 0, 0.08) 0px 4px 16px` shadow underneath."
- "Create a full-bleed navy `#001E62` CTA band with a centered Noto Serif ExtraLight Italic H2 at 3.7rem in cream reading *Savor the Experience*, a 1.1rem `rgba(255,255,255,0.77)` Lato Light subhead, and a single white pill CTA labeled `BOOK A CLUB TOUR`."
- "Build a 4-column footer on full-bleed navy `#001E62` with the eagle crest + address + phone + email in the left column, and three link columns (Explore the Club, Member, Legal) in `rgba(255, 255, 255, 0.77)` Lato Regular ALL CAPS at 0.85rem."

### Iteration Guide

When refining screens generated against this design system:

1. **Verify the italic.** If a heading is upright Noto Serif, it's wrong — every H1/H2/H3 in the system is italic.
2. **Check the weight.** Hero H1 = 600, section display = 200, mid-headline = 300. Noto Serif should never appear at 400 (Regular) or 700 (Bold).
3. **Check the background color.** `#FFFFFF` on a full-page background is a regression — swap to `#F5F4F2` cream.
4. **Confirm button shape.** Every button is `rounded.full` (999px). Anything less round breaks the voice.
5. **Confirm the hero CTA inverts.** On hero photography the primary CTA is a **white** pill with navy text, not a navy pill.
6. **Audit accent color usage.** Teal and Rouge should appear only as eyebrow labels — plus Rouge at display size on stats numerals. Any other use is a regression.
7. **Look for shadows.** Drop-shadows on cards are wrong. The system has exactly two shadows: the nav pill ambient, and the hero white-CTA lift.
8. **Caps-and-tracking check.** Every CTA, nav link, eyebrow, and link arrow is ALL CAPS with `0.04em` letter-spacing. Mixed-case CTAs are a regression.
9. **Photography first.** If a section is text-only on cream with no adjacent photo, ask whether it should pair with imagery — the site rarely has copy-only blocks outside FAQ.
10. **Antialiased smoothing.** Confirm `body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }` is in effect. Without it macOS Chrome's subpixel rendering makes Lato Light and Noto Serif ExtraLight read heavier than the design intends — the headline appears thicker than the Framer prototype.
11. **Hero subhead is sans.** If the H1 subhead under the hero pill is rendering in Noto Serif italic, it's wrong. The H1 stays serif italic; everything below it (subhead, CTA label) is Lato.
12. **CTA weight by shape.** Pill CTAs use Lato Regular 400; inline-arrow CTAs use Lato Bold 700. Both keep `0.04em` tracking.

---

## Appendix A — Site-Specific Implementation Data

> The sections above define the design system. The data below is site-specific build context preserved from the designer handover.

### Navigation Map

| Position | Label | Path |
|---|---|---|
| Left 1 | Home | `/home` |
| Left 2 | Dining & Retail | `/dining` |
| Left 3 | Fitness & Wellness | `/fitness` |
| Left 4 | Kids | `/kids` |
| Right 1 | Private Events & Catering | `/event-spaces` |
| Right 2 | Membership | `/membership` |
| Right 3 | What's On | `/whats-on` |
| CTA | Member Login | `https://amclub-portal.iontone.com/#/login` (external SSO) |

Additional page: `/about` — linked from footer only, not main nav.

### Home Page Section Inventory (observed on `/home`)

| # | Section | Eyebrow | Headline Type | Primary CTA |
|---|---|---|---|---|
| 1 | Hero | — | `display-hero` on navy overlay | `REQUEST FOR A CLUB TOUR` (white pill) |
| 2 | About Us | `ABOUT US` (charcoal) | `headline-lg` | `DISCOVER OUR STORY →` |
| 3 | Stats Counter | — | `headline-md` rouge numerals | — |
| 4 | Events Carousel | `EVENTS` (charcoal) | `headline-lg` | `VIEW FEATURED CLUB EVENTS →` |
| 5 | Services (navy band) | `SERVICES` (teal) | `headline-lg` cream on navy | `EXPLORE MEMBERSHIP →` |
| 6 | Experience zigzag | `EXPERIENCE` (charcoal) | `headline-lg` | Navy pills per card |
| 7 | Moments / Social | `MOMENTS` (teal) | `headline-lg` | `FOLLOW OUR SOCIALS →` |
| 8 | Testimonials carousel | — | `headline-sm` pull-quote on navy | `WATCH MORE →` |
| 9 | FAQ | `FAQ` (charcoal) | `headline-md` | `VIEW ALL FAQ →` |
| 10 | Enquiries / Footer | `ENQUIRIES` (navy) | — | — |

### Component Inventory (across site)

| Component | Count | Pages |
|---|---|---|
| Hero | 8 | All pages |
| Card Grid | 9 | Home, Dining, Fitness, Kids, Events, Membership, What's On |
| CTA Banner | 10 | All except About |
| Feature Grid | 5 | Home, About, Kids, Events, Membership |
| Text Block | 3 | Home, About |
| Stats Counter | 2 | Home, About |
| FAQ | 2 | Home, Membership |
| Tabs | 2 | Home, What's On |
| Testimonial | 1 | Home |
| Team Grid | 2 | About |

### External Resources

| Resource | URL |
|---|---|
| Design Prototype (Framer) | https://tactesting.framer.website |
| Designer Handover (Craft) | https://amclub.craft.me/handover |
| Site IA (Whimsical) | https://whimsical.com/tac-website-ia-Bj1APZvZ8P2iE2CZ3oaYLR |
| DESIGN.md spec + linter | https://github.com/google-labs-code/design.md |
| Assets ZIP (icons + images) | Attached in Craft handover (~35 MB) |

### Asset Notes

- Icons: SVG.
- Images: WebP / PNG / JPG, optimized for web.
- **Placeholder notice** — Framer prototype currently uses placeholder photography. Marketing to supply final imagery before production launch.

### IA Reference

Information architecture on [Whimsical](https://whimsical.com/tac-website-ia-Bj1APZvZ8P2iE2CZ3oaYLR) (last updated Oct 9, 2025 per Craft handover "Latest IA" subpage).
