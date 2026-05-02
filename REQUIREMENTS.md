# Feature Requirements

Living list of features the team is planning. Drives `SPECS.md` once built.

---

## ElevenLabs Knowledge Base sync

**Status:** approved (Phase 1 scope below). Not yet implemented.

**Goal**

Push CMS content to the ElevenLabs ConvAI knowledge base (KB) so the chatbot always answers from fresh, live site copy. Sync runs automatically when an editor publishes / unpublishes / updates content, and can also be triggered manually via a "Sync all" button in the Strapi admin.

**Scope (decisions confirmed)**

| Question | Answer |
|---|---|
| Auto-attach synced docs to the agent? | **Yes** — sync is one-click, no manual ElevenLabs dashboard step. |
| What counts as "page content"? | **Everything live in CMS.** All published entries across page-typed singletons (`home-page`, `about-page`, etc.) *and* collection types (`event`, `news-article`, `restaurant`, `venue`, `facility`, `committee-member`, `faq-item`, `testimonial`, `gallery-album`). Stale info is the failure mode we're trying to avoid. |
| Multi-agent support? | **No** — single agent ID from env var. Refactor if/when we add a second agent. |
| Delete on unpublish? | **Yes** — KB doc is removed when an entry is unpublished or deleted. |
| Auto-sync trigger? | **On publish + on PDF upload.** Manual "Sync all" button on top. (See "Sync triggers" below.) |

**Backend / API confirmed**

ElevenLabs ConvAI exposes a workspace-level KB. Relevant endpoints (key: `xi-api-key` header):

| Op | Endpoint |
|---|---|
| Create text doc | `POST /v1/convai/knowledge-base/text` → `{id, name}` |
| Create file doc | `POST /v1/convai/knowledge-base/file` (multipart `file` + optional `name`) → `{id, name, folder_path}` |
| List docs | `GET /v1/convai/knowledge-base?search=<prefix>&page_size=100` |
| Delete doc | `DELETE /v1/convai/knowledge-base/{id}?force=true` |
| Attach to agent | `PATCH /v1/convai/agents/{agent_id}` body `{conversation_config:{agent:{prompt:{knowledge_base:[{type,name,id,usage_mode}]}}}}` |

**File-doc support:** PDF, TXT, DOCX, HTML, EPUB are accepted directly — ElevenLabs handles parsing/indexing server-side. No client-side extraction needed. Per-file cap: 21 MB. We stream the binary from Strapi's Azure Blob upload provider straight to the file endpoint; no `pdf-parse` dependency in Strapi.

KB has no in-place text update — refresh = delete + recreate + re-attach.

**Limits (non-enterprise):** 20 MB / 300 k chars per workspace. Page entry markdown is small (kilobytes), so headroom is large.

**Approach — Phase 1 (now)**

Build the sync logic *inside* the Strapi project — not a packaged plugin yet — so we can iterate fast. Structure code so it lifts cleanly into a plugin later (see Phase 2).

- **Single config file** `cms/config/elevenlabs-sync.ts` exporting `{ contentTypes, docNamePrefix, mediaUrlPaths, agentIdEnv }`. All project-specific knowledge concentrated here.
- **Service module** `cms/src/services/elevenlabs-sync/` owns all logic: render markdown, hash, list/create/delete docs on ElevenLabs, attach to agent, update sync log. Pure functions, no Strapi-context coupling beyond the entry-point.
- **Block renderers as a registry** `cms/src/services/elevenlabs-sync/renderers/index.ts` — `Record<componentName, (attrs) => string>`. One file per renderer (`hero.ts`, `card-grid.ts`, etc.). No hardcoded switch. Lets Phase 2 expose this as a consumer-supplied hook.
- **Auto-harvest of attached PDFs**: `harvest-attachments.ts` walks media-relation fields generically (via Strapi metadata) AND scans configured `mediaUrlPaths` (CTA href fields) to pick up PDFs already linked from the page. Editors get an opt-in `kbDocuments: media[]` field on content types where they need to attach KB-only PDFs that aren't surfaced as a CTA.
- **Lifecycle hooks via the global subscriber**: one `strapi.db.lifecycles.subscribe({ models: [allowList], afterUpdate, afterDelete })` call in `cms/src/index.ts` `bootstrap()` — no per-content-type `lifecycles.ts` files. PDF media events ride the same subscriber on `plugin::upload.file`.
- **Admin REST endpoint** `POST /api/admin/elevenlabs/sync` (policy: `admin::isAuthenticated`). Body: `{ mode: "full" | "delta", scope?: { contentType, entryId } }`. Used by the manual buttons.
- **Admin UI** injected via `cms/src/admin/app.tsx`:
  - Per-entry: "Sync to ElevenLabs" panel on the edit view (delta for that entry).
  - Global: a "ElevenLabs Sync" admin page with "Sync all (delta)", "Sync all (full)", "Clear all" + a table of the sync log (last synced, hash, doc ID).
- **CLI parity** `cms/scripts/sync-elevenlabs.ts` — same service, runnable via `npm run sync:elevenlabs -- --mode=full`. Lets us trigger from GitHub Actions later.

**Approach — Phase 2 (deferred)**

Lift the service + admin extension into a standalone Strapi plugin (`@your-org/strapi-plugin-elevenlabs-sync`). What changes:

| Phase 1 file | Phase 2 plugin location | Change |
|---|---|---|
| `cms/config/elevenlabs-sync.ts` | `strapi.config.get('plugin::elevenlabs-sync.*')` | Consumer sets it in `config/plugins.ts` |
| `services/elevenlabs-sync/` | Plugin `server/services/` | Move as-is |
| `services/.../renderers/index.ts` | Plugin **public API hook** | Plugin ships generic fallback; consumers register custom renderers via `app.use('blockRenderer', fn)` |
| `harvest-attachments.ts`'s `mediaUrlPaths` | Plugin config option | Consumer supplies their CTA paths via `mediaUrlPaths: string[]` |
| `index.ts` `bootstrap()` lifecycle subscription | Plugin's own `bootstrap()` | Move as-is |
| `admin/app.tsx` button injection | Plugin's `admin/src/index.ts` | Same components, plugin entry point |
| `scripts/sync-elevenlabs.ts` | Plugin exports a programmatic API | Consumers can still wrap it in their own script |

**Designed-in for the Phase 2 lift:** the registry-shaped block renderer, the config-file boundary, the global-subscriber lifecycle pattern, and pure-function service core all already match the plugin shape. The lift is move-files + rename-config-paths, not a rewrite.

**Phase 1 → Phase 2 schema compatibility**

| Phase 1 artefact | Survives Phase 2 lift? | Notes |
|---|---|---|
| `kbDocuments: media[]` field on content types | **Stays as-is in consumer schemas** | Plugins don't own content-type fields — that's correct and forward-compatible. Plugin reads whatever field name the consumer configures (`kbDocumentsField: 'kbDocuments'` default). No migration. |
| `elevenlabs-sync-log` single-type | **Relocates to plugin** | Phase 2 plugin ships this content type (`plugin::elevenlabs-sync.sync-log`). Data is a cache — rebuild by running "Sync all (full)" once after upgrade. Five-minute migration, no data loss. |
| Block renderer functions | **Stays in consumer project** | Renderers know about consumer-specific block schemas — they can't live in a generic plugin. Phase 2 plugin exposes a `register(componentName, renderFn)` API; consumer wires up renderers in `bootstrap()`. One-time wiring change. |
| `cms/config/elevenlabs-sync.ts` | **Moves to `cms/config/plugins.ts`** | `elevenlabs-sync: { config: { ... } }` block under the standard Strapi plugin config convention. Pure rename. |
| API route `/api/admin/elevenlabs/sync` | **URL may change** | Plugin convention is `/api/elevenlabs-sync/...`. Admin UI updates to match. Trivial. |

**Why this and not the alternatives**

| Option | Why not (for Phase 1) |
|---|---|
| A — full Strapi plugin now | Reusability is a real goal but premature in Phase 1 — easier to extract once shape is proven. Tracked as Phase 2. |
| C — separate microservice | Adds another deploy target and auth surface for what's a CMS-internal concern. |
| D alone (CLI only) | No in-admin trigger and no auto-sync — editors would have to ssh-and-run, which won't stick. |

**Sync triggers**

| Event | Action |
|---|---|
| Editor publishes a page entry | Render → diff hash → if changed, delete old KB doc + create new + re-attach to agent. Update log. |
| Editor unpublishes / deletes an entry | Delete the matching KB doc, detach from agent, remove log row. |
| Editor uploads or replaces a PDF that's reachable from a synced page | When the page entry next syncs, harvester walks media-relations and configured `mediaUrlPaths` (CTA hrefs), pushes the PDF as a file doc, attaches to agent. PDFs are also synced when the editor adds them to a `kbDocuments` field on the page. |
| Admin clicks "Sync all (delta)" | Walk every published in-scope entry, sync only those whose hash differs from the log. |
| Admin clicks "Sync all (full)" | List every doc with name prefix `am-club:`, delete (force), wipe log, then run delta. |
| Admin clicks "Clear all" | Same as above but stop after deletion — no re-sync. |

**Tracking — delta**

New Strapi single-type **`elevenlabs-sync-log`** with one repeatable component `synced-document`:

```
synced-document {
  sourceKind: enum            // "page-entry" | "media-file"
  contentType: string         // e.g. "home-page" — null for media-file
  entryId: integer            // entry id for collections; null for single types or media-file
  mediaFileId: integer        // Strapi upload file id — null for page-entry
  ownerContentType: string    // for media-file rows: which page entry owns this PDF
  ownerEntryId: integer       // — so unpublishing the page also deletes its PDFs
  elDocType: enum             // "text" | "file" — which ElevenLabs endpoint created it
  documentId: string          // ElevenLabs doc id
  documentName: string        // "am-club:home-page" / "am-club:event:123" / "am-club:restaurant:central:pdf:menu"
  contentHash: string         // text rows: sha256 of rendered markdown. file rows: "<size>:<file.updatedAt>"
  syncedAt: datetime
}
```

This avoids polluting every page schema with `elevenlabsDocumentId` / `elevenlabsSyncedAt` columns.

Delta logic: render markdown for each entry → compute hash → compare against log → if different, delete old doc (if any), create new, update log, re-attach to agent.

Full logic: list every doc matching `am-club:` prefix, delete all (force), wipe log, then run delta over everything.

**Markdown shape (per page)**

One doc per page entry. Doc name = `am-club:<content-type>[:<slug-or-id>]`.

```
# <Page title>

> Source: https://<deployed-host>/<route>

## <Block heading>
<rendered prose / list>

## <Next block>
…
```

Block renderer lives next to existing block components in `cms/src/services/elevenlabs-sync/render-block.ts` — one switch over Strapi block `__component`, no images/IDs/className leakage. Stripped: media URLs (keep alt text only), internal IDs, raw HTML attributes.

**Security**

- `ELEVENLABS_API_KEY` (sk_…) lives in `cms/.env` only — never reaches the browser. Strapi reads via `process.env`. Add to Pulumi config / Container Apps secret.
- Route policy: `policies: ['admin::isAuthenticated']` — only logged-in Strapi admins can trigger. Public REST users get 401.
- Output validation: ElevenLabs is a trusted upstream so no response sanitisation needed, but log the document IDs we touch for auditing.
- Rate limit: simple in-memory token bucket (e.g. 1 req/sec per admin) so a stuck button doesn't hammer ElevenLabs.
- Input validation: `contentType` against a fixed allow-list of page types — no arbitrary string lookup.

**Cost assumption**

ElevenLabs meters conversation usage (TTS chars, agent turns), not KB CRUD operations. Workspace cap is 20 MB / 300 k chars total. With ~10 page-typed singletons + a few hundred collection entries each well under 10 KB of markdown, we're orders of magnitude under the cap — no rate-limit guard needed beyond a basic in-memory token bucket on our side. *To verify against the current pricing page before going live.*

**Out of scope for Phase 1**

- Per-block / partial updates. Sync granularity is one entry → one KB doc.
- URL-mode KB ingestion (pulling from deployed site). Sticking with text mode for determinism.
- A standalone, distributable Strapi plugin (Phase 2).
- Multi-agent support (Phase 2 if ever needed).
- Webhooks / queueing if ElevenLabs API gets slow. Phase 1 fires synchronously from the lifecycle and accepts the latency.

**Phase 1.5 — chatbot key separation (security hardening)**

Currently the frontend chatbot connects to a *public* agent using just the agent ID. Anyone can scrape the agent ID and run unlimited TTS conversations against our workspace, on our bill. Fix:

- Make the chatbot agent **private** in the ElevenLabs dashboard.
- Add a Strapi route `POST /api/chatbot/token` that mints a per-session `conversationToken` via `POST /v1/convai/conversation/token?agent_id=...` using the same `ELEVENLABS_API_KEY`. No body needed; rate-limit by IP / session.
- Frontend chatbot calls the route and passes `{ conversationToken: token }` to `startSession()` instead of `{ agentId }`.
- Same workspace key (`ELEVENLABS_API_KEY`) is used for both KB sync (this Phase 1) and token minting (Phase 1.5). Two *roles*, one key — ElevenLabs doesn't currently issue scoped keys. The protection comes from never exposing the key to the browser.

Independent of Phase 1 KB sync — can ship in parallel.

**Phase 2 backlog**

- **Extract to plugin.** Wrap the service + admin UI as a Strapi v5 plugin. Make it config-driven (content-type allow-list, doc-name prefix, agent ID env var). Publish to npm or share across client projects.
- **Auto-sync for media library PDFs without naming convention** — proper UI tagging.
- **Multi-agent** — per-doc tag identifying which agent(s) consume it.
- **Webhook-driven async sync** — if synchronous lifecycle latency hurts editor UX.

**PDF inclusion (resolved)**

- **Auto-harvest** from media-relation fields and configured CTA href paths (`mediaUrlPaths`). Common case is zero editor effort — a "View menu" CTA pointing at a Strapi-uploaded PDF is automatically picked up when the page syncs.
- **Explicit `kbDocuments: media[]`** field added only on content types where editors will need to attach KB-only PDFs that aren't surfaced visually (e.g. fee schedules, internal policies). Skip on types where every PDF is already a CTA.
- Dedup by Strapi file ID — same PDF reachable two ways pushes once.

**Hashing (resolved)**

- Text docs: sha256 of rendered markdown.
- File docs: `${file.size}:${file.updatedAt}` — Strapi's media library tracks both for free, no byte hashing needed.
- Hash is the cheap local diff check before any ElevenLabs API call: skip if unchanged, delete-and-recreate if changed.
- Stored on `contentHash` of each `synced-document` row in the `elevenlabs-sync-log` single-type — same Postgres database as the rest of CMS content, no separate storage.

---
