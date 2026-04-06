# AMClub Website

React 19 + Strapi v5 CMS website with Azure infrastructure.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, TypeScript |
| CMS | Strapi v5, PostgreSQL |
| Infrastructure | Azure Container Apps, Azure PostgreSQL, Pulumi |
| CI/CD | GitHub Actions |

---

## Local Development

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Install dependencies

```bash
cd cms && npm ci && cd ..
cd frontend && npm ci && cd ..
```

### 2. Start the stack

```bash
docker compose -f docker-compose.dev.yml up --build
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **Strapi CMS** on `http://localhost:1337` (with hot reload)

### 3. Start the frontend

In a separate terminal:

```bash
cd frontend && npm run dev
```

Frontend runs at **http://localhost:5173** and proxies `/api/*` to Strapi automatically.

### 4. Access Strapi Admin

Open **http://localhost:1337/admin** and create your admin account on first run.

---

## Project Structure

```
amclub-website/
├── cms/                    # Strapi v5 CMS
│   ├── src/api/            # Content types & routes
│   ├── src/components/     # Strapi components
│   └── config/             # Database, server, middleware config
├── frontend/               # React + Vite frontend
│   └── src/
│       ├── components/     # UI components (blocks/, layout/, shared/)
│       ├── pages/          # Route pages
│       ├── hooks/          # Data fetching hooks
│       └── lib/            # API client
├── infra/                  # Pulumi IaC (Azure)
├── Dockerfile              # Production all-in-one image
├── Dockerfile.cms          # CMS-only image (local dev)
├── docker-compose.dev.yml  # Local dev environment
└── .github/workflows/      # CI/CD pipelines
```

---

## Useful Commands

### Frontend

```bash
cd frontend
npm run dev          # Start dev server (http://localhost:5173)
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm run build        # Production build
```

### CMS

```bash
cd cms
npm run develop      # Start with hot reload (http://localhost:1337)
npm run build        # Build admin panel
npm run start        # Start production server
```

### Docker

```bash
# Start full local stack
docker compose -f docker-compose.dev.yml up

# Rebuild after Dockerfile changes
docker compose -f docker-compose.dev.yml up --build

# Stop and remove containers
docker compose -f docker-compose.dev.yml down

# Reset database (wipe all data)
docker compose -f docker-compose.dev.yml down -v
```

---

## Media / Uploads

Local uploads are stored in `./media/` and mounted into the CMS container.
This directory is git-ignored. To seed images for development, place files in:

```
media/
├── hero/
├── icons/
├── logos/
├── pages/
├── promotions/
├── restaurants/
└── services/
```

---

## Branching & Deployment

| Branch | Deploys to | Azure Subscription |
|---|---|---|
| `main` | `dev` environment | Your subscription |
| `prod` | `prod` environment | Client subscription |

**Push to `main`** → CI runs → deploys to Azure `dev`
**Push to `prod`** → CI runs → deploys to Azure `prod`

See [`infra/README.md`](infra/README.md) for full infrastructure and deployment docs.

---

## Environment Variables

### CMS (`.env` in `cms/`)

```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=...
ADMIN_JWT_SECRET=...
TRANSFER_TOKEN_SALT=...
ENCRYPTION_KEY=...
JWT_SECRET=...
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=amclub_strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=strapi_dev_password
DATABASE_SSL=false
```

> For local dev these are already set in `docker-compose.dev.yml` — no `.env` file needed.

### Frontend (`.env` in `frontend/`)

```env
VITE_API_URL=/api
```

> In local dev Vite proxies `/api` to `http://localhost:1337` automatically — no `.env` needed.

---

## Verification

Run before committing:

```bash
cd frontend && npm run typecheck && npm run lint && npm run build
cd cms && npm run build
cd infra && npx tsc --noEmit
```
