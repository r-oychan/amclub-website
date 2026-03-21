# TAC Website Design Reference

> Source: [Designer Handover (Craft)](https://amclub.craft.me/handover) | Handover Date: Mar 9, 2026 | Design Contact: Coin@maynami.com

## 1. Breakpoints

The site uses **4 breakpoints** as specified by the designer, confirmed against the Framer prototype CSS.

| Breakpoint | Range | CSS Media Query | Nav Layout |
|---|---|---|---|
| **Mobile** | 320px - 767px | `max-width: 767px` | Hamburger menu (centered eagle logo + hamburger icon) |
| **Tablet** | 768px - 1199px | `max-width: 1199.98px` | Hamburger menu (same mobile nav component, wider) |
| **Desktop L** | 1200px - 1439px | `min-width: 1200px and max-width: 1439.98px` | Floating dark navy bar with all nav links visible |
| **Desktop XL** | 1440px+ | `min-width: 1440px` | Full-width integrated top bar (non-floating at 1680+) |

### Nav Layout Details

**Desktop XL (1440px+)**
- At 1680px+: Nav sits in a full-width strip at the very top with the lobby ceiling visible behind it
- At 1440-1679px: Floating dark navy bar overlaid on the hero image
- All 8 links visible: Home, Dining & Retail, Fitness & Wellness, Kids | Private Events & Catering, Membership, What's On + Member Login CTA
- Logo centered between left/right nav groups

**Desktop L (1200px - 1439px)**
- Same floating dark navy bar as Desktop XL (narrower)
- All 8 links still visible
- Transition from Desktop XL is primarily a width adjustment

**Tablet (768px - 1199px)**
- Switches to mobile nav component (`data-framer-name="mobile closed"`)
- Centered eagle logo, hamburger icon on the right (48x48)
- Menu items hidden (opacity: 0, overflow: clip), revealed on hamburger tap
- Full-width layout

**Mobile (320px - 767px)**
- Same hamburger nav as Tablet
- Fluid width scaling, no structural change from Tablet

### Breakpoint Screenshots

| Viewport | File |
|---|---|
| 1680px (XL Desktop) | `screenshots/breakpoints/nav-1680-desktop-xl.png` |
| 1440px (Desktop XL) | `screenshots/breakpoints/nav-1440-desktop.png` |
| 1280px (Desktop L) | `screenshots/breakpoints/nav-1280-desktop-small.png` |
| 1200px (Desktop L) | `screenshots/breakpoints/nav-1200-check.png` |
| 1024px (Tablet) | `screenshots/breakpoints/nav-1024-tablet-landscape.png` |
| 768px (Tablet) | `screenshots/breakpoints/nav-768-tablet-portrait.png` |
| 375px (Mobile) | `screenshots/breakpoints/nav-375-mobile.png` |

Full-page screenshots also captured at: `screenshots/breakpoints/full-*.png`

---

## 2. Typography

Two complementary typefaces: serif for headings, sans-serif for body/UI.

- **Heading font:** Noto Serif (Google Fonts)
- **Body font:** Lato (Google Fonts)

### Text Styling Hierarchy

| Element | Usage | Font | Size / Line Height | Weight | Letter Spacing |
|---|---|---|---|---|---|
| H1 | Page Header | Noto Serif | 3.2rem / 1.0 | Light Italic | -0.04em |
| H2 (Serif) | Section Title | Noto Serif | 2.2rem / 1.2 | Light Italic | -0.02em |
| H2 (Sans) | Section Title | Lato | 1.5rem / 1.2 | Bold | -0.02em |
| H3 | Paragraph Title | Lato | 1.1rem / 1.4 | Bold | 0 |
| Body | Body Paragraph | Lato | 1.2rem / 1.4 | Light / Regular | 0 |
| Small | Small Caption | Lato | 0.8rem / 1.6 | Regular | 0 |
| CTA (Link) | Text Link (ALL CAPS) | Lato | 0.9rem / 1.4 | Bold | 0.04em |
| CTA (Button) | Button Label (ALL CAPS) | Lato | 0.85rem / 1.1 | Regular | 0.04em |

---

## 3. Color Palette

| Name | Hex | Usage |
|---|---|---|
| **Primary (Navy)** | `#001E62` | CTAs, Links, Page Title, Nav background |
| **Primary Dark** | `#00164A` | Darker navy variant |
| **Primary Light** | `rgba(0, 29, 97, 0.75)` | Transparent navy overlay |
| **Secondary (Teal)** | `#6BBBAE` | Accents |
| **Secondary (Rouge)** | `#DF4661` | Accents |
| **Dark (Charcoal)** | `#3F4452` | Text, Headings |
| **Light (Cream)** | `#F5F4F2` | Backgrounds |
| **White** | `#FFFFFF` | — |
| **Text Light** | `rgba(255, 255, 255, 0.77)` | Light text on dark backgrounds |

---

## 4. Navigation Structure

8 pages in the main nav:

| Position | Label | Path |
|---|---|---|
| Left 1 | Home | `/home` |
| Left 2 | Dining & Retail | `/dining` |
| Left 3 | Fitness & Wellness | `/fitness` |
| Left 4 | Kids | `/kids` |
| Right 1 | Private Events & Catering | `/event-spaces` |
| Right 2 | Membership | `/membership` |
| Right 3 | What's On | `/whats-on` |
| CTA | Member Login | `#` (external) |

Additional page: `/about` (linked from footer, not main nav)

---

## 5. Component Inventory

Reusable components identified across the site:

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

---

## 6. Assets & External Links

| Resource | URL |
|---|---|
| Design Prototype (Framer) | https://tactesting.framer.website |
| Designer Handover | https://amclub.craft.me/handover |
| Site IA (Whimsical) | https://whimsical.com/tac-website-ia-Bj1APZvZ8P2iE2CZ3oaYLR |
| Assets ZIP (icons + images) | Attached in Craft handover (35 MB) |

### Asset Notes
- Icons: SVG format
- Images: WebP/PNG/JPG, optimized for web
- **Placeholder notice:** Design prototype currently has placeholder images. Marketing team to provide final imagery before launch.

---

## 7. Footer

Dark navy footer with:
- Club address: 10 Claymore Hill Singapore, 229573
- Phone: +65 6737 3411
- Email: info@amclub.org.sg

Three link columns:
1. **Explore the Club:** Dining & Retail, Fitness & Wellness, Kids, Private Events & Catering, Membership, Events Calendar, About Us, Club News, Gallery, Advertising & Sponsorships, Contact Us
2. **Member:** Login, Reciprocal Clubs, Refer a Friend, Eagles Reward Program
3. **Legal:** Club Constitution, Club By-Laws, Data Protection, Privacy Statement

---

## 8. Latest IA Notes

> From Craft handover subpage "Latest IA" (updated Oct 9, 2025)

The information architecture serves as the framework for content presentation, guiding fundamental user journeys. Full IA diagram available on [Whimsical](https://whimsical.com/tac-website-ia-Bj1APZvZ8P2iE2CZ3oaYLR).
