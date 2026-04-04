---
name: frontend-builder
description: >-
  Build the React + Vite + Tailwind CSS frontend from site-analysis.json and
  Strapi content type schemas. Use when the user says "build the frontend",
  "create the UI", "scaffold the frontend", "create React app", "build the
  site", "generate pages", "create the website", "make the frontend", or any
  request to generate a working React application wired to the Strapi CMS.
  Triggers when both site-analysis.json and content-types/ directory exist.
  Always compose with the vercel-react-best-practices skill for performance.
allowed-tools: Bash(npm:*), Bash(npx:*), Bash(mkdir:*), Bash(node:*), Bash(cat:*)
---

# Frontend Builder — React + Vite + Tailwind CSS from CMS Schema

Generate a complete, production-ready React frontend that fetches content from
Strapi v5 REST API. The output is a working project in `frontend/`.

## Prerequisites

Before running this skill, verify:

1. `site-analysis.json` exists at the project root
2. `content-types/` directory exists with Strapi model schemas
3. Optionally `components/` directory with Strapi component schemas

If either is missing, tell the user to run the upstream skills first:
- `design-ingest` produces `site-analysis.json`
- `cms-data-modeler` produces `content-types/` and `components/`

## Quick Start

```
User: "Build the frontend"
You:
1. Read site-analysis.json and content type schemas
2. Scaffold Vite + React + TypeScript + Tailwind project
3. Generate TypeScript types from Strapi schemas
4. Create API client, pages, components, routing
5. Apply design tokens and animations
6. Run typecheck + lint + build to verify
7. Present summary of created pages and components
```

## Outputs

| Artifact | Location | Purpose |
|----------|----------|---------|
| React app | `frontend/` | Full project with src, config, public |
| TS types | `frontend/src/types/strapi.ts` | Generated from content type schemas |
| API client | `frontend/src/lib/strapi.ts` | Typed Strapi REST client |
| Pages | `frontend/src/pages/` | One file per page from site-analysis |
| Components | `frontend/src/components/` | One file per component from site-analysis |
| Router | `frontend/src/router.tsx` | React Router v7 config |
| Layout | `frontend/src/components/Layout.tsx` | Header + Footer + Outlet |

## Step-by-Step Process

### Step 1: Read Inputs

1. Parse `site-analysis.json` — extract pages, components, navigation, designTokens
2. Read all files in `content-types/` and `components/` directories
3. Determine the CMS API URL: use `VITE_STRAPI_URL` env var, default `http://localhost:1337`

### Step 2: Scaffold Project

Create a Vite + React + TypeScript project in `frontend/`. See
[references/react-vite-scaffold.md](references/react-vite-scaffold.md) for
the exact scaffold structure.

Key config:
- Vite dev server proxies `/api` to Strapi to avoid CORS in development
- Tailwind CSS v4 via `@tailwindcss/vite` plugin
- Environment variable: `VITE_STRAPI_URL`
- ESLint with TypeScript and React plugins
- `tsconfig.json` with strict mode, path aliases (`@/` maps to `src/`)

Install these dependencies:
```bash
cd frontend && npm install react react-dom react-router-dom react-helmet-async framer-motion
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react \
  tailwindcss @tailwindcss/vite eslint @eslint/js typescript-eslint eslint-plugin-react-hooks
```

### Step 3: Generate TypeScript Types

Read each content type schema and generate corresponding TypeScript interfaces.
See [references/type-generation.md](references/type-generation.md) for the
mapping rules.

Write all types to `frontend/src/types/strapi.ts`. Include:
- `StrapiResponse<T>` wrapper (data, meta)
- `StrapiCollectionResponse<T>` with pagination
- `StrapiMedia` type for media fields
- One interface per content type
- One interface per component
- Dynamic zone discriminated union types

### Step 4: Create API Client

Create `frontend/src/lib/strapi.ts` with:

```typescript
const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

export const getStrapiURL = (path = ''): string => {
  return `${STRAPI_URL}${path}`;
};

export const getStrapiMedia = (url: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('//')) return url;
  return getStrapiURL(url);
};
```

Add typed fetch functions per content type. See
[references/strapi-api-patterns.md](references/strapi-api-patterns.md) for
REST API query patterns.

Rules for the API client:
- Every function must have explicit return types (no `any`)
- Use `populate=*` by default, allow override
- Handle errors with a typed error response
- Export a `fetchAPI` helper that adds common headers
- Support pagination parameters
- Dynamic zone responses need `__component` field for discrimination

### Step 5: Create Page Components

For each page in `site-analysis.json.pages`:

1. Create `frontend/src/pages/<PageName>.tsx`
2. The page fetches its own data using the API client
3. Use `useEffect` + `useState` for data fetching (or React Router loader)
4. Render loading skeleton while fetching
5. Render error state if fetch fails
6. Map the page sections array to component instances
7. Pass fetched data as props to each component

For template pages (e.g., blog post), create a single component with a
dynamic route parameter (`:slug`).

### Step 6: Build Components

For each component in `site-analysis.json.components`:

1. Create `frontend/src/components/<ComponentName>.tsx`
2. Define props interface from the component fields
3. Use mobile-first Tailwind classes (responsive by default)
4. Add loading state placeholder
5. Handle missing/optional data gracefully (null checks)
6. If `hasAnimation` is true, wrap with framer-motion animations matching `animationType`

**Dynamic Zone Renderer:** Create `frontend/src/components/DynamicZone.tsx`:
```typescript
import { lazy, Suspense } from 'react';

const componentRegistry: Record<string, React.LazyExoticComponent<React.FC<unknown>>> = {
  'blocks.hero': lazy(() => import('./Hero')),
  'blocks.text-block': lazy(() => import('./TextBlock')),
  // ... one entry per dynamic zone component
};

export const DynamicZone: React.FC<{ sections: Array<{ __component: string; [key: string]: unknown }> }> = ({ sections }) => (
  <>
    {sections.map((section, i) => {
      const Component = componentRegistry[section.__component];
      if (!Component) return null;
      return (
        <Suspense key={i} fallback={<div className="animate-pulse h-32" />}>
          <Component {...section} />
        </Suspense>
      );
    })}
  </>
);
```

### Step 7: Set Up Routing

Create `frontend/src/router.tsx` with React Router v7:

1. Map each page from site-analysis to a route
2. Use the page `path` field as the route path
3. Template pages get parameterized routes (e.g., `/blog/:slug`)
4. Wrap all routes in the Layout component
5. Add a 404 catch-all route

### Step 8: Navigation Component

Create `frontend/src/components/Navigation.tsx`:
- Read navigation structure from site-analysis.json (hardcode or fetch from Strapi global)
- Responsive: hamburger menu on mobile, full nav on desktop
- Sticky header with scroll-aware background
- Active link highlighting via React Router `NavLink`
- Support dropdown submenus if `children` exist in nav items

### Step 9: SEO

Create `frontend/src/components/SEO.tsx` using `react-helmet-async`:
- Accept `seo` prop matching the Strapi SEO component shape
- Render `<title>`, `<meta name="description">`, Open Graph tags
- Each page passes its SEO data to this component
- Wrap the app in `<HelmetProvider>`

### Step 10: Design Tokens

Read `site-analysis.json.designTokens` and apply:

1. **Colors** — Add to `frontend/src/app.css` as CSS custom properties:
   ```css
   :root {
     --color-primary: <primary color>;
     --color-secondary: <secondary color>;
     /* ... */
   }
   ```
   Reference in Tailwind via `@theme`:
   ```css
   @theme {
     --color-primary: var(--color-primary);
     --color-secondary: var(--color-secondary);
   }
   ```

2. **Fonts** — Import Google Fonts (or local fonts) and set in CSS/Tailwind config

3. **Spacing** — Use the extracted spacing values for section gaps, container max-width

4. **Border radius** — Apply as Tailwind theme extension

### Step 11: Animations

For components with `hasAnimation: true`:
- Use `framer-motion` `motion` components
- Map `animationType` to motion variants:
  - `fade-in` -> `initial={{ opacity: 0 }}` `animate={{ opacity: 1 }}`
  - `slide-up` -> `initial={{ y: 40, opacity: 0 }}` `animate={{ y: 0, opacity: 1 }}`
  - `parallax` -> Use scroll-linked `useScroll` + `useTransform`
- Use `whileInView` for scroll-triggered animations
- Add `viewport={{ once: true }}` to prevent re-triggering

### Step 12: Static Assets & Sitemap

1. Generate `frontend/public/sitemap.xml` from the page list
2. Add `frontend/public/robots.txt`
3. Copy favicon if available from site-analysis

### Step 13: Verify

Run verification commands:
```bash
cd frontend && npm run typecheck && npm run lint && npm run build
```

Fix any errors before reporting completion.

## Key Rules

1. **Compose with vercel-react-best-practices** — Consult the
   `vercel-react-best-practices` skill for performance patterns. Apply its
   rules for bundle splitting, lazy loading, memoization, and data fetching.

2. **No `any` types** — Every variable, parameter, and return type must be
   explicitly typed. The API client, components, and pages must all be
   strictly typed.

3. **Central API client** — All Strapi calls go through `src/lib/strapi.ts`.
   No direct fetch calls in components.

4. **Responsive by default** — Every component uses mobile-first Tailwind
   classes. Test at 320px, 768px, and 1280px breakpoints mentally.

5. **Pages fetch their own data** — No global state management for CMS
   content. Each page is self-contained with its own data fetching.

6. **Dynamic zone registry** — Dynamic zones use a component registry that
   maps Strapi component names (e.g., `blocks.hero`) to React components.
   Use `React.lazy` for code splitting.

7. **Strapi media URLs** — Images from Strapi have relative URLs. Always
   prepend the base URL using `getStrapiMedia()` from the API client.

8. **Loading and error states** — Every component that fetches data must have:
   - A skeleton/shimmer loading state
   - An error boundary or error message
   - Graceful handling of empty/null data

9. **SEO on every page** — Each page renders the `<SEO>` component with data
   from the content type's `seo` field.

10. **Named exports only** — Use named exports for all modules. The only
    exception is lazy-loaded page components that need default exports for
    `React.lazy()`.

11. **Project conventions** — TypeScript strict mode, 2-space indentation,
    semicolons, single quotes, named exports.

## Image Handling

```typescript
// Always use getStrapiMedia for image sources
import { getStrapiMedia } from '@/lib/strapi';

const ImageComponent: React.FC<{ image: StrapiMedia }> = ({ image }) => {
  const imageUrl = getStrapiMedia(image.url);
  if (!imageUrl) return null;
  return (
    <img
      src={imageUrl}
      alt={image.alternativeText || ''}
      width={image.width}
      height={image.height}
      loading="lazy"
    />
  );
};
```

## Composing With Other Skills

| Skill | Relationship |
|-------|-------------|
| `design-ingest` | Produces `site-analysis.json` (input) |
| `cms-data-modeler` | Produces content type schemas (input) |
| `strapi-setup` | Creates the CMS that this frontend connects to |
| `content-migration` | Populates the CMS with data this frontend displays |
| `vercel-react-best-practices` | Performance patterns to follow |

## References

| Reference | Purpose |
|-----------|---------|
| [references/strapi-api-patterns.md](references/strapi-api-patterns.md) | Strapi v5 REST API query patterns |
| [references/react-vite-scaffold.md](references/react-vite-scaffold.md) | Project scaffold structure and config |
| [references/type-generation.md](references/type-generation.md) | TypeScript type generation from Strapi schemas |

## Checklist Before Completing

- [ ] `frontend/` directory has a complete Vite + React + TypeScript project
- [ ] TypeScript types generated for all content types and components
- [ ] API client with typed functions for every content type
- [ ] Page component for every page in site-analysis.json
- [ ] React component for every component in site-analysis.json
- [ ] React Router configured with all routes
- [ ] Navigation component is responsive with mobile menu
- [ ] SEO component on every page
- [ ] Design tokens applied (colors, fonts, spacing)
- [ ] Animations added for components that need them
- [ ] Dynamic zones use the registry pattern
- [ ] All images use `getStrapiMedia()` for URL resolution
- [ ] Loading and error states on every data-fetching component
- [ ] `npm run typecheck && npm run lint && npm run build` passes
