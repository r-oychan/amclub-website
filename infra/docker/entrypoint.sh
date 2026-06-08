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
    kill "$STRAPI_PID" "$NGINX_PID" 2>/dev/null || true
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

# ── Render nginx config ───────────────────────────────────────
# Substitute ONLY the storage vars into the /uploads reverse-proxy block,
# leaving nginx's own $-variables ($host, $request_uri, $blob_host, …) intact.
# Defaults keep nginx bootable in a no-Azure context (the /uploads block just
# won't resolve a real blob host then).
export STORAGE_ACCOUNT="${STORAGE_ACCOUNT:-unset}"
export STORAGE_CONTAINER_NAME="${STORAGE_CONTAINER_NAME:-media}"
envsubst '${STORAGE_ACCOUNT} ${STORAGE_CONTAINER_NAME}' \
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
    if ! kill -0 "$NGINX_PID" 2>/dev/null; then
        echo "==> Nginx exited unexpectedly"
        cleanup
    fi
    sleep 5
done
