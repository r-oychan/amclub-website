---
date: 2026-05-31
environment: prod (dev partial — same dev-gap as the earlier 05-31 batch)
content_type: frontend (EventDetailPage rendering) + event (3 longDescription updates)
entry: "Enable inline markdown links in event bodies + convert 3 events to use real [text](url) links"
author: dev (Claude) on 2026-05-31
dev: partial (05-31) — frontend change applies; 3 event updates skipped (events absent on dev)
uat: pending
seed: ported (patch-2026-05-31-batch.mjs EVENT_PATCHES + react-markdown in frontend)
---

## Applied to prod (full) + dev (frontend yes, event content partial)

User asked for proper inline links in event bodies (CTAs can't carry "register **here** for 4-7 yo and **here** for 8+ yo" — multiple inline targets in flowing copy). Chose **Option A** from the trade-off: add a markdown renderer in the frontend rather than migrating the schema to `blocks` or installing a WYSIWYG plugin.

### Frontend change

Installed `react-markdown@^10.1.0` (~50 KB, React 19 compatible). Replaced the plain `<p>{text}</p>` mapping in `EventDetailPage.tsx:244-252` with a `<ReactMarkdown>` block that:
- preserves the existing paragraph styling via a `components.p` override,
- renders inline `[text](url)` as `<a>` with project-styled accent + underline,
- opens `http(s)` links in a new tab with `rel="noopener noreferrer"`,
- leaves `mailto:`/`tel:`/relative links in same tab.

The existing `paragraphs()` helper and `normalizeAmPm()` are still used; `normalizeAmPm` is applied to the full string before rendering, so AM/PM formatting stays consistent in markdown output too.

### Event content updates (Strapi)

Patched 3 event bodies on prod to use real markdown links (the same script that ran earlier today — added markdown to the existing `EVENT_PATCHES` and re-ran with `--only=1`; idempotent skip on the 6 unchanged events).

| Event | Inline link added |
|---|---|
| `heroes-and-sidekicks-fathers-day-2026` | `[Register here](<URL>)` — uses the URL the user supplied for this batch |
| `camp-eagle-explorers-summer-2026` | two `[Register here](<URL>)` — one per age group |
| `sundays-served-right-the-2nd-floor` | `[2ndfloor@amclub.org.sg](mailto:2ndfloor@amclub.org.sg)` |

CTAs are kept too — they serve as a primary call-to-action button, while the inline links live in the descriptive copy where the action is contextual ("Register here for 4-7 yo" vs. the bare button).

## Dev outcome

- **Frontend code change** (`EventDetailPage.tsx`, `react-markdown`): applies on dev branch via the port. Once the dev container rebuilds, dev's existing event detail pages render markdown links too.
- **Event body updates**: all 3 affected events remain absent on dev (same gap as the earlier 2026-05-31 batch). Script gracefully skipped.

## Schema unchanged

`event.longDescription` remains `richtext`. Strapi `/admin` already provides a markdown editor for this type, so content authors can write `[label](https://...)` directly. No schema migration, no admin training new tooling.

## Render specifics

```tsx
<ReactMarkdown
  components={{
    p: ({ children }) => (
      <p className="text-text-dark" style={{ fontSize: '19.2px', fontWeight: 400, lineHeight: '26.88px' }}>
        {children}
      </p>
    ),
    a: ({ href, children }) => {
      const external = href?.startsWith('http');
      return (
        <a
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className="text-accent underline underline-offset-2 hover:no-underline"
        >
          {children}
        </a>
      );
    },
  }}
>
  {normalizeAmPm(event.longDescription ?? event.description ?? '')}
</ReactMarkdown>
```

## Replay instructions

Strapi side already idempotent via `patch-2026-05-31-batch.mjs --only=1`. Frontend side comes through normal git push + CI rebuild.

## Verification

After next prod frontend deploy:
- `/whats-on/heroes-and-sidekicks-fathers-day-2026` — body's "Register here" word is a clickable link to the Office Forms URL, opens in new tab.
- `/whats-on/camp-eagle-explorers-summer-2026` — both "Register here" instances are clickable, each going to its age-group-specific form.
- `/whats-on/sundays-served-right-the-2nd-floor` — email address in body opens the user's mail client; CTA button does the same.

## Long-term notes

- If we ever want **markdown lists / blockquotes / headings** rendered nicely, `react-markdown` supports them out of the box — just add component overrides for `ul`/`ol`/`blockquote`/`h2` etc. to map them to project styles.
- Same `ReactMarkdown` pattern can be applied to `dining-promotion.summary`, `restaurant.description`, etc. if those need inline links too — out of scope here but a one-line lift each.

## Related

- Linked entries:
  - [[2026-05-31-event-content-cleanup-and-event-spaces-fixes]] — earlier same-day batch that established the body content; this entry adds the inline-link capability + flips three bodies to use it.
  - [[2026-05-22-event-heroes-and-sidekicks-fathers-day]] — original event creation entry; the Register CTA URL gap (flagged there) is fully closed now via both CTA and inline link.
