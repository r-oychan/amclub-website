---
date: 2026-06-01
environment: prod + dev (start-application Strapi side prod only)
content_type: frontend (EventDetailPage + VenueDetailPage) + facility (start-application) + event (camp-eagle)
entry: "Add rehype-raw so inline HTML in event/venue bodies renders (e.g. `<br />`); add Visiting Membership Form to Strapi start-application downloads; restore Camp Eagle's `<br />` separator"
author: dev (Claude) on 2026-06-01
dev: partial (06-01) — frontend yes, camp-eagle yes; start-application Strapi op n/a (dev has a different content-type shape)
uat: pending
seed: ported (patch-2026-06-01-start-application-form.mjs + frontend rehype-raw setup)
---

## Applied to prod + dev

Two related fixes in one pass.

### Frontend — inline HTML in markdown bodies

Earlier today (camp-eagle batch) I had to drop a `<br />` because `react-markdown` was rendering it as literal text — by default it doesn't parse inline HTML for security reasons. That kicked the markdown story into "remove HTML to get back to plain text" mode, which isn't what the user wants.

Installed `rehype-raw@^7.0.0` and wired it as `rehypePlugins={[rehypeRaw]}` on both `<ReactMarkdown>` blocks (`EventDetailPage.tsx` + `VenueDetailPage.tsx`). Final behaviour:

- `\n` → `<br>` (via `remark-breaks`, line break inside a paragraph).
- `\n\n` → new `<p>` paragraph (markdown standard).
- `**bold**`, `*italic*`, `[text](url)` — all render as inline elements (already worked before; this just confirms they still work alongside HTML parsing).
- `<br />`, `<br>`, `<strong>…</strong>`, `<em>…</em>`, `<a href="…">…</a>` — inline HTML now parses as real DOM elements via rehype-raw.

Content authors get the full mix: markdown for the common stuff, raw HTML for the cases where markdown doesn't cover what they need (extra blank lines, specific class names, etc.).

> Note on safety: the Strapi `event.longDescription` and `restaurant.description` fields are admin-edited, not user-submitted. We trust the input — no DOMPurify / rehype-sanitize layer required here. If the content surface ever grows to accept end-user submissions, add `rehype-sanitize` with a permissive schema before deploying that change.

### Strapi — start-application downloads.items (prod)

Item 1 from the user message: Visiting Membership Application Form still wasn't showing on `/membership/start-application` even though I added it to `subpages.ts:1884` in the earlier batch.

Diagnosis: the page renders via `VenueDetailPage` which fetches `/facilities?slug=start-application&populate[downloads][populate]=*` on prod. The CMS returns an 8-item-now `downloads.items` list (Application Checklist, Application Form, Endorsement Form, Junior Membership, PDPA, GIRO, Car Registration, Visiting Membership). Per the merge in `VenueDetailPage.tsx` (`downloads: api.downloads ?? fallback?.downloads`), the CMS value wins — so `subpages.ts` was being shadowed and the new form never reached the page.

Fix: PUT `/facilities/<docId>` with `data.downloads.items` containing the existing 7 entries (`id` stripped per Strapi v5 component PUT quirk) plus the new `Visiting Membership Application Form` → `https://amclub.jotform.com/260038799703970`. Heading preserved as "Forms You'll Need".

### Camp Eagle — restore `<br />`

Now that `<br />` parses as actual HTML, the body can carry an explicit extra blank line between the two age groups. PUT longDescription back to the `<br />`-bearing version:

```
…Time: 9:00 AM – 3:00 PM\n<br />\n8 years old and above…
```

## Per-env outcome

| Op | Prod | Dev |
|---|---|---|
| Frontend rehype-raw setup | ✓ on branch (CI deploy pending) | ✓ on branch (CI deploy pending) |
| start-application downloads Strapi PUT | ✓ 7 → 8 items | n/a — dev's `/facilities` endpoint returns 404 for `start-application` (dev's content-type tree diverged: no `facility` collection contains this slug). The `subpages.ts` fallback already has the Visiting Form in the dev branch, so the page surfaces it via fallback once the CI deploys. |
| Camp Eagle `<br />` restored | ✓ | ✓ |

## Source script

`scripts/patch-2026-06-01-start-application-form.mjs` — covers both ops, idempotent (skips if Visiting Form already in items list; skips if Camp Eagle body already has `<br />`).

## Verification

After the prod frontend CI rebuild:
- `/membership/start-application` → Forms section ends with "Visiting Membership Application Form" → jotform link.
- `/whats-on/camp-eagle-explorers-summer-2026` → visible blank line between the 4-7 yo and 8+ yo blocks (the `<br />` renders as a real HTML break).
- Any event/venue body with inline `<br />`, `<strong>`, `<em>`, etc. now renders the HTML correctly.

## Related

- Linked entries:
  - [[2026-06-01-camp-eagle-br-fix]] — earlier today's `<br />`-was-text fix. This entry walks that back by enabling rehype-raw + restoring the `<br />` separator.
  - [[2026-06-01-remark-breaks-single-newline-fix]] — establishes the `\n` → `<br>` plugin; this entry layers HTML parsing on top.
  - [[2026-05-31-markdown-event-bodies]] — original markdown migration.
  - [[2026-06-01-membership-kids-fitness-batch]] / [[2026-06-01-content-batch-2]] — earlier touches that added Visiting Form to `subpages.ts` (which turned out to be shadowed by Strapi).
