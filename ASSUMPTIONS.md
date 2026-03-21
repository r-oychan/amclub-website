# Pipeline Assumptions — To Revisit

## Infrastructure
- Using Docker PostgreSQL locally for Strapi (not SQLite) to match production
- PostgreSQL 16 via Docker Compose
- Strapi dev runs on port 1337, frontend on port 5173
- Azure as cloud target (per CLAUDE.md)

## Content & Data Model
- FAQ answers are placeholder — will need real content later
- Events are a collection type (dynamic, CMS-managed)
- Committee members are a collection type (updatable by admin)
- Restaurant/venue details are collection types (not hardcoded)
- Testimonials are a collection type with video links
- "Member Login", "Start Your Application" etc. link to external systems (not built here)
- External links (menus, forms, order pages) are stored as URL fields, not built

## Frontend
- CMS API URL defaults to `http://localhost:1337` for dev
- No authentication/login system built — just links to external member portal
- No e-commerce/ordering (TAC2Go, Bottles2Go link externally)
- Responsive design targeting desktop + mobile
- No i18n (English only)

## Deployment
- Docker Compose for local development (Strapi + PostgreSQL)
- Pulumi IaC for Azure (Container Apps, PostgreSQL Flexible Server, Blob Storage)
- GitHub Actions CI/CD

## Scope Exclusions
- No blog/news CMS (not present in mockup navigation)
- No gallery page (referenced in footer but not in main nav/mockup)
- No search functionality
- No contact form backend (enquiries link to email)

_Created: 2026-03-05 — Revisit after initial build_
