---
name: design-ingest
description: Analyze and extract structure from website mockups, prototypes, and live sites. Use when the user provides a URL and asks to "analyze this site", "analyze this mockup", "analyze this design", "ingest this site", "extract the site structure", "capture this website", "read this mockup", "what components does this site use", or any request to understand a website's structure, pages, navigation, components, and content before building a CMS-backed replica. Also triggers when site-analysis.json or content-inventory.json need to be generated. allowed-tools: Bash(agent-browser:*), Bash(npx agent-browser:*), Bash(mkdir:*)
---

# Design Ingest — Site Analysis & Content Extraction

Crawl a mockup or live site to produce machine-readable analysis files that
downstream skills (cms-data-modeler, frontend-builder, content-migration) consume.

## Quick Start

```
User: "Analyze https://example.com"
You:
1. Crawl all pages
2. Capture screenshots
3. Extract structure → site-analysis.json
4. Extract content → content-inventory.json
5. Present summary and ask user to confirm/correct
```

## Outputs

| File | Purpose | Consumer |
|------|---------|----------|
| `site-analysis.json` | Page hierarchy, nav, component inventory, design tokens | cms-data-modeler, frontend-builder |
| `content-inventory.json` | All text, images, CTAs, media extracted per page | content-migration |
| `screenshots/` | Full-page captures of every unique page | site-verifier (baseline), user review |

**Output location:** Project root (alongside CLAUDE.md).

## Step-by-Step Process

### Phase 1: Discovery — Map the Site

1. **Open the URL** and wait for full load:
   ```bash
   agent-browser open <url> && agent-browser wait --load networkidle
   ```

2. **Capture the homepage screenshot:**
   ```bash
   mkdir -p screenshots
   agent-browser screenshot --full screenshots/home.png
   ```

3. **Extract navigation structure** using snapshot + eval:
   ```bash
   agent-browser snapshot -i -c
   ```
   Parse the snapshot to identify navigation elements (nav, header links, footer links, sidebar menus). Build a preliminary page list.

4. **Extract all internal links** via JavaScript:
   ```bash
   agent-browser eval --stdin <<'EVALEOF'
   JSON.stringify(
     [...new Set(
       Array.from(document.querySelectorAll('a[href]'))
         .map(a => new URL(a.href, location.origin))
         .filter(u => u.origin === location.origin)
         .map(u => u.pathname + u.search)
     )].sort()
   )
   EVALEOF
   ```

5. **Detect SPA routing:** Check if the site uses client-side routing:
   ```bash
   agent-browser eval 'typeof window.__NEXT_DATA__ !== "undefined" || !!document.querySelector("[data-reactroot]") || !!document.querySelector("#__nuxt") || !!document.querySelector("[data-framer-name]")'
   ```
   If SPA detected, use click-based navigation (not direct URL opens) to ensure
   route transitions fire correctly. Always `wait --load networkidle` after each
   navigation.

6. **Classify pages:** Group discovered URLs into:
   - **Unique pages** — distinct layouts (home, about, contact, blog listing)
   - **Template instances** — pages sharing the same layout with different content
     (individual blog posts, product pages). Identify by URL pattern (e.g.,
     `/blog/:slug`) and DOM similarity.
   - **Pagination** — pages with `?page=N` or similar patterns. Capture page 1
     only but note the pattern.

### Phase 2: Deep Crawl — Analyze Each Unique Page

For each unique page (and one representative of each template):

1. **Navigate and wait:**
   ```bash
   agent-browser open <page-url> && agent-browser wait --load networkidle
   ```

2. **Capture full-page screenshot:**
   ```bash
   agent-browser screenshot --full screenshots/<page-slug>.png
   ```

3. **Take accessibility snapshot** for component detection:
   ```bash
   agent-browser snapshot -c
   ```

4. **Extract page structure via JavaScript.** Run a comprehensive extraction
   script that identifies:
   ```bash
   agent-browser eval --stdin <<'EVALEOF'
   JSON.stringify({
     title: document.title,
     meta: {
       description: document.querySelector('meta[name="description"]')?.content || '',
       ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
       ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
     },
     sections: Array.from(document.querySelectorAll('header, main, section, footer, [class*="hero"], [class*="section"], [class*="block"]'))
       .map(el => ({
         tag: el.tagName.toLowerCase(),
         classes: el.className,
         role: el.getAttribute('role') || '',
         childCount: el.children.length,
         textLength: el.innerText?.length || 0,
         hasImages: el.querySelectorAll('img').length,
         hasForms: el.querySelectorAll('form').length,
         hasVideo: el.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length,
       })),
     images: Array.from(document.querySelectorAll('img'))
       .map(img => ({
         src: img.src,
         alt: img.alt,
         width: img.naturalWidth,
         height: img.naturalHeight,
       })),
     headings: Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))
       .map(h => ({ level: parseInt(h.tagName[1]), text: h.innerText.trim() })),
     forms: Array.from(document.querySelectorAll('form'))
       .map(f => ({
         action: f.action,
         method: f.method,
         fields: Array.from(f.querySelectorAll('input,select,textarea'))
           .map(el => ({ type: el.type, name: el.name, placeholder: el.placeholder }))
       })),
   })
   EVALEOF
   ```

5. **Detect repeated patterns.** Look for repeating DOM structures that indicate
   collections (card grids, list items, testimonials, team members):
   ```bash
   agent-browser eval --stdin <<'EVALEOF'
   JSON.stringify(
     Array.from(document.querySelectorAll('[class*="grid"], [class*="list"], [class*="cards"], [class*="collection"]'))
       .map(container => ({
         containerClasses: container.className,
         itemCount: container.children.length,
         sampleItem: container.children[0] ? {
           tag: container.children[0].tagName,
           classes: container.children[0].className,
           hasImage: !!container.children[0].querySelector('img'),
           hasHeading: !!container.children[0].querySelector('h1,h2,h3,h4,h5,h6'),
           hasLink: !!container.children[0].querySelector('a'),
           textPreview: container.children[0].innerText?.substring(0, 100),
         } : null
       }))
       .filter(c => c.itemCount > 1)
   )
   EVALEOF
   ```

### Phase 3: Component Classification

Analyze the collected data and classify every section into component types.
Use this taxonomy:

| Component Type | Detection Signals |
|---------------|-------------------|
| `hero` | First visible section, large heading, optional background image, CTA button |
| `navigation` | `<nav>`, header links, logo, hamburger menu |
| `footer` | `<footer>`, bottom of page, copyright, social links |
| `card-grid` | Repeated children with image + heading + text/link |
| `testimonial` | Repeated quotes with attribution (name, photo, role) |
| `cta-banner` | Section with heading + button, often colored background |
| `text-block` | Rich text section (paragraphs, lists, no repeated structure) |
| `image-gallery` | Grid/carousel of images |
| `contact-form` | Form with name/email/message fields |
| `faq` | Accordion or list of question/answer pairs |
| `pricing-table` | Repeated columns with price, features, CTA |
| `team-grid` | Repeated items with photo, name, role |
| `stats-counter` | Numbers with labels (e.g., "500+ clients") |
| `logo-cloud` | Row of partner/client logos |
| `video-embed` | YouTube/Vimeo iframe or video element |
| `blog-listing` | Card grid linking to individual posts |
| `sidebar` | Narrow column with filters, categories, or related links |
| `breadcrumb` | Hierarchical path links |
| `pagination` | Page number links or "Load more" button |
| `map` | Google Maps or similar embed |
| `accordion` | Collapsible content sections |
| `tabs` | Tabbed content panels |
| `timeline` | Chronological items with dates |
| `feature-grid` | Icon + heading + description repeated items |

If a section doesn't match any known type, classify it as `custom` and describe
its structure in detail.

### Phase 4: Content Extraction

For each page, extract ALL content into `content-inventory.json`:

- **Text:** Every heading, paragraph, list item, button label, link text
- **Images:** URL, alt text, dimensions, context (hero bg, card thumbnail, etc.)
- **CTAs:** Button/link text + destination URL
- **Media:** Video URLs, embeds
- **Forms:** Field labels, types, placeholder text, validation hints
- **Metadata:** Page title, meta description, OG tags

Group content by the component it belongs to. This enables content-migration
to map each piece to the correct CMS field.

### Phase 5: Assemble Output & User Review

1. **Write `site-analysis.json`** following the schema in
   [references/site-analysis-schema.json](references/site-analysis-schema.json).

2. **Write `content-inventory.json`** following the schema in
   [references/content-inventory-schema.json](references/content-inventory-schema.json).

3. **Present a summary to the user:**
   - Total pages found (unique + template instances)
   - Page hierarchy (tree view)
   - Component inventory (table: type, count, which pages)
   - Any ambiguities or questions (e.g., "Is the blog section a static page or
     a dynamic collection?", "Should the FAQ items be individually editable?")

4. **Wait for user confirmation** before considering the analysis complete.
   The user may ask to:
   - Add missed pages (behind auth, JS-only routes)
   - Reclassify components
   - Merge or split detected components
   - Exclude sections from the build

## Handling Edge Cases

### SPAs (React, Next.js, Framer, Vue)
- Use `agent-browser wait --load networkidle` after every navigation
- For Framer sites, click navigation links rather than opening URLs directly
  (Framer may not support direct deep linking to all routes)
- Check for `data-framer-name` attributes — these indicate Framer components
  and their names map to the design system

### Paginated Content
- Detect pagination patterns (`?page=`, `/page/2`, "Load more" buttons)
- Extract content from page 1 only
- Record the pagination pattern in site-analysis.json so content-migration
  can crawl all pages later

### Lazy-Loaded Content
- Scroll the page fully before extracting:
  ```bash
  agent-browser eval 'window.scrollTo(0, document.body.scrollHeight)'
  agent-browser wait 2000
  agent-browser eval 'window.scrollTo(0, 0)'
  ```
- Check for intersection observer patterns and scroll-triggered content

### Multi-Language Sites
- Detect language switcher in navigation
- Record available languages in site-analysis.json
- Extract content from the primary language only (flag others for i18n setup)

### Auth-Protected Pages
- If the user mentions pages behind login, ask for credentials or a session
- Use `agent-browser auth save` to store securely
- Flag protected pages in the analysis so downstream skills handle them

## Design Token Extraction

If the mockup uses a consistent design system, extract tokens:

```bash
agent-browser eval --stdin <<'EVALEOF'
JSON.stringify({
  colors: [...new Set(
    Array.from(document.querySelectorAll('*'))
      .flatMap(el => {
        const s = getComputedStyle(el);
        return [s.color, s.backgroundColor, s.borderColor];
      })
      .filter(c => c && c !== 'rgba(0, 0, 0, 0)' && c !== 'rgb(0, 0, 0)')
  )].slice(0, 20),
  fonts: [...new Set(
    Array.from(document.querySelectorAll('*'))
      .map(el => getComputedStyle(el).fontFamily)
      .filter(Boolean)
  )],
})
EVALEOF
```

Store in `site-analysis.json` under `designTokens` so the frontend-builder
can apply them.

## Composing With Other Skills

This skill produces the foundation files. Downstream skills expect:

- **cms-data-modeler** reads `site-analysis.json` → produces content type schemas
- **frontend-builder** reads `site-analysis.json` + content types → builds UI
- **content-migration** reads `content-inventory.json` → populates CMS
- **site-verifier** reads `screenshots/` → visual regression baseline

**Do not modify output files manually** — they are regenerated by rerunning
this skill. This is enforced by the project's CLAUDE.md guardrails.

## References

| Reference | Purpose |
|-----------|---------|
| [references/site-analysis-schema.json](references/site-analysis-schema.json) | JSON Schema for site-analysis.json output |
| [references/content-inventory-schema.json](references/content-inventory-schema.json) | JSON Schema for content-inventory.json output |
| [references/crawling-patterns.md](references/crawling-patterns.md) | Patterns for handling SPAs, pagination, lazy loading |

## Checklist Before Completing

- [ ] Every unique page has a screenshot in `screenshots/`
- [ ] All navigation links are accounted for in the page hierarchy
- [ ] Repeated patterns are identified and abstracted (not duplicated per instance)
- [ ] Images have src URLs and alt text captured
- [ ] Forms have all fields documented
- [ ] SEO metadata (title, description, OG) captured per page
- [ ] User has reviewed and confirmed the analysis summary
- [ ] Both JSON files validate against their schemas
