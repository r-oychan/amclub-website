---
name: site-verifier
description: >-
  Verify a built website against its original mockup or design. Use when the user
  says "verify the site", "run tests", "compare against mockup", "visual regression
  test", "check the site", "validate the build", "does it match the mockup",
  "test the frontend", "check for broken links", "run visual diff", "compare
  screenshots", "check SEO tags", "test the pages", "audit the site", or any
  request to validate that a built website matches its design and works correctly.
  Requires a running frontend and optionally a running CMS.
allowed-tools: Bash(agent-browser:*), Bash(npx agent-browser:*), Bash(mkdir:*), Bash(curl:*), Bash(node:*)
---

# Site Verifier — Visual Regression, Link Checking & Quality Assurance

Verify a built website against its original design screenshots and check for
broken links, missing SEO tags, API correctness, accessibility basics, and
responsive behavior. This skill is GENERIC — it works for any web project,
not just CMS pipeline sites.

## Quick Start

```
User: "Verify the site"
You:
1. Check dev servers are running (frontend + CMS)
2. Load site-analysis.json for page list
3. Capture new screenshots of every page
4. Compare against baseline screenshots
5. Crawl all links for 404s
6. Check SEO meta tags
7. Produce verification-report.json + visual-diffs/
```

## Inputs

| Input | Default | Required |
|-------|---------|----------|
| Frontend URL | `http://localhost:5173` | Yes |
| CMS URL | `http://localhost:1337` | No |
| `screenshots/` directory | Project root `screenshots/` | Yes (baseline) |
| `site-analysis.json` | Project root | Yes (page list) |

## Outputs

| File | Purpose |
|------|---------|
| `verification-report.json` | Full results — see [references/report-schema.json](references/report-schema.json) |
| `verification-screenshots/` | New captures at each viewport width |
| `visual-diffs/` | Diff images for pages that changed |

**Output location:** Project root (alongside CLAUDE.md).

## Step-by-Step Process

### Phase 1: Pre-flight Checks

1. **Verify dev servers are running:**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
   curl -s -o /dev/null -w "%{http_code}" http://localhost:1337
   ```
   If either returns a non-200 status or connection refused, tell the user:
   > "The frontend dev server is not running. Start it with `cd frontend && npm run dev`."
   > "The CMS dev server is not running. Start it with `cd cms && npm run develop`."
   Do NOT proceed until the frontend is reachable. CMS is optional.

2. **Load page list from `site-analysis.json`:**
   Read the file and extract all page paths from `pages[].path`. If the file
   does not exist, ask the user which URLs to verify, or default to just `/`.

3. **Create output directories:**
   ```bash
   mkdir -p verification-screenshots visual-diffs
   ```

### Phase 2: Visual Comparison

For each page in the site analysis:

1. **Navigate and capture at desktop width (1440px):**
   ```bash
   agent-browser open <frontend-url><page-path> && agent-browser wait --load networkidle
   agent-browser screenshot --full verification-screenshots/<page-slug>-1440.png
   ```

2. **Optionally capture at mobile width (375px):**
   ```bash
   agent-browser eval 'window.innerWidth = 375; window.dispatchEvent(new Event("resize"))'
   agent-browser wait 1000
   agent-browser screenshot --full verification-screenshots/<page-slug>-375.png
   ```

3. **Compare against baseline screenshot:**
   Use agent-browser's diff command to compare the new capture against the
   original in `screenshots/`:
   ```bash
   agent-browser diff screenshot --baseline screenshots/<page-slug>.png verification-screenshots/<page-slug>-1440.png
   ```
   The diff output reports a mismatch percentage and produces a diff image.
   Save the diff image to `visual-diffs/<page-slug>-diff.png`.

4. **Classify the result:**
   - **< 15% difference** → `pass` (minor rendering differences are expected)
   - **15–30% difference** → `warn` (noticeable differences, review needed)
   - **> 30% difference** → `fail` (significant mismatch, likely a bug)

   Visual comparison is a **sanity check**, not pixel-perfect validation.
   Different browsers, fonts, and dynamic content will cause small diffs.

### Phase 3: Link Checking

1. **Extract all links from every page:**
   For each page, navigate and extract all `<a>` tags:
   ```bash
   agent-browser open <frontend-url><page-path> && agent-browser wait --load networkidle
   agent-browser eval --stdin <<'EVALEOF'
   JSON.stringify(
     [...new Set(
       Array.from(document.querySelectorAll('a[href]'))
         .map(a => a.href)
         .filter(href => href && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:'))
     )]
   )
   EVALEOF
   ```

2. **Check each unique link with a HEAD request:**
   ```bash
   curl -s -o /dev/null -w "%{http_code} %{redirect_url}" -L --max-time 10 <url>
   ```
   - Follow redirects (`-L`) and report the final status code.
   - Group links as: internal (same origin) vs external.
   - Report: `200` = ok, `301/302` = redirect (info), `404` = broken (error),
     `5xx` = server error (error), timeout = unreachable (warning).

3. **Deduplicate:** Only check each unique URL once across all pages, but
   record which pages reference broken links.

### Phase 4: SEO Verification

For each page, extract and verify meta tags:

```bash
agent-browser eval --stdin <<'EVALEOF'
JSON.stringify({
  title: document.title,
  metaDescription: document.querySelector('meta[name="description"]')?.content || null,
  ogTitle: document.querySelector('meta[property="og:title"]')?.content || null,
  ogDescription: document.querySelector('meta[property="og:description"]')?.content || null,
  ogImage: document.querySelector('meta[property="og:image"]')?.content || null,
  canonical: document.querySelector('link[rel="canonical"]')?.href || null,
  robots: document.querySelector('meta[name="robots"]')?.content || null,
  jsonLd: Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map(s => { try { return JSON.parse(s.textContent); } catch { return null; } })
    .filter(Boolean),
})
EVALEOF
```

**Required on every page** (error if missing):
- `<title>` — non-empty
- `<meta name="description">` — non-empty
- `<meta property="og:title">` — non-empty
- `<meta property="og:description">` — non-empty

**Recommended** (warning if missing):
- `<meta property="og:image">`
- `<link rel="canonical">`
- JSON-LD structured data

**Site-wide checks** (run once):
- Check for `sitemap.xml` at the root: `curl -s -o /dev/null -w "%{http_code}" <frontend-url>/sitemap.xml`
- Check for `robots.txt`: `curl -s -o /dev/null -w "%{http_code}" <frontend-url>/robots.txt`

### Phase 5: API Verification (Optional)

Only run if a CMS URL is available and `site-analysis.json` defines content types.

1. **Fetch the Strapi content type list:**
   ```bash
   curl -s <cms-url>/api/content-type-builder/content-types | node -e "
     const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
     const apis = d.data?.filter(t => t.uid.startsWith('api::')) || [];
     apis.forEach(t => console.log(t.uid, t.schema?.pluralName));
   "
   ```

2. **Spot-check each collection endpoint:**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" <cms-url>/api/<plural-name>
   ```
   Verify the response is `200` and the JSON structure includes `data` array.

3. **Validate response fields** match expected content type attributes from
   `site-analysis.json` or the content type definitions in `content-types/`.

### Phase 6: Accessibility Basics

For each page, run quick accessibility checks:

```bash
agent-browser eval --stdin <<'EVALEOF'
JSON.stringify({
  imagesWithoutAlt: Array.from(document.querySelectorAll('img:not([alt])'))
    .map(img => img.src),
  imagesWithEmptyAlt: Array.from(document.querySelectorAll('img[alt=""]'))
    .map(img => img.src),
  headingHierarchy: Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))
    .map(h => ({ level: parseInt(h.tagName[1]), text: h.innerText.trim().substring(0, 80) })),
  missingAriaLabels: Array.from(document.querySelectorAll('button:not([aria-label]):not(:has(text))'))
    .length,
  missingFormLabels: Array.from(document.querySelectorAll('input:not([aria-label]):not([id])'))
    .filter(el => !document.querySelector(`label[for="${el.id}"]`))
    .length,
})
EVALEOF
```

**Check:**
- Every `<img>` should have an `alt` attribute (error if missing)
- Heading levels should not skip (e.g., h1 → h3 without h2) (warning)
- Interactive elements should have accessible labels (warning)

### Phase 7: Performance Basics

Quick checks without needing Lighthouse:

```bash
agent-browser eval --stdin <<'EVALEOF'
JSON.stringify({
  totalImages: document.querySelectorAll('img').length,
  imagesWithoutLazyLoad: Array.from(document.querySelectorAll('img:not([loading="lazy"])'))
    .filter(img => !img.closest('header') && !img.closest('[class*="hero"]'))
    .map(img => img.src),
  largeDomSize: document.querySelectorAll('*').length,
  externalScripts: Array.from(document.querySelectorAll('script[src]'))
    .filter(s => !s.src.includes(location.hostname))
    .map(s => s.src),
})
EVALEOF
```

**Report** (informational):
- Images below the fold without `loading="lazy"` (warning)
- DOM size > 1500 nodes (warning)
- Number of external scripts (info)

### Phase 8: Assemble Report

1. **Build `verification-report.json`** following the schema in
   [references/report-schema.json](references/report-schema.json).

2. **Present a summary table to the user:**

   ```
   Page            | Visual | Links | SEO  | A11y | Overall
   ----------------|--------|-------|------|------|--------
   Home (/)        | PASS   | PASS  | PASS | WARN | PASS
   About (/about)  | WARN   | PASS  | FAIL | PASS | FAIL
   Blog (/blog)    | PASS   | FAIL  | PASS | PASS | FAIL
   ```

   Overall status per page: `fail` if any check is `fail`, `warn` if any is
   `warn`, `pass` otherwise.

3. **Show details only for failures and warnings.** Do not dump passing
   results — the user only needs to act on problems.

4. **Provide actionable recommendations** for each failure:
   - Visual diff too high → "Check the hero section — it appears the background
     image is missing"
   - Broken link → "Link to /blog/old-post returns 404 — update or remove it"
   - Missing meta tag → "Add `<meta name='description'>` to the About page"

## Handling Edge Cases

### No Baseline Screenshots
If `screenshots/` does not exist or is empty, skip visual comparison and only
run link checking, SEO, accessibility, and performance checks. Note in the
report that visual comparison was skipped.

### Dynamic Content
Content loaded from CMS may differ between the original mockup and the built
site (e.g., different placeholder text). Visual diff thresholds account for
this — the 15% pass threshold is intentionally generous.

### SPA Routing
For SPAs, navigate via agent-browser (which uses a real browser) rather than
curl. This ensures client-side routes render correctly.

### Pages Behind Authentication
If some pages require auth, use agent-browser's auth vault:
```bash
agent-browser auth login <profile>
```
Then navigate to protected pages normally.

## Composing With Other Skills

- **design-ingest** produces `screenshots/` baseline and `site-analysis.json`
- **agent-browser** provides all browser automation commands — see its SKILL.md
  for the full command reference
- **frontend-builder** produces the frontend being verified
- **content-migration** populates CMS data that appears on pages

## Multi-Viewport Testing

By default, capture at **1440px** (desktop). Optionally also capture at:
- **375px** — mobile
- **768px** — tablet

To run all three viewports, tell the user the verification will take longer
and capture each page three times. Store screenshots as:
- `verification-screenshots/<slug>-1440.png`
- `verification-screenshots/<slug>-768.png`
- `verification-screenshots/<slug>-375.png`

## References

| Reference | Purpose |
|-----------|---------|
| [references/verification-checks.md](references/verification-checks.md) | Detailed implementation of all verification checks |
| [references/report-schema.json](references/report-schema.json) | JSON Schema for verification-report.json |

## Checklist Before Completing

- [ ] All pages from site-analysis.json have been visited
- [ ] Screenshots captured in `verification-screenshots/`
- [ ] Visual diffs produced for pages with baselines
- [ ] All internal links checked (no unchecked links)
- [ ] SEO meta tags verified on every page
- [ ] Accessibility basics checked on every page
- [ ] `verification-report.json` written and valid
- [ ] Summary table presented to user with actionable recommendations
