# CMS Website Builder

## Project Overview
- Monorepo building dynamic websites backed by headless CMS (Strapi v5)
- Frontend: React 19 + Vite + Tailwind CSS + TypeScript
- Backend/CMS: Strapi v5 with PostgreSQL (production), SQLite (dev)
- Infrastructure: Azure (Container Apps, PostgreSQL, Blob Storage) via Pulumi (TypeScript)
- CI/CD: GitHub Actions
- Node.js 20+, npm (not yarn, not pnpm)

## Directory Structure
- `cms/` — Strapi backend project
- `frontend/` — React + Vite frontend
- `infra/` — Pulumi IaC (TypeScript)
- `.github/workflows/` — CI/CD pipelines
- `site-analysis.json` — mockup analysis output (generated)
- `content-inventory.json` — extracted content (generated)
- `content-types/` — Strapi model definitions (generated)
- `components/` — Strapi component definitions (generated)

## Code Conventions
- TypeScript strict mode everywhere, no `any`
- Named exports only (no default exports except React pages)
- 2-space indentation, semicolons, single quotes
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`

## Verification Commands
- Frontend: `cd frontend && npm run typecheck && npm run lint && npm run build`
- CMS: `cd cms && npm run build`
- Infra: `cd infra && npx tsc --noEmit`
- Full test: `npm run test` (root package.json runs all)

## Working With Skills
- Custom skills live in `.claude/skills/`. Key ones:
  - **`framer-clone`** — clone a section/page from the Framer prototype using Playwright + Chrome DevTools MCP side-by-side. Use this for any "match Framer" / "copy the design" task.
  - `design-ingest` — crawl a source URL into `site-analysis.json` + `content-inventory.json`.
  - `cms-data-modeler` — generate Strapi content types from analysis.
  - `frontend-builder` — scaffold the React/Vite/Tailwind frontend.
  - `site-verifier` — visual regression + link/SEO checks against baseline screenshots.
  - `agent-browser`, `playwright-cli` — browser automation primitives.
  - `cloud-deploy` — Pulumi → Azure deployment.
- The `/build-cms-site` command orchestrates the full pipeline.
- Skills communicate via JSON files at the project root (see pipeline docs in the command).
- For visual / cloning work, **always combine Playwright (navigation, screenshots) with Chrome DevTools MCP (computed CSS, layout inspection)** — see "Workflow: Framer-Clone Design Replication" below.
- When building frontend, also consult the `frontend-design` skill for aesthetics.
- When writing Pulumi code, also consult installed `pulumi-authoring` skills.

## Guardrails
- Never commit secrets, API keys, or .env files
- Never run `npm install` with `--force` or `--legacy-peer-deps` without asking
- Never modify `site-analysis.json` or `content-inventory.json` manually — these are generated
- Always run verification commands before committing
- Always ask before destructive operations (drop database, delete content types)

## Design Reference

- **Source of truth:** [`DESIGN.md`](../DESIGN.md) at the project root — follows the Stitch [DESIGN.md spec](https://github.com/google-labs-code/design.md) (`alpha`). YAML frontmatter holds machine-readable tokens (colors, typography, rounded, spacing, components); markdown body holds rationale and usage rules.
- **Mockup prototype:** https://tactesting.framer.website — always verify against it.
- **Read `DESIGN.md` before touching anything visual.** Do not duplicate tokens, colors, type scales, breakpoints, or component rules into other files — reference `DESIGN.md` instead. Keeping one source avoids drift.
- **Validate changes:** `npx @google/design.md lint DESIGN.md` (0 errors, 0 warnings expected). Also `export --format tailwind|dtcg` and `diff` are available.

## Workflow: Framer-Clone Design Replication (PRIMARY WORKFLOW)

The core workflow of this project is to **clone the Framer prototype** (https://tactesting.framer.website) into our own React + Tailwind + Strapi implementation. We do this by inspecting Framer side-by-side with the local build using two complementary browser tools:

| Tool | Use For | Invocation |
|---|---|---|
| **`playwright-cli`** skill | Navigation, snapshots, form interaction, screenshots, scripted page flows | `playwright-cli open <url>`, `playwright-cli snapshot`, `playwright-cli screenshot --full` |
| **Chrome DevTools MCP** (`mcp__chrome-devtools__*`) | Computed CSS extraction, layout/box-model inspection, console + network logs, Lighthouse audits, viewport emulation | `mcp__chrome-devtools__evaluate_script`, `mcp__chrome-devtools__take_snapshot`, `mcp__chrome-devtools__list_network_requests`, `mcp__chrome-devtools__lighthouse_audit` |
| **`chrome-devtools-mcp:chrome-devtools`** skill | High-level guide for debugging/automation with Chrome DevTools MCP | invoke via Skill tool when general debugging is needed |
| **`chrome-devtools-mcp:chrome-devtools-cli`** skill | Shell-script automation of Chrome DevTools | invoke when scripting batch inspections |
| **`chrome-devtools-mcp:debug-optimize-lcp`**, **`a11y-debugging`**, **`memory-leak-debugging`** | Targeted audits — performance, accessibility, memory | invoke per task when those concerns arise |

**Use both — they complement each other.** Playwright is best at scripted navigation and full-page captures; Chrome DevTools MCP is best at extracting *exact* style values (computed CSS, box dimensions, colors, fonts) that you must mirror in Tailwind classes.

### Standard Cloning Procedure

For every page or section being cloned from the Framer prototype:

1. **Open Framer** in one browser context (`playwright-cli open https://tactesting.framer.website/<page>`) and **open the local build** in another (`mcp__chrome-devtools__new_page http://localhost:5173/<page>`).
2. **Capture both at the target breakpoint** (use `playwright-cli resize 1440 900` and `mcp__chrome-devtools__resize_page` / `emulate`). Save side-by-side screenshots to `screenshots/clone/<page>-<bp>-{framer,local}.png`.
3. **Extract design tokens from Framer** — use Chrome DevTools `evaluate_script` to read `getComputedStyle(...)` for the target element. Pull: font-family, font-size, font-weight, line-height, letter-spacing, color, background-color, padding, margin, gap, border-radius, box-shadow, transform.
4. **Inspect layout** — use `take_snapshot` to get the DOM tree + ARIA structure, and `evaluate_script` with `getBoundingClientRect()` to capture exact widths, heights, and positions.
5. **Inspect content** — extract text, image URLs, and CTA labels via `evaluate_script` (e.g. `Array.from(document.querySelectorAll('h2')).map(el => el.textContent)`).
6. **Translate to our stack:**
   - Map computed colors/spacing to existing tokens in `DESIGN.md` and Tailwind theme. Do **not** add raw hex values — extend `DESIGN.md` if a token is missing.
   - Express layouts in Tailwind utility classes; respect the 4 project breakpoints.
   - Move content into Strapi content types per `SPECS.md`; do not hardcode in React.
7. **Verify** — re-capture the local build at every breakpoint and diff against the Framer captures. Iterate until they match.

### When to use which tool

- **Choosing classes / spacing / typography?** → Chrome DevTools MCP `evaluate_script` on the Framer element. Read computed values, then map to Tailwind.
- **Capturing visual baselines or full-page screenshots?** → `playwright-cli screenshot --full`.
- **Debugging a layout issue in the local build?** → Chrome DevTools MCP `list_console_messages` + `take_snapshot` on `localhost:5173`.
- **Checking responsive behavior?** → `playwright-cli resize` (or `mcp__chrome-devtools__resize_page`) at each breakpoint (375, 768, 1200, 1440).
- **Running a performance / accessibility check?** → `mcp__chrome-devtools__lighthouse_audit`.

### Helper skill

The `framer-clone` skill (`.claude/skills/framer-clone/SKILL.md`) wraps the above procedure with concrete commands and example output. Invoke it whenever the user asks to "clone", "match Framer", "copy the design from the prototype", or "make this section look like the mockup".

## Workflow: Mockup Verification (legacy)
- **Before starting work:** Open the Framer prototype and review the target page/section to understand the design intent, layout, spacing, and visual style. Prefer the structured Framer-Clone procedure above for new work.
- **After completing work:** Compare the built output against the Framer prototype at multiple breakpoints (mobile, tablet, desktop).
- Use `screenshots/breakpoints/` for reference when the prototype is unavailable.

## Workflow: Post-Iteration Browser Testing (REQUIRED)
After every dev iteration (fix, feature, or refactor), you MUST use the `playwright-cli` skill to run a browser regression test before considering the work done.

**Step 1 — Regression sweep:** Navigate through the site (starting at `http://localhost:5173`) and visit every page/route that exists. For each page, verify:
- Page renders without blank screens or console errors
- Navigation links work
- No layout breakage at desktop width (1440px)

**Step 2 — Targeted test:** Test the specific fix or feature implemented in this iteration:
- For a bug fix: reproduce the original failure condition and confirm it no longer occurs
- For a new feature: exercise the feature end-to-end (interact with it, check expected output)
- For a refactor: confirm the visible behavior is identical before and after

**Step 3 — Report:** After testing, briefly state what was tested and whether it passed or failed. If anything fails, fix it before finishing.

## Workflow: CMS Wiring (REQUIRED for every page)

The frontend must render content fetched from Strapi at runtime. Hardcoded text, image URLs, and CTAs in page or section components are **regressions** — even if the page "looks right," it is broken until it loads from CMS. The current site has 18 Strapi content types defined but mostly empty entries, and most pages render inline literals; closing this gap is ongoing work and applies to every new feature.

### Definition of Done for any page

A page is only "done" when **all four** are true:
1. A matching Strapi content type exists (single-type for one-off pages like `home-page`, `about-page`; collection-type for repeated entities like `events`, `venues`, `committee-members`).
2. The page component (and the section components it composes) accept content as **props only** — no hardcoded strings, image URLs, hrefs, or arrays of items.
3. The page fetches its data via `fetchAPI` from `frontend/src/lib/api.ts` and passes it down. Loading and empty states are handled. Pattern reference: `frontend/src/pages/VenueDetailPage.tsx`, `frontend/src/hooks/useHeaderData.ts`.
4. A real entry has been created in the deployed Strapi (or seeded via the migration script), is published, and the deployed public URL renders that entry's content.

### Standard procedure (per page)

1. **Read `SPECS.md`** for the page's expected content shape and CMS binding. Update `SPECS.md` if reality has drifted.
2. **Verify the Strapi schema** in `cms/src/api/<type>/content-types/<type>/schema.json` matches what the page needs. If a field is missing, add it to the schema, regenerate, and redeploy the CMS before touching the frontend.
3. **Refactor the page** to consume props instead of literals:
   - Move every string, image URL, CTA href, and list into a typed prop interface in `frontend/src/lib/types.ts`.
   - Replace inline data with a `fetchAPI<PageData>('/<slug>', { populate: 'deep' })` call (use `populate` correctly — Strapi v5 uses `populate[field]=...` or `populate=*`).
   - Render loading and empty states. Never render a blank page if the fetch fails.
4. **Seed the content** in the deployed Strapi:
   - Preferred: extend the migration script (`content-inventory.json` is the source of truth for initial copy) and run it against the deployed instance.
   - Acceptable for one-offs: enter directly in `/admin` and document the entry in `SPECS.md`.
5. **Verify end-to-end** at the deployed URL (not just `localhost`). Confirm the page renders the CMS entry, then change a field in `/admin`, republish, and confirm the change appears on the public site after a refresh. Capture before/after screenshots if the change is visible.
6. **Run the post-iteration browser regression sweep** described elsewhere in this file.

### Hard rules

- **Never** hardcode user-facing content in a page or block component. If you find yourself typing real copy into a `.tsx`, stop and create or extend a CMS field instead.
- **Never** ship a page that renders fine offline because the data is inlined — that defeats the entire CMS.
- **Never** populate the CMS as a one-off in `/admin` without recording the entry shape in `SPECS.md` and ideally in the migration script. Otherwise the next environment loses the content.
- **Never** point `VITE_STRAPI_URL` at `localhost` in a deployed build. The deployed frontend talks to its own origin (`/api`) via the nginx proxy.
- **Always** keep `content-inventory.json` and the Strapi schemas aligned. If you add a content type or field, add it in both places in the same commit.

### When wiring up a brand-new page

Same procedure, but in this order: (a) define the content type in `cms/src/api/...`, (b) add the page entry to `content-inventory.json`, (c) build the page component prop-first against a fixture, (d) wire `fetchAPI`, (e) deploy CMS schema, (f) seed entry, (g) verify.

### Migration backlog

The list of pages still using hardcoded content (must be migrated to CMS-driven):
`HomePage`, `AboutPage`, `DiningPage`, `FitnessPage`, `KidsPage`, `MembershipPage`, `EventSpacesPage`, `WhatsOnPage`, `GalleryPage`, `NewsPage`, `ContactUsPage`. Already wired: `VenueDetailPage`, header nav (`useHeaderData`).

Track progress in `SPECS.md` — mark each page as `cms-wired: true` once it meets the Definition of Done above.

## Flexibility & Componentization
- **Componentize everything:** Every distinct visual section on a page should be its own React component.
- **Make everything configurable:** Props should drive content, layout variants, colors, and visibility. Avoid hardcoding text, images, or layout decisions inside components.
- **CMS-driven:** All content should come from Strapi. Components receive data via props, not static imports.
- **Variant support:** Components should support visual variants (e.g., light/dark background, left/right image alignment) via props.
- **Slot patterns:** Use children/render props for flexible composition where appropriate.

## Spec Tracking
- `SPECS.md` at the project root is the source of truth for every page, component, CMS binding, animation, and infra resource.
- **Read `SPECS.md` at the start of any feature or fix** to understand the current structure before touching code.
- **Update `SPECS.md`** whenever you add, rename, or remove a page, component, content type, Strapi component, or infra resource. Keep it in sync with the code.

## Documentation Policy
- **Always consult official online docs** when you are stuck on a bug, hit an unexpected error, or the user asks for a fix — do not guess from memory alone.
- Priority order for doc lookups: official library/framework docs first, then GitHub issues, then community sources.
- Key doc sources:
  - Strapi v5: https://docs.strapi.io
  - React / React Router: https://reactrouter.com/docs and https://react.dev
  - Tailwind CSS v4: https://tailwindcss.com/docs
  - Pulumi Azure Native: https://www.pulumi.com/registry/packages/azure-native/
  - Vite: https://vite.dev/guide
  - TypeScript: https://www.typescriptlang.org/docs

## Clarification Policy
- Use `AskUserQuestion` tool whenever requirements are ambiguous, design intent is unclear, or a decision could go multiple ways. Do not guess — ask.

## Agent Teams
- If using agent teams, each teammate owns ONE directory (cms/, frontend/, infra/)
- No two teammates should edit the same files
- The lead coordinates, teammates execute