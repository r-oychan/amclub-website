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
ARG VITE_ELEVENLABS_AGENT_ID=agent_9501k4971nfqf1xvgd0604g5kq8y
ENV VITE_ELEVENLABS_AGENT_ID=$VITE_ELEVENLABS_AGENT_ID
RUN npm run build

# ── Stage 2: Build CMS ───────────────────────────────────────
FROM node:20-alpine AS cms-builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /build
COPY cms/package*.json ./
# Local providers referenced via file: in package.json must exist at the
# moment npm ci runs — otherwise npm creates a broken symlink in
# node_modules and Strapi fails to load the upload provider at runtime.
COPY cms/providers ./providers
RUN npm ci
# CMS_BUILD_NONCE busts the buildx layer cache when the value changes
# (set per-deploy in infra/index.ts to the current commit SHA). Needed
# because we saw the buildcache reuse a pre-refactor cms-builder layer
# even though `cms/` source had clearly changed.
#
# Critically: we WRITE the nonce to disk so the resulting layer has an
# actual filesystem diff. A bare `RUN echo ...` creates an empty diff
# that BuildKit happily collapses back to the cached parent — which is
# exactly what bit us last attempt.
ARG CMS_BUILD_NONCE=fallback
RUN echo "$CMS_BUILD_NONCE" > /build/.cms-build-nonce && cat /build/.cms-build-nonce
COPY cms/ ./
RUN NODE_ENV=production npm run build

# ── Stage 3: Production runtime ──────────────────────────────
FROM node:20-alpine

# gettext provides `envsubst`, used at startup to template the storage
# account name into the nginx config (see entrypoint.sh).
RUN apk add --no-cache nginx wget gettext

# Nginx directories
RUN mkdir -p /run/nginx /data

# Copy Nginx config as a TEMPLATE — entrypoint.sh renders the final config,
# substituting ${STORAGE_ACCOUNT}/${STORAGE_CONTAINER_NAME} into the /uploads
# reverse-proxy block so media is served from this origin.
COPY infra/docker/nginx.conf /etc/nginx/http.d/default.conf.template

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
# Local providers — node_modules/upload-azure-folders is a symlink into
# /build/providers in the builder stage. The runtime needs the symlink
# target present at the SAME relative path (../providers from
# /app/cms/node_modules → /app/cms/providers) or `require()` fails.
COPY --from=cms-builder /build/providers ./providers
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
