# Site Specs

> Source of truth for page structure, CMS bindings, component inventory, and infrastructure.
> Update this file whenever a page, component, content type, or infra resource changes.

---

## Pages

| Route | Page Component | Strapi Type | Content Type Name | CMS Wired |
|---|---|---|---|---|
| `/home` | `HomePage.tsx` | singleType | `home-page` | 🟡 |
| `/about` | `AboutPage.tsx` | singleType | `about-page` | 🟡 |
| `/dining` | `DiningPage.tsx` | singleType | `dining-page` | 🟡 |
| `/fitness` | `FitnessPage.tsx` | singleType | `fitness-page` | 🟡 |
| `/kids` | `KidsPage.tsx` | singleType | `kids-page` | 🟡 |
| `/event-spaces` | `EventSpacesPage.tsx` | singleType | `event-spaces-page` | 🟡 |
| `/membership` | `MembershipPage.tsx` | singleType | `membership-page` | 🟡 |
| `/whats-on` | `WhatsOnPage.tsx` | singleType + collection | `whats-on-page` + `event` (filtered by `event-category`) | 🟡 |
| `/whats-on/:slug` | `EventDetailPage.tsx` | collection | `event` (by slug) | 🟡 |
| `/home-sub/news` | `NewsPage.tsx` | singleType + collection | `news-page` + `news-article` | 🟡 |
| `/home-sub/gallery` | `GalleryPage.tsx` | singleType + collection | `gallery-page` + `gallery-album` | ✅ |
| `/home-sub/contact-us` | `ContactUsPage.tsx` | — | static (`data/contactUs.ts`) — Map + Getting Here + Outlet Operating Hours tabs | ❌ |
| `/:section/:slug` | `VenueDetailPage.tsx` | collection | `restaurant` / `venue` / `facility` | ✅ |

> **CMS Wired** = page meets all four conditions in CLAUDE.md → "Workflow: CMS Wiring → Definition of Done". Flip ❌ → ✅ only after the deployed URL renders the deployed Strapi entry. 🟡 = page fetches from Strapi single-type but still carries local fallback constants / inline-hardcoded section components / Framer CDN URLs. Header nav (`useHeaderData`) is wired, though it is not a page.

### Outstanding migration gaps (PR-2 scope)

For every 🟡 page above, the page component still contains content that bypasses the CMS. The list below is the strict-CMS punch list — when all entries are addressed, every page flips to ✅.

| Page | Gap | Where |
|---|---|---|
| HomePage | `MOMENTS_FALLBACK` (4 hardcoded social cards w/ `/images/social/*` refs) | `frontend/src/pages/HomePage.tsx:197-235` |
| HomePage | `DUMMY_FAQ_ANSWERS` regex-keyed fallback answers | `frontend/src/pages/HomePage.tsx:162-193` |
| HomePage | `AMCLUB_INSTAGRAM` constant | `frontend/src/pages/HomePage.tsx:195` |
| HomePage | `CTA_OVERRIDES` patch map | `frontend/src/pages/HomePage.tsx:123-133` |
| AboutPage | `COLLAGE_FALLBACK` (5 framerusercontent.com URLs) | `frontend/src/pages/AboutPage.tsx:136-142` |
| AboutPage | `CTA_OVERRIDES` patch map | `frontend/src/pages/AboutPage.tsx:73-78` |
| DiningPage | `CTA_OVERRIDES` patch map | `frontend/src/pages/DiningPage.tsx:69-74` |
| DiningPage | `HIDDEN_FROM_GRID` constant | `frontend/src/pages/DiningPage.tsx:127` |
| FitnessPage | `CTA_OVERRIDES` patch map | `frontend/src/pages/FitnessPage.tsx:55-60` |
| KidsPage | `CTA_OVERRIDES` patch map | `frontend/src/pages/KidsPage.tsx:59-64` |
| KidsPage | `LEARNING_OVERRIDES` (2 cards) | `frontend/src/pages/KidsPage.tsx:178-187` |
| KidsPage | `fallbackPartyPackages` (3 items w/ Azure blob URLs) | `frontend/src/pages/KidsPage.tsx:127-164` |
| KidsPage | `<QuadSection>` inline-hardcodes 3 Quad venues | `frontend/src/components/kids/QuadSection.tsx` |
| KidsPage | `<ChildSafetySection>` inline-hardcodes heading + 3 features | `frontend/src/components/kids/ChildSafetySection.tsx` |
| MembershipPage | `CTA_OVERRIDES` + `PROGRAM_CARD_OVERRIDES` | `frontend/src/pages/MembershipPage.tsx:50-81` |
| MembershipPage | `FALLBACK_COMMUNITY_IMAGES` (4), `FALLBACK_BENEFIT_ICONS` (6 SVGs), `FALLBACK_FIND_MEMBERSHIP_IMAGE` | `frontend/src/pages/MembershipPage.tsx:92-106` |
| EventSpacesPage | `overrideHref()` + `TOUR_FORM_URL` | `frontend/src/pages/EventSpacesPage.tsx:45-52` |
| WhatsOnPage | Fallback heading "Featured Club Events" + empty-state copy | `frontend/src/pages/WhatsOnPage.tsx:163,174` |
| GalleryPage | Hardcoded UI chrome ("Gallery", "Load More", "View Album") | `frontend/src/pages/GalleryPage.tsx:86,118,191` |
| NewsPage | Hardcoded UI chrome ("Club News" fallback, "Load More", "Read More", breadcrumb parent) | `frontend/src/pages/NewsPage.tsx:67,76,103,120` |
| ContactUsPage | `TalkToUsBanner` component carries hardcoded defaults (heading, label, JotForm URL) | `frontend/src/components/contact/TalkToUsBanner.tsx:11-14` |
| ContactUsPage | `data/contactUs.ts` static outlet/hours/address data | `frontend/src/data/contactUs.ts` |

### Outstanding media gaps (PR-2 scope)

Frontend code references **22 unique `framerusercontent.com` URLs** + several `/images/social/*` local-public files that should be Strapi-uploaded so admins can swap them. Specifically:

| Reference | Source | Target (planned) |
|---|---|---|
| Header/Footer logo `jYpgpsEhknSxMZJWxquvCab3o.webp` | `Header.tsx`, `Footer.tsx`, `useHeaderData.ts` | `header.logo` (already a media field, just needs upload) |
| Header burger background `6mcf62RlDfRfU61Yg5vb2pefpi4.png` | `Header.tsx:171` | New `header.menuIcon` media field |
| Header nav dropdown images (3) | `useHeaderData.ts:151,178,204` | `nav-column.image` (already a field) |
| DetailHeroBanner fallback `uA8oZioX84LwYdHwDPogQJhk13I.jpg` | `DetailHeroBanner.tsx:2` | New `site-settings.detailHeroFallback` media field |
| About `COLLAGE_FALLBACK` (5) | `AboutPage.tsx:136-142` | `about-page.collage.images` (already a field; just seed the upload) |
| Reciprocal Clubs hero + 5 logos | `ReciprocalClubsPage.tsx:12-...` | Already-defined fields on the (yet-unsewn) `reciprocal-clubs-page` single type |
| `data/subpages.ts` (14 framer URLs) | static data file | Migrated when each subpage moves into its own CMS single-type or component |
| `frontend/public/images/social/*.{jpg,mp4}` (4 pairs) | `HomePage.tsx` `MOMENTS_FALLBACK` | Removed when `MOMENTS_FALLBACK` is removed; canonical lives in `media/social/` and is already seeded to `testimonial` entries |

### Local `media/` directory inventory

After PR-1 cleanup:

| Folder | Seeded by | Notes |
|---|---|---|
| `media/about/` | `seed-about-page.mjs` | 61 files: GC portraits, mgmt, awards, heritage |
| `media/dining/` | `seed-dining-page.mjs`, `seed-dining-promotions.mjs` | restaurants, promotions |
| `media/event-spaces/` | `seed-event-spaces-page.mjs` | 28 files |
| `media/fitness/` | `seed-fitness-page.mjs`, `seed-facilities.mjs` | 47 files |
| `media/gallery/` | `seed-gallery.mjs` | 23 albums (subfolders with spaces — defer rename) |
| `media/hero/`, `media/home/` | `seed-home-page.mjs` | home page hero/services/experience/about/events |
| `media/icons/` | **(not yet seeded — PR-2)** | cuisine SVGs, dresscode, promo-accent — currently served from `frontend/public/icons/` |
| `media/kids/`, `media/pages/kids/` | `seed-kids-page.mjs`, `seed-facilities.mjs` | hangout/parties/packages |
| `media/logos/` | `seed-dining-page.mjs` | restaurant logos |
| `media/membership/` | `seed-membership-page.mjs`, `seed-membership-forms.mjs` | hero, community, programs, forms (PDFs) |
| `media/news/` | **(partial — 6 cover images via `_manifest.txt` not yet wired to `news-article.image` — PR-2)** | local copies of legacy Framer cover images |
| `media/pages/` | varies | subfolder structure for new page-specific media |
| `media/promotions/`, `media/restaurants/`, `media/services/` | `seed-dining-page.mjs` | dining-page sub-blocks |
| `media/social/` | `seed-home-page.mjs` (SOCIAL_DIR) | 4 social posts (jpg + mp4); already seeded |
| `media/TAC-favicon/` | **(not Strapi-managed)** | favicons consumed by `frontend/public/` build copy |

Deleted in PR-1: `media/marketing/` (orphan, duplicate of `frontend/public/marketing/`), `media/membership-add/` (empty).

All page-typed entries use a `content` **dynamiczone** (block-based), populated by Strapi block components listed below.

---

## Block Components

| React Component | Strapi Block Component | Notes |
|---|---|---|
| `Hero.tsx` | `blocks.hero` | Single image, heading, subheading, CTA, variant field |
| `HeroCarousel.tsx` | `blocks.hero` (slides) | Uses `slides` repeatable + `autoPlayInterval` |
| `CardGrid.tsx` | `blocks.card-grid` | label, heading, cards array, optional CTA |
| `FeatureGrid.tsx` | `blocks.feature-grid` | Feature items with icon/image |
| `ThreeColGrid.tsx` | `blocks.card-grid` | 3-column layout variant of card-grid |
| `TextBlock.tsx` | `blocks.text-block` | Rich text / prose |
| `AboutSection.tsx` | `blocks.text-block` | Text + image variant |
| `StatsCounter.tsx` | `blocks.stats-counter` | `stat-item` repeatables (label, value) |
| `TabsSection.tsx` | `blocks.tabs-section` | Tab labels + content per tab |
| `TestimonialSlider.tsx` | `blocks.testimonial-slider` | Pulls from `testimonial` collection |
| `FaqAccordion.tsx` | `blocks.faq-section` | Pulls from `faq-item` collection |
| `FaqAnswerBlocks.tsx` | n/a | Renders Strapi v5 `blocks` content for FAQ answers (paragraphs, headings, lists, links, inline images) |
| `FaqPage.tsx` (page) | `faq-page` + `faq-category` + `faq-item` | `/faq` route — groups items by category, one accordion section per category |
| `TeamGrid.tsx` | `blocks.team-grid` | Pulls from `committee-member` collection |
| `CtaBanner.tsx` | `blocks.cta-banner` | Heading, subtext, primary + secondary CTA |
| `OverlaySection.tsx` | `blocks.overlay-section` (or `blocks.cta-banner` + sibling media field) | Full-bleed image with overlay text panel |
| `MembershipCommunityCollage.tsx` | `blocks.cta-banner` (heading/body/ctas) + `membership-page.joinCommunityImages` (media[]) | 4-image scattered collage with centered heading + CTA. Used by `MembershipPage`. |
| `MembershipPrograms.tsx` | `blocks.card-grid` (cards w/ image + heading + description + cta) | 3-column dark-navy radial gradient with mint divider + arrow CTA. Used by `MembershipPage`. |

### Detail Page Components (venue/restaurant/facility detail)

| React Component | Strapi Source | Notes |
|---|---|---|
| `DetailHeroBanner.tsx` | `restaurant` / `venue` / `facility` `.image` | Full-width hero from record |
| `DetailBreadcrumb.tsx` | static + route params | Section label + item name |
| `DetailSection.tsx` | `.description`, `.content` | Prose or blocks |
| `ContactRow.tsx` | `.contact` fields | Phone, email, address |
| `PhotoGallery.tsx` | `.gallery` (media[]) | Lightbox grid |

### Gallery Page Components

| React Component | Strapi Source | Notes |
|---|---|---|
| `GalleryPage.tsx` | `gallery-page` (single) + `gallery-album` (collection, sorted by `order`) | Hero band with centered "Gallery" italic title; 2-col cream cards (1-col below `lg`) — image with mint photo-count badge, eyebrow date, title, "View Album" CTA. Click any card opens shared `Lightbox`. Load More reveals 4 more albums per click. |
| `Lightbox.tsx` | takes `images: { url, alt? }[]`, `title?`, `onClose` | Full-screen portal modal with backdrop blur. Keyboard nav: Esc closes, Arrow Left/Right paginates. Click backdrop closes. Locks body scroll. Hides prev/next chrome when only 1 image. Reusable beyond gallery. |

### Contact Page Components

| React Component | Source | Notes |
|---|---|---|
| `MapGettingHere.tsx` | `data/contactUs.ts` `contactInfo` | Embedded Google Maps + Address / Operating Hours / Contact Details |
| `OutletOperatingHours.tsx` | `data/contactUs.ts` `outletGroups` | Pill tabs (5 categories) + masonry grid of cards. Each card has name + scheduled blocks (with optional `subtitle` like "Lunch"/"Dinner"). |
| `TalkToUsBanner.tsx` | static | Mint-to-navy radial-gradient CTA banner |

### Event Spaces Page Components

| React Component | Source | Notes |
|---|---|---|
| `PrivateEventPackages.tsx` | `EventSpacesPage` data | 3-up package cards (Wedding / Corporate / Parties): cream tile, image top, eyebrow lists, navy text-link CTA. Centered "Make an Enquiry" CTA above grid. |
| `DistinctiveEventSpaces.tsx` | `EventSpacesPage` data | Zigzag rows (Galbraith / Thinkspace / Bowling / Quad). Renders each row through the shared `OverlaySection` block (image + overlapping text panel). Exports `VenuePanelContent` so other pages can reuse the same panel layout. Accepts optional `panelBgImage` per row for image-backed panels. |
| `OffsiteCateringServices.tsx` | `EventSpacesPage` data | Heading + intro on cream, full-bleed navy band with 3 pillar cards (Service Styles / Culinary / Dietary), then Catering2Go sub-banner with white pill `ORDER NOW`. |

---

## Layout Components

| Component | Strapi Source | Notes |
|---|---|---|
| `Header.tsx` | singleType `header` | Nav items via `useHeaderData` hook. Floating (≥1200px) / hamburger (<1200px) |
| `Footer.tsx` | singleType `footer` | Contact block + `footer-column` repeatable |

---

## Strapi Content Types

### Single Types (one record per type)
| Name | API ID | Key Fields |
|---|---|---|
| home-page | `home-page` | title, content (dynamiczone), seo |
| about-page | `about-page` | title, content, seo |
| dining-page | `dining-page` | title, content, seo |
| fitness-page | `fitness-page` | title, content, seo |
| kids-page | `kids-page` | title, content, seo |
| event-spaces-page | `event-spaces-page` | title, content, seo |
| membership-page | `membership-page` | title, content, seo |
| whats-on-page | `whats-on-page` | title, content, seo |
| gallery-page | `gallery-page` | title, introHeading, introBody, heroImage, seo |
| faq-page | `faq-page` | title, introHeading, introBody, heroImage, seo |
| header | `header` | logo, navItems (nav-item[]), cta (shared.link) |
| footer | `footer` | contact (address, phone, email), columns (footer-column[]), logo |

### Collections (multiple records)
| Name | API ID | Key Fields |
|---|---|---|
| restaurant | `restaurant` | name, slug, description, image, gallery, contact, category, ctas |
| venue | `venue` | name, slug, description, image, gallery, capacity, contact, ctas |
| facility | `facility` | name, slug, description, image, gallery, section (fitness/kids/event), ctas |
| event | `event` | title, slug, date, time, location, dressCode, reservation, description, longDescription, image, category (→ event-category), featured, ctas (shared.link[]) |
| event-category | `event-category` | name, slug, displayOrder |
| testimonial | `testimonial` | quote, author, role, image |
| committee-member | `committee-member` | name, role, image, bio, order |
| faq-item | `faq-item` | question, slug, answer (blocks — supports inline images), category (enum, legacy), faqCategory (→ faq-category), order |
| faq-category | `faq-category` | name, slug, description, displayOrder, faqItems (oneToMany → faq-item) |
| gallery-album | `gallery-album` | title, slug, coverImage, **images (media[])**, date, photoCount, description, order. One album = one upload group; admins upload all photos for an event into the `images` field of that album entry. |

---

## Strapi Shared Components

| Component | Fields | Used In |
|---|---|---|
| `shared.link` | label, href, isExternal, variant (primary/secondary/outline/text) | CTAs everywhere |
| `shared.seo` | metaTitle, metaDescription, metaImage, canonicalURL | All page types |
| `shared.nav-item` | label, href, dropdown (nav-dropdown) | header |
| `shared.nav-dropdown` | label, href, columns (nav-column[]) | header nav |
| `shared.nav-column` | heading, links (shared.link[]), image, imageLink | header dropdown |
| `shared.hero-slide` | image, heading, subheading, cta | blocks.hero carousel |
| `shared.feature-item` | icon/image, heading, body | blocks.feature-grid |
| `shared.stat-item` | label, value | blocks.stats-counter |
| `shared.footer-column` | heading, links (shared.link[]) | footer |

---

## Animations

**Current state: no animation libraries.** All motion is CSS-only via Tailwind.

| Effect | Implementation | Used In |
|---|---|---|
| Scroll fade-in | `useScrollFadeIn` hook (IntersectionObserver + CSS transition) | Block sections |
| Scroll slide-in (overlay) | `useScrollFadeIn` + Tailwind `translate-x-12`/`-translate-x-12` | `OverlaySection.tsx` (image + panel slide toward center from opposite sides on scroll) |
| Nav transitions | CSS `transition` classes | Header mobile menu |
| Hero carousel | CSS / JS interval (no library) | `HeroCarousel.tsx` |

> If adding animations: prefer **Framer Motion** (already in ecosystem via Framer prototype). Install: `npm install framer-motion` in `frontend/`.

---

## Infrastructure (Azure via Pulumi)

| Resource | Type | Config |
|---|---|---|
| Resource Group | `azure-native.resources.ResourceGroup` | Region: Southeast Asia, name: `amclub-rg` |
| Container Registry | `azure-native.containerregistry.Registry` | Basic SKU |
| PostgreSQL Server | `azure-native.dbforpostgresql.FlexibleServer` | v16, Standard_B1ms, 32GB, 7-day backups |
| Storage Account | `azure-native.storage.StorageAccount` | Standard LRS, `allowBlobPublicAccess: true` (required by media container) |
| File Share | `azure-native.storage.FileShare` | 5GB quota (legacy `/data` mount; only holds previously seeded uploads) |
| Blob Container `media` | `azure-native.storage.BlobContainer` | `publicAccess: Blob` — Strapi Media Library backing store |
| Log Analytics | `azure-native.operationalinsights.Workspace` | Per-GB, 30-day retention |
| Container Apps Env | `azure-native.app.ManagedEnvironment` | Linked to Log Analytics |
| Container App | `azure-native.app.ContainerApp` | 1 replica, 1 CPU / 1GB RAM, liveness + startup probes |

**Secrets auto-generated:** DB password, app keys ×2, API token salt, admin JWT, transfer token salt, encryption key, JWT secret.

**Outputs:** `resourceGroupName`, `appUrl`, `postgresHost`, `containerRegistryLoginServer`

**IaC entry point:** `infra/index.ts`

---

## Responsive Behaviour Summary

| Breakpoint | Width | Nav |
|---|---|---|
| Mobile | 320–767px | Hamburger |
| Tablet | 768–1199px | Hamburger |
| Desktop L | 1200–1439px | Floating dark navy bar |
| Desktop XL | 1440px+ | Full-width top bar |

Tailwind custom breakpoints: `xl` = 75rem (1200px), `2xl` = 90rem (1440px).

---

## Key Source Files

| Purpose | Path |
|---|---|
| API utility | `frontend/src/lib/api.ts` |
| TypeScript types | `frontend/src/lib/types.ts` |
| Static subpage data | `frontend/src/data/subpages.ts` |
| Tailwind theme | `frontend/src/index.css` |
| Nav data hook | `frontend/src/hooks/useHeaderData.ts` |
| Scroll animation hook | `frontend/src/hooks/useScrollFadeIn.ts` |
| App router | `frontend/src/App.tsx` |
| Design spec | `DESIGN.md` |
| Framer prototype | https://tactesting.framer.website |
