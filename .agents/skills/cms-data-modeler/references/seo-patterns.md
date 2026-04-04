# SEO Component Patterns for Strapi

## Standard SEO Component

Create a reusable `shared.seo` component that attaches to every content type.

### Component Definition (`src/components/shared/seo.json`)

```json
{
  "collectionName": "components_shared_seo",
  "info": {
    "displayName": "SEO",
    "description": "Search engine optimization metadata",
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
    },
    "metaRobots": {
      "type": "string",
      "default": "index, follow"
    },
    "canonicalURL": {
      "type": "string"
    },
    "structuredData": {
      "type": "json"
    }
  }
}
```

### Attaching to a Content Type

```json
"seo": {
  "type": "component",
  "repeatable": false,
  "component": "shared.seo"
}
```

## Open Graph Component

If you need Open Graph fields separate from basic SEO (optional, can also be part of the main SEO component):

```json
{
  "collectionName": "components_shared_open_graph",
  "info": {
    "displayName": "Open Graph",
    "description": "Social media sharing metadata",
    "icon": "share"
  },
  "attributes": {
    "ogTitle": {
      "type": "string",
      "maxLength": 60
    },
    "ogDescription": {
      "type": "text",
      "maxLength": 200
    },
    "ogImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "ogType": {
      "type": "enumeration",
      "enum": ["website", "article", "product", "profile"],
      "default": "website"
    },
    "twitterCard": {
      "type": "enumeration",
      "enum": ["summary", "summary_large_image", "app", "player"],
      "default": "summary_large_image"
    }
  }
}
```

## JSON-LD Structured Data Patterns

Store structured data in the `structuredData` JSON field of the SEO component. The frontend renders it as a `<script type="application/ld+json">` tag.

### Article (Blog Posts)

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Article Title",
  "description": "Article summary",
  "image": "https://example.com/image.jpg",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Site Name",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "datePublished": "2024-01-01",
  "dateModified": "2024-01-15"
}
```

### Organization (About, Homepage)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Company Name",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-555-5555",
    "contactType": "customer service"
  },
  "sameAs": [
    "https://facebook.com/company",
    "https://twitter.com/company",
    "https://linkedin.com/company/company"
  ]
}
```

### FAQ Page

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is your return policy?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can return items within 30 days."
      }
    }
  ]
}
```

### BreadcrumbList

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://example.com/blog"
    }
  ]
}
```

### Product

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "image": "https://example.com/product.jpg",
  "description": "Product description",
  "brand": {
    "@type": "Brand",
    "name": "Brand Name"
  },
  "offers": {
    "@type": "Offer",
    "price": "99.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
```

### LocalBusiness (Contact Page)

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Business Name",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "City",
    "addressRegion": "State",
    "postalCode": "12345",
    "addressCountry": "US"
  },
  "telephone": "+1-555-555-5555",
  "openingHours": "Mo-Fr 09:00-17:00"
}
```

## Per-Page SEO Guidance

| Page Type | JSON-LD Type | Priority Fields |
|-----------|-------------|-----------------|
| Homepage | `Organization` or `WebSite` | name, url, logo, sameAs |
| Blog listing | `CollectionPage` | name, description |
| Blog post | `Article` | headline, author, datePublished, image |
| About | `Organization` | name, description, founders |
| Contact | `LocalBusiness` | address, telephone, openingHours |
| FAQ | `FAQPage` | mainEntity (questions) |
| Product/Service | `Product` or `Service` | name, description, offers |
| Team | `Organization` + `Person` | member list |

## Best Practices

1. Always set `metaTitle` to be under 60 characters
2. Always set `metaDescription` to be under 160 characters
3. Use unique meta titles and descriptions per page
4. Include the primary keyword in metaTitle
5. Set `metaRobots` to `"noindex, nofollow"` for utility pages (privacy, terms)
6. Always provide an `metaImage` (1200x630px for OG)
7. Use `canonicalURL` to prevent duplicate content issues
8. Generate JSON-LD on the frontend from CMS data rather than storing static JSON when possible
