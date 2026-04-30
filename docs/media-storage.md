# Media Storage

How user-uploaded media (images, videos) flows from the Strapi admin UI to the public site.

## Overview

```
                     ┌──────────────┐
   admin upload ───▶ │  Strapi v5   │ ── metadata ──▶ Postgres (plugin::upload.file)
                     │ upload plugin│
                     └──────┬───────┘
                            │ provider.upload()
                            ▼
                     ┌──────────────────────────┐
                     │ strapi-provider-upload-  │
                     │   azure-storage          │
                     └──────┬───────────────────┘
                            ▼
                     ┌──────────────────────────┐
                     │ Azure Storage Account    │
                     │  amclubdata*             │
                     │   blob container "media" │   ◀── public site fetches files
                     │     uploads/<hash><ext>  │       directly via blob URL
                     └──────────────────────────┘
```

## Pieces

### Upload provider

- Package: `strapi-provider-upload-azure-storage` (v3.5.0, community).
- Configured in `cms/config/plugins.ts`. Activates only when `STORAGE_ACCOUNT` env var is set; otherwise Strapi falls back to its built-in local provider (used in `npm run develop`).
- Auth: shared-key (`accountKey`). For a future hardening pass, switch to managed identity by changing `authType: 'msi'` and assigning the Container App a system-assigned identity with `Storage Blob Data Contributor` on the account.

### Pulumi resources (`infra/index.ts`)

| Resource | Purpose |
|---|---|
| `StorageAccount amclubdata*` | Holds both the legacy file share and the new media blob container. `allowBlobPublicAccess: true` is required so the media container can be exposed for direct reads. |
| `FileShare amclub-data` | Legacy `/data` mount. Was used for `/data/uploads` via the persistent volume. New uploads no longer write here, but old `/uploads/<file>` URLs still resolve from it via nginx → Strapi static handler. |
| `BlobContainer media` | `publicAccess: Blob` (anonymous read on individual blobs only — list/write require auth). Holds new uploads under `uploads/<hash>.<ext>`. |

### Container app env vars

Threaded into the `app` container in `infra/index.ts`:

| Var | Source | Purpose |
|---|---|---|
| `STORAGE_ACCOUNT` | `storage.name` | Azure account name |
| `STORAGE_ACCOUNT_KEY` | secret `storage-account-key` | Shared-key auth |
| `STORAGE_URL` | `https://<account>.blob.core.windows.net` | Service base URL |
| `STORAGE_CONTAINER_NAME` | `mediaContainer.name` (= `media`) | Target container |
| `STORAGE_CDN_URL` | unset | Optional — point at a CDN later for cache fronting |

### What public URLs look like

- New uploads: `https://amclubdata28a57492.blob.core.windows.net/media/uploads/<hash>.<ext>`
- Legacy uploads (anything in the `files` table with `provider: local`): `/uploads/<hash>.<ext>` served by nginx → Strapi → `/data/uploads`

The frontend doesn't care which is which — both are absolute or root-relative URLs that resolve from the browser. Strapi returns whichever is stored in the `files.url` column for each media row.

## Why this layout

- **Don't store blobs in DB.** Strapi metadata (filename, dimensions, mime, alt text, hash, references) lives in Postgres. Binary contents go to Blob Storage.
- **Object storage > file share for media.** Faster, cheaper, CDN-friendly, scales horizontally, no persistent volume to manage.
- **Public-blob access > SAS tokens for a public website.** A public-facing club site has no secret media. Public-blob access keeps URLs stable and cacheable. If we later host private member content, switch the upload plugin to `defaultPath` per-folder + SAS-signed URLs.
- **Backward compatibility kept.** The file share + `/data/uploads` symlink remain so existing slide images (uploaded before Azure Blob Storage was active) still render.

## Migration of legacy media (manual step, optional)

Files seeded before Azure Blob Storage was wired up have `provider: local`. To move them:

1. Re-upload via admin Media Library — the new copy goes to blob storage, returns a blob URL, and is what the slide editor will reference.
2. Or write a one-shot script that downloads from `/uploads/...`, re-uploads through `strapi.plugin('upload').service('upload').upload(...)`, and updates references.

Until migrated, the two systems coexist: legacy files stay on the file share, new files land in blob storage.

## Common gotchas

- `mime: application/octet-stream` on a file usually means it was uploaded with a `Blob` constructor that didn't set `type`. Strapi stores whatever the multipart parser sees. Fixed in the migration script (`migrate-content.ts`) and backfilled at boot via `cms/src/index.ts → backfillUploadMimes`.
- Adding a new media field to a component (e.g. `backgroundVideo`) requires it to also be listed under the `populate` spec in any **custom controller** that overrides `find`/`findOne`. The auto-generated controllers populate everything, but `cms/src/api/home-page/controllers/home-page.ts` declares an explicit `POPULATE` map — every new media field needs an entry there.
- The Storage Account default for new accounts is `allowBlobPublicAccess: false`. Without it, `BlobContainer` with `publicAccess: Blob` fails with `Status=409 PublicAccessNotPermitted`.
