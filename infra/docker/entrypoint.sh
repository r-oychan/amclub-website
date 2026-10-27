#!/bin/sh
set -e

UPLOADS=/data/uploads

# Ensure uploads directory exists on persistent volume
mkdir -p "$UPLOADS"

# Seed media files on first run (if volume is empty)
if [ -d /app/seed-media ] && [ -z "$(ls -A "$UPLOADS" 2>/dev/null)" ]; then
    echo "==> Seeding uploads from bundled media..."
    cp -r /app/seed-media/* "$UPLOADS/"
fi

# Symlink CMS uploads to persistent volume so Strapi writes there
rm -rf /app/cms/public/uploads
ln -sf "$UPLOADS" /app/cms/public/uploads

# ── Cleanup handler ───────────────────────────────────────────
cleanup() {
    echo "==> Shutting down..."
    kill "$STRAPI_PID" "${NEXT_PID:-}" "$NGINX_PID" 2>/dev/null || true
    exit 0
}
trap cleanup TERM INT

# ── Start Strapi ──────────────────────────────────────────────
echo "==> Starting Strapi..."
cd /app/cms
node node_modules/.bin/strapi start &
STRAPI_PID=$!
cd /

# Wait for Strapi to be ready (up to 120s)
WAIT=0
until wget -qO /dev/null http://127.0.0.1:1337/_health 2>/dev/null; do
    WAIT=$((WAIT + 2))
    if [ "$WAIT" -gt 120 ]; then
        echo "==> Strapi failed to start within 120s"
        cleanup
    fi
    sleep 2
done
echo "==> Strapi ready."

# Enable only on dev until the POC is explicitly promoted.
export NEXT_HOME_ENABLED="${NEXT_HOME_ENABLED:-false}"
export STRAPI_INTERNAL_URL="http://127.0.0.1:1337"
if [ "$NEXT_HOME_ENABLED" = "true" ]; then
    echo "==> Starting Next.js homepage..."
    PORT=3000 HOSTNAME=127.0.0.1 node /app/next-home/next-home/server.js &
    NEXT_PID=$!
    NEXT_WAIT=0
    until wget -qO /dev/null http://127.0.0.1:3000/health 2>/dev/null; do
        NEXT_WAIT=$((NEXT_WAIT + 1))
        if [ "$NEXT_WAIT" -gt 60 ]; then
            echo "==> Next.js failed to start"
            cleanup
        fi
        sleep 1
    done
fi

# ── Render nginx config ───────────────────────────────────────
# Substitute ONLY the storage + resolver vars into the /uploads reverse-proxy
# block, leaving nginx's own $-variables ($host, $request_uri, $blob_host, …)
# intact. Defaults keep nginx bootable in a no-Azure context (the /uploads
# block just won't resolve a real blob host then).
export STORAGE_ACCOUNT="${STORAGE_ACCOUNT:-unset}"
export STORAGE_CONTAINER_NAME="${STORAGE_CONTAINER_NAME:-media}"
envsubst '${STORAGE_ACCOUNT} ${STORAGE_CONTAINER_NAME} ${NEXT_HOME_ENABLED}' \
    < /etc/nginx/http.d/default.conf.template \
    > /etc/nginx/http.d/default.conf
echo "==> Rendered nginx config (blob host: ${STORAGE_ACCOUNT}.blob.core.windows.net, container: ${STORAGE_CONTAINER_NAME})"

# ── Start Nginx ───────────────────────────────────────────────
echo "==> Starting Nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!
echo "==> All services running."

# ── Monitor processes ─────────────────────────────────────────
while true; do
    if ! kill -0 "$STRAPI_PID" 2>/dev/null; then
        echo "==> Strapi exited unexpectedly"
        cleanup
    fi
    if [ "$NEXT_HOME_ENABLED" = "true" ] && ! kill -0 "$NEXT_PID" 2>/dev/null; then
        echo "==> Next.js exited unexpectedly"
        cleanup
    fi
    if ! kill -0 "$NGINX_PID" 2>/dev/null; then
        echo "==> Nginx exited unexpectedly"
        cleanup
    fi
    sleep 5
done
