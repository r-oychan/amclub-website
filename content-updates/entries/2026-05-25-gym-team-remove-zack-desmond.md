---
date: 2026-05-25
environment: prod (frontend code only — no Strapi entry exists for these)
content_type: subpages.ts (gym subpage teamMembers)
entry: "fitness/gym — remove Zack and Desmond from Personal Trainer team"
author: dev (Claude) on 2026-05-25
dev: pending (will arrive via git push to dev branch)
uat: pending
seed: n/a (frontend code, no Strapi data)
---

## Applied to main (code change)

Removed Zack and Desmond from the gym page's Personal Trainer team grid. Frontend code change only; takes effect on the next prod frontend deploy.

## Mechanism (diagnosed before edit)

- The `gym` page (slug `gym` under `event-spaces`-style routing → actually under fitness) does NOT have a `facility` entry in Strapi on prod (verified `/facilities?filters[slug][$eq]=gym` → 404).
- The page is rendered entirely from `frontend/src/data/subpages.ts:829` (slug `gym`).
- The `teamMembers` array at lines 889–909 contains all Personal Trainers. Zack and Desmond were the last two entries.
- Confirmed no other surface references these two — searched `fitness-page` and `home-page` singletons on prod: no match.

The other "Zack" on `subpages.ts:680` is a **different** person — `Zack Leong, Aquatics Coordinator` on the aquatics page (also exists in Strapi `coaches` collection). Not touched.

## Fields touched

### `frontend/src/data/subpages.ts` (slug `gym`, `teamMembers`)

Removed lines 908 and 909:
```ts
{ name: 'Zack',     role: 'Personal Trainer',                                                bioImage: '/images/fitness/team-pt/zack-bio.png' },
{ name: 'Desmond',  role: 'Personal Trainer',                                                bioImage: '/images/fitness/team-pt/desmond-bio.png' },
```

The trailing comma on line 907 (`Andyn`) was preserved; the array now ends after Andyn.

## Media removed

Orphans cleaned up in the same batch (no longer referenced):
- `frontend/public/images/fitness/team-pt/zack-bio.png`
- `frontend/public/images/fitness/team-pt/desmond-bio.png`
- `media/fitness/team-pt/zack-bio.png` (canonical copy)
- `media/fitness/team-pt/desmond-bio.png` (canonical copy)

Confirmed via grep that no remaining frontend or media reference exists.

## Replay instructions

**No Strapi action needed.** This is a pure code change.

- **Dev branch:** the same edit needs to land on `dev` branch. If dev has migrated gym team to the `gym-trainer` collection-type (per commits seen on origin/dev: `fd73a5e feat(fitness): per-discipline coach collections (Section 2)`), then the dev replay is instead: delete the `gym-trainer` entries for Zack and Desmond on dev env Strapi. **TBC** when promoting this fix to dev.
- **uat:** same edit assuming uat still has subpages.ts in its current state.

## Verification

After next prod frontend deploy:
- https://www.amclub.org.sg/fitness/gym → "Meet Our Team" (or the trainer grid) no longer shows Zack or Desmond. Andyn is now the last entry.

## Long-term debt

The gym team-members data living in `subpages.ts` violates `feedback_no_hardcoded_subpages`. The dev branch has begun migrating gym team to a `gym-trainer` collection. When that lands on main, this `teamMembers` array can be removed entirely and the page reads from Strapi.

## Related

- Linked entries: [[2026-05-25-fitness-gym-rates-pdf-update]] — sibling fitness/gym change in same batch.
