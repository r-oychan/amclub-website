# UAT Sign-off

`UAT-Signoff.xlsx` is the User Acceptance Test checklist for the American Club
website, to be completed against **UAT** (`https://uat.amclub.org.sg`) before any
promotion to production.

## Sheets

| Tab | Covers |
|---|---|
| **Sign-off** | Cover: environment, tester, overall result, status legend |
| **1. Content Editability** | One row per content type (17 collections + 22 single types) — every field editable, Save/Publish, reflects on the public page |
| **2. Responsive** | 20 key pages × 4 breakpoints (Desktop XL ≥1440, Desktop 1200–1439, Tablet 768–1199, Mobile <768) |
| **3. Google Analytics** | Google Tag ID (gtag G-/GT-/AW- or GTM-), tag load, realtime, SPA page_view |
| **4. SSO & User Mgmt** | Microsoft Entra SSO, password login, invites, Editor vs Super Admin roles |
| **5. Media Upload** | Image/PDF upload, assignment, serving, thumbnails (CORS), folders |
| **6. Chatbot (ElevenLabs)** | Publish→KB sync, answer accuracy, expiry removal; tone optional |
| **7. Workflow & Rendering** | Draft/Publish/Unpublish, Clone, expiry filter, markdown links/PDFs, CTA variants |
| **8. Navigation & SEO** | Header/footer/breadcrumbs, page titles, meta/OG, favicon, 404 |
| **9. Cross-browser & Perf** | Chrome/Safari/Edge + mobile, Lighthouse, console errors |
| **10. Infra & Security** | Custom domain + HTTPS, access control, env correctness, backups, deploy |

> Forms and accessibility were intentionally left out of this round per the UAT scope agreed 2026-06-16.

## Regenerating

The content-type list is read live from `cms/src/api/**/schema.json`, so re-run after schema changes:

```bash
python3 docs/uat/generate_uat_signoff.py   # needs: pip install openpyxl
```

Test cases are maintained inline in that script.
