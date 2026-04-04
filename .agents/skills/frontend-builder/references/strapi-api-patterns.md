# Strapi v5 REST API Patterns

Reference for querying the Strapi v5 REST API from a React frontend.

Source: https://docs.strapi.io/cms/api/rest

## Base URL Structure

All content type endpoints follow this pattern:

```
GET    /api/<pluralName>          # List entries
GET    /api/<pluralName>/:id      # Get single entry
POST   /api/<pluralName>          # Create entry
PUT    /api/<pluralName>/:id      # Update entry
DELETE /api/<pluralName>/:id      # Delete entry
```

For single types:
```
GET    /api/<singularName>        # Get the entry
PUT    /api/<singularName>        # Update the entry
```

## Query Parameters

### Filtering

```
/api/articles?filters[title][$eq]=Hello
/api/articles?filters[title][$contains]=world
/api/articles?filters[publishedAt][$notNull]=true
/api/articles?filters[category][name][$eq]=Tech
```

Filter operators:
- `$eq` — Equal
- `$ne` — Not equal
- `$lt`, `$lte` — Less than, less than or equal
- `$gt`, `$gte` — Greater than, greater than or equal
- `$in` — In array: `filters[id][$in][0]=1&filters[id][$in][1]=2`
- `$notIn` — Not in array
- `$contains` — Contains (case-sensitive)
- `$containsi` — Contains (case-insensitive)
- `$notContains` — Does not contain
- `$startsWith` — Starts with
- `$endsWith` — Ends with
- `$null` — Is null
- `$notNull` — Is not null

### Sorting

```
/api/articles?sort=title:asc
/api/articles?sort[0]=title:asc&sort[1]=createdAt:desc
```

### Pagination

```
/api/articles?pagination[page]=1&pagination[pageSize]=10
/api/articles?pagination[start]=0&pagination[limit]=10
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "pageCount": 5,
      "total": 48
    }
  }
}
```

### Field Selection

```
/api/articles?fields[0]=title&fields[1]=slug&fields[2]=publishedAt
```

### Population (Relations & Components)

**Populate all top-level relations:**
```
/api/articles?populate=*
```

**Populate specific relations:**
```
/api/articles?populate[0]=category&populate[1]=author
```

**Nested populate:**
```
/api/articles?populate[author][populate][0]=avatar
```

**Deep populate with field selection:**
```
/api/articles?populate[category][fields][0]=name&populate[category][fields][1]=slug
```

**Dynamic zone population:**
```
/api/pages?populate[content][populate]=*
```

Dynamic zones require explicit population. The response includes a
`__component` field on each item:
```json
{
  "content": [
    {
      "__component": "blocks.hero",
      "id": 1,
      "title": "Welcome",
      "subtitle": "Hello world"
    },
    {
      "__component": "blocks.text-block",
      "id": 2,
      "body": "Some text..."
    }
  ]
}
```

**Deeply nested dynamic zone components:**
```
/api/pages?populate[content][on][blocks.hero][populate]=*&populate[content][on][blocks.card-grid][populate][cards][populate]=*
```

## Media URL Handling

Media fields return objects with a `url` property. The URL is **relative** in
most Strapi configurations:

```json
{
  "cover": {
    "id": 1,
    "url": "/uploads/photo_abc123.jpg",
    "alternativeText": "A photo",
    "width": 1200,
    "height": 800,
    "formats": {
      "thumbnail": { "url": "/uploads/thumbnail_photo_abc123.jpg", "width": 156, "height": 104 },
      "small": { "url": "/uploads/small_photo_abc123.jpg", "width": 500, "height": 333 },
      "medium": { "url": "/uploads/medium_photo_abc123.jpg", "width": 750, "height": 500 },
      "large": { "url": "/uploads/large_photo_abc123.jpg", "width": 1000, "height": 667 }
    }
  }
}
```

**Always prepend the Strapi base URL** to relative media URLs:
```typescript
const getStrapiMedia = (url: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('//')) return url;
  return `${STRAPI_URL}${url}`;
};
```

Use responsive image formats when available:
```typescript
const getImageSrcSet = (image: StrapiMedia): string => {
  const formats = image.formats;
  if (!formats) return '';
  return Object.entries(formats)
    .map(([, format]) => `${getStrapiMedia(format.url)} ${format.width}w`)
    .join(', ');
};
```

## Authentication

### Public Content (No Auth)
Most read endpoints work without authentication if the content type has
public `find` and `findOne` permissions enabled in Strapi admin.

### API Token (For Protected Content)
```typescript
const headers: HeadersInit = {
  'Content-Type': 'application/json',
};

if (apiToken) {
  headers['Authorization'] = `Bearer ${apiToken}`;
}
```

API tokens are created in Strapi admin under Settings > API Tokens.
Types: `read-only`, `full-access`, `custom`.

### JWT (For User-Authenticated Content)
```
POST /api/auth/local
Body: { "identifier": "user@example.com", "password": "password" }
Response: { "jwt": "...", "user": {...} }
```

Then use the JWT in the Authorization header.

## Error Response Format

```json
{
  "data": null,
  "error": {
    "status": 404,
    "name": "NotFoundError",
    "message": "Not Found",
    "details": {}
  }
}
```

Common status codes:
- `200` — Success
- `400` — Bad request (invalid query params)
- `401` — Unauthorized (missing/invalid token)
- `403` — Forbidden (insufficient permissions)
- `404` — Not found
- `500` — Internal server error

## TypeScript Fetch Pattern

```typescript
interface StrapiError {
  status: number;
  name: string;
  message: string;
  details: Record<string, unknown>;
}

interface StrapiResponse<T> {
  data: T;
  meta: Record<string, unknown>;
  error?: StrapiError;
}

interface StrapiCollectionResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
  error?: StrapiError;
}

const fetchAPI = async <T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> => {
  const url = new URL(path, STRAPI_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData?.error?.message || `API error: ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
};
```

## Common Query Recipes

### Get All Published Entries
```
/api/articles?filters[publishedAt][$notNull]=true&sort=publishedAt:desc&populate=*
```

### Get Entry by Slug
```
/api/articles?filters[slug][$eq]=my-article&populate=*
```
Returns a collection response — use `data[0]`.

### Get Single Type (e.g., Homepage)
```
/api/homepage?populate[content][populate]=*
```

### Paginated Collection
```
/api/articles?pagination[page]=1&pagination[pageSize]=12&sort=createdAt:desc
```

### Search
```
/api/articles?filters[$or][0][title][$containsi]=query&filters[$or][1][description][$containsi]=query
```
