# CMS Migration Tracking

Living document for the project-wide effort to move every page from hardcoded
content to Strapi-driven content. Update continuously. Authoritative for
**status**, **decisions**, **shared components**, and **per-page progress**.
Pair with `SPECS.md` (which describes intended app/CMS shape) and
`.claude/CLAUDE.md` (which describes process).

Last updated: 2026-04-27 — pilot phase (HomePage).

---

## 1. Goals

1. Every page renders content fetched from Strapi at runtime. Zero hardcoded
   user-facing strings, image URLs, hrefs, or lists in pages or section
   components.
2. Editors can change content via `/admin` and see it on the public site after
   refresh — no redeploy required for content changes.
3. Shared visual blocks are modeled as **Strapi reusable components** (not
   Dynamic Zones), so per-page layout intent is preserved and rendering is
   strictly typed.
4. Images are uploaded to Strapi media library; no external `framerusercontent.com`
   URLs in production data.

## 2. Architectural Decisions

| # | Decision | Why | Where it bites |
|---|---|---|---|
| D1 | **Reusable components over Dynamic Zones** | Predictable per-page layout, strict types, simpler renderers. | All page content types (`home-page`, `about-page`, …) get explicit fields, NOT a `content: dynamiczone`. |
| D2 | **Framer is source of truth for copy & imagery, except where the local build has been intentionally enhanced** (notably HomePage) and where widths have been standardized. | Framer reflects the agreed design. Local enhancements are the exception. | When Framer ≠ local: extract from Framer first, then ask before keeping a local override. |
| D3 | **Images: download from Framer → upload to Strapi media → reference by media ID** | Self-hosted, durable, editor-replaceable in `/admin`. | Every image field is `type: media` (not `type: string`). Seed scripts must upload first, then reference. |
| D4 | **Audit before populate** | Existing 18 schemas have known gaps vs. what pages actually need (see §5). | Each page goes: audit → schema fix → seed → wire frontend → verify. |
| D5 | **Pilot HomePage end-to-end** | Validates the whole pipeline (schema, components, seed, fetchAPI, deploy) on one page before fanning out. | Other 10 pages wait until HomePage is green on the deployed URL. |
| D6 | **Strapi component naming**: `blocks.<section-block>` for full-section blocks; `shared.<atom>` for reused atoms (link, hero-slide, feature-item, etc.). | Existing convention; keeps the admin UI grouped sensibly. | New components must follow this. |
| D7 | **Hero stays a 3-slide carousel** on HomePage (intentional local enhancement). | User confirmed 2026-04-28; matches D2. | `blocks.hero.slides` repeatable, with per-slide CTA + position fields. |
| D8 | **FAQ answers ship empty**. Client populates via /admin later. | User confirmed 2026-04-28. | Seed script writes `answer: null` for the 4 HomePage FAQ items. |
| D9 | **Tab images: keep current local choices (3 reused Services photos), but serve from Strapi**. Don't substitute Framer's distinct lifestyle photos. | User confirmed 2026-04-28. | Upload `ALiDWPH.jpeg`, `FfQ1mhh.jpeg`, `DytJIjZ.jpeg` once; reference from both Services + Experience. |
| D10 | **Moments testimonial #5 = Emma Chen (local), not Framer's duplicate Sarah Grey**. | Default applied — Framer's #5 is clearly a placeholder duplicate of #2. | Seed `testimonial` with 5 entries, Emma Chen included. |
| D11 | **API token via `cms/.env.seed`** (gitignored), read by the seed script at runtime. | User confirmed 2026-04-28. | Seed script: `STRAPI_API_TOKEN`, `STRAPI_BASE_URL` env vars. |

## 3. Per-Page Status

Status legend:
- `❌ none` — entries empty in CMS, frontend hardcoded
- `🟡 partial` — some fields wired, some still hardcoded (avoid this state)
- `✅ wired` — meets §4 Definition of Done (matches `.claude/CLAUDE.md`)

| Page | Frontend file | Strapi single-type | Status | Notes |
|---|---|---|---|---|
| Home | `pages/HomePage.tsx` | `home-page` | ✅ wired | **Pilot complete (2026-04-28).** Deployed at `--0000052` revision; serves 30 images from Strapi /uploads, 0 page-section framer* URLs. Verified screenshot: `frontend/audits/deployed-home-1440-cms.jpeg`. |
| About | `pages/AboutPage.tsx` | `about-page` | ✅ wired | **Complete (2026-04-28).** All 14 sections render from CMS; 40 images served from /uploads. Audit `frontend/audits/about.md`. |
| Dining | `pages/DiningPage.tsx` | `dining-page` | ✅ wired | **Complete (2026-04-28).** 6 restaurants in collection (with logo + cuisineIconSlug). Hero, club-favorites 2-up, essentials overlay, final CTA. PromoCell stays hardcoded. |
| Fitness | `pages/FitnessPage.tsx` | `fitness-page` | ✅ wired | **Complete (2026-04-28).** 9 sections (5 overlays + 3-col + bowling overlay + final CTA + hero); added logo to overlay-section and bordered to link. |
| Kids | `pages/KidsPage.tsx` | `kids-page` | ✅ wired | **Complete (2026-04-28).** All sections CMS-driven except `QuadSection` which stays hardcoded (custom inline-SVG layout). Audit `frontend/audits/kids.md`. |
| Membership | `pages/MembershipPage.tsx` | `membership-page` | ✅ wired | **Complete (2026-04-28).** 8 sections, hero bg image, 3 program cards. Audit `frontend/audits/membership.md`. |
| Event Spaces | `pages/EventSpacesPage.tsx` | `event-spaces-page` | ✅ wired | **Complete (2026-04-28).** 7 new components for packages/venues/catering. 12 images uploaded. |
| What's On | `pages/WhatsOnPage.tsx` | `whats-on-page` | ✅ wired | **Complete (2026-04-28).** Hero + filterable event grid (9 events from collection) + final CTA. Reuses HomePage-seeded events. |
| Gallery | `pages/GalleryPage.tsx` | `gallery-page` + `gallery-album` | ✅ wired | **Complete (2026-04-28).** New collection + page; 8 albums seeded. |
| News | `pages/NewsPage.tsx` | `news-page` + `news-article` | ✅ wired | **Complete (2026-04-28).** New collection + page; 6 articles seeded. |
| Contact Us | `pages/ContactUsPage.tsx` | `contact-us-page` | ✅ wired | **Complete (2026-04-28).** New page; address, phone, email, map, outlet schedules (5 groups, ~30 outlets) all from CMS. |
| Venue Detail | `pages/VenueDetailPage.tsx` | `venue` (collection) | ✅ wired | Reference implementation. |
| Header / Nav | `hooks/useHeaderData.ts` | `header` | ✅ wired | Reference implementation. |
| Footer | `components/layout/Footer.tsx` | `footer` | ❓ unknown | Verify whether footer is fetched. |

## 4. Definition of Done (per page)

Mirrors `.claude/CLAUDE.md` so we don't drift. A page is "done" only when **all
four** are true:

1. A matching Strapi content type exists (single-type for one-offs;
   collection-type for repeated entities).
2. Page + section components accept content as **props only** — no hardcoded
   strings, image URLs, hrefs, or arrays.
3. Page fetches via `fetchAPI('/<slug>', { populate: 'deep' })` (or
   field-specific populate). Loading and empty states are handled.
4. A real entry exists, is published, on the **deployed** Strapi, and the
   deployed public URL renders that entry. Editor change in `/admin` →
   refresh public URL → change visible.

## 5. Strapi Component Registry

Existing components in `cms/src/components/`. ✓ = matches a frontend block, ⚠ =
gaps relative to current frontend usage, ➕ = needs to be created.

### `blocks.*` — full section blocks

| Component | Existing fields | Used by frontend | Status | Action |
|---|---|---|---|---|
| `blocks.hero` | heading, subheading, backgroundImage, cta:link, slides:hero-slide[], variant, autoPlayInterval | `Hero.tsx` (HomePage, etc.) | ⚠ | Add `titlePosition`/`subtitlePosition` enums to `blocks.hero` *and* `shared.hero-slide`. |
| `blocks.text-block` | label, heading, body:blocks, cta:link | About body, generic copy | ✓ | OK. |
| `blocks.stats-counter` | label, stats:stat-item[] | About? Home About section? | ⚠ | Frontend `AboutSection` bundles label + heading + stats + funFact + cta + images — see new `blocks.about-section` below. |
| `blocks.card-grid` | label, heading, subheading, cards:feature-item[], cta:link, dark | Generic card grid | ⚠ | `feature-item` has `icon` (media); HomePage passes `image` semantically. **Rename `icon` → `image`** on `shared.feature-item`, or add an alias. |
| `blocks.feature-grid` | label, heading, body, features:feature-item[], cta:link, dark | HomePage Services | ✓ (after `feature-item` rename) | |
| `blocks.event-listing` | label, heading, cta:link, maxItems, filterByCategory:event-category | HomePage Events, WhatsOnPage | ✓ | Use this *instead of* generic card-grid for events. |
| `blocks.cta-banner` | label, heading, body, ctas:link[], variant | Generic CTA | ✓ | OK. |
| `blocks.tabs-section` | label, heading, tabs:link[], dark | HomePage Experience | ⚠ | `link` has no image; HomePage tabs include images. **Add new `shared.tab-item` (label, href, image)** and switch `tabs:` to it. |
| `blocks.testimonial-slider` | label, heading, cta:link, testimonials:testimonial[], dark | HomePage Moments | ⚠ | testimonial schema lacks per-item CTA. **Add `ctaLabel`, `ctaUrl` to `api::testimonial`.** |
| `blocks.faq-section` | label, heading, ctas:link[], items:faq-item[], dark | HomePage FAQ | ✓ | OK. |
| `blocks.team-grid` | heading, members:committee-member[] | About management | ✓ (verify on About audit) | |
| ➕ `blocks.about-section` | label, heading, stats:stat-item[], funFact, cta:link, images:media[] | HomePage AboutSection | ➕ | **Create.** |

### `shared.*` — reusable atoms

| Component | Fields | Status | Action |
|---|---|---|---|
| `shared.link` | label, href, isExternal, variant | ✓ | OK. |
| `shared.hero-slide` | backgroundImage, overlayDarken, title, titleColor, subtitle, subtitleColor, subtitleLink, cta:link | ⚠ | Add `titlePosition`, `subtitlePosition` enums. |
| `shared.feature-item` | heading, description, icon:media | ⚠ | Rename `icon` → `image` (semantic, used as full image not just icon). |
| `shared.stat-item` | (verify schema) | ❓ | Confirm fields match `{ value, label }`. |
| `shared.seo` | (existing) | ✓ | OK. |
| `shared.nav-item`, `nav-dropdown`, `nav-column`, `footer-column` | header/footer atoms | ✓ | Already wired. |
| ➕ `shared.tab-item` | label, href, image:media | ➕ | **Create.** Replaces `shared.link` in `blocks.tabs-section.tabs`. |

## 6. Pilot — HomePage Decomposition

Source: `frontend/src/pages/HomePage.tsx` (current hardcoded). Compared
against existing schemas. Framer extraction pending (next task).

| Section | Frontend block | Maps to Strapi component | Schema gaps | Notes |
|---|---|---|---|---|
| Hero (carousel) | `<Hero variant="full" slides=[3]>` | `blocks.hero` (with `slides`, ignore top-level fields when slides ≥ 2) | Need `titlePosition` + `subtitlePosition` on `blocks.hero` and `shared.hero-slide`. | **Local enhancement**: 3-slide carousel + position-controlled title/subtitle is likely a local enhancement vs. Framer's possibly-static hero. Confirm with Framer audit before locking the schema. |
| About | `<AboutSection label heading stats[] funFact cta images[]>` | ➕ new `blocks.about-section` | Create the block; reuse existing `shared.stat-item` + `shared.link`. | The "Did You Know?" funFact is a HomePage-specific atom; bundling makes sense. |
| Events | `<CardGrid variant="event" items=[9 events]>` | `blocks.event-listing` (relation to `api::event`) | Schema OK, but each `event` entry needs creating with image, date, category. | 9 hardcoded events become 9 `event` collection entries. Order/filtering via `filterByCategory` and `maxItems`. |
| Services | `<FeatureGrid label heading cta dark items=[3]>` | `blocks.feature-grid` | Rename `shared.feature-item.icon` → `image`. | |
| Experience | `<TabsSection label heading items=[3]>` | `blocks.tabs-section` | Replace `tabs:link[]` with `tabs:tab-item[]`; create `shared.tab-item`. | |
| Moments | `<TestimonialSlider label heading cta items=[5]>` | `blocks.testimonial-slider` (relation to `api::testimonial`) | Add `ctaLabel`, `ctaUrl` to testimonial schema. Map frontend `name` → `memberName`, `image` → `photo`. | |
| FAQ | `<FaqAccordion label heading ctas=[2] items=[4]>` | `blocks.faq-section` (relation to `api::faq-item`) | Schema OK. faq-item.answer field is `blocks` rich text. Frontend currently passes empty `answer` strings — Framer likely has the actual answers. | |

### Final HomePage schema (target shape)

After D1 (no Dynamic Zones) and the gaps above are fixed, `home-page`
becomes:

```jsonc
{
  "kind": "singleType",
  "attributes": {
    "title": "string (required)",
    "hero": "component blocks.hero (single)",
    "aboutSection": "component blocks.about-section (single)  // ➕ new",
    "events": "component blocks.event-listing (single)",
    "services": "component blocks.feature-grid (single)",
    "experience": "component blocks.tabs-section (single)",
    "moments": "component blocks.testimonial-slider (single)",
    "faq": "component blocks.faq-section (single)",
    "seo": "component shared.seo (single)"
  }
}
```

## 7. Image Asset Plan (HomePage pilot)

Pending Framer audit. Will list every Framer URL → target Strapi field →
local download path → uploaded media ID. Filled out after task #9.

## 8. Open Questions / Blockers

Captured during HomePage Framer audit (`frontend/audits/home.md`).

| # | Question | Blocking | Owner |
|---|---|---|---|
| Q1 | Hero: keep 3-slide carousel (local enhancement) or revert to Framer's single static hero? | Schema + seed for `blocks.hero` slides. | User. |
| Q2 | FAQ answers: ship empty (client fills later), or provide placeholder copy now? | Seed for `faq-item.answer`. | User. |
| Q3 | Moments testimonial #5: keep local Emma Chen unique, or restore Framer's duplicate Sarah Grey? | Seed for `testimonial`. | User. |
| Q4 | Experience tabs: adopt Framer's distinct lifestyle images, or keep local reuse of Services images? | Seed for `tab-item.image`. | User. |
| Q5 | **Strapi admin API token** for the seed script (`/admin → Settings → API Tokens`, Full access). | Tasks #10, #12 (seed + verify). | User. |
| Q6 | Footer wiring status — is `footer` content type used or hardcoded in `Footer.tsx`? | Page-level Definition of Done for the global layout. | Quick audit, defer. |
| Q7 | Local Events grid uses **wrong images** (uses About-section photos for events 1–4, then shifts the rest by +1). Confirm we'll fix to Framer's mapping when seeding. | Event collection seed. | User (recommended: fix). |

## 9. Migration Backlog Order

1. ✅ **HomePage** (pilot, complete 2026-04-28) — pipeline proven.
2. ✅ **AboutPage** (complete 2026-04-28) — biggest page; added 10 new components.
3. ✅ **MembershipPage** (complete 2026-04-28) — small page; added cta on feature-item, light variant on cta-banner.
4. ✅ **KidsPage** (complete 2026-04-28) — added overlay-section, three-col-grid, three-col-item; QuadSection stays hardcoded for now.
5. ✅ **FitnessPage** (complete 2026-04-28) — heaviest overlay-driven page; logo on overlay-section, bordered on link.
6. ✅ **DiningPage** (complete 2026-04-28) — 6 restaurants seeded; club-favorites 2-up grid; PromoCell stays hardcoded.
7. ✅ **WhatsOnPage** (complete 2026-04-28) — reuses HomePage events; hero + filterable event grid + final CTA.
8. ✅ **EventSpacesPage** (complete 2026-04-28) — 7 new components (private-event-packages, distinctive-event-spaces, offsite-catering-services + supporting atoms).
9. ✅ **GalleryPage** (complete 2026-04-28) — new gallery-album collection + gallery-page single type; 8 albums seeded.
10. ✅ **NewsPage** (complete 2026-04-28) — new news-article collection + news-page single type; 6 articles seeded.
11. ✅ **ContactUsPage** (complete 2026-04-28) — new contact-us-page single type with deep outlet schedules (~30 outlets across 5 groups) stored as JSON.

🎉 **All 11 backlog pages wired.**

## Known follow-ups

- **TalkToUsBanner** (ContactUs) currently hardcoded; the contact-us-page schema has `talkToUsCta` populated but the component doesn't take props yet — minor refactor.
- **Header/footer dropdown panels** — `frontend/src/data/subpages.ts` is still hardcoded with framerusercontent.com URLs. Visible on every page's header.
- **QuadSection** (Kids) — custom inline-SVG layout still hardcoded. Future task.
- **PromoCell** (Dining) — small decorative card still hardcoded. Future task.
- **CtaBanner schema** — does not yet support backgroundImage / decorativeImages (Membership Join CTA + Find-Right CTA in Framer use these). Future schema extension.

## 10. Update Process

- After **every** structural change (new component, new schema field, new
  page wired): update §3 status, §5 component registry, and §8 questions if
  newly resolved.
- After every Framer audit: append to a `frontend/audits/<page>.md` file with
  the side-by-side diff (kept out of this doc to stay scannable).
- When a section moves to ✅, link to the deployed CMS entry URL in the
  notes column for traceability.
