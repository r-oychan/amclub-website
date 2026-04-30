---
name: framer-clone
description: >-
  Clone a page or section from the Framer prototype (https://tactesting.framer.website)
  into the local React + Tailwind + Strapi build. Use when the user says "clone this
  page", "copy the design from Framer", "match the prototype", "replicate the
  Framer design", "make this look like Framer", "build this section from the
  mockup", "extract styles from Framer", or any request to mirror a section of the
  Framer prototype in the local implementation. Wraps Playwright (navigation, screenshots)
  and Chrome DevTools MCP (computed CSS, layout, content extraction) into a single
  side-by-side comparison workflow.
allowed-tools: Bash(playwright-cli:*), Bash(mkdir:*), Bash(curl:*)
---

# Framer-Clone — Side-by-Side Design Replication

This skill replicates a Framer prototype page/section into the local build by
running two browser contexts in parallel and extracting exact style and layout
values from Framer that you then translate into Tailwind classes + Strapi content.

## Tools

| Tool | What it's for |
|---|---|
| **`playwright-cli`** (Bash skill) | Navigation, full-page screenshots, scripted flows, snapshots |
| **Chrome DevTools MCP** (`mcp__chrome-devtools__*`) | Computed CSS, box-model, console, network, Lighthouse |

Both must be available. Playwright captures the visual baseline; Chrome DevTools
extracts the exact pixel/CSS values you need to reproduce in Tailwind.

## Quick Start

```
User: "Clone the Hero section on the home page from Framer"
You:
1. Open Framer + local build side by side at desktop XL (1440)
2. Capture screenshots of both
3. Extract computed CSS for the Hero element from Framer
4. Map values to existing DESIGN.md tokens (or extend if needed)
5. Edit React component using Tailwind classes
6. Re-capture local build, diff against Framer
7. Repeat at tablet (768) + mobile (375) breakpoints
8. Update SPECS.md if a new component or content type was added
```

## Inputs

| Input | Required | Default |
|---|---|---|
| Framer URL | yes | `https://tactesting.framer.website` |
| Local URL | yes | `http://localhost:5173` |
| Page path | yes | (ask user) |
| Section selector | optional | full page |
| Breakpoints | optional | 375, 768, 1200, 1440 |

## Pre-flight

```bash
# verify local dev server
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
# verify Framer is reachable
curl -s -o /dev/null -w "%{http_code}" https://tactesting.framer.website
mkdir -p screenshots/clone
```

If local returns non-200, tell the user: `cd frontend && npm run dev`.

## Phase 1 — Capture Both Sides

Open two browser contexts so Framer and the local build are inspected in parallel.

### A. Framer (use playwright-cli)

```bash
playwright-cli open https://tactesting.framer.website/<page>
playwright-cli wait --load networkidle
playwright-cli resize 1440 900
playwright-cli screenshot --full screenshots/clone/<page>-1440-framer.png
playwright-cli snapshot --filename screenshots/clone/<page>-framer.snapshot.yaml
```

### B. Local build (use Chrome DevTools MCP)

```
mcp__chrome-devtools__new_page { url: "http://localhost:5173/<page>" }
mcp__chrome-devtools__resize_page { width: 1440, height: 900 }
mcp__chrome-devtools__take_screenshot { fullPage: true, path: "screenshots/clone/<page>-1440-local.png" }
mcp__chrome-devtools__take_snapshot
```

## Phase 2 — Extract Design Tokens from Framer

Use Chrome DevTools MCP `evaluate_script` against the Framer page to read computed
styles. Always pull values from `getComputedStyle()`, not from inline attributes.

### Token extraction snippet

Run this inside `mcp__chrome-devtools__evaluate_script` — point the selector at
the Framer element (find it via `take_snapshot` first):

```js
(selector) => {
  const el = document.querySelector(selector);
  if (!el) return null;
  const cs = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return {
    text: el.textContent?.trim().slice(0, 200),
    box: { w: rect.width, h: rect.height, x: rect.x, y: rect.y },
    typography: {
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      fontStyle: cs.fontStyle,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      textTransform: cs.textTransform,
    },
    color: { color: cs.color, background: cs.backgroundColor },
    spacing: {
      padding: cs.padding,
      margin: cs.margin,
      gap: cs.gap,
    },
    layout: {
      display: cs.display,
      flexDirection: cs.flexDirection,
      justifyContent: cs.justifyContent,
      alignItems: cs.alignItems,
      gridTemplateColumns: cs.gridTemplateColumns,
    },
    decoration: {
      borderRadius: cs.borderRadius,
      boxShadow: cs.boxShadow,
      border: cs.border,
      transform: cs.transform,
      opacity: cs.opacity,
    },
  };
}
```

### Content extraction snippet

```js
() => ({
  headings: Array.from(document.querySelectorAll('h1,h2,h3')).map(el => ({ tag: el.tagName, text: el.textContent.trim() })),
  paragraphs: Array.from(document.querySelectorAll('p')).map(el => el.textContent.trim()),
  ctas: Array.from(document.querySelectorAll('a, button')).map(el => ({ label: el.textContent.trim(), href: el.getAttribute('href') })),
  images: Array.from(document.querySelectorAll('img')).map(el => ({ src: el.src, alt: el.alt, w: el.naturalWidth, h: el.naturalHeight })),
})
```

## Phase 3 — Map to DESIGN.md Tokens

For every value extracted from Framer:

1. Check `DESIGN.md` (project root) for an existing token (color name, type scale step, spacing step).
2. If a match exists → use the corresponding Tailwind class (e.g. `text-primary`, `text-h2`, `gap-8`).
3. If no match exists → **extend `DESIGN.md`** rather than hardcoding a hex/px value. Run `npx @google/design.md lint DESIGN.md` after the edit.
4. **Never** introduce raw hex codes, ad-hoc px sizes, or arbitrary spacing in components.

## Phase 4 — Translate to React + Strapi

| Element type | Where it lives |
|---|---|
| Layout / styling | Tailwind classes on the React component |
| Static structural choices | Component props with sensible defaults |
| Content (text, images, CTAs, ordering) | Strapi content type or component (per `SPECS.md`) |
| New visual variant | Add a `variant` prop, document in `SPECS.md` |

Edit the corresponding component in `frontend/src/components/blocks/` (or
`layout/`, `detail/`, etc.). Reuse existing block components when the structure
matches; only create a new component if the layout is genuinely new.

If you add or rename a component, update `SPECS.md`.

## Phase 5 — Verify Side-by-Side

For each breakpoint in `[375, 768, 1200, 1440]`:

```bash
# Framer
playwright-cli resize <bp> 900
playwright-cli screenshot --full screenshots/clone/<page>-<bp>-framer.png

# Local
# (via MCP)
mcp__chrome-devtools__resize_page { width: <bp>, height: 900 }
mcp__chrome-devtools__take_screenshot { fullPage: true, path: "screenshots/clone/<page>-<bp>-local.png" }
```

Then visually diff. Flag any of these as failures and iterate:

- Heading text mismatched, wrapped on a different line, or different font weight
- Button color, padding, or radius differs
- Section padding above/below differs by more than 4px
- Image aspect ratio or crop differs
- Element ordering differs
- Component missing on a breakpoint where it should appear

## Phase 6 — Console + Network Sanity

After visual match, confirm runtime health on the local build:

```
mcp__chrome-devtools__list_console_messages   // expect no errors
mcp__chrome-devtools__list_network_requests   // confirm Strapi calls 200 OK; no failed asset loads
```

Optionally run a Lighthouse audit on the cloned page:

```
mcp__chrome-devtools__lighthouse_audit { url: "http://localhost:5173/<page>" }
```

## Phase 7 — Update Spec & Wrap

1. Update `SPECS.md` if any of: page added, component added/renamed, Strapi binding changed.
2. Run the standard verification chain:
   ```bash
   cd frontend && npm run typecheck && npm run lint && npm run build
   ```
3. Run the post-iteration browser regression sweep (see CLAUDE.md → "Workflow: Post-Iteration Browser Testing").

## Output Conventions

- All screenshots: `screenshots/clone/<page>-<breakpoint>-<framer|local>.png`
- All snapshots: `screenshots/clone/<page>-<framer|local>.snapshot.yaml`
- Extracted tokens (if you write them down): `screenshots/clone/<page>-tokens.json` — for your own reference; do not commit unless asked.

## Hard Rules

- Always extract from Framer with `getComputedStyle()`, never trust inline styles.
- Always map to existing tokens before adding new ones.
- Never hardcode content in React — it goes in Strapi, surfaced via props.
- Never skip the side-by-side verification phase. A "looks about right" without a screenshot diff is not done.
- If Framer's layout uses a non-standard hack (negative margins, absolute positioning chains), prefer the cleanest Tailwind/flex/grid translation and confirm it visually matches — don't transcribe pixel-for-pixel hacks.

## Common Pitfalls

| Symptom | Likely Cause | Fix |
|---|---|---|
| Text wraps differently | Different font, line-height, or container width | Re-check `font-family`, `line-height`, `max-width` from computed styles |
| Section feels "tighter" | Padding / gap mismatch | Re-extract `padding`, `margin`, `gap` and map to spacing tokens |
| Image looks different | Aspect ratio or `object-fit` differs | Compare `getBoundingClientRect()` of both images, check `object-fit` |
| Hover state doesn't match | Framer transitions weren't captured | Re-run `evaluate_script` after `:hover` (use `el.matches(':hover')`) or trigger via Playwright `hover` |
| Mobile layout breaks | Breakpoint missed | Re-capture at 375 + 768 and inspect computed `display` / `grid-template-columns` |

## Related

- `DESIGN.md` — design tokens (source of truth)
- `SPECS.md` — component / page / Strapi inventory
- `playwright-cli` skill — browser automation primitives
- `chrome-devtools-mcp:chrome-devtools` skill — general debugging / automation guide for Chrome DevTools MCP
- `chrome-devtools-mcp:chrome-devtools-cli` skill — shell-script Chrome DevTools when batching inspections
- `chrome-devtools-mcp:debug-optimize-lcp`, `a11y-debugging`, `memory-leak-debugging` — targeted audits
- `site-verifier` skill — broader regression and visual diff tooling
- Chrome DevTools MCP repo: https://github.com/ChromeDevTools/chrome-devtools-mcp
- Awesome Chrome DevTools: https://github.com/ChromeDevTools/awesome-chrome-devtools
