# Strapi v5 Content API for Creating Entries

Reference for creating, updating, and uploading content via the Strapi v5 REST API.

Source: https://docs.strapi.io/cms/api/rest

## Creating Entries

### Collection Types

```
POST /api/<pluralName>
Content-Type: application/json
Authorization: Bearer <api-token>

{
  "data": {
    "title": "My Article",
    "slug": "my-article",
    "content": "Article body text...",
    "publishedDate": "2026-01-15"
  }
}
```

Response:
```json
{
  "data": {
    "id": 1,
    "documentId": "abc123def456",
    "title": "My Article",
    "slug": "my-article",
    "content": "Article body text...",
    "publishedDate": "2026-01-15",
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-01-15T10:00:00.000Z",
    "publishedAt": null
  },
  "meta": {}
}
```

Note: Entries are created as **drafts** by default in Strapi v5 when
`draftAndPublish` is enabled. Use the publish action to make them live.

### Single Types

Single types use PUT (not POST) since there is always exactly one entry:

```
PUT /api/<singularName>
Content-Type: application/json
Authorization: Bearer <api-token>

{
  "data": {
    "title": "Homepage",
    "content": [...]
  }
}
```

### Publishing Entries

```
POST /api/<pluralName>/<documentId>/actions/publish
Authorization: Bearer <api-token>
```

For single types:
```
POST /api/<singularName>/actions/publish
Authorization: Bearer <api-token>
```

## Media Upload

### Upload Files

```
POST /api/upload
Authorization: Bearer <api-token>
Content-Type: multipart/form-data

files: <binary file data>
fileInfo: {"alternativeText":"Photo description","caption":"Optional caption"}
```

Using curl:
```bash
curl -X POST http://localhost:1337/api/upload \
  -H "Authorization: Bearer <token>" \
  -F "files=@/path/to/image.jpg" \
  -F 'fileInfo={"alternativeText":"A nice photo","caption":"Photo by Someone"}'
```

Response:
```json
[
  {
    "id": 1,
    "name": "image.jpg",
    "alternativeText": "A nice photo",
    "caption": "Photo by Someone",
    "width": 1200,
    "height": 800,
    "formats": {
      "thumbnail": { "url": "/uploads/thumbnail_image.jpg", "width": 156, "height": 104 },
      "small": { "url": "/uploads/small_image.jpg", "width": 500, "height": 333 },
      "medium": { "url": "/uploads/medium_image.jpg", "width": 750, "height": 500 },
      "large": { "url": "/uploads/large_image.jpg", "width": 1000, "height": 667 }
    },
    "url": "/uploads/image.jpg",
    "mime": "image/jpeg",
    "size": 245.5
  }
]
```

### Upload Multiple Files

```bash
curl -X POST http://localhost:1337/api/upload \
  -H "Authorization: Bearer <token>" \
  -F "files=@image1.jpg" \
  -F "files=@image2.png"
```

### Supported Formats

Images: jpg, jpeg, png, gif, svg, webp, avif, tiff, bmp
Video: mp4, webm, ogg
Documents: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv

## Linking Media to Entries

When creating or updating an entry, reference uploaded media by ID:

### Single Media Field
```json
{
  "data": {
    "title": "My Article",
    "cover": 1
  }
}
```

### Multiple Media Field
```json
{
  "data": {
    "title": "My Gallery",
    "images": [1, 2, 3]
  }
}
```

## Creating Relations

### Single Relation (manyToOne)
Pass the related entry's `documentId`:
```json
{
  "data": {
    "title": "My Article",
    "category": {
      "connect": ["documentId-of-category"]
    }
  }
}
```

### Multiple Relations (manyToMany)
```json
{
  "data": {
    "title": "My Article",
    "tags": {
      "connect": ["tag-doc-id-1", "tag-doc-id-2"]
    }
  }
}
```

### Alternative: Direct ID Assignment
For simpler cases, you can pass the documentId directly:
```json
{
  "data": {
    "title": "My Article",
    "category": "documentId-of-category"
  }
}
```

## Components in Create Payload

### Single Component
```json
{
  "data": {
    "title": "My Page",
    "seo": {
      "metaTitle": "My Page - Site Name",
      "metaDescription": "Description of my page"
    }
  }
}
```

### Repeatable Component
```json
{
  "data": {
    "title": "Features Page",
    "features": [
      { "title": "Feature 1", "description": "First feature", "icon": "star" },
      { "title": "Feature 2", "description": "Second feature", "icon": "bolt" }
    ]
  }
}
```

### Dynamic Zone
Each item must include the `__component` field:
```json
{
  "data": {
    "title": "Homepage",
    "content": [
      {
        "__component": "blocks.hero",
        "title": "Welcome to Our Site",
        "subtitle": "We build amazing things",
        "backgroundImage": 5
      },
      {
        "__component": "blocks.text-block",
        "body": "Some introductory text..."
      },
      {
        "__component": "blocks.card-grid",
        "heading": "Our Services",
        "cards": [
          { "title": "Web Design", "description": "Beautiful websites", "image": 6 },
          { "title": "Development", "description": "Robust applications", "image": 7 }
        ]
      }
    ]
  }
}
```

## Authentication

### API Token
Created in Strapi admin: Settings > API Tokens.

Token types:
- `read-only` — GET requests only
- `full-access` — All CRUD operations
- `custom` — Granular per-content-type permissions

Usage:
```
Authorization: Bearer <token>
```

### Creating a Token Programmatically
Not available via REST API. Must be created through the admin panel or
directly in the database.

## Error Handling

### Common Errors

**400 — Validation Error:**
```json
{
  "data": null,
  "error": {
    "status": 400,
    "name": "ValidationError",
    "message": "1 relation(s) of type api::category.category associated with this entity do not exist",
    "details": {
      "errors": [
        {
          "path": ["category"],
          "message": "1 relation(s) of type api::category.category associated with this entity do not exist"
        }
      ]
    }
  }
}
```

**403 — Forbidden (token lacks permission):**
```json
{
  "data": null,
  "error": {
    "status": 403,
    "name": "ForbiddenError",
    "message": "Forbidden"
  }
}
```

**413 — Payload Too Large (file upload):**
Increase the limit in Strapi: `config/plugins.ts`:
```typescript
export default {
  upload: {
    config: {
      sizeLimit: 50 * 1024 * 1024, // 50 MB
    },
  },
};
```

### Retry Pattern

For transient errors (429, 500, 502, 503), retry with exponential backoff:
```
Attempt 1: immediate
Attempt 2: wait 1s
Attempt 3: wait 2s
Attempt 4: wait 4s
Max retries: 3
```
