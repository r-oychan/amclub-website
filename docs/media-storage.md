# Media Storage

How user-uploaded media (images, PDFs, video) flows from the Strapi admin or seed scripts to the public site, and how it ends up organised in folders that mirror the page IA.

## Overview

```
                     ┌──────────────┐
   admin / seed ───▶ │  Strapi v5   │ ── metadata ──▶ Postgres (plugin::upload.file)
                     │ upload plugin│                    + plugin::upload.folder
                     └──────┬───────┘
                            │ provider.upload()
                            ▼
                     ┌──────────────────────────────┐
                     │ upload-azure-folders         │   ── wraps ──▶ strapi-provider-
                     │ (local provider wrapper)     │                upload-azure-storage
                     └──────┬───────────────────────┘
                            ▼
                     ┌─────────────────────────────────────────┐
                     │ Azure Storage Account amclub<env>data   │
                     │  blob container "media"                 │   ◀── public site fetches
                     │   uploads/<section>/<page>/<hash><ext>  │       blobs directly
                     └─────────────────────────────────────────┘
```

Two parallel structures stay in sync:

1. **Blob storage hierarchy** — derived from `file.path`, set per upload request.
2. **Media Library folders** — Strapi's admin-facing folder tree (rows in `upload_folders`), kept aligned to the blob hierarchy by a server middleware.

## Pieces

### 1. Wrapper provider — `cms/providers/upload-azure-folders/`

The upstream provider (`strapi-provider-upload-azure-storage`) hardcodes `config.defaultPath` for every blob it writes and ignores `file.path`. Our wrapper re-inits the upstream per-call with an adjusted `defaultPath = join(defaultPath, file.path)`, so per-upload folder routing works. The wrapper also tolerates `BlobNotFound` on delete (orphaned rows from interrupted seeds otherwise can't be purged).

Wired in `cms/config/plugins.ts`:

```ts
plugins.upload = {
  config: {
    provider: 'upload-azure-folders',           // matches package name below
    providerOptions: { authType: 'default', account, accountKey, ... },
  },
};
```

Linked into `node_modules` via a `file:` dependency in `cms/package.json`:

```json
"upload-azure-folders": "file:providers/upload-azure-folders"
```

> ⚠ Local providers MUST be referenced via a `file:` link, not via a relative path string like `'./src/providers/...'`. Strapi's createProvider calls `require(modulePath)` from inside `node_modules/@strapi/upload/dist/server/register.js` — relative paths resolve against that file's directory, not the project root, and fail with `MODULE_NOT_FOUND`.

### 2. Seed-helper auto-path — `scripts/seed-helpers.mjs`

`uploadFile` and `uploadAll` derive the blob folder from where the local file sits under `media/`. A `TOP_LEVEL_BLOB_MAP` normalises legacy directory names to the canonical site IA:

```
media/pages/dining/hero-bg.jpg     → dining/hero-bg.jpg
media/restaurants/central.jpeg     → dining/restaurants/central.jpeg
media/promotions/fathers-day.jpg   → dining/promotions/fathers-day.jpg
media/logos/central.png            → dining/restaurants/central.png
media/branding/logo.webp           → global/branding/logo.webp
media/social/instagram.png         → global/social/instagram.png
media/fitness/aquatics/coach-x.jpg → fitness/aquatics/coach-x.jpg
```

Already-canonical top-level dirs (`about/`, `dining/`, `event-spaces/`, `fitness/`, `gallery/`, `home/`, `kids/`, `membership/`, `news/`) pass through unchanged. An explicit `{ path }` argument always wins over auto-derivation — used by scripts that download to a tmp dir outside `media/` (e.g. `seed-events.mjs` passes `path: \`whats-on/events/${slug}\``).

### 3. Path → Media Library folder middleware — `cms/src/middlewares/upload-path-to-folder.ts`

Intercepts `POST /api/upload`. When the body contains a `path`:

1. Walks the path segments, finds-or-creates a row in `upload_folders` for each (memoised in-process).
2. After the upload controller commits the file, updates the file row to set `folder` + `folderPath` so the Media Library admin UI renders it inside the matching folder hierarchy.

> ⚠ The folder is written **post-controller**, not via `fileInfo.folder`. Content-API's yup schema (`fileInfoSchema.noUnknown()`) strips unknown keys before the controller runs — `folder` is admin-API-only. By the time `next()` returns, Strapi has persisted the file without a folder; we then update the row directly.

Registered in `cms/config/middlewares.ts` as `{ name: 'global::upload-path-to-folder' }`, after `strapi::body` so multipart fields are parsed.

### 4. Pulumi resources (`infra/index.ts`)

| Resource | Purpose |
|---|---|
| `StorageAccount amclub<env>data` | Holds the media blob container. `allowBlobPublicAccess: true` is required so the container can be exposed for direct reads. |
| `BlobContainer media` | `publicAccess: Blob` (anonymous read on individual blobs only — list/write require auth). Blobs land under `uploads/<section>/<page>/<hash>.<ext>`. |
| `BlobServiceProperties` (CORS) | Wildcard `AllowedOrigins: ['*']` for GET/HEAD/OPTIONS. Required because the admin Media Library renders `<img crossorigin="anonymous">` — without CORS headers the browser refuses to display the image even though the blob is publicly readable. |

### 5. Container app env vars

| Var | Source | Purpose |
|---|---|---|
| `STORAGE_ACCOUNT` | `storage.name` | Azure account name |
| `STORAGE_ACCOUNT_KEY` | secret `storage-account-key` | Shared-key auth |
| `STORAGE_URL` | `https://<account>.blob.core.windows.net` | Service base URL |
| `STORAGE_CONTAINER_NAME` | `mediaContainer.name` (= `media`) | Target container (also templated into the nginx `/uploads` proxy) |
| `STORAGE_CDN_URL` | `publicSiteUrl` (= `PUBLIC_SITE_URL`) | Front media on the site origin → `file.url` becomes `<site>/uploads/...`; nginx proxies it to the blob. See "What public URLs look like". |

### 6. Dockerfile (`Dockerfile` — used by Pulumi)

Two extra copies for the local provider:

```dockerfile
# cms-builder stage — providers/ must exist BEFORE npm ci so the file: link resolves
COPY cms/package*.json ./
COPY cms/providers ./providers
RUN npm ci

# Production runtime — providers/ must be present at runtime too;
# node_modules/upload-azure-folders is a symlink → ../providers/upload-azure-folders
COPY --from=cms-builder /build/node_modules ./node_modules
COPY --from=cms-builder /build/providers ./providers
```

Without the runtime copy the symlink dangles and Strapi boots with `Cannot find module 'upload-azure-folders'`.

## What public URLs look like

Media is served from the **site's own origin**, not the raw blob host:

```
https://<env-site>/uploads/<section>/<page>/<hash>.<ext>
# e.g. https://uat.amclub.org.sg/uploads/dining/restaurants/central.jpeg
```

This matches how the static documents under `frontend/public/` are served, so the
whole site stays on one domain and the storage-account name is never exposed.

How it works (two cooperating pieces):

1. **Provider rewrite.** `STORAGE_CDN_URL` is set to the env's public site origin
   (`PUBLIC_SITE_URL`). The Azure provider (`strapi-provider-upload-azure-storage`)
   replaces the blob host with `cdnBaseURL` **and strips the container segment**, so
   `…blob.core.windows.net/media/uploads/x.jpg` → `<site>/uploads/x.jpg`. This is
   stamped into `file.url` (and every responsive `formats[*].url`) at upload time.
2. **nginx reverse-proxy.** `location /uploads/` proxies to
   `https://<account>.blob.core.windows.net/<container>/uploads/...`. The account +
   container are templated into the config at container start by `entrypoint.sh`
   (`envsubst '${STORAGE_ACCOUNT} ${STORAGE_CONTAINER_NAME}'` against
   `default.conf.template`). A `resolver` + variable `proxy_pass` forces runtime DNS
   resolution. The `media` container has public blob read, so no auth is forwarded.

The frontend doesn't need to know about the folder structure — every media field on
the API returns the full URL string.

**Existing rows** uploaded before `STORAGE_CDN_URL` was set keep the old blob-host URL
until rewritten. Run `scripts/sql/rewrite-media-urls-to-origin.sql` once per env
(via Cloud Shell, **after** deploying the nginx change) to migrate `url` + `formats`.

## Why this layout

- **Blob path mirrors page IA.** Editors (and devs) can find the assets for a page just by browsing the blob container — no guessing where "logos/central.png" lives.
- **Media Library folder mirrors blob path.** Editors uploading via the admin land inside the right folder by default once they navigate to it; nothing falls into a generic "API Uploads" bucket.
- **Private fields stay private.** `folder` and `folderPath` are `private: true` on the upload `file` schema — they don't appear in `GET /api/upload/files` responses. The admin uses authenticated admin endpoints that DO include them.

## Common gotchas

See [troubleshooting.md](./troubleshooting.md) for full debugging recipes. Quick reference:

- **Thumbnails broken in admin** → Azure CORS rule missing on the blob service.
- **Files show flat under "API Uploads"** → middleware not registered, or the seed script bypassed `seed-helpers.uploadFile`.
- **`Cannot find module 'upload-azure-folders'`** → Dockerfile didn't copy `cms/providers/` into the deps and/or runtime stage.
- **`folderPath: null` on every file row in GET responses** → not a bug; field is `private: true`. Check by querying with admin auth or via DB.
- **`mime: application/octet-stream`** → uploaded with `new Blob([buf])` without `type`. The seed helper sets the mime from filename ext; the boot script in `cms/src/index.ts` backfills any stale rows.
- **`StorageAccount` create fails with `PublicAccessNotPermitted`** → set `allowBlobPublicAccess: true` on the account.

## Migration of legacy media

Files seeded before this layout was wired up have `provider: local` or live at a flat `uploads/<hash>.<ext>` path. To move them, the cleanest path is:

1. Delete every row in `plugin::upload.file` via `DELETE /api/upload/files/:id` (the wrapper provider tolerates `BlobNotFound` so orphan rows can be purged).
2. Empty the blob container's `uploads/*` via `az storage blob delete-batch`.
3. Re-run every `scripts/seed-*.mjs` — they re-upload with correct paths, mime types, and folder linkage in one pass.

See [strapi-patterns.md → "Resetting media on a non-prod env"](./strapi-patterns.md#resetting-media-on-a-non-prod-env) for the script template.
