---
name: strapi-setup
description: >-
  Scaffold and configure a Strapi v5 CMS project with content types, plugins,
  and environment config. Use when the user says "set up Strapi", "install CMS",
  "scaffold CMS", "create the Strapi project", "initialize Strapi", "set up the
  backend", "install the CMS backend", "configure Strapi", or any request to
  create a working Strapi v5 project. Requires content type definitions in
  content-types/ and component definitions in components/ (produced by
  cms-data-modeler). Produces a working cms/ directory with all schemas,
  plugins, routes, controllers, and verified build.
allowed-tools: Bash(npx:*), Bash(npm:*), Bash(mkdir:*), Bash(cp:*), Bash(mv:*), Bash(chmod:*), Bash(cat:*), Bash(ls:*), Bash(cd:*), Bash(node:*), Bash(openssl:*)
---

# Strapi Setup — Scaffold & Configure Strapi v5 CMS

Create a production-ready Strapi v5 project from content type and component
definitions, with plugins, database config, CORS, and environment variables.

## Quick Start

```
User: "Set up Strapi"
You:
1. Verify content-types/ and components/ exist
2. Ask user about plugin preferences (upload provider, email, i18n)
3. Create Strapi project with --no-run
4. Install chosen plugins
5. Copy content types and create API stubs
6. Copy components
7. Configure database, CORS, environment
8. Build and verify
```

## Inputs

| File/Directory | Required | Source |
|----------------|----------|--------|
| `content-types/` | Yes | cms-data-modeler skill |
| `components/` | Yes | cms-data-modeler skill |

**Prerequisite check:** Before starting, verify that `content-types/` and
`components/` directories exist at the project root and contain schema files.
If missing, tell the user to run the cms-data-modeler skill first.

## Outputs

| Directory/File | Purpose |
|----------------|---------|
| `cms/` | Complete Strapi v5 project |
| `cms/.env` | Development environment variables |
| `cms/.env.example` | Template for production variables |

## Step-by-Step Process

### Phase 1: Gather User Preferences

Ask the user about:

1. **Upload provider:**
   - Local filesystem (default for dev, no plugin needed)
   - Azure Blob Storage (`@strapi/provider-upload-azure-storage`)
   - AWS S3 (`@strapi/provider-upload-aws-s3`)

2. **Email provider** (optional):
   - None (skip)
   - SMTP via Nodemailer (`@strapi/provider-email-nodemailer`)
   - SendGrid (`@strapi/provider-email-sendgrid`)

3. **i18n** (internationalization):
   - Enable or disable (check if `site-analysis.json` has `availableLanguages`)

4. **Frontend URL** for CORS (default: `http://localhost:5173`)

If the user says "just use defaults" or "quickstart", use:
- Local filesystem upload
- No email provider
- i18n disabled
- CORS for `http://localhost:5173`

### Phase 2: Create Strapi Project

```bash
npx create-strapi@latest cms --quickstart --no-run --skip-cloud
```

**Critical:** Always use `--no-run` to prevent auto-starting the server. The
project needs configuration before first run.

If the `cms/` directory already exists, ask the user before overwriting.

After creation, verify the project structure:
```bash
ls cms/src/api cms/src/components cms/config
```

### Phase 3: Install Plugins

Based on user choices from Phase 1, install plugins:

```bash
cd cms

# PostgreSQL client (always install for production readiness)
npm install pg

# Azure Blob Storage upload
npm install @strapi/provider-upload-azure-storage

# OR AWS S3 upload
npm install @strapi/provider-upload-aws-s3

# SMTP email
npm install @strapi/provider-email-nodemailer

# OR SendGrid email
npm install @strapi/provider-email-sendgrid
```

Only install the plugins the user selected. Always install `pg` for production
PostgreSQL support.

### Phase 4: Copy Content Types

For each directory in the project root `content-types/` folder:

1. **Create the API directory structure:**
   ```
   cms/src/api/<name>/
   ├── content-types/<name>/schema.json
   ├── controllers/<name>.ts
   ├── routes/<name>.ts
   └── services/<name>.ts
   ```

2. **Copy the schema file:**
   ```bash
   mkdir -p cms/src/api/<name>/content-types/<name>
   cp content-types/<name>/schema.json cms/src/api/<name>/content-types/<name>/schema.json
   ```

3. **Create the controller stub:**
   ```typescript
   // cms/src/api/<name>/controllers/<name>.ts
   import { factories } from '@strapi/strapi';

   export default factories.createCoreController('api::<name>.<name>');
   ```

4. **Create the route stub:**
   ```typescript
   // cms/src/api/<name>/routes/<name>.ts
   import { factories } from '@strapi/strapi';

   export default factories.createCoreRouter('api::<name>.<name>');
   ```

5. **Create the service stub:**
   ```typescript
   // cms/src/api/<name>/services/<name>.ts
   import { factories } from '@strapi/strapi';

   export default factories.createCoreService('api::<name>.<name>');
   ```

**Important:** The `<name>` in the API path must match the `singularName` in the
schema's `info` object. Read each schema.json to get the correct singularName.

### Phase 5: Copy Components

For each component file in the project root `components/` folder:

```bash
# Components are organized by category
# components/shared/seo.json -> cms/src/components/shared/seo.json
# components/blocks/hero.json -> cms/src/components/blocks/hero.json

mkdir -p cms/src/components/shared
mkdir -p cms/src/components/blocks
cp components/shared/*.json cms/src/components/shared/
cp components/blocks/*.json cms/src/components/blocks/
```

Preserve the category directory structure exactly.

### Phase 6: Configure Database

#### Development (SQLite — already configured by quickstart)

Verify `cms/config/database.ts` uses SQLite with env var support:

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

#### Production (PostgreSQL)

Create `cms/config/env/production/database.ts`:

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

**Never hardcode database credentials.** Always use `env()`.

### Phase 7: Configure CORS

Update `cms/config/middlewares.ts` to allow the frontend origin:

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

### Phase 8: Configure Plugins

Write `cms/config/plugins.ts` based on user selections:

```typescript
export default ({ env }) => ({
  // i18n (if enabled)
  i18n: {
    enabled: true,
    config: {
      defaultLocale: 'en',
    },
  },

  // Upload provider (if not local)
  upload: {
    config: {
      provider: '@strapi/provider-upload-azure-storage',
      providerOptions: {
        account: env('AZURE_STORAGE_ACCOUNT'),
        accountKey: env('AZURE_STORAGE_ACCOUNT_KEY'),
        containerName: env('AZURE_STORAGE_CONTAINER_NAME', 'strapi-uploads'),
        defaultPath: 'assets',
      },
    },
  },

  // Email (if selected)
  email: {
    config: {
      provider: '@strapi/provider-email-nodemailer',
      providerOptions: {
        host: env('SMTP_HOST'),
        port: env.int('SMTP_PORT', 587),
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
      },
      settings: {
        defaultFrom: env('SMTP_FROM'),
        defaultReplyTo: env('SMTP_REPLY_TO'),
      },
    },
  },
});
```

Only include sections for plugins the user selected.
See [references/strapi-plugins.md](references/strapi-plugins.md) for all config patterns.

### Phase 9: Create Environment Files

#### `.env` (Development)

Generate secure random keys and write the dev env file:

```bash
cd cms
cat > .env << EOF
HOST=0.0.0.0
PORT=1337
PUBLIC_URL=http://localhost:1337
APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)
API_TOKEN_SALT=$(openssl rand -base64 32)
ADMIN_JWT_SECRET=$(openssl rand -base64 32)
TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGINS=http://localhost:5173
EOF
```

#### `.env.example` (Template)

Create a template with placeholder values (no real secrets):

See [references/env-template.md](references/env-template.md) for the full template.

#### `.gitignore` Check

Verify that `cms/.gitignore` includes:
```
.env
.tmp
build
node_modules
```

If not present, add these entries.

### Phase 10: Update Security Middleware (if using cloud upload)

If Azure Blob or S3 was selected, update the security middleware to allow
loading images from the storage URL:

```typescript
{
  name: 'strapi::security',
  config: {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'connect-src': ["'self'", 'https:'],
        'img-src': [
          "'self'",
          'data:',
          'blob:',
          env('AZURE_STORAGE_URL', 'https://your-storage.blob.core.windows.net'),
        ],
        'media-src': [
          "'self'",
          'data:',
          'blob:',
          env('AZURE_STORAGE_URL', 'https://your-storage.blob.core.windows.net'),
        ],
        upgradeInsecureRequests: null,
      },
    },
  },
},
```

### Phase 11: Build and Verify

```bash
cd cms && npm run build
```

This compiles the admin panel and validates all content type schemas and
component definitions. If the build fails:

1. Read the error message carefully
2. Common issues:
   - **Invalid relation target:** Check that `target` values match `api::<singularName>.<singularName>`
   - **Missing component:** Ensure all components referenced in schemas exist in `src/components/`
   - **Duplicate collectionName:** Each schema must have a unique `collectionName`
   - **Invalid attribute type:** Check spelling of type names
3. Fix the issue and rebuild

After a successful build, inform the user:

```
Strapi project created and verified successfully.

To start the development server:
  cd cms && npm run develop

The admin panel will be available at http://localhost:1337/admin
You will need to create an admin user on first run.

API endpoints will be available at http://localhost:1337/api/<collection>
```

## Key Rules

1. **Always use `--no-run`** during project creation. Never auto-start Strapi.

2. **Content type files go to `cms/src/api/<name>/content-types/<name>/schema.json`.**
   The `<name>` must match the schema's `info.singularName`.

3. **Create route, controller, and service stubs** for every API content type.
   Use the Strapi factory pattern (`factories.createCoreController`, etc.).

4. **Component files go to `cms/src/components/<category>/<name>.json`.** Preserve
   the exact category/name structure from the input `components/` directory.

5. **Database config must use env vars.** Never hardcode `host`, `password`, or
   any credential. Always use `env('VAR_NAME', 'default')`.

6. **CORS must allow the frontend origin.** Use `env.array('CORS_ORIGINS')`
   so it is configurable per environment.

7. **After setup, run `cd cms && npm run build`** to verify everything compiles.
   Do not consider the setup complete until the build passes.

8. **Generate real secrets for .env** using `openssl rand -base64 32`. Never
   use placeholder strings like "changeme" in the actual .env file.

9. **Always install `pg`** even if dev uses SQLite, so the project is ready
   for production PostgreSQL without needing another `npm install`.

10. **Do not commit .env files.** Ensure .gitignore excludes them. Create
    `.env.example` as the committed template.

## Composing With Other Skills

- **cms-data-modeler** (upstream) produces `content-types/` and `components/`
- **frontend-builder** (downstream) connects to the running Strapi API
- **content-migration** (downstream) populates Strapi with content
- **infra** (downstream) deploys the `cms/` project to Azure

## References

| Reference | Purpose |
|-----------|---------|
| [references/strapi-v5-setup.md](references/strapi-v5-setup.md) | Installation, project structure, config files |
| [references/strapi-plugins.md](references/strapi-plugins.md) | Plugin install commands and config patterns |
| [references/env-template.md](references/env-template.md) | Environment variable template |

## Checklist Before Completing

- [ ] `content-types/` and `components/` were verified to exist before starting
- [ ] Strapi project created with `--no-run` flag
- [ ] All content types copied to `cms/src/api/<name>/content-types/<name>/schema.json`
- [ ] Controller, route, and service stubs created for every content type
- [ ] All components copied to `cms/src/components/<category>/<name>.json`
- [ ] PostgreSQL client (`pg`) installed
- [ ] Selected plugins installed and configured
- [ ] Production database config created with env vars (no hardcoded creds)
- [ ] CORS configured to allow frontend origin
- [ ] `.env` created with generated secrets
- [ ] `.env.example` created as a template
- [ ] `.gitignore` excludes `.env` and `.tmp`
- [ ] `cd cms && npm run build` passes successfully
- [ ] User informed how to start the dev server
