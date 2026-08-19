# Strapi v5 Patterns

Repeatable patterns for building features on this project. Each section describes the problem, the approach we chose, and the gotchas baked into Strapi v5 that drove the design.

## 1. Custom upload provider (file-system folder routing)

**Goal:** route each upload to a per-section/page sub-folder in blob storage based on a `path` form-data field.

**Constraints discovered:**
- The upstream Azure provider (`strapi-provider-upload-azure-storage`) hardcodes `config.defaultPath` and ignores `file.path`.
- Strapi's provider loader is `require(modulePath)` from inside `node_modules/@strapi/upload/dist/server/register.js` — **relative paths in the plugin config resolve against that file's directory, not the project root**. `provider: './src/providers/foo'` fails with `MODULE_NOT_FOUND`.
- npm `file:` deps create a symlink in `node_modules` whose target must exist at both **install time** (so `npm ci` doesn't dangle) and **runtime** (so Node can follow the link).

**Pattern (the one in `cms/providers/upload-azure-folders/`):**

1. Put the provider at `cms/providers/<name>/` with its own `package.json` (`name: <name>`, `main: index.js`).
2. Add a `file:` link in `cms/package.json`:
   ```json
   "upload-azure-folders": "file:providers/upload-azure-folders"
   ```
3. Reference by NPM-style name in `cms/config/plugins.ts`:
   ```ts
   provider: 'upload-azure-folders'
   ```
4. Dockerfile must `COPY cms/providers ./providers` **before `npm ci`** in the builder stage, and **after** `node_modules` in the runtime stage (the symlink target needs to be present at the same relative path).

The wrapper itself re-inits the upstream provider per call with an adjusted config — Azure SDK's `BlobServiceClient` is just an object until used, so this is cheap and concurrency-safe:

```js
function providerForFile(config, file) {
  const effectivePath = file.path ? joinPath(config.defaultPath, file.path) : config.defaultPath;
  return upstream.init({ ...config, defaultPath: effectivePath });
}
```

## 2. Bridge "path" form field to Media Library folder

**Problem:** even with the blob path routed correctly, files show flat under "API Uploads" in the admin because Media Library folder organisation is a separate concept (`upload_folders` table).

**Why setting `fileInfo.folder` doesn't work for content-API uploads:**

```js
// @strapi/upload/dist/server/controllers/validation/content-api/upload.js
const fileInfoSchema = utils.yup.object({
  name: ..., alternativeText: ..., caption: ..., focalPoint: ...
}).noUnknown();   // ← strips `folder` before the controller sees it
```

Admin uploads have a separate schema that allows `folder`; content-API doesn't.

**Pattern (the one in `cms/src/middlewares/upload-path-to-folder.ts`):**

1. Registered as `{ name: 'global::upload-path-to-folder' }` in `cms/config/middlewares.ts` **after** `strapi::body` (so multipart fields are parsed).
2. On `POST /api/upload`:
   - Read `body.path`.
   - Walk the segments, find-or-create rows in `plugin::upload.folder` for each, memoising in-process.
3. **After** `await next()`:
   - Update each created file row with `folder` + `folderPath` via `strapi.db.query('plugin::upload.file').update(...)`.
   - Also mutate `ctx.response.body` so the caller's immediate read shows the linkage.

`folder` and `folderPath` are `private: true` on the file schema, so subsequent `GET /api/upload/files` responses don't include them — that's correct, not a bug. The admin uses authenticated endpoints that include private fields.

## 3. Hide-from-listings expiry filter (URL alive)

**Goal:** when an event/promo passes its natural end date, drop it from listing endpoints but keep `/whats-on/<slug>` resolving so bookmarks survive. Editors can override per-entry.

**Constraints:**
- Strapi v5's query engine has no `COALESCE`. The "use explicit `expiredAt` if set, else fall back to `date`" rule has to be expressed in `$or`/`$and`.
- The same controller serves both list (`GET /api/events`) and slug-by-filter (`GET /api/events?filters[slug][$eq]=...`). The slug-by-filter path is what `/whats-on/<slug>` uses — it must NOT be filtered.

**Pattern (in `cms/src/utils/expiry-filter.ts`):**

Skip the filter when the consumer already targets a single entry:

```ts
export function shouldApplyExpiryFilter(query: any): boolean {
  const f = query?.filters;
  if (!f) return true;
  if ('slug' in f || 'documentId' in f || 'id' in f) return false;
  return true;
}
```

Build the filter as "either explicit override is in the future, or override is null and fallback date is in the future":

```ts
export function buildExpiryFilter(fallbackField: string) {
  const today = new Date().toISOString().slice(0, 10);  // 'YYYY-MM-DD'
  return {
    $or: [
      { expiredAt: { $gte: today } },                   // editor said keep
      {
        $and: [
          { expiredAt: { $null: true } },               // no override
          { $or: [
              { [fallbackField]: { $null: true } },
              { [fallbackField]: { $gte: today } },
          ]},
        ],
      },
    ],
  };
}
```

Apply in the type's controller:

```ts
async find(ctx) {
  ctx.query = withExpiryFilter(ctx.query, 'date');   // or 'validTo' for promos
  return await super.find(ctx);
}
```

Editor experience:
- Leave `expiredAt` null → fall back to `event.date` / `validTo`.
- Set `expiredAt = past` → hide now even if the natural date is upcoming.
- Set `expiredAt = future` → keep listed past the natural date (recurring/annual).

## 4. Nightly KB-cleanup cron

**Goal:** when an entry drops off the listing (via the expiry filter), also drop it from the ElevenLabs chatbot knowledge base. Don't depend on an editor save — time alone should trigger cleanup.

**Pattern (in `cms/src/index.ts`):**

1. `cms/config/server.ts` enables cron: `cron: { enabled: env.bool('CRON_ENABLED', true) }`.
2. Bootstrap registers a single nightly task just after the Singapore day rolls over:
   ```ts
   strapi.cron.add({
     expiryKbSweep: {
       task: () => sweepExpiredKbDocs(strapi),
       options: { rule: '5 0 * * *', tz: 'Asia/Singapore' },
     },
   });
   ```
3. `sweepExpiredKbDocs` queries each expiry-aware UID (`event`, `dining-promotion`) for rows past their natural date, calls `elevenlabs-chatbot.sync.unsyncEntryBySlug` per row — which also drops the entry's harvested `:file:` docs (menus/posters). Idempotent — already-removed rows no-op, and each run re-checks *all* past rows, so a missed tick self-heals the next night.

Nightly cadence is deliberate: expiry is date-granular and listing-side hiding is instant (request-time SQL filter), so the KB only needs a day-boundary sweep. Compute "today" with `toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })` — containers run UTC, and a UTC date keeps yesterday's events alive until 8am SGT.

## 5. Display naming `<Section>: <Thing>`

**Goal:** make the admin sidebar scannable. Default Strapi sorts content types alphabetically by `displayName`, so a section prefix → adjacent grouping for free.

**Pattern:**

- Touch ONLY `info.displayName` in each `schema.json`. Never `singularName` / `pluralName` — those drive `/api/<plural>` routes that the frontend, seed scripts, and infra all reference.
- Convention: `<Section>: <Thing>` with title case and one space after the colon.
  - Singletons → `<Section>: Page` (e.g. `Dining: Page`, `Membership: Joining Fees Page`).
  - Collections → `<Section>: <Plural Entity>` (e.g. `Dining: Restaurants`, `Fitness: Aquatics Coaches`).
  - Globals → `Global: <Thing>` (`Global: Header`, `Global: Footer`).
  - Shared/unscoped → `Shared: …`.
- Internal-only types (e.g. `elevenlabs-doc` sync log) → set:
  ```json
  "pluginOptions": {
    "content-manager":      { "visible": false },
    "content-type-builder": { "visible": false }
  }
  ```
  rather than rename.

A bulk rename script lives at `/tmp/rename-displayname.mjs` (one-shot — not committed). Future renames can crib from it.

## 6. Local plugins (server + admin side panels)

**Goal:** add cross-cutting admin actions (Clone Entry, ElevenLabs Sync) as in-tree plugins that look first-class, not as ad-hoc patches.

**Pattern (mirrors `cms/src/plugins/elevenlabs-chatbot` and `cms/src/plugins/clone-entry`):**

Directory layout:
```
cms/src/plugins/<name>/
  package.json          (kind: "plugin", exports: strapi-server + strapi-admin)
  strapi-server.ts      → re-exports ./server
  strapi-admin.ts       → re-exports ./admin/src
  server/
    index.ts            → { register, bootstrap, controllers, routes, services, policies }
    routes/content-api.ts
    controllers/...
    services/...
    policies/is-admin.ts
  admin/src/
    index.tsx           → registers content-manager.addEditViewSidePanel
    pages/<Panel>.tsx
```

Register in `cms/config/plugins.ts`:
```ts
plugins['clone-entry'] = { enabled: true, resolve: './src/plugins/clone-entry' };
```

### Admin-session auth on a content-API route

`/api/*` route pool doesn't include the `admin` strategy. We bypass with `auth: false` + a policy that manually validates the admin bearer token via `strapi.sessionManager('admin')`:

```ts
// server/policies/is-admin.ts
export default async function isAdminPolicy(ctx) {
  const token = ctx.request.header.authorization?.split(/\s+/)[1];
  if (!token) return false;
  const sm = strapi.sessionManager('admin');
  const { isValid, payload } = sm.validateAccessToken(token);
  if (!isValid || !(await sm.isSessionActive(payload.sessionId))) return false;
  const user = await strapi.db.query('admin::user').findOne({ where: { id: payload.userId } });
  if (!user?.isActive) return false;
  ctx.state.user = user;
  return true;
}
```

Route config: `{ auth: false, policies: ['plugin::<name>.is-admin'] }`.

### Side panel (content-manager edit view)

```ts
// admin/src/index.tsx
export default {
  register() {},
  bootstrap(app) {
    app.getPlugin('content-manager').apis.addEditViewSidePanel([SidePanel]);
  },
};
```

Panel signature: `(ctx: PanelContext) => { title, content } | null`. Hooks are allowed inside.

### Deep-copy / identity-strip for "Clone"

Components and dynamiczone items carry per-row IDs that need stripping recursively or Strapi tries to attach to existing rows on save and bails:

```ts
const IDENTITY_FIELDS = new Set(['id', 'documentId', 'createdAt', 'updatedAt', 'publishedAt', 'createdBy', 'updatedBy', 'locale', 'localizations']);

function stripIdentity(node) {
  if (Array.isArray(node)) return node.map(stripIdentity);
  if (!isPlainObject(node)) return node;
  return Object.fromEntries(
    Object.entries(node)
      .filter(([k]) => !IDENTITY_FIELDS.has(k))
      .map(([k, v]) => [k, stripIdentity(v)])
  );
}
```

Media + relations stay referenced (linked by ID, not deep-cloned).

## 7. Resetting media on a non-prod env

Operational pattern for nuking + reseeding a dev/uat environment safely.

```bash
# 1. Delete every upload row (and its blob) via REST. The wrapper provider
#    tolerates BlobNotFound, so orphans from interrupted seeds purge cleanly.
node /tmp/reset-uploads.mjs    # uses cms/.env.seed.dev token

# 2. Empty stray blobs that lost their DB row.
az storage blob delete-batch -s media --pattern 'uploads/*' --account-name amclubdevdata

# 3. Truncate content tables via REST DELETE on each collection.
node /tmp/wipe-content.mjs     # iterates collection plurals, DELETEs each row

# 4. Re-run every seed. Helpful order: singletons → collections → derived.
bash /tmp/run-seeds.sh
```

Templates for `reset-uploads.mjs` / `wipe-content.mjs` / `run-seeds.sh` are in `scripts/` history; reuse them rather than re-deriving. Auth tables (`admin::user`, `up_users`) are untouched — only `/api/*` is hit, so admin login survives.

## 8. Environment branching

Three long-lived branches, one per environment:

```
dev  → development (commit + push here first; auto-deploys)
uat  → staging     (PR from dev; auto-deploys)
main → production  (PR from uat; auto-deploys)
```

Never push directly to `uat` or `main`. Promotion is always a PR. Hotfixes still go to `dev` first, then race up.

To check what's queued for promotion:

```bash
git fetch origin
git log --oneline origin/uat..origin/dev    # dev ahead of uat
git log --oneline origin/main..origin/uat   # uat ahead of main
```

Environment-specific config lives in `infra/Pulumi.<env>.yaml`. Strapi env-specific settings come from Container App env vars + plugin config that reads `env(...)`. **Never hardcode an env URL in source.**

## 9. RAG auto-indexing (ElevenLabs KB)

**Gotcha:** attaching a KB doc to an agent does **not** build its retrieval index. Un-indexed docs are invisible to RAG — the agent simply can't answer from them. And because KB docs are immutable, every entry *update* uploads a brand-new doc that starts un-indexed, even if the previous generation was indexed.

**Pattern (elevenlabs-chatbot plugin):**

1. `client.ts` wraps `GET/POST /v1/convai/knowledge-base/{id}/rag-index`. The POST is idempotent — an already-indexed or in-progress doc returns the existing index, so firing it blind is safe and free.
2. `sync.ts` calls `requestIndexSafe(...)` right after every `createTextDoc` / `createFileDoc` — indexing failures log a warning but never fail the sync.
3. `auditRagIndexes(strapi, build)` walks the sync log, reports per-doc index state, and (when `build`) requests indexing for any doc missing one. Exposed via `POST /api/elevenlabs-chatbot/index-all { build }` and the settings-page **Check indexes** / **Build missing indexes** buttons.

Cost: no per-index credit charge — the constraint is the plan-tier cap on total *original file size* indexed. Measured on the Club account 2026-08-19: **1.5 MB used of 20 MB** (`GET /v1/convai/knowledge-base/rag-index` reports `total_used_bytes` / `total_max_bytes` — read it rather than trusting a remembered figure; the old ~2 MB number was the agency plan). Deleted docs free quota, so the expiry cron doubles as quota hygiene. `scripts/elevenlabs-index-kb.py <env>` remains the CLI fallback.

**This only works where the code is deployed.** Auto-indexing landed on `dev` 2026-08-09 (`89ac316`) but prod's last promotion was 2026-08-07, so for ten days prod uploaded every doc and indexed none — 31 of 306 attached docs were invisible to the bot, including 17 upcoming events. The symptom is indistinguishable from a relevance problem: the agent answers from an older, *indexed* doc (a 2025 photo album) while ignoring the current one. **Diagnose with the index status, not the doc list** — a doc can be present and attached and still unreachable:

```
GET /v1/convai/knowledge-base/{id}/rag-index   → {"indexes": []}   ← invisible to RAG
```

## 10. Excluding documents from the KB (selective, not blanket)

**Gotcha:** ElevenLabs' PDF extractor flattens tables. A class timetable becomes headings in reading order with no row/column association, and the agent then *confabulates* confident wrong pairings (verified on prod 2026-08-11). Linear PDFs — menus, policies, forms — extract fine, so "stop indexing PDFs" is the wrong fix.

**Pattern:** `RuntimeSettings.excludedFilePatterns` (plugin settings page, one pattern per line). `isFileExcluded(file, patterns)` in `utils.ts` matches case-insensitively against the upload's **name and URL**, with `*` as a wildcard, so a rule can target one file or a whole upload folder.

The important detail is *where* the check sits: `syncAttachedFiles` skips an excluded file **and leaves it out of `fileNamesAfter`**, which is the set the stale-cleanup pass diffs against. That makes the denylist **retroactive** for free — adding a pattern deletes the already-pushed doc on the next sync of its owner page, with no separate purge step.

## 11. Calendar → KB: collapse recurrence before indexing

**Gotcha:** a 60-day Teamup window returns ~1,900 event occurrences but only ~230 distinct series — the calendar is dominated by weekly classes and court bookings. One doc per occurrence floods the KB with near-identical records and buries the one-off events members actually ask about.

**Pattern (`services/teamup.ts`):**

1. **Group** occurrences into series: `series_id` → master id parsed off the `"<id>-rid-<ts>"` occurrence id → `title+time+location` signature. Anything alone in its bucket is a one-off.
2. **Derive cadence from the actual gaps**, never from the weekday alone. Two Wednesdays five weeks apart is *not* "every Wednesday" — that is a confident falsehood of exactly the kind this pipeline exists to prevent. Median gap 6–8d → weekly, 13–16d → fortnightly, 27–32d → monthly, all-gaps ≤8d across 7 weekdays → "every day"; anything else **enumerates the real dates**.
3. **Don't collapse differing times.** If sessions in a series run at different times, list them per session rather than printing the first one as if it applied to all.
4. **Expire by recomputing the window.** Each run rebuilds the wanted set from today and deletes any `<prefix>teamup:` doc no longer in it — past events drop out with no extra cron.
5. Call `refreshAgentKnowledgeBase` afterwards: creating a doc does not attach it to the agent.

Secrets: `TEAMUP_TOKEN` is env-only (Container App secret). The calendar **key** is non-secret and lives in plugin settings — don't put the token in the plugin store, which any admin can read and which lands in DB backups.

Pure transforms (`collapseSeries`, `renderSeriesMarkdown`, `computeWindow`, `isFileExcluded`) are unit-tested in `cms/tests/teamup-render.test.mjs` via `npm run test:plugin` — they compile to a temp dir so no Strapi runtime is needed.
