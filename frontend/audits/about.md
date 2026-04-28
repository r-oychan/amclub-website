# AboutPage Audit — Framer ↔ Local

Captured 2026-04-28 at 1440×900 from `https://tactesting.framer.website/about`.
Reference screenshot: `framer-about-1440.jpeg`.

## Section order (12 blocks)

1. Hero (compact, image only — heading "About the Club")
2. HeritageTimeline (heading, body, bg image, 8 slides with year+body+image)
3. StatsCounter ("The Club Today", 4 stats — adds **25 Committees** vs HomePage's 3)
4. VisionMission (Our Vision + Our Mission, image left)
5. Governance (heading, body, sidebar heading + body + 3 links incl. one with caption)
6. TeamGrid (General Committee, 15 members)
7. FeatureGrid w/ list + aside image (Club Advocacy + sustainability bullets)
8. ManagementSlider (Club Management, 6 members, 1st has long bio)
9. PartnerOrganizations (7 partners + 2 strategic)
10. AwardsGrid (9 items)
11. **CtaBanner (local enhancement — not in Framer)**

## Diff highlights

| Section | Status |
|---|---|
| Hero | ✅ matches |
| HeritageTimeline 8 slides | ✅ matches; only 1966 image visible without scroll, others lazy-load |
| StatsCounter | ✅ matches (4 stats) |
| Vision/Mission text | ✅ matches |
| Governance text + sidebar links | ✅ matches; "Committee List" has caption "(Updated as at December 3, 2025)" |
| General Committee 15 members | ⚠ **order differs** — local has Priyanka & Ted before Michelle/Autumn/Sandra; Framer reverses |
| Club Advocacy bullets + image | ✅ matches |
| Management 6 members + Christine bio | ✅ matches |
| Partner Organizations 7+2 | ✅ matches; Framer's order: VwJAdprWe, rLS9eBaz, c9nSNg8v, M8rcJzc7, lEDAQcu7, Hub3OXj3, lmRS69Ff |
| Awards 9 items | ✅ matches |
| CtaBanner ("Become Part of Our Story") | 🔁 **local enhancement** — not in Framer |

## Local enhancements to keep (D2)

1. CtaBanner at bottom — keeps the page closed with a clear next step.
2. Page widths standardized (per CLAUDE.md memory).

## Decisions

- **Use Framer's General Committee order**, not local's. Sequence: GC president & officers first; reps last.
- **Keep CtaBanner** at bottom (D2 enhancement).
- **Filter committee-members by `memberType`**. Two collections-of-people in one DB-level table; blocks pull by enum filter.

## Schema needs

New Strapi components:
- `shared.timeline-slide` — year, body, image
- `shared.partner-logo` — name, image, href
- `shared.partner-group` — heading?, logos[]
- `shared.award-item` — title, issuer, image
- `blocks.heritage-timeline` — heading, body, backgroundImage, slides[]
- `blocks.vision-mission` — vision, mission, image, imagePosition
- `blocks.governance` — heading, body, sidebarHeading, sidebarBody, links[]
- `blocks.management-slider` — heading, watermark, filterByType (default management)
- `blocks.partner-organizations` — heading, groups[]
- `blocks.awards-grid` — heading, items[]

Edits to existing:
- `blocks.feature-grid` — add subheading, body, listItems (json), asideImage, asideImagePosition
- `blocks.team-grid` — add variant (light/dark), filterByType (default general-committee)
- `blocks.stats-counter` — add heading
- `shared.link` — add caption (optional)
- `api::committee-member` — already has memberType enum; OK

Refactor `api::about-page` from Dynamic Zone to explicit components (D1).
Add deep-populate controller (mirrors home-page pattern).

## Image inventory (from Framer)

| Section | Image | Local? |
|---|---|---|
| Hero bg | `5Wnl6bOkKlpqZIDwN798ZEhqs.jpg` | ✓ already in local |
| Heritage 1966 | `LqyNjKZmAT6eQLWMGwjqYJ4qvyk.jpg` | ✓ |
| Heritage 1970 | `q4RJmABpcLaL18xk0ENsstWi2E.jpg` | ✓ |
| Heritage 1978 | `Br8wsd35CiEWsRROc5cb0uw.jpg` | ✓ |
| Heritage 1983 | `NNmXh9wZuz8PMn8kYcq6xRHDJ7A.jpg` | ✓ |
| Heritage 1989 | `qOdPN2jz2g8jc3ohflKsKZtJhg.jpg` | ✓ |
| Heritage 1990 | `zL20NMUh0bUXlxaXByninbz4.jpeg` | ✓ |
| Heritage 2000 | `8AdZeXaiX01zJ8DeEDecvQ5y8c.jpg` | ✓ |
| Heritage 2015 | `qGgCGqT3R7jhogHscMek1P7gmE.jpg` | ✓ |
| Vision/Mission | `ALiDWPH3U3VnmiEzcoEet6lPIk.jpeg` | ✓ already uploaded for HomePage (reuse) |
| GC Daniel Gewirtz | `yQzuzYzL7t5XQaH5upKt7gruR9Q.png` | ✓ |
| GC Tessa Pang | `0WIEM72I1vgWDuMYqLCBgOrk.png` | ✓ |
| GC Alisha Barnes | `jxU7bm20Hkfa0nt1lQIJg1xft8Q.png` | ✓ |
| GC Charles Santos | `bapIqliILvMJllzgOM301TfFbFE.png` | ✓ |
| GC Marcella Sullivan | `7dTc00R0ddDdnpQZ18pBIezRw.png` | ✓ |
| GC Ngiam Siew Wei | `LgG3L2KEkC3NpG2yO94nYJQ0yU.png` | ✓ |
| GC Priyanka Bhalla | `7fAHglucQZFyxm4xbLmhwxyv6wI.png` | ✓ |
| GC Ted Teo | `tDBTdmmp2D543zjHGjP6DhuvMtA.png` | ✓ |
| GC Michelle Reeb | `VFJQqqNixmxna4NkTpsiXjzhgY.png` | ✓ |
| GC Autumn Vavoso | `kFNEb2osoQAJhtv7ojPg3YVE8P4.png` | ✓ |
| GC Sandra Johnson | `V4o3foYlXnyBgeTKoXF0K1UXU.png` | ✓ |
| Advocacy aside | `pQCJtSqu7qKYWmvnmEruNd1GkI.png` | ✓ |
| Mgmt Christine | `Kc4g3gqcDM59xyogzsi9CH62xbo.jpeg` | ✓ |
| Mgmt Shah | `4Ef2YIpYt3NnB45ttxaPrldXQg.jpg` | ✓ |
| Mgmt Audrey | `w35xKyRe5sLU0f3k3a7zPVD7w.jpeg` | ✓ |
| Mgmt Vincent | `4QRsPlTR6NqbnGUgLe8aJ9XOK0M.jpg` | ✓ |
| Mgmt Chang | `eJi2gxT39VUQXoqBU9zkL38ZHM.jpg` | ✓ |
| Mgmt Julie | `jyPhDb3hmo4PPzz1fTXNgrcX3fQ.jpg` | ✓ |
| Partner AAS | `c9nSNg8vzoJJHIWBfKiFkk4cIXE.jpg` | ✓ |
| Partner AWA | `rLS9eBazhnxSlFrZAWKWsQRapzc.png` | ✓ |
| Partner ACoC | `VwJAdprWeM5ZjEdN2h5pE3GTTXE.jpg` | ✓ |
| Partner CAS | `M8rcJzc7UqkbTP4oyYARg5PHA.png` | ✓ |
| Partner 5 | `lmRS69FfwkUd6i2HlH6joR77k.jpg` | ✓ |
| Partner 6 | `Hub3OXj3qHL5sK9ztNlbmZKXkXg.jpg` | ✓ |
| Partner 7 | `lEDAQcu7uHeWdNSRl5WoHacAk.png` | ✓ |
| Strategic 1 | `QP5J74CtuaE6APcl4T8BrxjsA.png` | ✓ |
| Strategic 2 | `g4s9KjETINwf0lO3CxJasNdquYA.png` | ✓ |
| Award 1 ISOCert | `h7Gh3reWTA8slWV2Hq7IZ8kbTbg.png` | ✓ |
| Award 2 PlatinumClub | `fKdhSQyCEYKHn7CTGSTwy5LVw.png` | ✓ |
| Award 3 Tripartite 2018 | `wsCJo3GHKlnDKttHSA0J3niW8jo.jpg` | ✓ |
| Award 4 TAFEP 2016 | `9aYuE7cHSsUVCvYzuB6AT2jl0.png` | ✓ |
| Award 5 SG Clean | `eMWqj52OM5dzojVwSahw3CYu1k.png` | ✓ |
| Award 6 Green Mark | `WEmHXC6rfdGCEb043B1OdLgpDWc.jpg` | ✓ |
| Award 7 Water | `vEt0cbGAip2wDbkj41Elj9MUJw.jpg` | ✓ |
| Award 8 BizSafe | `z0JgtmwsuQK4dqSSUyTXPeE8.jpg` | ✓ |
| Award 9 Expat Living | `Aj2u7VMzwgal5ieXNQoWarOeZs.jpg` | ✓ |

≈ 44 unique images. 1 reuse from HomePage (`ALiDWPH3U3VnmiEzcoEet6lPIk.jpeg`).
