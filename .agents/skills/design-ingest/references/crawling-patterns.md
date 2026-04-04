# Crawling Patterns Reference

Patterns for handling common web crawling challenges with agent-browser.

## SPA Detection and Navigation

### Detecting the Framework

Run this on the homepage to identify the framework:

```bash
agent-browser eval --stdin <<'EVALEOF'
JSON.stringify({
  react: !!document.querySelector('[data-reactroot], #__next, #root'),
  nextjs: typeof window.__NEXT_DATA__ !== 'undefined',
  nuxt: !!document.querySelector('#__nuxt'),
  vue: !!document.querySelector('[data-v-]'),
  framer: !!document.querySelector('[data-framer-name]'),
  webflow: !!document.querySelector('.w-webflow-badge, html[data-wf-site]'),
  wordpress: !!document.querySelector('meta[name="generator"][content*="WordPress"]'),
  gatsby: !!document.querySelector('#___gatsby'),
  angular: !!document.querySelector('[ng-version], [_nghost]'),
  svelte: !!document.querySelector('[class*="svelte-"]'),
})
EVALEOF
```

### Framer Sites

Framer sites use client-side routing. Direct URL navigation may not work for
all routes. Instead:

1. Open the homepage
2. Use `snapshot -i` to find nav elements
3. Click nav links to navigate between pages
4. After each click: `wait --load networkidle` then re-snapshot

Framer assigns `data-framer-name` attributes that map to component names in
the Framer editor — capture these for better component naming.

### Next.js / Gatsby Sites

These support both server-side rendering and client-side navigation. Direct
URL access works fine. However, `getServerSideProps` / `getStaticProps` data
won't be in the DOM initially — wait for hydration:

```bash
agent-browser open <url> && agent-browser wait --load networkidle
```

### Vue / Nuxt Sites

Similar to React. Look for `#__nuxt` or `[data-v-]` attributes. Direct URL
navigation works for Nuxt (SSR). For pure Vue SPAs, use click-based navigation.

## Pagination Handling

### Detection

```bash
agent-browser eval --stdin <<'EVALEOF'
JSON.stringify({
  numbered: !!document.querySelector('[class*="pagination"], nav[aria-label="pagination"], .page-numbers'),
  loadMore: !!document.querySelector('button[class*="load-more"], [class*="load-more"]'),
  infiniteScroll: !!document.querySelector('[data-infinite-scroll], [class*="infinite"]'),
  nextLink: document.querySelector('a[rel="next"], a[class*="next"]')?.href || null,
  totalPages: document.querySelector('[class*="pagination"] a:last-of-type')?.textContent?.trim() || null,
})
EVALEOF
```

### Strategy

- **Numbered pagination**: Record URL pattern (e.g., `?page={n}`), capture page 1
  content, note total pages for content-migration
- **Load more**: Click the button, wait for new content, re-extract. Repeat
  until button disappears. Record total items found.
- **Infinite scroll**: Scroll to bottom repeatedly until no new content loads.
  Use `agent-browser eval 'document.body.scrollHeight'` before and after scroll
  to detect new content.
- **Cursor-based**: Record the API endpoint if detectable from network requests.

## Lazy-Loaded Content

### Triggering All Content to Load

```bash
# Scroll to bottom in increments to trigger intersection observers
agent-browser eval --stdin <<'EVALEOF'
(async () => {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const totalHeight = document.body.scrollHeight;
  const step = window.innerHeight;
  for (let pos = 0; pos < totalHeight; pos += step) {
    window.scrollTo(0, pos);
    await delay(300);
  }
  window.scrollTo(0, 0);
  return 'done';
})()
EVALEOF
agent-browser wait 2000
```

### Detecting Lazy Images

```bash
agent-browser eval --stdin <<'EVALEOF'
JSON.stringify(
  Array.from(document.querySelectorAll('img[loading="lazy"], img[data-src], img[data-lazy]'))
    .map(img => ({
      currentSrc: img.src,
      dataSrc: img.dataset.src || img.dataset.lazy || null,
      loaded: img.complete && img.naturalWidth > 0,
    }))
)
EVALEOF
```

## Multi-Level Navigation

### Extracting Nested Navigation

```bash
agent-browser eval --stdin <<'EVALEOF'
function extractNav(container) {
  const items = [];
  const topLevel = container.querySelectorAll(':scope > li, :scope > a, :scope > div > a');
  topLevel.forEach(item => {
    const link = item.tagName === 'A' ? item : item.querySelector('a');
    if (!link) return;
    const entry = {
      label: link.textContent.trim(),
      href: link.href,
    };
    const submenu = item.querySelector('ul, [class*="submenu"], [class*="dropdown"]');
    if (submenu) {
      entry.children = extractNav(submenu);
    }
    items.push(entry);
  });
  return items;
}
const nav = document.querySelector('nav, [role="navigation"], header');
JSON.stringify(nav ? extractNav(nav.querySelector('ul') || nav) : []);
EVALEOF
```

### Mega Menus

Some sites have mega menus that only appear on hover. Trigger them:

```bash
# Hover over a nav item to reveal its mega menu
agent-browser snapshot -i
agent-browser eval 'document.querySelector("nav li:nth-child(2)").dispatchEvent(new MouseEvent("mouseenter", {bubbles: true}))'
agent-browser wait 500
agent-browser snapshot -c  # Capture the revealed menu
```

## Content Extraction Patterns

### Rich Text Extraction

For WYSIWYG content areas, extract the HTML (not just text) to preserve
formatting:

```bash
agent-browser eval --stdin <<'EVALEOF'
JSON.stringify(
  Array.from(document.querySelectorAll('article, [class*="content"], [class*="body"], .prose'))
    .map(el => ({
      selector: el.className,
      html: el.innerHTML,
      text: el.innerText,
      wordCount: el.innerText.split(/\s+/).length,
    }))
)
EVALEOF
```

### Image Extraction With Context

```bash
agent-browser eval --stdin <<'EVALEOF'
JSON.stringify(
  Array.from(document.querySelectorAll('img'))
    .filter(img => img.naturalWidth > 50)
    .map(img => ({
      src: img.src,
      alt: img.alt,
      width: img.naturalWidth,
      height: img.naturalHeight,
      context: img.closest('section, article, div')?.className || '',
      isBackground: false,
    }))
    .concat(
      Array.from(document.querySelectorAll('[style*="background-image"]'))
        .map(el => {
          const match = getComputedStyle(el).backgroundImage.match(/url\(["']?(.+?)["']?\)/);
          return match ? {
            src: match[1],
            alt: '',
            width: el.offsetWidth,
            height: el.offsetHeight,
            context: el.className,
            isBackground: true,
          } : null;
        })
        .filter(Boolean)
    )
)
EVALEOF
```

## Error Handling

### Page Load Failures

If `agent-browser open` times out:

1. Try with explicit timeout: `agent-browser wait --load networkidle`
2. If still failing, check if the site requires JavaScript — try
   `agent-browser eval 'document.readyState'`
3. For sites behind WAF/Cloudflare, you may need to add a wait and retry
4. Report the failure in the analysis output rather than silently skipping

### Element Not Found

If a snapshot shows no interactive elements:

1. The page may not be fully loaded — add `wait 3000`
2. Content may be in iframes — check with
   `agent-browser eval 'document.querySelectorAll("iframe").length'`
3. Content may be in Shadow DOM — these won't appear in standard snapshots

## Performance Tips

- **Chain commands** with `&&` when you don't need intermediate output
- **Use sessions** for parallel crawling of independent pages
- **Limit design token extraction** to 20 values — extracting all computed
  styles from every element is extremely slow on large pages
- **Skip duplicate screenshots** — if a template has 50 instances, screenshot
  one representative, not all 50
