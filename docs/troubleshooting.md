# Troubleshooting

Symptom → cause → fix recipes for issues we've hit on this project. Skim the symptoms; each entry has the diagnostic command and the file/line that needs to change.

## Media / uploads

### Thumbnails appear broken in the admin Media Library

**Symptom:** Each row in `/admin/plugins/upload` shows a broken-image icon. Clicking opens a details modal with `<img src="https://amclubdata.../uploads/thumbnail_*.jpg" crossorigin="anonymous">` and a tiny broken-image glyph.

**Diagnosis:**

```bash
curl -sI 'https://amclub<env>data.blob.core.windows.net/media/uploads/thumbnail_<hash>.jpg' \
  -H 'Origin: https://<your-admin-host>'
```

If the response is missing `Access-Control-Allow-Origin`, it's CORS. If `Content-Type` is `application/octet-stream` for a JPEG, it's a mime issue. Often both.

**Fix 1 — CORS on the storage account:**

```bash
az storage cors add --account-name amclub<env>data --services b \
  --methods GET HEAD OPTIONS --origins '*' \
  --allowed-headers '*' --exposed-headers '*' --max-age 3600
```

(Or land via Pulumi — see `infra/index.ts` → `BlobServiceProperties` block. Pulumi-driven CORS survives stack rebuilds.)

**Fix 2 — Mime on the blob:**

The blob's stored `Content-Type` is set by whatever the upload provider sends. `seed-helpers.uploadFile` already sets `new Blob([buf], { type: mimeForFile(name) })`. For files uploaded before the fix, re-upload via `--replace` or do a clean reset (see [strapi-patterns.md → Resetting media](./strapi-patterns.md#resetting-media-on-a-non-prod-env)).

The bootstrap in `cms/src/index.ts → backfillUploadMimes` fixes the DB row's mime column for legacy uploads, but doesn't touch the blob's stored Content-Type header. CSP-side fix is already configured in `cms/config/middlewares.ts` — adds `STORAGE_HOST` to `img-src` so the admin can request the blob host at all.

**Fix 3 — CSP missing the PUBLIC media host (PROD-ONLY www/apex split):**

**Symptom:** A specific entry's media thumbnail is blank in the Content Manager *on prod only* — dev/uat are fine. The blob/thumbnail returns `200 image/jpeg` with `Access-Control-Allow-Origin: *` (so it's neither 404, mime, nor CORS), yet the admin won't render it.

**Cause:** The upload provider rewrites media URLs to the PUBLIC host (`STORAGE_CDN_URL`/`PUBLIC_SITE_URL`, e.g. `https://amclub.org.sg/uploads/...`), **not** the raw blob host. On dev/uat the admin and media share a host (`dev.amclub.org.sg`) so CSP `'self'` covers it. On **prod the admin is served from `www.amclub.org.sg` but media resolve on the apex `amclub.org.sg`** — a different CSP origin not in `img-src` (which only had `'self'` + the blob host) → browser blocks every thumbnail.

**Diagnosis:** `curl -sD - -o /dev/null https://www.amclub.org.sg/admin | grep -i content-security-policy` → check `img-src` lists the apex media host. Compare against the media `url` host returned by the content API.

**Fix:** `cms/config/middlewares.ts` now derives `CDN_HOST` from `STORAGE_CDN_URL || PUBLIC_SITE_URL` and adds it to both `img-src` and `media-src` (per-env). Requires a CMS rebuild + redeploy.

### Files show under "API Uploads" in admin even though blob path looks right

**Symptom:** Admin Media Library has a tree (Dining, Fitness, etc.) with the right folders, but all files appear under a flat "API Uploads" bucket. Folders are empty.

**Cause:** content-API's yup schema strips unknown keys from `fileInfo` before the upload controller runs. `fileInfo.folder` only works on the admin-API. The pattern of *creating* the folder server-side then *also* updating the file row post-controller fixes this — see `cms/src/middlewares/upload-path-to-folder.ts`.

**Diagnosis:**

```bash
# Run a test upload that the middleware should intercept
curl -sS -X POST "$BASE/api/upload" -H "Authorization: Bearer $TOKEN" \
  -F "files=@/tmp/pixel.txt" -F "path=test/sub" \
  | python3 -c "import sys,json; r=json.load(sys.stdin)[0]; print('folder=', r.get('folder'), 'folderPath=', r.get('folderPath'))"
```

If `folder: None`, the middleware isn't running (not registered, or registered before `strapi::body` so multipart wasn't parsed yet). Container logs will show `[upload-path-to-folder] hit method=POST` lines when it does run.

**Fix:** Check `cms/config/middlewares.ts` has `{ name: 'global::upload-path-to-folder' }` AFTER `strapi::body`. Rebuild and redeploy CMS.

### `GET /api/upload/files/N` returns `folder: null` even though admin shows it

**Not a bug.** `folder` and `folderPath` are `private: true` on the Strapi upload `file` schema, so the default REST GET excludes them. The admin uses authenticated admin endpoints that include private fields.

To verify the row is actually linked, either:
- Query a single file by ID and look for the linkage in the DB row (psql, requires firewall allow), or
- Re-upload the same file with `--replace` and check the response — the upload pipeline returns the live folder.

### `Cannot find module 'upload-azure-folders'` at boot

**Symptom:** Container logs show:

```
error: Could not load upload provider "upload-azure-folders".
Cannot find module 'upload-azure-folders'
at createProvider (/app/cms/node_modules/@strapi/upload/dist/server/register.js:63:20)
```

**Cause:** the `file:` link in `cms/package.json` resolves at install time to a symlink under `node_modules/`. In the Docker runtime image, the symlink's target (`/app/cms/providers/upload-azure-folders`) is missing because the `providers/` dir wasn't COPYed.

**Fix:** in `Dockerfile`, ensure both the cms-builder and the runtime stages copy `cms/providers`:

```dockerfile
# cms-builder
COPY cms/package*.json ./
COPY cms/providers ./providers   # ← needed BEFORE npm ci
RUN npm ci

# runtime
COPY --from=cms-builder /build/node_modules ./node_modules
COPY --from=cms-builder /build/providers ./providers   # ← needed AFTER node_modules
```

The runtime copy is what most people miss. Without it, the symlink dangles.

### `Could not load upload provider "./src/providers/foo"` even though the file exists

**Cause:** Strapi resolves provider strings via `require(modulePath)` from inside `node_modules/@strapi/upload/dist/server/register.js`. Relative paths in plugin config resolve against THAT file's directory, not the project root. So `'./src/providers/foo'` looks for `node_modules/@strapi/upload/dist/server/src/providers/foo` and fails.

**Fix:** use a `file:` link in `package.json`, reference by NPM-style name in plugin config. See [strapi-patterns.md → Custom upload provider](./strapi-patterns.md#1-custom-upload-provider-file-system-folder-routing).

### Reset script: `Removing N files… Done. ok=0 errors=N`

**Cause:** Strapi's `DELETE /api/upload/files/:id` tries to delete the blob FIRST. If the blob is missing (orphaned row from an interrupted seed), Azure returns 404 `BlobNotFound`, the provider throws, and Strapi refuses to delete the DB row too.

**Fix:** in the wrapper provider, swallow `BlobNotFound` on delete:

```js
delete: async (file) => {
  try { return await providerForFile(config, file).delete(file); }
  catch (err) {
    if (/BlobNotFound|specified blob does not exist/i.test(String(err.message))) return;
    throw err;
  }
},
```

Already in `cms/providers/upload-azure-folders/index.js`. If you see this on a re-run after that commit landed, the deploy didn't pick up — check `gh run list --branch dev`.

## SSO

### Locked out of SSO after enabling whitelist

**Symptom:** Set `USE_WHITELIST: true` on `strapi-plugin-sso`, deployed, now SSO login throws "Not present in whitelist" for every email — including your own. No way in via SSO.

**Cause:** `USE_WHITELIST: true` enforces that the SSO email must match a row in `plugin::strapi-plugin-sso.whitelists`. If the table is empty (no rows seeded before flipping the flag), every login is rejected.

**Recovery:** password login still works (the whitelist gate is SSO-only). Log in with your local password admin, navigate to `/admin/settings/strapi-plugin-sso` → Whitelist tab, add allowed emails, then SSO works for those addresses.

**If even the password admin is gone:** revert the flag in `cms/config/plugins.ts`, push, wait for deploy. SSO falls back to the original auto-provision behaviour.

**Safer pattern:** seed allowed emails first (via admin UI, or a bootstrap step in `cms/src/index.ts` that reads `SSO_WHITELIST_EMAILS` env var), THEN flip `USE_WHITELIST: true`. Not yet implemented — re-attempt the gate only with that prep in place.

## Expiry filter

### `/whats-on` shows past events on one env, hides them on another

Check whether the expiry filter has been promoted to every env:

```bash
git show origin/main:cms/src/api/event/controllers/event.ts | head -5
git show origin/uat:cms/src/api/event/controllers/event.ts | head -5
git show origin/dev:cms/src/api/event/controllers/event.ts | head -5
```

If the controller is the default `factories.createCoreController('api::event.event')` with no override, the filter isn't there. Filter logic + override live in `cms/src/utils/expiry-filter.ts` + the type's controller — promote both as one bundle.

### Editor can't find the "hide date" control

`expiredAt` (date) is the explicit override on `event` + `dining-promotion`. If the field doesn't appear in the admin edit view:

1. Confirm it's in `schema.json`.
2. Refresh the admin and re-open the entry — newly-added fields appear at the bottom of the auto-generated layout.
3. If the layout was customised in Content-Type Builder, the new field may not be in the saved layout. Open Content-Type Builder → Event → "Edit the view" → drag `expiredAt` into the layout → Save.

### Listing endpoint hides expired events but `/whats-on/<expired-slug>` should still resolve

**Diagnosis:**

```bash
curl -sS "$BASE/api/events?filters[slug][\$eq]=<expired-slug>" | jq '.data | length'
```

Should return `1`. If `0`, the expiry filter is being applied to the slug query — check `shouldApplyExpiryFilter` in `cms/src/utils/expiry-filter.ts` and confirm the controller delegates to it (not just calling `buildExpiryFilter` directly).

## Deployment

### Container Apps deploy "successful" but app responds with stale revision

**Symptom:** Push to `dev`, CI green, Deploy job green, but the deployed admin still shows old code.

**Diagnosis:**

```bash
az containerapp revision list --name amclub-dev-app --resource-group amclub-dev-rg \
  --query '[].{name:name, traffic:properties.trafficWeight, healthState:properties.healthState, created:properties.createdTime}' -o table
```

If the newest revision shows `HealthState: Unhealthy` and `Traffic: 100`, the new container booted but failed the readiness probe — Container Apps still routes traffic to it (no healthy fallback). Check logs:

```bash
az containerapp logs show --name amclub-dev-app --resource-group amclub-dev-rg --tail 200 \
  | grep -iE 'error|fail|provider|Cannot find'
```

Common boot failures:
- `Cannot find module '<provider>'` — Dockerfile didn't copy `cms/providers`.
- `Could not load upload provider "..."` — relative path in plugin config; use file: link instead.
- `MissingEnvVar` from the elevenlabs plugin — `ELEVENLABS_AGENT_ID` not set in the Container App env vars.

### `gh run watch` hangs even though the deploy completed

`gh`'s long-poll occasionally drops its connection to api.github.com and the watch hangs without erroring. Fall back to:

```bash
gh run list --branch dev --limit 3 --json databaseId,name,status,conclusion \
  --jq '.[] | "\(.databaseId) \(.name) \(.status) \(.conclusion // "-")"'
```

For automated waits, use `gh run view <ID> --json conclusion` in a `until` loop with a 30s sleep instead of `gh run watch`.

### Pulumi state account `pulumistate<hash>` resolves to NXDOMAIN

The dev/uat/prod stacks each pin to a state storage account name. If DNS returns NXDOMAIN, the account was renamed, deleted, or migrated tenants. Quick fixes:

- Apply isolated changes directly via `az` CLI (e.g. CORS rules) and commit the equivalent Pulumi code for next stack rebuild.
- For destructive Pulumi changes, recover the state backend first — don't try to `pulumi up` against the wrong account.

The currently-active state accounts are tracked in `infra/.env` and `infra/Pulumi.<env>.yaml`. Update `~/.claude/projects/.../memory/reference_pulumi_state_storage.md` after any tenant migration so the LLM has fresh info next session.

## Seed scripts

### Some seeds fail with `fetch failed` mid-run

Container Apps scale-from-zero can introduce 30–60s cold-starts. If a seed run hits a cold app, the first few requests may time out and the script's `fetch` throws.

**Mitigation:** Container Apps min-replicas should stay at 1 in `infra/index.ts`. If scale-to-zero is on for cost, warm the app before running seeds:

```bash
curl -sS $BASE/api/upload/files?pagination[pageSize]=1 -o /dev/null -w "warmup %{http_code} %{time_total}s\n"
```

Then run the seeds. If a few scripts fail anyway, re-run them individually — they're idempotent upserts.

### `seed-site-settings.mjs → 405 Method Not Allowed`

The site-settings singleton is upserted by Strapi's bootstrap (`cms/src/index.ts → ensureSiteSettings`). The seed script's PUT pattern doesn't match Strapi v5 singleton semantics. Safe to skip — the row exists with sensible defaults. Use the admin to flip flags.

### `seed-membership-subpages.mjs → 404 facilities`

The legacy `facility` collection was deleted upstream. The script targets it directly. Stale — skip. The 5 membership singleton pages (`joining-fees-page`, `referral-page`, etc.) are seeded by their own dedicated scripts.

## General

### "I see my commit on the PR but the deployed app doesn't show the change"

1. Check the Deploy job status: `gh run list --branch <branch> --limit 5`.
2. Check Container Apps revision health: `az containerapp revision list ...` — Unhealthy means it booted but failed readiness.
3. Container logs: `az containerapp logs show --name amclub-<env>-app --resource-group amclub-<env>-rg --tail 200`.
4. If the Dockerfile changed, the build cache may be stale. The Pulumi build sets `CMS_BUILD_NONCE=<git sha>` and writes it to disk inside the cms-builder stage to bust the layer cache. If you've changed `Dockerfile` and the build seems to skip a stage anyway, force a fresh build by pushing an empty commit.

### "How do I know what's queued for promotion?"

```bash
git fetch origin
git log --oneline origin/uat..origin/dev    # dev ahead of uat (next PR target)
git log --oneline origin/main..origin/uat   # uat ahead of main (next PR target)
git diff --stat origin/uat..origin/dev      # what files would change
```

PRs for promotion: `gh pr create --base uat --head dev …` and `gh pr create --base main --head uat …`. Never push directly to `uat`/`main`.

### "My memory of the project (Pulumi state account etc.) is stale"

Refresh:

```bash
nslookup pulumistate<hash>.blob.core.windows.net   # check the state account still exists
cat infra/Pulumi.<env>.yaml                        # confirm stack config
```

Update memory files in `~/.claude/projects/.../memory/` when reality diverges from what's saved.

## Patch fails with `Invalid key <newField>` right after a deploy

**Symptom:** a content patch that PUTs a newly added schema field errors immediately after the Deploy workflow reports success; re-running the same patch a minute later works.

**Cause:** Container Apps revision swap lag — the request hit the *old* revision, whose Strapi doesn't know the new field yet (input validation rejects unknown keys). Seen twice on `patch-2026-06-12-benefits-text.mjs` (dev and uat).

**Fix:** wait ~30–60 s after the new revision shows 100 % traffic (`az containerapp revision list`), or just re-run the patch — all content patches in `scripts/` are idempotent by design.

## A newly-added field appears empty on the site even though it was seeded (custom controller POPULATE map drift)

**Symptom:** you add a field to a detail content type (e.g. `fitness-facility.imagePanels`, `restaurant.promoCards`), seed it, and the public page still shows the old hardcoded `subpages.ts` fallback. Reading back via the REST API (`GET /api/<plural>?...&populate[field][populate]=*`) returns the field **empty**, so it *looks* like the write didn't persist.

**The trap:** these detail types use a **custom `find`/`findOne` controller** with a **hardcoded `POPULATE` map** (see `cms/src/api/fitness-facility/controllers/fitness-facility.ts`, `restaurant`, and `cms/src/lib/detail-page-populate.ts`). The controllers **ignore the `populate` query param entirely** and always use their internal map. So:
- Any field **missing from that map is never returned** — no matter what `populate=…` you pass. The frontend therefore never receives it and falls back to `subpages.ts`.
- This masquerades as "the write didn't persist." It did — you just can't see it through the custom read path.

**Confirm the write actually persisted** (bypass the custom `find` controller — the default `update` route *does* honour query populate):

```js
// PUT with populate in the URL returns the populated entity from the default update controller
const r = await api(ctx, `/fitness-facilities/${docId}?populate[imagePanels][populate]=*`,
  { method: 'PUT', body: { data: {} } });           // empty data = no-op write, just read back
console.log(r.data.imagePanels);                      // populated → the data is there
```

If that shows the data but the normal `GET` doesn't, it's the controller map — **not** the DB.

**Fix:** add the field (with the nested populate the frontend needs) to the controller's `POPULATE` constant, e.g.:

```ts
// fitness-facility controller
imagePanels: { populate: { image: true, cta: true, bullets: true, operatingHours: { populate: { rows: true } } } },
// restaurant controller
promoCards: { populate: { cards: { populate: { image: true, cta: true } } } },
```

Then `cd cms && npm run build`, commit, deploy. **Rule of thumb:** every time you add a component/relation field to `fitness-facility`, `restaurant`, `kids-experience`, `event-space`, or any type with a custom controller, **update its `POPULATE` map in the same commit** — the schema and the controller's read map drift apart silently otherwise. Discovered 2026‑06‑16: commit `22c7ccf` added `imagePanels`/`promoCards` but left both controllers' maps untouched, so the content was invisible despite being stored.

> Earlier misdiagnosis (recorded so nobody repeats it): this was first mistaken for a missing-DB-table / schema-sync problem. It is **not** — the component tables exist and the writes persist. `TRUNCATE strapi_database_schema` + restart does nothing for this; only the controller `POPULATE` map fix does.

## Chatbot KB syncs "succeed" but the agent never gets the new docs

**Symptom:** publishing entries creates new ElevenLabs KB documents (visible via the
knowledge-base API, often as accumulating duplicates), but the agent's attached
`knowledge_base` list never changes; the bot answers from stale content or says it
doesn't know. Container logs show two warnings from `[elevenlabs-chatbot]`:

- `ElevenLabs PATCH /v1/convai/agents/... failed: 404 ... document_not_found` —
  the sync-log (`elevenlabs-doc` collection) holds rows whose remote doc was
  deleted (e.g. by another environment's CMS pointing at the same ElevenLabs
  account historically, or manual cleanup). One dead id makes the whole agent
  PATCH fail, so **no** attachment update ever lands.
- `Transaction query already complete` — lifecycle-triggered syncs ran inside the
  request's committed DB transaction, losing sync-log upserts (→ duplicate docs).

**Fix (landed July 2026):** the agent attach now tries the PATCH first and, only
on failure, verifies each sync-log row with a **direct GET** and drops true
404s (the knowledge-base *search* endpoint's index lags doc creation — using
it for validation wrongly deletes rows for docs created seconds earlier).
Lifecycle syncs are queued and drained by a bootstrap-scoped worker (a nested
`strapi.db.transaction` JOINS the completed parent — it does not escape it).
If you see this on an older build, redeploy, then re-publish entries (or
admin → Sync All) to rebuild the log and attachments.

**Related:** RAG indexes are NOT computed automatically for newly attached docs —
`POST /v1/convai/knowledge-base/{id}/rag-index` per doc, or the agent retrieves
nothing and falls back to "I don't have that in my knowledge base".

## Chatbot KB: duplicate docs, quota exhaustion, missing content (July 2026)

- **Symptom:** `rag_limit_exceeded` when indexing; the agent's KB full of
  `am-club:<type>:id-<n>` docs in multiple generations (e.g. five copies of
  `footer:id-5..9:file:club-bylaws` holding ~1.2 MB of the ~2 MB account quota).
  **Cause:** doc names keyed on the published **row id**, which Strapi v5
  regenerates on every publish — each republish of a slugless entry (singletons,
  committee members) created a new doc and stranded the old one, still attached
  and indexed. **Fix (landed 10 Jul 2026):** `buildDocName`/`buildFileDocName`
  key on slug → `documentId`; stale-file cleanup matches the stable doc-name
  prefix instead of `ownerEntryId`. Purge any remaining `id-N` docs with
  `scripts/elevenlabs-purge-stale.py <env>` and re-index with
  `scripts/elevenlabs-index-kb.py <env>`.
- **Symptom:** chatbot knows nothing about a whole content type (e.g. event
  spaces). **Cause:** stale UID in `DEFAULT_ELEVENLABS_CONTENT_TYPES`
  (`api::venue.venue` survived the rename to `event-space`) — a bad UID fails
  silently. Keep the allow-list in step with content-type renames.
- **Symptom:** chatbot can't answer from a field that is clearly on the page
  (e.g. ballroom size/capacity). **Cause:** the markdown renderer skipped
  `richtext` fields entirely and dropped short scalars (`capacity`,
  `locationLevel`) not in its summary set. Both render since 10 Jul 2026 —
  if a new "invisible field" appears, check `markdown.ts` field handling first.
- **Symptom:** RAG index status `failed` at 100% progress on multiple accounts
  for the same doc. **Cause:** corrupt doc content (not quota) — inspect the
  uploaded text. Status must be polled via **GET**; the POST response reports
  `new` misleadingly, and an index can only be deleted after the doc is
  detached from every agent (`rag_index_used`).
