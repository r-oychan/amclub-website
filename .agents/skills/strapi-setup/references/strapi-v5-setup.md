# Strapi v5 Installation & Configuration Reference

## Installation

### Create a New Project

```bash
npx create-strapi@latest cms --quickstart --no-run
```

Flags:
- `--quickstart` — Use SQLite and skip database config prompts
- `--no-run` — Create the project without starting the dev server
- `--typescript` — Use TypeScript (default in v5)
- `--skip-cloud` — Skip Strapi Cloud setup prompt

If `--quickstart` is not desired (e.g., for PostgreSQL from the start):
```bash
npx create-strapi@latest cms --no-run --skip-cloud
```

### Project Structure After Creation

```
cms/
├── config/
│   ├── admin.ts
│   ├── api.ts
│   ├── database.ts
│   ├── middlewares.ts
│   ├── plugins.ts
│   ├── server.ts
│   └── env/
│       └── production/
│           └── database.ts
├── database/
│   └── migrations/
├── public/
│   └── uploads/
├── src/
│   ├── admin/
│   │   └── app.ts
│   ├── api/
│   │   └── (content-types go here)
│   ├── components/
│   │   └── (components go here)
│   ├── extensions/
│   ├── middlewares/
│   └── policies/
├── types/
│   └── generated/
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

## Database Configuration

### SQLite (Development)

`config/database.ts`:
```typescript
import path from 'path';

export default ({ env }) => ({
  connection: {
    client: 'sqlite',
    connection: {
      filename: path.join(
        __dirname,
        '..',
        env('DATABASE_FILENAME', '.tmp/data.db')
      ),
    },
    useNullAsDefault: true,
  },
});
```

### PostgreSQL (Production)

`config/env/production/database.ts`:
```typescript
export default ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', '127.0.0.1'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'strapi'),
      user: env('DATABASE_USERNAME', 'strapi'),
      password: env('DATABASE_PASSWORD', ''),
      ssl: env.bool('DATABASE_SSL', false) && {
        rejectUnauthorized: env.bool(
          'DATABASE_SSL_REJECT_UNAUTHORIZED',
          true
        ),
      },
    },
    pool: {
      min: env.int('DATABASE_POOL_MIN', 2),
      max: env.int('DATABASE_POOL_MAX', 10),
    },
  },
});
```

For PostgreSQL, install the client:
```bash
cd cms && npm install pg
```

## Server Configuration

`config/server.ts`:
```typescript
export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS', ['key1', 'key2']),
  },
  url: env('PUBLIC_URL', 'http://localhost:1337'),
});
```

## Admin Configuration

`config/admin.ts`:
```typescript
export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
});
```

## CORS Configuration

`config/middlewares.ts`:
```typescript
export default ({ env }) => [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: env.array('CORS_ORIGINS', ['http://localhost:5173']),
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

The `CORS_ORIGINS` env var should be a comma-separated list of allowed origins:
```
CORS_ORIGINS=http://localhost:5173,https://www.example.com
```

## Security Middleware

For production, configure CSP and other security headers in `config/middlewares.ts`:
```typescript
{
  name: 'strapi::security',
  config: {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'connect-src': ["'self'", 'https:'],
        'img-src': ["'self'", 'data:', 'blob:', 'https://your-cdn.com'],
        'media-src': ["'self'", 'data:', 'blob:', 'https://your-cdn.com'],
        upgradeInsecureRequests: null,
      },
    },
  },
},
```

## API Content Type File Structure

Each API type needs these files:

```
src/api/<name>/
├── content-types/
│   └── <name>/
│       └── schema.json
├── controllers/
│   └── <name>.ts
├── routes/
│   └── <name>.ts
└── services/
    └── <name>.ts
```

### Controller Stub

`src/api/<name>/controllers/<name>.ts`:
```typescript
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::<name>.<name>');
```

### Route Stub

`src/api/<name>/routes/<name>.ts`:
```typescript
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::<name>.<name>');
```

### Service Stub

`src/api/<name>/services/<name>.ts`:
```typescript
import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::<name>.<name>');
```

## Build and Verify

```bash
cd cms && npm run build
```

This compiles the admin panel and validates all content types and components. If there are schema errors, the build will fail with descriptive messages.

## Source
- https://docs.strapi.io/cms/installation
- https://docs.strapi.io/cms/configurations/database
- https://docs.strapi.io/cms/configurations/server
- https://docs.strapi.io/cms/configurations/middlewares
