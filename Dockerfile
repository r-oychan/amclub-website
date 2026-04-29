# ============================================================
# Production image: Strapi CMS + Nginx (frontend)
# PostgreSQL provided externally by Azure Flexible Server.
# ============================================================

# ── Stage 1: Build frontend ──────────────────────────────────
FROM node:20-alpine AS frontend-builder
RUN apk add --no-cache libc6-compat
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ── Stage 2: Build CMS ───────────────────────────────────────
FROM node:20-alpine AS cms-builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /build
COPY cms/package*.json ./
RUN npm ci
COPY cms/ ./
# Cache-bust: bump the value below to force a fresh `strapi build` and
# guarantee dist/ reflects the latest component schemas. Strapi v5 reads
# component definitions from dist/src/components/ at startup, so a stale
# dist means new attributes (backgroundVideo, collageImages, etc.) silently
# go missing in the API.
ARG CMS_BUILD_BUST=2026-04-29T1
RUN echo "$CMS_BUILD_BUST" > /tmp/.build-bust && NODE_ENV=production npm run build

# ── Stage 3: Production runtime ──────────────────────────────
FROM node:20-alpine

RUN apk add --no-cache nginx wget

# Nginx directories
RUN mkdir -p /run/nginx /data

# Copy Nginx config
COPY infra/docker/nginx.conf /etc/nginx/http.d/default.conf

# Copy frontend build
COPY --from=frontend-builder /build/dist /app/frontend

# Copy CMS — use compiled JS from dist/, not raw TS from source
WORKDIR /app/cms
COPY --from=cms-builder /build/node_modules ./node_modules
COPY --from=cms-builder /build/dist ./dist
COPY --from=cms-builder /build/dist/build ./build
COPY --from=cms-builder /build/package.json ./
COPY --from=cms-builder /build/dist/config ./config
COPY --from=cms-builder /build/dist/src ./src
COPY cms/public ./public

# Copy seed media (used to populate empty volume on first run)
COPY media/ /app/seed-media/

# Copy entrypoint
COPY infra/docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

WORKDIR /app
VOLUME /data
EXPOSE 80

ENTRYPOINT ["/app/entrypoint.sh"]
