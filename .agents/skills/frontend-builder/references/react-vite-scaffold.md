# React + Vite Project Scaffold Conventions

Standard project structure and configuration for the frontend.

## Directory Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── components/
│   │   ├── DynamicZone.tsx
│   │   ├── Layout.tsx
│   │   ├── Navigation.tsx
│   │   ├── Footer.tsx
│   │   ├── SEO.tsx
│   │   ├── Hero.tsx
│   │   ├── CardGrid.tsx
│   │   └── ... (one per component from site-analysis)
│   ├── lib/
│   │   └── strapi.ts          # API client
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   ├── NotFound.tsx
│   │   └── ... (one per page from site-analysis)
│   ├── types/
│   │   └── strapi.ts          # Generated types
│   ├── app.css                # Global styles + design tokens
│   ├── main.tsx               # Entry point
│   └── router.tsx             # React Router config
├── .env.example
├── .eslintrc.cjs
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

## Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:1337',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:1337',
        changeOrigin: true,
      },
    },
  },
});
```

## Tailwind CSS v4 Setup

Tailwind v4 uses CSS-first configuration. No `tailwind.config.js` needed.

```css
/* src/app.css */
@import 'tailwindcss';

/* Design tokens as CSS custom properties */
:root {
  --color-primary: #2563eb;
  --color-secondary: #7c3aed;
  --color-accent: #f59e0b;
  --color-background: #ffffff;
  --color-text: #1f2937;
  --font-heading: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  --max-width: 1280px;
  --section-gap: 4rem;
}

/* Register custom theme values for Tailwind */
@theme {
  --color-primary: var(--color-primary);
  --color-secondary: var(--color-secondary);
  --color-accent: var(--color-accent);
}
```

## TypeScript Configuration

```json
// tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

```json
// tsconfig.node.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

## React Router v7 Setup

```typescript
// src/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '@/components/Layout';

// Lazy-load pages for code splitting
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('@/pages/Home'));
const About = lazy(() => import('@/pages/About'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <SuspenseWrapper><Home /></SuspenseWrapper> },
      { path: '/about', element: <SuspenseWrapper><About /></SuspenseWrapper> },
      // ... more routes from site-analysis pages
      { path: '*', element: <SuspenseWrapper><NotFound /></SuspenseWrapper> },
    ],
  },
]);
```

## Entry Point

```typescript
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { router } from '@/router';
import '@/app.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  </StrictMode>,
);
```

## Environment Variables

```bash
# .env.example
VITE_STRAPI_URL=http://localhost:1337
```

Access in code: `import.meta.env.VITE_STRAPI_URL`

All env vars exposed to the client must be prefixed with `VITE_`.

## ESLint Configuration

```javascript
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['dist/', 'node_modules/'],
  },
);
```

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -b --noEmit",
    "lint": "eslint src/"
  }
}
```

## Layout Component Pattern

```typescript
// src/components/Layout.tsx
import { Outlet } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const Layout: React.FC = () => (
  <div className="flex flex-col min-h-screen">
    <Navigation />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);
```
