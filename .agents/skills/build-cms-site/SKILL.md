---
name: build-cms-site
description: >-
  Orchestrate the full CMS website build pipeline from mockup to deployment.
  Use when the user says "build the site", "build CMS site", "run the full
  pipeline", "build from mockup", "create the website", or provides a URL and
  wants the entire workflow: analyze → model → CMS setup → frontend → content
  migration → verification → deployment. Coordinates all 7 skills in dependency
  order with optional agent team parallelism.
allowed-tools: Bash(agent-browser:*), Bash(npx:*), Bash(npm:*), Bash(mkdir:*), Bash(cp:*), Bash(mv:*), Bash(chmod:*), Bash(cat:*), Bash(ls:*), Bash(cd:*), Bash(node:*), Bash(openssl:*), Bash(curl:*), Bash(docker:*), Bash(docker-compose:*)
argument-hint: "[mockup-url]"
---

# Build CMS Site — Full Pipeline Orchestrator

Coordinate all 7 skills to go from a mockup URL to a deployed CMS-backed website.

## Usage

```
/build-cms-site https://example-mockup.framer.website
```

Or without a URL (will prompt for one):
```
/build-cms-site
```

## Pipeline Overview

```
                    ┌─────────────────┐
                    │  1. design-ingest│  ← User provides mockup URL
                    │  (crawl & analyze)│
                    └────────┬────────┘
                             │
                    site-analysis.json
                    content-inventory.json
                    screenshots/
                             │
                    ┌────────┴────────┐
                    │ 2. cms-data-modeler│  ← User confirms data model
                    │ (design schemas) │
                    └────────┬────────┘
                             │
                    content-types/
                    components/
                    data-model.mermaid
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────┴───┐  ┌──────┴─────┐  ┌─────┴──────┐
     │3. strapi-  │  │4. frontend-│  │7. cloud-   │
     │   setup    │  │   builder  │  │   deploy   │
     │(scaffold)  │  │(React+Vite)│  │(Docker+IaC)│
     └────────┬───┘  └──────┬─────┘  └─────┬──────┘
              │              │              │
              cms/           frontend/      infra/
              │              │              .github/
              │              │              Dockerfiles
              ├──────────────┘
              │
     ┌────────┴────────┐
     │ 5. content-     │  ← CMS must be running
     │    migration    │
     │ (populate CMS)  │
     └────────┬────────┘
              │
     ┌────────┴────────┐
     │ 6. site-verifier│  ← Both must be running
     │ (test & compare)│
     └─────────────────┘
```

## Step-by-Step Execution

### Step 0: Gather Requirements

If no URL was provided as `$ARGUMENTS`, ask the user:

> What is the URL of the mockup or site you want to replicate?

Then ask about scope:

> Which parts of the pipeline do you want to run?
> 1. **Full pipeline** — analyze → model → CMS + frontend + deploy → migrate → verify
> 2. **Build only** — analyze → model → CMS + frontend (no deployment, no migration)
> 3. **Resume from step N** — if a previous run was interrupted

Record the URL as `MOCKUP_URL` and scope as `PIPELINE_SCOPE`.

### Step 1: Design Ingest

**Skill:** `design-ingest`
**Input:** `MOCKUP_URL`
**Gate:** User confirms the site analysis summary

Run the design-ingest skill. It will:
1. Crawl the mockup URL
2. Capture screenshots
3. Extract structure → `site-analysis.json`
4. Extract content → `content-inventory.json`
5. Present summary for user review

**Wait for user confirmation before proceeding.** The user may want to adjust
page classifications, component types, or exclude sections.

**Checkpoint files:**
- `site-analysis.json` ← must exist to proceed
- `content-inventory.json` ← must exist to proceed
- `screenshots/` directory with at least one image

### Step 2: CMS Data Modeler

**Skill:** `cms-data-modeler`
**Input:** `site-analysis.json`
**Gate:** User confirms the data model and Mermaid diagram

Run the cms-data-modeler skill. It will:
1. Read site-analysis.json
2. Design Strapi content types and components
3. Generate `data-model.mermaid`
4. Present the model for user review

**Wait for user confirmation before proceeding.** The user may want to adjust
field types, add relations, or change how components map to content types.

**Checkpoint files:**
- `content-types/` directory with at least one `schema.json`
- `components/` directory with shared and block components
- `data-model.mermaid`

### Step 3–4–7: Parallel Build Phase

After the data model is confirmed, three skills can run in parallel because
they have no dependencies on each other — they all read from `content-types/`
and `components/` but write to separate directories:

| Skill | Writes to | Can run in parallel |
|-------|-----------|-------------------|
| `strapi-setup` | `cms/` | Yes |
| `frontend-builder` | `frontend/` | Yes |
| `cloud-deploy` | `infra/`, `.github/`, `Dockerfile.*` | Yes |

**If using agent teams**, spawn three teammates:

```
Team: build-cms-site
├── cms-agent      → runs strapi-setup      → owns cms/
├── frontend-agent → runs frontend-builder  → owns frontend/
└── infra-agent    → runs cloud-deploy      → owns infra/, .github/, Dockerfiles
```

Each teammate owns ONE directory. No two teammates edit the same files.

**If running sequentially** (no team), execute in this order:
1. `strapi-setup` (needed for content migration)
2. `frontend-builder`
3. `cloud-deploy` (can be deferred to after verification)

**Skip `cloud-deploy` if `PIPELINE_SCOPE` is "Build only".**

Before running `frontend-builder`, ask about the CMS API URL. In dev it's
typically `http://localhost:1337`. The frontend needs this for API calls.

**Checkpoint files after this phase:**
- `cms/` with successful `npm run build`
- `frontend/` with successful `npm run build`
- `infra/` with Pulumi program (if deployment scope)
- `Dockerfile.cms`, `Dockerfile.frontend` (if deployment scope)

### Step 5: Content Migration

**Skill:** `content-migration`
**Prerequisite:** Strapi must be running

Before running content-migration:

1. **Start Strapi dev server:**
   ```bash
   cd cms && npm run develop
   ```
   Wait for it to be accessible at http://localhost:1337.

2. **Create admin account:** The user must create an admin account at
   http://localhost:1337/admin on first run. Ask them to do this and provide
   an API token for content creation.

3. **Run content-migration** with the API token.

It will:
1. Read `content-inventory.json`
2. Upload media to Strapi
3. Create entries in dependency order
4. Produce `migration-report.json`

**Checkpoint files:**
- `migration-report.json` with zero failures

### Step 6: Site Verification

**Skill:** `site-verifier`
**Prerequisite:** Both Strapi and frontend dev server running

Before running site-verifier:

1. **Ensure Strapi is still running** from step 5.
2. **Start the frontend dev server:**
   ```bash
   cd frontend && npm run dev
   ```
   Wait for it to be accessible at http://localhost:5173.

3. **Run site-verifier** comparing against the original `screenshots/`.

It will:
1. Navigate every page
2. Capture new screenshots
3. Compare against originals (visual diff)
4. Check links, SEO, API responses
5. Produce `verification-report.json`

**Review the report with the user.** If there are failures:
- Visual diff > 30% on a page → review the screenshot, fix frontend component
- Broken links → fix routing or navigation
- Missing SEO → fix meta tag rendering
- API errors → fix Strapi content type or frontend fetch

Iterate on fixes and re-verify until the report passes.

## Inter-Skill Communication

Skills communicate via files at the project root. Here is the complete map:

| File | Producer | Consumers |
|------|----------|-----------|
| `site-analysis.json` | design-ingest | cms-data-modeler, frontend-builder, site-verifier |
| `content-inventory.json` | design-ingest | content-migration |
| `screenshots/` | design-ingest | site-verifier (baseline) |
| `content-types/` | cms-data-modeler | strapi-setup, frontend-builder, content-migration |
| `components/` | cms-data-modeler | strapi-setup |
| `data-model.mermaid` | cms-data-modeler | User review only |
| `cms/` | strapi-setup | content-migration, site-verifier, cloud-deploy |
| `frontend/` | frontend-builder | site-verifier, cloud-deploy |
| `migration-report.json` | content-migration | User review only |
| `verification-report.json` | site-verifier | User review only |
| `infra/` | cloud-deploy | CI/CD pipelines |

**Rule:** Never manually edit generated JSON files (`site-analysis.json`,
`content-inventory.json`, `migration-report.json`, `verification-report.json`).
Rerun the producing skill instead.

## Resuming an Interrupted Pipeline

If the pipeline was interrupted, check which checkpoint files exist:

```
site-analysis.json exists?      → Step 1 complete, skip to Step 2
content-types/ exists?          → Step 2 complete, skip to Step 3
cms/package.json exists?        → Step 3 complete (CMS)
frontend/package.json exists?   → Step 4 complete (Frontend)
migration-report.json exists?   → Step 5 complete, skip to Step 6
verification-report.json exists? → Step 6 complete, pipeline done
```

Ask the user: "I found existing outputs from a previous run. Should I resume
from Step N, or start fresh?"

## Agent Team Configuration

When using agent teams for the parallel build phase (Step 3-4-7):

**Team name:** `build-cms-site`

**Teammates:**

| Name | Subagent Type | Skill | Owns |
|------|--------------|-------|------|
| `cms-agent` | `general-purpose` | strapi-setup | `cms/` |
| `frontend-agent` | `general-purpose` | frontend-builder | `frontend/` |
| `infra-agent` | `general-purpose` | cloud-deploy | `infra/`, `.github/`, `Dockerfile.*` |

**Coordination rules:**
- Lead (you) coordinates timing and user interactions
- Each teammate runs one skill and reports completion
- No teammate edits files outside their owned directory
- If a teammate needs information from another (e.g., frontend needs CMS URL),
  route it through the lead
- All user-facing questions (plugin choices, cloud provider, etc.) go through
  the lead — teammates do not ask the user directly

**When NOT to use teams:**
- User explicitly says "do it step by step" or "one at a time"
- The machine has limited resources (ask if unsure)
- Debugging a specific skill failure (run that skill solo)

## Verification Commands

After the pipeline completes, run these to verify everything:

```bash
# CMS builds
cd cms && npm run build

# Frontend builds
cd frontend && npm run typecheck && npm run lint && npm run build

# Infrastructure compiles (if generated)
cd infra && npx tsc --noEmit
```

## Completion Summary

When the full pipeline finishes, present this summary:

```
## Pipeline Complete

### What was built
- **Source:** <mockup URL>
- **Pages:** N unique pages, M template instances
- **Content types:** N collection types, M single types
- **Components:** N shared, M block components

### Directories
- `cms/` — Strapi v5 CMS (start: `cd cms && npm run develop`)
- `frontend/` — React + Vite frontend (start: `cd frontend && npm run dev`)
- `infra/` — Pulumi IaC for <Azure|AWS>
- `.github/workflows/` — CI/CD pipelines

### Verification
- Visual match: N/N pages pass (<15% diff)
- Links: N/N pass (no 404s)
- SEO: N/N pages have required meta tags

### Next Steps
1. Review and customize the frontend design
2. Push to GitHub to trigger CI pipeline
3. Run `cd infra && pulumi up` to deploy staging
4. Access Strapi admin at <staging-url>/admin
```
