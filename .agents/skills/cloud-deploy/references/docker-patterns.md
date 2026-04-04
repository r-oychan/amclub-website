# Docker Patterns

Reference for generating Dockerfiles, docker-compose, and related configuration.

## Strapi CMS Dockerfile

### Multi-Stage Build

```dockerfile
# ============================================
# Stage 1: Build
# ============================================
FROM node:20-alpine AS build

# Install native dependencies for sharp (image processing)
RUN apk add --no-cache \
  vips-dev \
  build-base \
  python3

WORKDIR /app

# Copy package files first (layer caching)
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build Strapi admin panel and server
ENV NODE_ENV=production
RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine AS production

# Runtime dependency for sharp
RUN apk add --no-cache vips

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY --from=build /app/package.json /app/package-lock.json ./

# Install production-only dependencies
RUN npm ci --omit=dev

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/config ./config
COPY --from=build /app/database ./database
COPY --from=build /app/public ./public
COPY --from=build /app/src ./src
COPY --from=build /app/favicon.png ./favicon.png

# Create non-root user
RUN addgroup -S strapi && adduser -S strapi -G strapi
RUN chown -R strapi:strapi /app
USER strapi

EXPOSE 1337

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:1337/_health || exit 1

CMD ["node", "dist/server.js"]
```

### Key Considerations

- **Sharp native deps:** Strapi uses `sharp` for image processing. Alpine
  needs `vips-dev` at build time and `vips` at runtime.
- **Non-root user:** Run as non-root in production for security.
- **Health check uses wget:** Alpine doesn't have `curl` by default.
  Use `wget` or install `curl` explicitly.
- **Start period:** Strapi takes time to boot. Use `--start-period=30s`.
- **Layer caching:** Copy `package*.json` before source code so npm install
  is cached when only source changes.

## React Frontend Dockerfile

### Multi-Stage Build (Vite + nginx)

```dockerfile
# ============================================
# Stage 1: Build
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first (layer caching)
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment-specific config
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# ============================================
# Stage 2: Serve with nginx
# ============================================
FROM nginx:1.27-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create non-root user for nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### nginx Configuration

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing — serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Don't cache HTML (SPA entry point)
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 256;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

## docker-compose.yml (Local Development)

```yaml
services:
  cms:
    build:
      context: ./cms
      dockerfile: ../Dockerfile.cms
      target: build
    ports:
      - '1337:1337'
    environment:
      NODE_ENV: development
      DATABASE_CLIENT: postgres
      DATABASE_HOST: db
      DATABASE_PORT: '5432'
      DATABASE_NAME: strapi
      DATABASE_USERNAME: strapi
      DATABASE_PASSWORD: strapi
      APP_KEYS: devKey1,devKey2,devKey3,devKey4
      API_TOKEN_SALT: devApiTokenSalt
      ADMIN_JWT_SECRET: devAdminJwtSecret
      JWT_SECRET: devJwtSecret
      TRANSFER_TOKEN_SALT: devTransferTokenSalt
    volumes:
      - ./cms/config:/app/config
      - ./cms/src:/app/src
      - ./cms/public:/app/public
      - ./cms/database:/app/database
    depends_on:
      db:
        condition: service_healthy
    command: npm run develop

  frontend:
    build:
      context: ./frontend
      dockerfile: ../Dockerfile.frontend
      target: build
    ports:
      - '5173:5173'
    environment:
      VITE_API_URL: http://localhost:1337
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
      - ./frontend/index.html:/app/index.html
    command: npm run dev -- --host 0.0.0.0

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: strapi
      POSTGRES_USER: strapi
      POSTGRES_PASSWORD: strapi
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U strapi']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

### Key Considerations

- **Target `build` stage:** Use the build stage for dev so devDependencies
  are available (TypeScript, linters, etc.)
- **Volume mounts:** Mount source directories for hot reload, but NOT
  `node_modules` (those stay in the container)
- **Command override:** Use `npm run develop` for Strapi dev mode and
  `npm run dev -- --host 0.0.0.0` for Vite
- **Dev secrets:** The hardcoded secrets in docker-compose are for LOCAL DEV
  ONLY. Never use these in production.
- **Health check on db:** CMS depends on PostgreSQL being ready

## .dockerignore

```
# Dependencies
node_modules
.npm

# Build output
dist
build

# Environment files (secrets)
.env
.env.*
!.env.example

# Version control
.git
.gitignore

# IDE
.vscode
.idea
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Documentation
*.md
LICENSE

# Tests
coverage
__tests__
*.test.*
*.spec.*

# CI/CD
.github
.gitlab-ci.yml

# Infrastructure
infra
pulumi

# Other skills/tools
.claude
.agents
screenshots
verification-screenshots
visual-diffs
```

## Build Arguments Pattern

For values that differ between environments and are needed at build time
(not runtime), use Docker build arguments:

```dockerfile
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build
```

Pass at build time:
```bash
docker build --build-arg VITE_API_URL=https://api.example.com -f Dockerfile.frontend ./frontend
```

In CI/CD:
```yaml
- name: Build frontend
  run: |
    docker build \
      --build-arg VITE_API_URL=${{ vars.VITE_API_URL }} \
      -f Dockerfile.frontend \
      -t ${{ env.REGISTRY }}/${{ env.FRONTEND_IMAGE }}:${{ github.sha }} \
      ./frontend
```

## Image Tagging Strategy

- Use git SHA for traceability: `myapp-cms:abc1234`
- Also tag with `latest` for convenience: `myapp-cms:latest`
- For production, tag with semver if releases are versioned

```bash
docker tag myapp-cms:${GIT_SHA} myapp-cms:latest
docker push myapp-cms:${GIT_SHA}
docker push myapp-cms:latest
```
