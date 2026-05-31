---
date: 2026-06-01
environment: prod + dev
content_type: event (camp-eagle longDescription)
entry: "Drop literal <br /> text from Camp Eagle body; use plain paragraph break"
author: dev (Claude) on 2026-06-01
dev: applied (06-01)
uat: pending
seed: ported (patch-2026-06-01-camp-eagle-br-fix.mjs + corrected patch-2026-06-01-content-batch-2.mjs source)
---

## Applied to prod + dev

Earlier today I added an inline `<br />` between Camp Eagle's two age-group blocks to force a visible extra blank line beyond the standard `\n\n` paragraph break. That doesn't work the way I hoped — `react-markdown` doesn't parse inline HTML without the `rehype-raw` plugin, so the `<br />` ended up rendering as literal text on the page.

Reverted to a plain `\n\n` paragraph break between the two age-group blocks. Now relies on the normal 20px gap between adjacent `<p>` elements (set on the `flex flex-col` wrapper in `EventDetailPage.tsx:243`). If the spacing turns out to be insufficient, two options for the next pass:
1. Install `rehype-raw` and use `<br />` for inline HTML.
2. Use `\n\n&nbsp;\n\n` — markdown treats it as an empty paragraph with non-breaking space content, which gives an additional visible blank line.

## Fields touched

`event.longDescription` on `camp-eagle-explorers-summer-2026`:

- **Before**: `…Time: 9:00 AM – 3:00 PM\n<br />\n\n8 years old and above…`
- **After**: `…Time: 9:00 AM – 3:00 PM\n\n8 years old and above…`

## Source script corrected

`scripts/patch-2026-06-01-content-batch-2.mjs` updated so the `camp-eagle` `EVENT_PATCHES` entry reflects today's final body. A fresh replay on any env arrives at the same end state.

## Side note — item 2 from this user message

The "add Visiting Membership Application Form" item was already shipped in the 2026-06-01 batch (`subpages.ts:1884`). It's in `main` and `dev` branches as of commit 4a45ac4. Waiting on the prod frontend CI rebuild to surface on the live `/membership/start-application` page.

## Verification

After CDN refresh / next deploy:
- `/whats-on/camp-eagle-explorers-summer-2026` — no literal `<br />` text in the body; the two age-group blocks are visually separated by a normal paragraph gap.

## Related

- Linked entries:
  - [[2026-06-01-content-batch-2]] — the batch where the `<br />` was first introduced. Source script now reflects the corrected version.
  - [[2026-06-01-remark-breaks-single-newline-fix]] — the markdown rendering setup that this fix lives within.
