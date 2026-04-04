# Content Migration Patterns

Patterns for migrating content from content-inventory.json into Strapi CMS.

## Dependency Ordering (Topological Sort)

Content types must be created in dependency order. If Article references
Category, then Category entries must exist before Article entries.

### Algorithm

1. Parse all content type schemas from `content-types/`
2. For each content type, find all `relation` attributes
3. Build a directed adjacency list: `contentType -> [dependsOn...]`
4. Perform topological sort (Kahn's algorithm):

```
function topologicalSort(graph):
  inDegree = {} // count of incoming edges per node
  queue = []     // nodes with no incoming edges
  result = []    // sorted output

  // Initialize in-degrees
  for each node in graph:
    inDegree[node] = 0
  for each node in graph:
    for each dependency in graph[node]:
      inDegree[dependency] += 1

  // Note: we reverse the direction — nodes with no dependencies first
  // Actually, edges point FROM dependent TO dependency.
  // So nodes with inDegree 0 have no dependents — but we want
  // nodes with no DEPENDENCIES first.

  // Correct approach: edges A -> B means "A depends on B"
  // We want B before A. So reverse: B has outgoing edge to A.
  // inDegree of A = number of dependencies.
  // Start with nodes that have inDegree 0 (no dependencies).

  for each node where inDegree[node] == 0:
    queue.push(node)

  while queue is not empty:
    node = queue.shift()
    result.push(node)
    for each dependent that depends on node:
      inDegree[dependent] -= 1
      if inDegree[dependent] == 0:
        queue.push(dependent)

  if result.length != total nodes:
    // Circular dependency detected — handle with two-pass approach

  return result
```

### Handling Circular Dependencies

If two content types reference each other (e.g., Author has `articles` and
Article has `author`):

1. **First pass:** Create all entries WITHOUT relation fields
2. **Second pass:** Update entries to add the relations

This breaks the cycle because both entries exist before relations are set.

### Single Types First

Single types (homepage, site settings) are often referenced globally. Create
them before collection types.

Suggested ordering priority:
1. Single types with no dependencies
2. Collection types with no dependencies (tags, categories)
3. Collection types with dependencies (articles, pages)
4. Single types with dependencies (homepage referencing articles)

## Idempotency

Every migration run must be safe to re-run without creating duplicates.

### Check Strategy

For each entry to create:

1. **Check by slug** (preferred — slugs are unique):
   ```
   GET /api/<pluralName>?filters[slug][$eq]=<slug>
   ```

2. **Check by title** (fallback if no slug field):
   ```
   GET /api/<pluralName>?filters[title][$eq]=<title>
   ```

3. **Check by unique identifier** (if available):
   ```
   GET /api/<pluralName>?filters[email][$eq]=<email>
   ```

If the query returns `data.length > 0`, skip creation and log as "skipped".

### Single Types

Single types always exist (one entry). Use GET to check if it has content:
```
GET /api/<singularName>
```
If response has data, use PUT to update. If data is null/empty, use PUT to set initial content.

## Image Migration

### Download Phase

1. Extract all unique URLs from `content-inventory.json.media`
2. Deduplicate by URL
3. Download to temp directory with sanitized filenames:
   ```
   Original: https://example.com/wp-content/uploads/2024/photo%20(1).jpg
   Local:    .migration-tmp/media/photo-1.jpg
   ```
4. Preserve file extension for MIME type detection
5. Skip downloads that already exist locally (resume support)

### Upload Phase

1. Upload each file to Strapi media library
2. Include `alternativeText` and `caption` from the content inventory
3. Store the mapping: `originalUrl -> { strapiId, strapiUrl }`

### URL Replacement in Rich Text

Rich text fields may contain `<img>` tags or Markdown images with original URLs.

For Markdown rich text:
```
Original: ![Alt text](https://example.com/images/photo.jpg)
Replaced: ![Alt text](/uploads/photo_abc123.jpg)
```

For HTML in rich text:
```
Original: <img src="https://example.com/images/photo.jpg" alt="Alt text">
Replaced: <img src="/uploads/photo_abc123.jpg" alt="Alt text">
```

Scan patterns:
- Markdown: `!\[.*?\]\((https?://[^)]+)\)`
- HTML src: `src=["'](https?://[^"']+)["']`
- Plain URLs: `https?://original-domain\.com/[^\s"')]+\.(jpg|jpeg|png|gif|webp|svg)`

## Batch Processing with Rate Limiting

### Implementation

```typescript
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const rateLimitedBatch = async <T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  maxPerSecond: number,
): Promise<void> => {
  const delayMs = 1000 / maxPerSecond;
  for (const item of items) {
    await processor(item);
    await delay(delayMs);
  }
};
```

### Recommended Limits

- Media uploads: 5 per second (larger payloads)
- Entry creation: 10 per second
- Entry queries (idempotency check): 20 per second

## Error Recovery

### Progress Tracking

The migration report serves as a progress tracker. If the migration fails:

1. Read `migration-report.json` (partial, from previous run)
2. Identify which entries were already created (status: "created" or "skipped")
3. Skip those entries in the re-run
4. Continue from the last failed entry

### Common Failure Modes

| Error | Cause | Recovery |
|-------|-------|----------|
| 400 Validation | Missing required field | Add default value or skip entry |
| 400 Relation not found | Dependency not created yet | Fix dependency order |
| 403 Forbidden | Token lacks permissions | Update token permissions |
| 413 Too Large | File exceeds upload limit | Compress or skip file |
| 429 Too Many Requests | Rate limit exceeded | Reduce request rate |
| 500 Server Error | Strapi crash | Restart Strapi, retry |
| ECONNREFUSED | Strapi not running | Start Strapi first |

### Graceful Degradation

If a non-critical entry fails (e.g., one blog post out of 50):
- Log the error with full details
- Continue with remaining entries
- Report failures at the end
- Do NOT abort the entire migration

## Migration Report Format

```json
{
  "version": "1.0.0",
  "migratedAt": "<ISO 8601 timestamp>",
  "strapiUrl": "<Strapi URL used>",
  "summary": {
    "totalEntries": 0,
    "created": 0,
    "skipped": 0,
    "failed": 0,
    "mediaUploaded": 0,
    "mediaFailed": 0
  },
  "entries": [
    {
      "contentType": "<plural name>",
      "slug": "<slug or identifier>",
      "status": "created | skipped | failed",
      "strapiId": null,
      "documentId": null,
      "reason": null,
      "error": null
    }
  ],
  "media": [
    {
      "originalUrl": "<source URL>",
      "status": "uploaded | failed | skipped",
      "strapiId": null,
      "strapiUrl": null,
      "error": null
    }
  ]
}
```
