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
- This project uses 7 custom skills in `.claude/skills/`
- The `/build-cms-site` command orchestrates the full pipeline
- Skills communicate via JSON files at the project root (see pipeline docs in the command)
- When building frontend, also consult the `frontend-design` skill for aesthetics
- When writing Pulumi code, also consult installed `pulumi-authoring` skills

## Guardrails
- Never commit secrets, API keys, or .env files
- Never run `npm install` with `--force` or `--legacy-peer-deps` without asking
- Never modify `site-analysis.json` or `content-inventory.json` manually — these are generated
- Always run verification commands before committing
- Always ask before destructive operations (drop database, delete content types)

## Design Reference (from DESIGN.md)

The mockup prototype is at **https://tactesting.framer.website** — always verify against it.

### Breakpoints
| Breakpoint | Range | Nav Layout |
|---|---|---|
| Mobile | 320px - 767px | Hamburger menu |
| Tablet | 768px - 1199px | Hamburger menu |
| Desktop L | 1200px - 1439px | Floating dark navy bar |
| Desktop XL | 1440px+ | Full-width top bar |

### Typography
- **Heading font:** Noto Serif (Google Fonts) — Light Italic for H1/H2
- **Body font:** Lato (Google Fonts)
- See `DESIGN.md` §2 for full text hierarchy (H1–Small, CTA styles)

### Color Palette
| Name | Hex | Usage |
|---|---|---|
| Primary (Navy) | `#001E62` | CTAs, Links, Nav bg |
| Primary Dark | `#00164A` | Darker navy |
| Secondary (Teal) | `#6BBBAE` | Accents |
| Secondary (Rouge) | `#DF4661` | Accents |
| Dark (Charcoal) | `#3F4452` | Text, Headings |
| Light (Cream) | `#F5F4F2` | Backgrounds |
| Text Light | `rgba(255,255,255,0.77)` | Light text on dark bg |

### Component Inventory
Hero (8), Card Grid (9), CTA Banner (10), Feature Grid (5), Text Block (3), Stats Counter (2), FAQ (2), Tabs (2), Testimonial (1), Team Grid (2)

Full design spec in `DESIGN.md` at project root.

## Workflow: Mockup Verification
- **Before starting work:** Open the Framer prototype (https://tactesting.framer.website) and review the target page/section to understand the design intent, layout, spacing, and visual style.
- **After completing work:** Compare the built output against the Framer prototype to ensure alignment with the mockup. Check at multiple breakpoints (mobile, tablet, desktop).
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