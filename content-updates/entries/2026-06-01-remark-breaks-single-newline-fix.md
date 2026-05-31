---
date: 2026-06-01
environment: prod (frontend code only, no Strapi writes)
content_type: frontend (EventDetailPage + VenueDetailPage rendering)
entry: "Make single `\\n` in event/venue bodies render as a visible line break (remark-breaks plugin)"
author: dev (Claude) on 2026-06-01
dev: pending (will arrive via dev port)
uat: pending
seed: n/a (frontend code)
---

## Applied to main (code change)

After the 2026-05-31 markdown migration, single `\n` in event/venue bodies was being silently collapsed into a space — only `\n\n` produced a paragraph break. That's correct standard markdown behaviour, but it's not what the body content assumes — copy like

```
For kids aged 3-6 years old
Member: $3 | Guest: $5
```

was rendering as one wrapped line. User flagged it on `/whats-on/tiny-art-explorers-program-36`.

Fixed by adding the `remark-breaks` plugin to both `<ReactMarkdown>` blocks. Single `\n` → `<br>`, double `\n` still → new paragraph. No content edits needed; the same Strapi body now renders correctly.

## Cause (for future reference)

`react-markdown` follows the CommonMark spec where:
- a soft break (`\n`) inside a paragraph is rendered as whitespace, not a line break.
- only two trailing spaces + `\n` (or `<br>`) produce a hard line break.
- `\n\n` produces a paragraph break.

The content team writes natural copy with single `\n` between every line. Rather than re-format every event body (and ask the team to remember to double up every line), the plugin solves it once at the renderer level — matching the GitHub-flavoured markdown behaviour most authors expect.

## Files touched

- `frontend/package.json` + `package-lock.json` — added `remark-breaks@^4.0.0`.
- `frontend/src/pages/EventDetailPage.tsx` — added `import remarkBreaks from 'remark-breaks';` and `remarkPlugins={[remarkBreaks]}` on the existing `<ReactMarkdown>`.
- `frontend/src/pages/VenueDetailPage.tsx` — same.

## What this fixes (visible on next prod deploy)

- `/whats-on/tiny-art-explorers-program-36` — May (Mother's Day) event copy: "Thursdays, 3:00 PM – 3:45 PM Registration not required / For kids aged 3 – 6 years old" now shows on two lines; Member/Guest, Theme, weekly schedule all line-break correctly.
- `/whats-on/tiny-art-explorers-program-37` — June (Father's Day) event — same fix applies retroactively (we'd missed it in the 2026-05-31 polish).
- Any other event or venue detail page whose body uses single newlines between related lines — Camp Eagle age-group blocks, Sundays Served Right address lines, Sip & Serve registration steps, etc.

## What this does NOT change

- The 2026-05-31 markdown-link feature (inline `[text](url)`) still works the same way.
- Body paragraphs separated by `\n\n` still render as separate `<p>` blocks with the existing 20px gap; only inside a paragraph does single `\n` now produce a `<br>`.
- No Strapi writes — content stored on prod is identical to what was there yesterday.

## Replay instructions

Frontend code change only — arrives via the normal git push + CI rebuild on whichever env the branch deploys to.

## Related

- Linked entries:
  - [[2026-05-31-markdown-event-bodies]] — original markdown migration; this is its follow-up fix.
  - [[2026-06-01-membership-kids-fitness-batch]] — extended the markdown rendering to `VenueDetailPage`; this batch teaches both pages about single-newline breaks.
