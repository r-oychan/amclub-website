# Common Content Type Patterns

Examples of Strapi v5 content types for frequently occurring website patterns. Use these as starting points and customize based on `site-analysis.json`.

## Blog

### Article (Collection Type)

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
  "options": { "draftAndPublish": true },
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title", "required": true },
    "excerpt": { "type": "text", "maxLength": 300 },
    "content": { "type": "blocks" },
    "cover": { "type": "media", "multiple": false, "allowedTypes": ["images"] },
    "publishedDate": { "type": "date", "required": true },
    "author": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::author.author",
      "inversedBy": "articles"
    },
    "category": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::category.category",
      "inversedBy": "articles"
    },
    "tags": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::tag.tag",
      "inversedBy": "articles"
    },
    "seo": { "type": "component", "repeatable": false, "component": "shared.seo" }
  }
}
```

### Category (Collection Type)

```json
{
  "kind": "collectionType",
  "collectionName": "categories",
  "info": {
    "singularName": "category",
    "pluralName": "categories",
    "displayName": "Category"
  },
  "options": { "draftAndPublish": false },
  "attributes": {
    "name": { "type": "string", "required": true, "unique": true },
    "slug": { "type": "uid", "targetField": "name", "required": true },
    "description": { "type": "text" },
    "articles": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::article.article",
      "mappedBy": "category"
    }
  }
}
```

### Author (Collection Type)

```json
{
  "kind": "collectionType",
  "collectionName": "authors",
  "info": {
    "singularName": "author",
    "pluralName": "authors",
    "displayName": "Author"
  },
  "options": { "draftAndPublish": false },
  "attributes": {
    "name": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "name", "required": true },
    "bio": { "type": "text" },
    "avatar": { "type": "media", "multiple": false, "allowedTypes": ["images"] },
    "email": { "type": "email" },
    "articles": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::article.article",
      "mappedBy": "author"
    }
  }
}
```

### Tag (Collection Type)

```json
{
  "kind": "collectionType",
  "collectionName": "tags",
  "info": {
    "singularName": "tag",
    "pluralName": "tags",
    "displayName": "Tag"
  },
  "options": { "draftAndPublish": false },
  "attributes": {
    "name": { "type": "string", "required": true, "unique": true },
    "slug": { "type": "uid", "targetField": "name", "required": true },
    "articles": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::article.article",
      "mappedBy": "tags"
    }
  }
}
```

## Landing Page (Single Type with Dynamic Zone)

```json
{
  "kind": "singleType",
  "collectionName": "home_pages",
  "info": {
    "singularName": "home-page",
    "pluralName": "home-pages",
    "displayName": "Home Page"
  },
  "options": { "draftAndPublish": true },
  "attributes": {
    "title": { "type": "string", "required": true },
    "content": {
      "type": "dynamiczone",
      "components": [
        "blocks.hero",
        "blocks.text-block",
        "blocks.card-grid",
        "blocks.cta-banner",
        "blocks.image-gallery",
        "blocks.faq",
        "blocks.testimonial-slider",
        "blocks.stats-counter",
        "blocks.feature-grid",
        "blocks.video-embed",
        "blocks.logo-cloud",
        "blocks.team-grid",
        "blocks.pricing-table"
      ]
    },
    "seo": { "type": "component", "repeatable": false, "component": "shared.seo" }
  }
}
```

## Team Member (Collection Type)

```json
{
  "kind": "collectionType",
  "collectionName": "team_members",
  "info": {
    "singularName": "team-member",
    "pluralName": "team-members",
    "displayName": "Team Member"
  },
  "options": { "draftAndPublish": true },
  "attributes": {
    "name": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "name", "required": true },
    "role": { "type": "string", "required": true },
    "bio": { "type": "blocks" },
    "photo": { "type": "media", "multiple": false, "allowedTypes": ["images"] },
    "email": { "type": "email" },
    "linkedIn": { "type": "string" },
    "order": { "type": "integer", "default": 0 },
    "seo": { "type": "component", "repeatable": false, "component": "shared.seo" }
  }
}
```

## Testimonial (Collection Type)

```json
{
  "kind": "collectionType",
  "collectionName": "testimonials",
  "info": {
    "singularName": "testimonial",
    "pluralName": "testimonials",
    "displayName": "Testimonial"
  },
  "options": { "draftAndPublish": true },
  "attributes": {
    "quote": { "type": "text", "required": true },
    "authorName": { "type": "string", "required": true },
    "authorRole": { "type": "string" },
    "authorCompany": { "type": "string" },
    "authorPhoto": { "type": "media", "multiple": false, "allowedTypes": ["images"] },
    "rating": { "type": "integer", "min": 1, "max": 5 },
    "order": { "type": "integer", "default": 0 }
  }
}
```

## FAQ (Collection Type)

```json
{
  "kind": "collectionType",
  "collectionName": "faqs",
  "info": {
    "singularName": "faq",
    "pluralName": "faqs",
    "displayName": "FAQ"
  },
  "options": { "draftAndPublish": true },
  "attributes": {
    "question": { "type": "string", "required": true },
    "answer": { "type": "blocks", "required": true },
    "category": { "type": "string" },
    "order": { "type": "integer", "default": 0 }
  }
}
```

## Service (Collection Type)

```json
{
  "kind": "collectionType",
  "collectionName": "services",
  "info": {
    "singularName": "service",
    "pluralName": "services",
    "displayName": "Service"
  },
  "options": { "draftAndPublish": true },
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title", "required": true },
    "description": { "type": "text" },
    "content": { "type": "blocks" },
    "icon": { "type": "string" },
    "image": { "type": "media", "multiple": false, "allowedTypes": ["images"] },
    "order": { "type": "integer", "default": 0 },
    "seo": { "type": "component", "repeatable": false, "component": "shared.seo" }
  }
}
```

## Navigation (Single Type with Nested Items)

### Navigation Component (`src/components/shared/nav-item.json`)

```json
{
  "collectionName": "components_shared_nav_items",
  "info": {
    "displayName": "Nav Item",
    "description": "Single navigation link",
    "icon": "link"
  },
  "attributes": {
    "label": { "type": "string", "required": true },
    "href": { "type": "string", "required": true },
    "isExternal": { "type": "boolean", "default": false },
    "order": { "type": "integer", "default": 0 },
    "children": {
      "type": "component",
      "repeatable": true,
      "component": "shared.nav-link"
    }
  }
}
```

### Nav Link (leaf-level, no nesting) (`src/components/shared/nav-link.json`)

```json
{
  "collectionName": "components_shared_nav_links",
  "info": {
    "displayName": "Nav Link",
    "description": "Leaf navigation link (no children)",
    "icon": "link"
  },
  "attributes": {
    "label": { "type": "string", "required": true },
    "href": { "type": "string", "required": true },
    "isExternal": { "type": "boolean", "default": false },
    "order": { "type": "integer", "default": 0 }
  }
}
```

### Header (Single Type)

```json
{
  "kind": "singleType",
  "collectionName": "headers",
  "info": {
    "singularName": "header",
    "pluralName": "headers",
    "displayName": "Header"
  },
  "options": { "draftAndPublish": false },
  "attributes": {
    "logo": { "type": "media", "multiple": false, "allowedTypes": ["images"] },
    "logoAlt": { "type": "string" },
    "navigation": {
      "type": "component",
      "repeatable": true,
      "component": "shared.nav-item"
    },
    "ctaButton": { "type": "component", "repeatable": false, "component": "shared.link" }
  }
}
```

## Global Settings (Single Type)

```json
{
  "kind": "singleType",
  "collectionName": "globals",
  "info": {
    "singularName": "global",
    "pluralName": "globals",
    "displayName": "Global"
  },
  "options": { "draftAndPublish": false },
  "attributes": {
    "siteName": { "type": "string", "required": true },
    "siteDescription": { "type": "text" },
    "logo": { "type": "media", "multiple": false, "allowedTypes": ["images"] },
    "favicon": { "type": "media", "multiple": false, "allowedTypes": ["images"] },
    "defaultSeo": { "type": "component", "repeatable": false, "component": "shared.seo" },
    "socialLinks": {
      "type": "component",
      "repeatable": true,
      "component": "shared.social-link"
    }
  }
}
```

### Social Link Component (`src/components/shared/social-link.json`)

```json
{
  "collectionName": "components_shared_social_links",
  "info": {
    "displayName": "Social Link",
    "icon": "globe"
  },
  "attributes": {
    "platform": {
      "type": "enumeration",
      "enum": ["facebook", "twitter", "instagram", "linkedin", "youtube", "tiktok", "github", "other"],
      "required": true
    },
    "url": { "type": "string", "required": true }
  }
}
```

## Footer (Single Type)

```json
{
  "kind": "singleType",
  "collectionName": "footers",
  "info": {
    "singularName": "footer",
    "pluralName": "footers",
    "displayName": "Footer"
  },
  "options": { "draftAndPublish": false },
  "attributes": {
    "logo": { "type": "media", "multiple": false, "allowedTypes": ["images"] },
    "description": { "type": "text" },
    "columns": {
      "type": "component",
      "repeatable": true,
      "component": "shared.footer-column"
    },
    "copyright": { "type": "string" },
    "socialLinks": {
      "type": "component",
      "repeatable": true,
      "component": "shared.social-link"
    }
  }
}
```

### Footer Column Component (`src/components/shared/footer-column.json`)

```json
{
  "collectionName": "components_shared_footer_columns",
  "info": {
    "displayName": "Footer Column",
    "icon": "layout"
  },
  "attributes": {
    "heading": { "type": "string", "required": true },
    "links": {
      "type": "component",
      "repeatable": true,
      "component": "shared.nav-link"
    }
  }
}
```

## Shared Components Summary

| Component | Category | Purpose |
|-----------|----------|---------|
| `shared.seo` | shared | SEO metadata for all content types |
| `shared.link` | shared | Button/link with label + URL + variant |
| `shared.nav-item` | shared | Navigation item with optional children |
| `shared.nav-link` | shared | Leaf navigation link |
| `shared.social-link` | shared | Social media platform + URL |
| `shared.footer-column` | shared | Footer column with heading + links |
| `shared.media` | shared | Image with alt text and caption |

### Link Component (`src/components/shared/link.json`)

```json
{
  "collectionName": "components_shared_links",
  "info": {
    "displayName": "Link",
    "description": "Button or link with label and URL",
    "icon": "link"
  },
  "attributes": {
    "label": { "type": "string", "required": true },
    "href": { "type": "string", "required": true },
    "isExternal": { "type": "boolean", "default": false },
    "variant": {
      "type": "enumeration",
      "enum": ["primary", "secondary", "outline", "text"],
      "default": "primary"
    }
  }
}
```

### Media Component (`src/components/shared/media.json`)

```json
{
  "collectionName": "components_shared_media",
  "info": {
    "displayName": "Media",
    "description": "Image with alt text and caption",
    "icon": "image"
  },
  "attributes": {
    "file": { "type": "media", "multiple": false, "allowedTypes": ["images", "videos"] },
    "alternativeText": { "type": "string" },
    "caption": { "type": "string" }
  }
}
```
