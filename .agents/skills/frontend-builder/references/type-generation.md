# TypeScript Type Generation from Strapi Schemas

How to generate TypeScript interfaces from Strapi v5 content type and
component schemas.

## Strapi Attribute Type Mapping

| Strapi Type | TypeScript Type | Notes |
|-------------|----------------|-------|
| `string` | `string` | |
| `text` | `string` | |
| `richtext` | `string` | Markdown string |
| `blocks` | `BlocksContent` | Strapi Blocks structured content |
| `email` | `string` | |
| `password` | `string` | Rarely exposed via API |
| `uid` | `string` | URL-safe slug |
| `integer` | `number` | |
| `biginteger` | `string` | Too large for JS number |
| `float` | `number` | |
| `decimal` | `number` | |
| `date` | `string` | ISO date `YYYY-MM-DD` |
| `time` | `string` | `HH:mm:ss` |
| `datetime` | `string` | ISO 8601 |
| `timestamp` | `string` | ISO 8601 in API response |
| `boolean` | `boolean` | |
| `json` | `Record<string, unknown>` | |
| `enumeration` | Union of literal strings | e.g., `'draft' \| 'published'` |
| `media` | `StrapiMedia \| null` | `StrapiMedia[] \| null` if `multiple: true` |
| `relation` | Related interface or `null` | Array for `oneToMany`/`manyToMany` |
| `component` | Component interface | Array if `repeatable: true` |
| `dynamiczone` | Array of discriminated union | Uses `__component` discriminator |

## Wrapper Types

Every Strapi REST response wraps data in a standard envelope:

```typescript
// Strapi v5 flattened response (v5 no longer nests under data.attributes)
interface StrapiResponse<T> {
  data: T & { id: number; documentId: string };
  meta: Record<string, unknown>;
}

interface StrapiCollectionResponse<T> {
  data: Array<T & { id: number; documentId: string }>;
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}
```

**Important:** Strapi v5 flattens the response. Attributes are directly on
the data object alongside `id` and `documentId`. There is no `attributes`
nesting like in Strapi v4.

## Media Type

```typescript
interface StrapiMediaFormat {
  url: string;
  width: number;
  height: number;
  size: number; // KB
}

interface StrapiMedia {
  id: number;
  url: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: {
    thumbnail?: StrapiMediaFormat;
    small?: StrapiMediaFormat;
    medium?: StrapiMediaFormat;
    large?: StrapiMediaFormat;
  } | null;
  mime: string;
}
```

## Example: Blog Post Content Type

Given this Strapi schema:

```json
{
  "kind": "collectionType",
  "info": {
    "singularName": "article",
    "pluralName": "articles",
    "displayName": "Article"
  },
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title", "required": true },
    "content": { "type": "richtext" },
    "excerpt": { "type": "text" },
    "cover": { "type": "media", "multiple": false, "allowedTypes": ["images"] },
    "publishedDate": { "type": "date" },
    "category": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::category.category"
    },
    "tags": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::tag.tag"
    },
    "seo": {
      "type": "component",
      "repeatable": false,
      "component": "shared.seo"
    }
  }
}
```

Generate this TypeScript:

```typescript
export interface Article {
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  cover: StrapiMedia | null;
  publishedDate: string | null;
  category: Category | null;
  tags: Tag[];
  seo: SharedSeo | null;
}
```

## Handling Relations

- `oneToOne` / `manyToOne` -> `RelatedType | null`
- `oneToMany` / `manyToMany` -> `RelatedType[]`

Relations may not be populated in the response. When not populated, Strapi v5
returns `null` for single relations and `[]` for collection relations. The
type should reflect the populated shape.

## Handling Components

- `repeatable: false` -> `ComponentType | null`
- `repeatable: true` -> `ComponentType[]`

Example component type:

```typescript
export interface SharedSeo {
  metaTitle: string;
  metaDescription: string;
  metaImage: StrapiMedia | null;
}
```

## Handling Dynamic Zones

Dynamic zones are arrays where each item has a `__component` discriminator:

```typescript
// Individual component types
interface BlocksHero {
  __component: 'blocks.hero';
  title: string;
  subtitle: string | null;
  backgroundImage: StrapiMedia | null;
  ctaText: string | null;
  ctaLink: string | null;
}

interface BlocksTextBlock {
  __component: 'blocks.text-block';
  body: string;
}

interface BlocksCardGrid {
  __component: 'blocks.card-grid';
  heading: string | null;
  cards: BlocksCard[];
}

// Discriminated union for the dynamic zone
type PageContent = BlocksHero | BlocksTextBlock | BlocksCardGrid;

// Usage in the page type
export interface Page {
  title: string;
  slug: string;
  content: PageContent[];
}
```

Use the `__component` field to discriminate:

```typescript
const renderSection = (section: PageContent) => {
  switch (section.__component) {
    case 'blocks.hero':
      return <Hero {...section} />;
    case 'blocks.text-block':
      return <TextBlock {...section} />;
    case 'blocks.card-grid':
      return <CardGrid {...section} />;
    default:
      return null;
  }
};
```

## Enumeration Types

```json
"status": {
  "type": "enumeration",
  "enum": ["draft", "in-review", "published"]
}
```

Generates:

```typescript
export type ArticleStatus = 'draft' | 'in-review' | 'published';

export interface Article {
  status: ArticleStatus | null;
}
```

## Naming Conventions

- Content type interfaces: PascalCase of `displayName` (e.g., `Article`, `TeamMember`)
- Component interfaces: PascalCase of `<category><name>` (e.g., `SharedSeo`, `BlocksHero`)
- Enum types: PascalCase of `<ContentType><FieldName>` (e.g., `ArticleStatus`)
- All types go in `src/types/strapi.ts`
