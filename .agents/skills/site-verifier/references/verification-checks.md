# Verification Checks — Implementation Reference

This document details every verification check the site-verifier skill performs,
with exact commands and evaluation criteria.

## 1. Visual Comparison

### Capture Baseline vs Current

The baseline screenshots come from the `screenshots/` directory produced by
the design-ingest skill. The verifier captures new screenshots into
`verification-screenshots/`.

**Capture command:**
```bash
agent-browser open <url> && agent-browser wait --load networkidle
agent-browser screenshot --full verification-screenshots/<slug>-<width>.png
```

### Diff Command

Use agent-browser's built-in diff:
```bash
agent-browser diff screenshot --baseline screenshots/<slug>.png verification-screenshots/<slug>-1440.png
```

This produces:
- A mismatch percentage (0–100%)
- A diff image highlighting changed pixels

### Thresholds

| Mismatch % | Status | Meaning |
|-----------|--------|---------|
| 0–14% | `pass` | Minor rendering differences (fonts, anti-aliasing, dynamic content) |
| 15–30% | `warn` | Noticeable differences — review the diff image |
| 31–100% | `fail` | Significant mismatch — likely a layout or content bug |

### Viewport Widths

| Width | Name | When to Use |
|-------|------|-------------|
| 1440px | Desktop | Always (default) |
| 768px | Tablet | On request or full audit |
| 375px | Mobile | On request or full audit |

### Handling Missing Baselines

If a page has no baseline screenshot:
- Skip visual comparison for that page
- Record status as `skipped` (not `fail`)
- Note the reason in the report

## 2. Link Checking

### Extraction

On each page, extract all `<a>` tags:
```javascript
[...new Set(
  Array.from(document.querySelectorAll('a[href]'))
    .map(a => a.href)
    .filter(href =>
      href &&
      !href.startsWith('javascript:') &&
      !href.startsWith('mailto:') &&
      !href.startsWith('tel:') &&
      !href.startsWith('#')
    )
)]
```

### Classification

- **Internal links:** Same origin as the frontend URL
- **External links:** Different origin
- **Anchor links:** Start with `#` (skip — not HTTP requests)
- **mailto/tel:** Start with `mailto:` or `tel:` (skip)

### Checking

```bash
curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 <url>
```

**Flags:**
- `-L` — follow redirects (report final status)
- `--max-time 10` — timeout after 10 seconds
- `-s` — silent mode
- `-o /dev/null` — discard body

### Status Interpretation

| HTTP Status | Result | Severity |
|-------------|--------|----------|
| 200 | OK | — |
| 301, 302 | Redirect | `info` — link works but could be updated to final URL |
| 403 | Forbidden | `warning` — may require auth or be intentionally restricted |
| 404 | Not Found | `error` — broken link |
| 500+ | Server Error | `error` — backend issue |
| 0 / timeout | Unreachable | `warning` — network issue or very slow server |

### Deduplication

Check each unique URL only once. Track which pages reference each URL so the
report can say "broken link to /foo found on /about and /contact".

## 3. SEO Verification

### Per-Page Checks

Extract all meta tags in a single eval:
```javascript
{
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
}
```

### Required Tags (error if missing)

| Tag | Check |
|-----|-------|
| `<title>` | Non-empty string |
| `<meta name="description">` | Non-empty string, ideally 50–160 chars |
| `<meta property="og:title">` | Non-empty string |
| `<meta property="og:description">` | Non-empty string |

### Recommended Tags (warning if missing)

| Tag | Check |
|-----|-------|
| `<meta property="og:image">` | Valid URL |
| `<link rel="canonical">` | Valid URL |
| JSON-LD structured data | At least one valid JSON-LD block |

### Site-Wide Checks

| Resource | Command | Expected |
|----------|---------|----------|
| `sitemap.xml` | `curl -s -o /dev/null -w "%{http_code}" <url>/sitemap.xml` | 200 |
| `robots.txt` | `curl -s -o /dev/null -w "%{http_code}" <url>/robots.txt` | 200 |

## 4. API Verification

Only run when CMS URL is available.

### List Content Types

```bash
curl -s <cms-url>/api/content-type-builder/content-types
```

Filter to `api::*` types (user-defined, not Strapi internals).

### Spot-Check Endpoints

For each collection type with plural name:
```bash
curl -s <cms-url>/api/<plural-name>
```

**Verify:**
- Response status is `200`
- Response body contains `data` key
- `data` is an array (for collection types) or object (for single types)
- Response includes expected attributes (cross-reference with content type definitions)

### Single Type Check

```bash
curl -s <cms-url>/api/<singular-name>
```

Verify `data` is an object (not array).

## 5. Accessibility Basics

### Image Alt Text

```javascript
{
  imagesWithoutAlt: document.querySelectorAll('img:not([alt])').length,
  imagesWithEmptyAlt: document.querySelectorAll('img[alt=""]').length,
  totalImages: document.querySelectorAll('img').length,
}
```

- Missing `alt` attribute → `error`
- Empty `alt=""` → `info` (acceptable for decorative images)

### Heading Hierarchy

```javascript
Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))
  .map(h => parseInt(h.tagName[1]))
```

**Check:**
- Exactly one `<h1>` per page (warning if 0 or > 1)
- No skipped levels (e.g., h1 → h3 without h2) (warning)

### Form Labels

```javascript
Array.from(document.querySelectorAll('input, select, textarea'))
  .filter(el => {
    const id = el.id;
    const hasLabel = id && document.querySelector(`label[for="${id}"]`);
    const hasAria = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
    const hasPlaceholder = el.placeholder;
    return !hasLabel && !hasAria && !hasPlaceholder;
  })
```

Inputs without any label mechanism → `warning`

### Interactive Elements

- Buttons without text content or `aria-label` → `warning`
- Links without text content or `aria-label` → `warning`

## 6. Performance Basics

### Image Lazy Loading

```javascript
Array.from(document.querySelectorAll('img:not([loading="lazy"])'))
  .filter(img => !img.closest('header') && !img.closest('[class*="hero"]'))
```

Images below the fold without `loading="lazy"` → `warning`

Exception: images in the header/hero should NOT be lazy loaded (they are
above the fold).

### DOM Size

```javascript
document.querySelectorAll('*').length
```

| DOM Nodes | Status |
|-----------|--------|
| < 1500 | OK |
| 1500–3000 | `warning` |
| > 3000 | `error` |

### External Resources

Count external scripts and stylesheets:
```javascript
{
  externalScripts: document.querySelectorAll('script[src]')
    .filter(s => !s.src.includes(location.hostname)).length,
  externalStylesheets: document.querySelectorAll('link[rel="stylesheet"]')
    .filter(l => !l.href.includes(location.hostname)).length,
}
```

High count of external resources → `info` (not blocking but worth noting)

## 7. Mobile Responsiveness

### Viewport Simulation

agent-browser runs a real browser, so viewport changes are accurate:

```bash
# Desktop (default)
agent-browser screenshot --full verification-screenshots/<slug>-1440.png

# Tablet
agent-browser eval 'window.innerWidth = 768'
agent-browser wait 500
agent-browser screenshot --full verification-screenshots/<slug>-768.png

# Mobile
agent-browser eval 'window.innerWidth = 375'
agent-browser wait 500
agent-browser screenshot --full verification-screenshots/<slug>-375.png
```

### Responsive Checks

- No horizontal overflow at 375px width (check `document.body.scrollWidth > window.innerWidth`)
- Touch targets are at least 44x44px (check button/link dimensions)
- Text is readable without zooming (font-size >= 14px on mobile)
