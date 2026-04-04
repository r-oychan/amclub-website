---
name: content-migration
description: >-
  Migrate content from content-inventory.json into a running Strapi CMS instance.
  Use when the user says "migrate content", "populate CMS", "import content",
  "seed the CMS", "transfer content", "fill in the content", "load content into
  Strapi", "populate the database", "import data", or any request to move
  extracted website content into the CMS. Triggers when both a Strapi instance
  is running and content-inventory.json exists at the project root. The CMS must
  have content types already created (via strapi-setup + cms-data-modeler).
allowed-tools: Bash(npx:*), Bash(node:*), Bash(curl:*), Bash(mkdir:*), Bash(npm:*)
---

# Content Migration — Populate Strapi from Content Inventory

Upload media assets and create CMS entries from `content-inventory.json`,
produced by the `design-ingest` skill. Entries are created in dependency order
and the migration is idempotent (safe to re-run).

## Prerequisites

Before running this skill, verify:

1. `content-inventory.json` exists at the project root
2. Strapi is running (default `http://localhost:1337`)
3. Content types are registered in Strapi (via `cms-data-modeler` + `strapi-setup`)
4. An API token with `full-access` permissions exists (or create one)

If any prerequisite is missing, tell the user which upstream step to run:
- `design-ingest` produces `content-inventory.json`
- `cms-data-modeler` produces content type schemas
- `strapi-setup` creates the Strapi project and registers content types

## Quick Start

```
User: "Migrate content into the CMS"
You:
1. Verify Strapi is running and content-inventory.json exists
2. Ask for or create an API token
3. Build dependency graph from content types
4. Download and upload media assets
5. Create entries in dependency order
6. Output migration-report.json
7. Present summary (created, skipped, failed)
```

## Outputs

| File | Purpose |
|------|---------|
| `migration-report.json` | Tracks every entry: created, skipped, failed, with error details |

**Output location:** Project root (alongside CLAUDE.md).

## Step-by-Step Process

### Step 1: Verify Environment

1. Check that `content-inventory.json` exists and is valid JSON
2. Ping the Strapi health endpoint:
   ```bash
   curl -s http://localhost:1337/_health
   ```
3. Ask the user for an API token, or guide them to create one:
   - Strapi admin > Settings > API Tokens > Create new
   - Type: `full-access`
   - Duration: unlimited (for development) or 30 days
4. Verify the token works:
   ```bash
   curl -s -H "Authorization: Bearer <token>" http://localhost:1337/api/content-type-builder/content-types
   ```

### Step 2: Build Dependency Graph

Read the content type schemas from `content-types/` to determine creation
order. See [references/migration-patterns.md](references/migration-patterns.md)
for the dependency ordering algorithm.

1. Parse all content type schemas
2. Identify relations between content types
3. Build a directed graph: edge from A to B means "A depends on B"
4. Topological sort to get creation order (dependencies first)
5. Single types before collection types (they are often referenced globally)

Example order:
```
1. category (no dependencies)
2. author (no dependencies)
3. tag (no dependencies)
4. article (depends on: category, author, tag)
5. homepage (single type, references articles)
```

### Step 3: Download Media Assets

1. Extract all unique media URLs from `content-inventory.json.media`
2. Create a temp directory for downloads:
   ```bash
   mkdir -p .migration-tmp/media
   ```
3. Download each asset:
   ```bash
   curl -L -o .migration-tmp/media/<filename> "<original-url>"
   ```
4. Track the mapping: `{ originalUrl -> localPath }`
5. Handle download failures gracefully (log and continue)
6. Skip already-downloaded files (check by filename)

### Step 4: Upload Media to Strapi

Upload each downloaded asset to Strapi's media library. See
[references/strapi-content-api.md](references/strapi-content-api.md) for the
upload API format.

```bash
curl -X POST http://localhost:1337/api/upload \
  -H "Authorization: Bearer <token>" \
  -F "files=@.migration-tmp/media/<filename>" \
  -F "fileInfo={\"alternativeText\":\"<alt text>\",\"caption\":\"<caption>\"}"
```

Track the mapping: `{ originalUrl -> strapiMediaId }`

**Rate limit:** Maximum 5 uploads per second. Add a small delay between uploads.

**Important:** Preserve alt text and captions from the content inventory.

### Step 5: Create Entries in Dependency Order

For each content type, in topological order:

1. Find all entries for this type in `content-inventory.json`
2. For each entry:
   a. **Check idempotency** — Query Strapi for existing entry by slug or title:
      ```bash
      curl -s -H "Authorization: Bearer <token>" \
        "http://localhost:1337/api/<pluralName>?filters[slug][$eq]=<slug>"
      ```
   b. If entry exists, **skip** and log as "skipped"
   c. If entry does not exist, **create** it:
      ```bash
      curl -X POST http://localhost:1337/api/<pluralName> \
        -H "Authorization: Bearer <token>" \
        -H "Content-Type: application/json" \
        -d '{"data": { ... }}'
      ```
   d. Map media fields: replace original URLs with Strapi media IDs
   e. Map relation fields: use the Strapi IDs of previously created entries
   f. Log result (created/failed with error details)

**Rate limit:** Maximum 10 API calls per second.

### Step 6: Handle Rich Text Image URLs

Rich text fields (`richtext` or `blocks`) may contain image URLs from the
original site. After uploading all media:

1. Scan all rich text content for image URLs
2. Replace original URLs with Strapi media URLs:
   ```
   Original: https://example.com/images/photo.jpg
   Strapi:   /uploads/photo_abc123.jpg
   ```
3. Update the entry via PUT if replacements were made

### Step 7: Publish Entries

After creating all entries (which are drafts by default in Strapi v5):

1. Ask the user if entries should be published
2. If yes, publish each entry:
   ```bash
   curl -X POST http://localhost:1337/api/<pluralName>/<documentId>/actions/publish \
     -H "Authorization: Bearer <token>"
   ```

### Step 8: Generate Migration Report

Write `migration-report.json` to the project root:

```json
{
  "version": "1.0.0",
  "migratedAt": "2026-03-05T12:00:00Z",
  "strapiUrl": "http://localhost:1337",
  "summary": {
    "totalEntries": 45,
    "created": 40,
    "skipped": 3,
    "failed": 2,
    "mediaUploaded": 28,
    "mediaFailed": 0
  },
  "entries": [
    {
      "contentType": "article",
      "slug": "my-first-post",
      "status": "created",
      "strapiId": 1,
      "documentId": "abc123"
    },
    {
      "contentType": "article",
      "slug": "existing-post",
      "status": "skipped",
      "reason": "Already exists"
    },
    {
      "contentType": "article",
      "slug": "broken-post",
      "status": "failed",
      "error": "Validation error: title is required"
    }
  ],
  "media": [
    {
      "originalUrl": "https://example.com/photo.jpg",
      "status": "uploaded",
      "strapiId": 5,
      "strapiUrl": "/uploads/photo_abc123.jpg"
    }
  ]
}
```

### Step 9: Present Summary

Show the user:
- Total entries processed
- Created vs skipped vs failed breakdown (table)
- Media upload summary
- Any failed entries with error details
- Suggested next steps (run frontend, verify in Strapi admin)

## Key Rules

1. **Dependency order** — MUST create entries in topological order. Entries
   that are referenced by other entries (categories, authors, tags) must be
   created before the entries that reference them (articles, pages).

2. **Idempotency** — MUST check for existing entries before creating. Query
   by `slug` field first; fall back to `title` if no slug exists. Never
   create duplicate entries.

3. **Image alt text** — MUST preserve alt text and captions from the content
   inventory when uploading to Strapi. Pass them in the `fileInfo` parameter.

4. **Media upload format** — Media uploads use `multipart/form-data`, NOT
   JSON. The `files` field is the binary file. The `fileInfo` field is a JSON
   string with metadata.

5. **Rich text URL replacement** — Rich text fields may contain image URLs
   from the original site. After uploading media, replace those URLs with the
   new Strapi media URLs.

6. **API token required** — Always authenticate with a Bearer token. Ask the
   user for one or guide them to create it in Strapi admin. Never hardcode
   tokens.

7. **Rate limiting** — Maximum 10 API calls per second for entry creation,
   5 per second for media uploads. Use delays between batches to avoid
   overwhelming Strapi.

8. **Migration report** — Always generate `migration-report.json` tracking:
   total entries, created count, skipped count, failed count, media uploaded
   count. Include details for every entry.

9. **Error recovery** — If the migration fails partway through, it must be
   safe to re-run. The idempotency check ensures already-created entries are
   skipped. Log progress so the user can see where it stopped.

10. **Single types** — Single types use PUT instead of POST (they always have
    exactly one entry). Check if the single type already has content before
    updating.

11. **Dynamic zones** — When creating entries with dynamic zones, each item
    needs the `__component` field:
    ```json
    {
      "data": {
        "content": [
          { "__component": "blocks.hero", "title": "Welcome" },
          { "__component": "blocks.text-block", "body": "Hello" }
        ]
      }
    }
    ```

12. **Component data** — Components in create payloads do NOT need an `id`.
    Just pass the field values directly:
    ```json
    {
      "data": {
        "seo": {
          "metaTitle": "My Page",
          "metaDescription": "A page"
        }
      }
    }
    ```

## Handling Edge Cases

### Missing Content Fields

If a required field in the content type has no corresponding content in the
inventory, set a reasonable default or skip the entry and log a warning.

### Circular Dependencies

If content types have circular relations (A references B, B references A):
1. Create all entries without relation fields first
2. Update entries with relation fields in a second pass

### Large Media Files

For files larger than 10 MB:
- Warn the user (Strapi default upload limit is often 10 MB)
- Suggest they increase the limit in Strapi settings if needed
- Skip and log if upload fails due to size

### HTML in Rich Text

If the original site content is HTML but Strapi expects Markdown:
- Convert HTML to Markdown before creating the entry
- Use a library or inline conversion for common tags (p, h1-h6, a, img, ul, ol, li, strong, em)

## Composing With Other Skills

| Skill | Relationship |
|-------|-------------|
| `design-ingest` | Produces `content-inventory.json` (input) |
| `cms-data-modeler` | Defines content type schemas (needed for dependency graph) |
| `strapi-setup` | Creates the Strapi instance this skill populates |
| `frontend-builder` | Displays the content this skill migrates |

## References

| Reference | Purpose |
|-----------|---------|
| [references/strapi-content-api.md](references/strapi-content-api.md) | Strapi v5 Content API for creating entries and uploading media |
| [references/migration-patterns.md](references/migration-patterns.md) | Dependency ordering, idempotency, and error recovery patterns |

## Bundled Scripts

| Script | Purpose |
|--------|---------|
| [scripts/migrate-content.ts](scripts/migrate-content.ts) | TypeScript migration runner (can be executed with `npx tsx`) |

## Checklist Before Completing

- [ ] Strapi is running and API token is verified
- [ ] All media assets downloaded and uploaded to Strapi
- [ ] Entries created in correct dependency order
- [ ] No duplicate entries (idempotency verified)
- [ ] Rich text image URLs replaced with Strapi media URLs
- [ ] `migration-report.json` generated with full details
- [ ] Summary presented to user with created/skipped/failed counts
- [ ] User informed of any failures and suggested fixes
