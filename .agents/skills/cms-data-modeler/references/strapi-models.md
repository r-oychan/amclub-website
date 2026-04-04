# Strapi v5 Model Format Reference

## Content Type Schema Structure

Every content type lives at `src/api/<api-name>/content-types/<type-name>/schema.json`.

```json
{
  "kind": "collectionType",
  "collectionName": "articles",
  "info": {
    "singularName": "article",
    "pluralName": "articles",
    "displayName": "Article",
    "description": "Blog articles"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    }
  }
}
```

### `kind` Values
- `"collectionType"` — Multiple entries (blog posts, team members, FAQs)
- `"singleType"` — Exactly one entry (homepage, global settings, about page)

### `collectionName`
The database table name. Convention: lowercase plural, e.g., `"articles"`, `"team_members"`.

### `info` Object
- `singularName` — kebab-case singular, e.g., `"article"`, `"team-member"`
- `pluralName` — kebab-case plural, e.g., `"articles"`, `"team-members"`
- `displayName` — Human-readable, e.g., `"Article"`, `"Team Member"`
- `description` — Optional description shown in admin

### `options`
- `draftAndPublish: true` — Enables draft/published workflow (default for content types)

## Attribute Types

### Scalar Types

```json
"fieldName": {
  "type": "<type>",
  "required": true,
  "unique": false,
  "default": "value",
  "minLength": 1,
  "maxLength": 255,
  "private": false
}
```

| Type | Description | Extra Options |
|------|-------------|---------------|
| `string` | Short text (up to 255 chars) | `minLength`, `maxLength`, `regex` |
| `text` | Long text (no limit) | `minLength`, `maxLength` |
| `richtext` | Markdown rich text | `minLength`, `maxLength` |
| `blocks` | Strapi Blocks editor (structured rich text) | — |
| `email` | Email with validation | `minLength`, `maxLength` |
| `password` | Hashed password field | `minLength`, `maxLength` |
| `uid` | URL-friendly unique ID | `targetField`, `options.separator` |
| `integer` | Whole number | `min`, `max` |
| `biginteger` | Large whole number | `min`, `max` |
| `float` | Floating point | `min`, `max` |
| `decimal` | Precise decimal | `min`, `max` |
| `date` | Date only (YYYY-MM-DD) | — |
| `time` | Time only (HH:mm:ss) | — |
| `datetime` | Date and time (ISO 8601) | — |
| `timestamp` | Unix timestamp | — |
| `boolean` | True/false | `default` |
| `json` | Arbitrary JSON object | — |

### Enumeration

```json
"status": {
  "type": "enumeration",
  "enum": ["draft", "in-review", "published"],
  "default": "draft",
  "required": true
}
```

### UID (Slug)

```json
"slug": {
  "type": "uid",
  "targetField": "title",
  "required": true
}
```

The `targetField` auto-generates the slug from the specified field.

### Media

```json
"cover": {
  "type": "media",
  "multiple": false,
  "required": false,
  "allowedTypes": ["images"]
}
```

`allowedTypes`: `["images"]`, `["videos"]`, `["files"]`, `["audios"]`, or combinations.
`multiple: true` allows multiple file uploads.

## Relations

### Syntax

```json
"category": {
  "type": "relation",
  "relation": "manyToOne",
  "target": "api::category.category",
  "inversedBy": "articles"
}
```

### Relation Types

| Relation | Field Side | Other Side | Config Key |
|----------|-----------|------------|------------|
| `oneToOne` | Has one | Has one | `inversedBy` / `mappedBy` |
| `oneToMany` | Has many | Belongs to one | `mappedBy` (on the "one" side) |
| `manyToOne` | Belongs to one | Has many | `inversedBy` (on the "many" side) |
| `manyToMany` | Has many | Has many | `inversedBy` / `mappedBy` |

### Bidirectional Relations

The owning side uses `inversedBy`, the inverse side uses `mappedBy`.

**Article (many) -> Category (one):**

Article schema:
```json
"category": {
  "type": "relation",
  "relation": "manyToOne",
  "target": "api::category.category",
  "inversedBy": "articles"
}
```

Category schema:
```json
"articles": {
  "type": "relation",
  "relation": "oneToMany",
  "target": "api::article.article",
  "mappedBy": "category"
}
```

### Target Format
`"api::<api-name>.<content-type-name>"` for API content types.
`"plugin::users-permissions.user"` for plugin types.

## Components

Components are reusable field groups. They live at `src/components/<category>/<name>.json`.

```json
{
  "collectionName": "components_shared_seo",
  "info": {
    "displayName": "SEO",
    "description": "SEO metadata fields",
    "icon": "search"
  },
  "attributes": {
    "metaTitle": {
      "type": "string",
      "maxLength": 60,
      "required": true
    },
    "metaDescription": {
      "type": "text",
      "maxLength": 160,
      "required": true
    },
    "metaImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    }
  }
}
```

### Using Components in Content Types

**Single component:**
```json
"seo": {
  "type": "component",
  "repeatable": false,
  "component": "shared.seo"
}
```

**Repeatable component:**
```json
"features": {
  "type": "component",
  "repeatable": true,
  "component": "blocks.feature-item"
}
```

Component reference format: `"<category>.<name>"` (matches directory structure).

### `collectionName` Convention
`"components_<category>_<name>"`, e.g., `"components_shared_seo"`, `"components_blocks_hero"`.

## Dynamic Zones

Dynamic zones allow content editors to pick from a list of components and arrange them freely.

```json
"content": {
  "type": "dynamiczone",
  "components": [
    "blocks.hero",
    "blocks.text-block",
    "blocks.card-grid",
    "blocks.cta-banner",
    "blocks.image-gallery",
    "blocks.faq",
    "blocks.testimonial",
    "blocks.stats-counter",
    "blocks.feature-grid",
    "blocks.video-embed"
  ]
}
```

Each component in the list must exist at `src/components/<category>/<name>.json`.

## File Structure Summary

```
cms/src/
├── api/
│   ├── article/
│   │   ├── content-types/
│   │   │   └── article/
│   │   │       └── schema.json
│   │   ├── controllers/
│   │   │   └── article.ts
│   │   ├── routes/
│   │   │   └── article.ts
│   │   └── services/
│   │       └── article.ts
│   └── category/
│       └── content-types/
│           └── category/
│               └── schema.json
└── components/
    ├── shared/
    │   ├── seo.json
    │   ├── media.json
    │   └── link.json
    └── blocks/
        ├── hero.json
        ├── text-block.json
        └── card-grid.json
```

## Source
- https://docs.strapi.io/cms/backend-customization/models
- https://docs.strapi.io/cms/backend-customization/models#model-schema
