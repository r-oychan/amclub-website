---
name: cloud-deploy
description: >-
  Generate deployment infrastructure for a web project — Dockerfiles, docker-compose,
  Pulumi IaC, and GitHub Actions CI/CD. Use when the user says "deploy", "set up
  CI/CD", "create infrastructure", "Dockerize", "set up hosting", "deploy to Azure",
  "deploy to AWS", "create pipeline", "generate Dockerfile", "infrastructure as code",
  "containerize", "create Docker setup", "set up staging", "set up production",
  "deploy to cloud", "create deployment pipeline", or any request to prepare a
  frontend/CMS project for cloud hosting. Requires existing frontend and CMS projects.
allowed-tools: Bash(mkdir:*), Bash(node:*), Bash(cat:*), Bash(ls:*)
---

# Cloud Deploy — Dockerfiles, IaC & CI/CD Generation

Generate everything needed to deploy a CMS-backed website to the cloud:
multi-stage Dockerfiles, docker-compose for local dev, Pulumi infrastructure
as code, and GitHub Actions CI/CD workflows.

## Quick Start

```
User: "Deploy the site"
You:
1. Ask: Azure (default) or AWS? Staging only or staging + production?
2. Generate Dockerfiles (CMS + frontend)
3. Generate docker-compose.yml for local dev
4. Generate Pulumi program in infra/
5. Generate GitHub Actions workflows
6. Generate .env.example files
7. Document required secrets
```

## Inputs

| Input | Default | Required |
|-------|---------|----------|
| `frontend/` directory | Project root | Yes |
| `cms/` directory | Project root | Yes |
| Cloud provider | Azure | No (ask user) |
| Environments | Staging + Production | No (ask user) |

## Outputs

| File | Purpose |
|------|---------|
| `Dockerfile.cms` | Multi-stage Dockerfile for Strapi CMS |
| `Dockerfile.frontend` | Multi-stage Dockerfile for React frontend (build → nginx) |
| `docker-compose.yml` | Local development with all services |
| `.dockerignore` | Exclude node_modules, .env, etc. |
| `infra/` | Pulumi TypeScript program |
| `.github/workflows/ci.yml` | Lint, typecheck, build, test on PRs |
| `.github/workflows/deploy-staging.yml` | Auto-deploy to staging on merge to main |
| `.github/workflows/deploy-production.yml` | Manual deploy to production |
| `.env.example` | Template for required environment variables |

**Output location:** Project root.

## Step-by-Step Process

### Phase 0: Gather Requirements

**Ask the user before generating anything:**

1. **Cloud provider:** Azure (default) or AWS?
2. **Environments:** Staging only, or staging + production?
3. **Custom domain:** Do they have a domain name?
4. **Media storage:** Cloud blob storage for CMS uploads? (default: yes)
5. **CDN:** Enable CDN for frontend? (default: yes)

If the user says "just deploy" or "use defaults", proceed with:
- Azure, staging + production, no custom domain, blob storage + CDN enabled.

### Phase 1: Dockerfiles

#### Dockerfile.cms (Strapi)

Generate a multi-stage Dockerfile:

**Stage 1 — Build:**
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
```

**Stage 2 — Production:**
```dockerfile
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/config ./config
COPY --from=build /app/database ./database
COPY --from=build /app/public ./public
COPY --from=build /app/src ./src
EXPOSE 1337
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:1337/_health || exit 1
CMD ["node", "dist/server.js"]
```

**Key considerations:**
- Use `node:20-alpine` for small image size
- `npm ci` for deterministic installs
- Copy only necessary files to production stage
- Include health check endpoint
- Sharp (image processing) may need additional Alpine packages:
  `RUN apk add --no-cache vips-dev`

#### Dockerfile.frontend (React + Vite → nginx)

**Stage 1 — Build:**
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build
```

**Stage 2 — Serve:**
```dockerfile
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1
```

**Generate `frontend/nginx.conf`** with:
- SPA routing (try_files → index.html)
- Gzip compression
- Cache headers for static assets
- Security headers (X-Frame-Options, CSP basics)

#### .dockerignore

```
node_modules
.env
.env.*
!.env.example
.git
*.md
.vscode
.DS_Store
dist
build
```

### Phase 2: Docker Compose (Local Dev)

Generate `docker-compose.yml` for local development:

```yaml
services:
  cms:
    build:
      context: ./cms
      dockerfile: ../Dockerfile.cms
      target: build  # Use build stage for dev (includes devDependencies)
    ports:
      - "1337:1337"
    environment:
      DATABASE_CLIENT: postgres
      DATABASE_HOST: db
      DATABASE_PORT: 5432
      DATABASE_NAME: strapi
      DATABASE_USERNAME: strapi
      DATABASE_PASSWORD: strapi
    volumes:
      - ./cms:/app
      - /app/node_modules
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: ../Dockerfile.frontend
      target: build
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:1337
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev -- --host 0.0.0.0

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: strapi
      POSTGRES_USER: strapi
      POSTGRES_PASSWORD: strapi
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U strapi"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

**Key rules:**
- docker-compose.yml is for LOCAL DEV ONLY — never use in production
- Use volume mounts for hot reload
- Exclude `node_modules` from volume mount (`/app/node_modules`)
- PostgreSQL uses health check so CMS waits for it
- Never hardcode secrets — use `.env` file with docker-compose

### Phase 3: Pulumi Infrastructure as Code

**IMPORTANT:** Compose with the `pulumi-authoring` skills for IaC best
practices. Reference its SKILL.md for Pulumi conventions, resource naming,
and stack configuration patterns.

Generate a Pulumi TypeScript program in `infra/`:

```
infra/
  Pulumi.yaml           # Project definition
  Pulumi.staging.yaml   # Staging stack config
  Pulumi.production.yaml # Production stack config
  index.ts              # Main program
  package.json          # Dependencies
  tsconfig.json         # TypeScript config
```

#### Azure Architecture (Default)

See [references/azure-architecture.md](references/azure-architecture.md) for
full resource definitions. Key resources:

| Resource | Purpose |
|----------|---------|
| Resource Group | Container for all resources |
| Container Registry | Store Docker images |
| Container App Environment | Managed container hosting |
| Container App (CMS) | Strapi backend |
| Container App (Frontend) | nginx serving React |
| PostgreSQL Flexible Server | CMS database |
| Blob Storage Account | Media uploads |
| Front Door / CDN | Frontend acceleration |

#### AWS Architecture (Alternative)

See [references/aws-architecture.md](references/aws-architecture.md) for
full resource definitions. Key resources:

| Resource | Purpose |
|----------|---------|
| VPC + Subnets | Network isolation |
| ECR | Container image registry |
| ECS Cluster + Fargate Services | Container hosting |
| RDS PostgreSQL | CMS database |
| S3 Bucket | Media uploads + frontend static |
| CloudFront Distribution | CDN |
| ALB | Load balancer for CMS |

#### Stack Configuration

Use Pulumi stack config for environment-specific values — never hardcode:

```typescript
const config = new pulumi.Config();
const dbPassword = config.requireSecret('dbPassword');
const environment = pulumi.getStack(); // 'staging' or 'production'
```

**Scaling by environment:**

| Setting | Staging | Production |
|---------|---------|------------|
| CMS replicas | 1 | 2 |
| Frontend replicas | 1 | 2 |
| DB tier | Basic/Burstable | General Purpose |
| CDN | Optional | Enabled |

### Phase 4: GitHub Actions CI/CD

#### ci.yml — Runs on Pull Requests

```yaml
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
        working-directory: frontend
      - run: npm run lint
        working-directory: frontend
      - run: npm run typecheck
        working-directory: frontend

  build-frontend:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
        working-directory: frontend
      - run: npm run build
        working-directory: frontend

  build-cms:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
        working-directory: cms
      - run: npm run build
        working-directory: cms
```

#### deploy-staging.yml — Auto on Merge to Main

- Build Docker images for CMS and frontend
- Push to container registry (ACR or ECR)
- Run `pulumi up` on the staging stack
- Post deployment URL as GitHub comment

#### deploy-production.yml — Manual Trigger

- `workflow_dispatch` with confirmation input
- OR use GitHub environment protection rules
- Promote the same image tags from staging (do not rebuild)
- Run `pulumi up` on the production stack

**See [references/github-actions-patterns.md](references/github-actions-patterns.md)**
for complete workflow templates.

### Phase 5: Environment Configuration

#### .env.example

Generate at project root:

```env
# CMS (Strapi)
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=changeme
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=changeme
ADMIN_JWT_SECRET=changeme
JWT_SECRET=changeme
TRANSFER_TOKEN_SALT=changeme

# Frontend
VITE_API_URL=http://localhost:1337

# Cloud (Azure)
AZURE_STORAGE_ACCOUNT=
AZURE_STORAGE_CONTAINER=uploads
AZURE_STORAGE_CONNECTION_STRING=

# Cloud (AWS — alternative)
AWS_S3_BUCKET=
AWS_S3_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

### Phase 6: Documentation

After generating all files, present a summary to the user:

1. **Files created** — list every new file with a one-line description
2. **Required secrets** — what needs to be set in GitHub Secrets:
   - `AZURE_CREDENTIALS` or `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`
   - `PULUMI_ACCESS_TOKEN`
   - `DATABASE_PASSWORD`
   - Strapi secret keys (`APP_KEYS`, etc.)
3. **Next steps** — ordered checklist:
   - [ ] Set up cloud provider account
   - [ ] Install Pulumi CLI and login
   - [ ] Create Pulumi stacks (`pulumi stack init staging`)
   - [ ] Set stack secrets (`pulumi config set --secret dbPassword ...`)
   - [ ] Add GitHub Secrets
   - [ ] Push to main to trigger first deployment

## Key Rules

- **Compose with `pulumi-authoring` skills** for IaC best practices — always
  reference its conventions for resource naming, outputs, and stack config.
- **Azure and AWS reference files are separate.** Only load and follow the one
  the user chose. Do not generate both unless asked.
- **Dockerfiles must use multi-stage builds** — build stage with all
  devDependencies, production stage with only runtime dependencies.
- **Never hardcode secrets** in Dockerfiles, docker-compose, Pulumi code, or
  workflows. Use environment variables, Pulumi config secrets, or GitHub Secrets.
- **docker-compose.yml is for LOCAL DEV ONLY.** Production uses container
  orchestration (Container Apps / ECS).
- **CI/CD must be modular** — separate jobs for lint, build, deploy. Not one
  giant script.
- **Production deploy requires manual approval** — use `workflow_dispatch` or
  GitHub environment protection rules. Never auto-deploy to production.
- **Always include health check endpoints** in container definitions.
- **Pulumi must use stack configuration** for environment-specific values.
  No hardcoded URLs, passwords, or resource sizes.
- **Frontend serves via nginx in production** — not `npm run dev` or a Node.js
  server. The Dockerfile builds static files and copies them to nginx.
- **CMS connects to PostgreSQL in production.** Dev can use SQLite or the
  docker-compose PostgreSQL.

## Handling Edge Cases

### No CMS (Frontend Only)
If the project has no `cms/` directory, skip CMS Dockerfile, remove the CMS
service from docker-compose, and simplify the Pulumi program to just frontend
hosting (static site).

### Monorepo With Shared Dependencies
If the root `package.json` has workspaces, adjust Dockerfiles to copy the root
`package.json` and `package-lock.json` first, then the workspace directory.

### Custom Domain Setup
If the user provides a domain:
- Add DNS zone resource to Pulumi
- Add custom domain binding to the container app / CDN
- Generate TLS certificate (Let's Encrypt via managed certificate or ACM)

### Existing Infrastructure
If `infra/` already exists, do not overwrite. Instead, review existing code
and suggest additions or modifications.

## Composing With Other Skills

- **pulumi-authoring** — ALWAYS consult for Pulumi code patterns, resource
  naming conventions, and stack management. This is mandatory.
- **frontend-builder** produces the frontend project that gets containerized
- **strapi-setup** produces the CMS project that gets containerized
- **site-verifier** can run against the deployed staging URL for smoke testing

## References

| Reference | Purpose |
|-----------|---------|
| [references/azure-architecture.md](references/azure-architecture.md) | Azure resource definitions and Pulumi patterns |
| [references/aws-architecture.md](references/aws-architecture.md) | AWS resource definitions and Pulumi patterns |
| [references/docker-patterns.md](references/docker-patterns.md) | Dockerfile and docker-compose patterns |
| [references/github-actions-patterns.md](references/github-actions-patterns.md) | CI/CD workflow templates |

## Checklist Before Completing

- [ ] Dockerfiles use multi-stage builds with health checks
- [ ] docker-compose.yml starts all services locally with `docker compose up`
- [ ] Pulumi program compiles (`cd infra && npx tsc --noEmit`)
- [ ] Stack config files exist for each environment
- [ ] No secrets are hardcoded anywhere
- [ ] CI workflow runs lint + typecheck + build
- [ ] Staging deploys automatically on merge to main
- [ ] Production requires manual trigger
- [ ] `.env.example` documents all required variables
- [ ] User has been told which GitHub Secrets to configure
