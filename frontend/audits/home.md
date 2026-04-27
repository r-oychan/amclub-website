# HomePage Audit — Framer ↔ Local

Captured 2026-04-28 at 1440×900 from `https://tactesting.framer.website/home`.
Reference screenshot: `framer-home-1440.jpeg` (this folder).

Goal: enumerate every section on the Framer home with canonical text and image
URLs, then mark where the local hardcoded version drifts. Drift may be
intentional (HomePage has been "enhanced" per project decision D2) — flagged
items go to the user for keep/revert decisions.

Legend:
- ✅ matches Framer exactly
- 🔁 local enhancement (kept on purpose, but confirm)
- ❌ drift / likely error

---

## Section order

1. Hero (1 slide / carousel?)
2. About Us (label + heading + 3 stats + funFact + CTA + 4 image collage)
3. Events (9 cards, link to event collection)
4. Services (3 feature cards with image)
5. Experience (3 tabs)
6. Moments (5 testimonials with video CTA)
7. FAQ (4 questions, placeholder answers)

---

## 1. Hero

| Field | Framer | Local | Diff |
|---|---|---|---|
| variant | single static hero | `variant="full"`, 3-slide carousel | 🔁 **enhancement** |
| heading | A Home Away From Home | A Home Away From Home | ✅ |
| subheading | Thrive in a vibrant community with a unique American and Canadian culture. | (same) | ✅ |
| CTA | REQUEST FOR A CLUB TOUR | Request for a Club Tour, href=`#` | ✅ |
| backgroundImage | `cEQ0tbJZ9iABZ7aowxb1DaK4U.jpg` | (same on slide 1) | ✅ |
| **slide 2** (local only) | — | "Dine. Drink. Unwind.", img=`ALiDWPH3U3VnmiEzcoEet6lPIk.jpeg`, CTA→/dining | 🔁 |
| **slide 3** (local only) | — | "Stay Active, Stay Healthy", img=`FfQ1mhhWwbjsMQKiahq8SzaqLs.jpeg`, CTA→/fitness | 🔁 |

**Decision needed (Q1):** Keep the 3-slide carousel as a deliberate
enhancement, or revert to Framer's single static hero? The schema and
seed change accordingly.

## 2. About Us

| Field | Framer | Local | Diff |
|---|---|---|---|
| label | ABOUT US | "About Us" | ✅ |
| heading | Blending American Traditions with Singaporean Charm | (same) | ✅ |
| stat 1 | 11,000+ MEMBERS | 11,000+ Members | ✅ |
| stat 2 | 90+ NATIONALITIES | 90+ Nationalities | ✅ |
| stat 3 | 77+ YEARS OF HERITAGE | 77+ Years of Heritage | ✅ |
| funFact intro | **Did Your Know?** *(typo in Framer)* | Did You Know? | 🔁 (local fix) |
| funFact body | The idea of forming a social club for Americans was first mooted in 1932? | (same) | ✅ |
| CTA | DISCOVER OUR STORY | Discover Our Story → /about | ✅ |
| image 1 | `PlDsZH1QChc2aIXh0p9duml4TC0.jpeg` | (same) | ✅ |
| image 2 | `JkrDtEpbLxJMTiPrF9mJYWb3YQ.jpeg` | (same) | ✅ |
| image 3 | `ToMfql1ukRrZhj1CjpLEOHmCb4.jpeg` | (same) | ✅ |
| image 4 | `RjIIikrBuOoQmOLuWXcoR6GFkOE.jpeg` | (same) | ✅ |

Local already corrected the "Did Your Know" typo to "Did You Know" — keep
the local copy.

## 3. Events (9 cards)

Framer renders these as link-to-event-detail cards. Each maps to one
`event` collection entry.

| # | Category (Framer) | Title | Date | Framer image | Local image (current) | Diff |
|---|---|---|---|---|---|---|
| 1 | DINING | Nostalgic Flavors of Singapore | DEC 4 | `0YNsQiaf0KR8LDUah35vR09jfwc.jpg` | `RjIIikrBuOoQmOLuWXcoR6GFkOE.jpeg` (about photo) | ❌ wrong image |
| 2 | FITNESS & WELLNESS | Pedal to Victory! A Spin Bike Time Challenge | NOV 5 | `rNT1Hh6hiX6cJHoJGmlFogBGWmU.jpg` | `ToMfql1ukRrZhj1CjpLEOHmCb4.jpeg` (about photo) | ❌ wrong image |
| 3 | KIDS | Scarily Fun Friday Nights for the Kids! | OCT 19 | `MlqKdegxMYfk5tpETtAaDIaV2w.jpg` | `JkrDtEpbLxJMTiPrF9mJYWb3YQ.jpeg` (about photo) | ❌ wrong image |
| 4 | DINING | Smokin' Sundays at Grillhouse | OCT 11 | `A9M0VHDW2FE6UoaFatzINqucGp0.jpg` | `PlDsZH1QChc2aIXh0p9duml4TC0.jpeg` (about photo) | ❌ wrong image |
| 5 | DINING | Kanonkop Wine Dinner | OCT 22 | `FZCLsivFTgvRBOrZD71tlU6pVRc.jpg` | `0YNsQiaf0KR8LDUah35vR09jfwc.jpg` | ❌ wrong image |
| 6 | DINING | Get Your Green Fix Salad Bar Buffet | OCT 30 | `LMpJMMP2p2pn1AbLP2PMbovXUI.jpg` | `rNT1Hh6hiX6cJHoJGmlFogBGWmU.jpg` | ❌ wrong image |
| 7 | KIDS | National Football League 2025 Live Screening | DEC 20 | `dNdck5caikZnWpKFnagBbiEY.jpg` | `MlqKdegxMYfk5tpETtAaDIaV2w.jpg` | ❌ wrong image |
| 8 | MEMBER ENGAGEMENT | Classic & Contemporary: A Cocktail Masterclass Series | NOV 7 | `wMDwgAVSxK8uEO7JWLcelps3tHM.jpg` | `A9M0VHDW2FE6UoaFatzINqucGp0.jpg` | ❌ wrong image |
| 9 | FITNESS & WELLNESS | Adult Team Tennis Challenge 2025 | DEC 30 | `e0HtVwuzybsmAnbsKzfzClaU.jpg` | `FZCLsivFTgvRBOrZD71tlU6pVRc.jpg` | ❌ wrong image |

**Finding:** local images are shifted/swapped. Each event has the wrong
photo. Framer is the canonical mapping. When seeding, use Framer's
mapping above.

## 4. Services (3 feature cards)

| # | Heading | Description | Framer image | Local image | Diff |
|---|---|---|---|---|---|
| 1 | The Perfect Club Experience for the Whole Family | From pool time to playtime, dining to downtime — there's something for everyone in the family to enjoy. | `ALiDWPH3U3VnmiEzcoEet6lPIk.jpeg` | (same) | ✅ |
| 2 | Business Done Right. Leisure Done Better. | Connect, meet, or recharge — the Club makes balancing work and leisure effortless. | `FfQ1mhhWwbjsMQKiahq8SzaqLs.jpeg` | (same) | ✅ |
| 3 | Everyday Concierge, the Club Way | A welcoming smile, a helping hand. Enjoy seamless support with a personal touch. | `DytJIjZnqDf7hE6r7WyfxUrNjU.jpeg` | (same) | ✅ |

Section label: SERVICES. Heading: "From shared experiences to lasting bonds — it all starts here". CTA: "EXPLORE MEMBERSHIP" → /membership. ✅ all match.

## 5. Experience (3 tabs)

| # | Label (Framer) | Local label | Local href | Diff |
|---|---|---|---|---|
| 1 | DINING & RETAIL | Dining & Retail | /dining | ✅ |
| 2 | FITNESS & WELLNESS | Fitness & Wellness | /fitness | ✅ |
| 3 | KIDS | Kids | /kids | ✅ |

Tab images on Framer are larger lifestyle shots that change as you switch
tabs. The local code uses these images:
- Tab 1: `ALiDWPH3U3VnmiEzcoEet6lPIk.jpeg`
- Tab 2: `FfQ1mhhWwbjsMQKiahq8SzaqLs.jpeg`
- Tab 3: `DytJIjZnqDf7hE6r7WyfxUrNjU.jpeg`

These are reused from Services. Framer's experience images appear to be
distinct: `1PjikpjyQQKqhiR3r8F2UtyRTI.jpeg`, `67l0mNcpyr612koYZMjpg2bmLY.jpeg`,
`glifXVW1Fpm8FU4aR3Bg9B6pMo.jpeg`, `K6DoyAS2cr4sNav3IA32UZgU.jpeg`,
`Er6mlC0xHU5nNPKnOyddqkHFFc.jpeg` (5 images for 3 tabs — might be slider per tab).

🔁 / ❌ drift — local re-uses service images for tabs. Need user decision
(see Q4 below).

## 6. Moments (5 testimonials)

Framer cards have a video-play overlay; "WATCH MORE" links to (presumably)
Instagram or a video. Static thumbnails are not directly extractable from
the DOM (likely lazy-loaded videos).

| # | Name | Quote | Framer | Local |
|---|---|---|---|---|
| 1 | Ronald Williams | "Abuzz with Independence Day cheer on July 1" | ✅ | ✅ |
| 2 | Sarah Grey | "A multitude of culinary experience for your tastebuds" | ✅ | ✅ |
| 3 | Matthew Hallen | "Fantastic evening of glitz, glamor and giving" | ✅ | ✅ |
| 4 | Joseph Gunner | "Abuzz with Independence Day cheer on July 1" *(duplicate of #1)* | ✅ | ✅ |
| 5 | **Sarah Grey** | "A multitude of culinary experience..." *(duplicate of #2)* | (Framer) | **Emma Chen** — "Sunday brunch with the family at the Grillhouse" 🔁 |

Local replaced #5 with a unique name + quote. Either:
- Keep local (Emma Chen) — cleaner, no duplicate name + quote.
- Match Framer (Sarah Grey duplicate) — but the prototype almost certainly
  has placeholder duplicates that should be replaced before launch.

**Recommendation:** keep local (Emma Chen), document as intentional fix. (Q3)

Image mapping (local — these are reused from other sections; Framer videos
not extractable):
- Ronald Williams: `MlqKdegxMYfk5tpETtAaDIaV2w.jpg` (also used by Framer event 3)
- Sarah Grey: `rNT1Hh6hiX6cJHoJGmlFogBGWmU.jpg` (Framer event 2)
- Matthew Hallen: `A9M0VHDW2FE6UoaFatzINqucGp0.jpg` (Framer event 4)
- Joseph Gunner: `JkrDtEpbLxJMTiPrF9mJYWb3YQ.jpeg` (about photo)
- Emma Chen: `PlDsZH1QChc2aIXh0p9duml4TC0.jpeg` (about photo)

🔁 entire Moments section uses placeholder imagery. We can keep these as
seed values; client can swap to real video posters later via /admin.

CTA: "FOLLOW OUR SOCIALS" → instagram.com/americanclubsingapore/. ✅ matches.

## 7. FAQ

| # | Question | Framer answer | Local answer |
|---|---|---|---|
| 1 | What types of membership do you offer? | `<Placeholder>` | `''` (empty) |
| 2 | What facilities and services are included? | `<Placeholder>` | `''` (empty) |
| 3 | Is membership transferable? | `<Placeholder>` | `''` (empty) |
| 4 | Can I upgrade or change my membership type? | `<Placeholder>` | `''` (empty) |

Framer literally renders `<Placeholder>` text in the accordions — meaning
the prototype never wrote real answers. Local follows suit with empty
strings. We need real copy from the client.

CTAs: "VIEW ALL FAQ" + "ENQUIRIES → /home-sub/contact-us". ✅ match.

**Q2 below.**

---

## Open questions for user

| # | Question | Default if user skips |
|---|---|---|
| Q1 | Keep the 3-slide hero carousel (slides 2 & 3 added locally), or revert to Framer's single static hero? | Keep carousel (per D2: HomePage is enhanced) |
| Q2 | FAQ answers are placeholder in Framer and empty in local. Provide real copy now, or ship empty and have the client fill in via /admin later? | Ship empty; placeholder text "Coming soon — please contact us." |
| Q3 | Moments testimonial #5: keep local (Emma Chen unique) or match Framer (Sarah Grey duplicate)? | Keep local (Emma Chen) |
| Q4 | Experience tabs: should we adopt Framer's distinct lifestyle images (`1Pjikpjy...`, `67l0mN...`, `glifXVW1...`) instead of reusing the Services images locally? | Adopt Framer images (canonical) |
| Q5 | Strapi admin **API token** for the seed script — can you generate one in `/admin → Settings → API Tokens` (Full access, unlimited duration) and share securely? | Blocks task #10/#12. |

## Local enhancements to lock in (D2)

These are local-wins decisions to record in `CMS-MIGRATION.md`:
- Hero: 3-slide carousel (Q1 pending confirmation).
- About fun fact: "Did You Know?" (typo fix).
- Moments #5: Emma Chen (Q3 pending confirmation).
- Page widths: standardized (per CLAUDE.md memory).
