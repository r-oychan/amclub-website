# Strapi CMS Conventions
- Strapi v5 with TypeScript
- Content types live in `src/api/[name]/content-types/[name]/schema.json`
- Components live in `src/components/[category]/[name].json`
- Plugin configs in `config/plugins.ts`
- Use `strapi develop` to start dev server (port 1337)
- API prefix: `/api/` (e.g., `/api/pages`, `/api/blog-posts`)
- Always register content types via the file system, not the admin UI