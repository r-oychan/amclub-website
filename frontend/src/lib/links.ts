/**
 * Link routing helpers.
 *
 * CTA hrefs come from the CMS and mix two kinds of destinations:
 *   - internal SPA routes (`/about`, `/dining/grillhouse`) → React Router `<Link>`
 *   - real navigations (absolute URLs, `mailto:`/`tel:`, and Strapi media
 *     downloads under `/uploads/`) → a plain `<a>` so the browser actually
 *     leaves the SPA / opens the file.
 *
 * Editors frequently forget to tick the CMS "open in new tab / external"
 * toggle when linking a PDF or an absolute URL, which left React Router
 * intercepting the click and navigating to a dead in-app route (the CTA
 * appeared to do nothing). `isExternalHref` auto-detects those cases so the
 * toggle becomes a manual override rather than a hard requirement.
 */

/** File extensions that represent a direct download/asset, not an SPA route. */
const DOWNLOAD_EXT =
  /\.(pdf|docx?|xlsx?|pptx?|csv|zip|rar|7z|txt|rtf|jpe?g|png|gif|webp|svg|mp4|mov|webm|mp3|wav)(\?|#|$)/i;

/**
 * True when `href` should be rendered as a plain `<a>` (real navigation)
 * rather than a React Router `<Link>` (client-side SPA route).
 *
 * Treated as external:
 *   - absolute or protocol-relative URLs (`https://…`, `//cdn…`)
 *   - `mailto:` / `tel:` schemes
 *   - Strapi media under `/uploads/` (served by the CMS, not the SPA)
 *   - direct file downloads (PDFs, docs, images, video/audio…)
 */
export function isExternalHref(href?: string): boolean {
  if (!href) return false;
  if (/^(https?:)?\/\//i.test(href)) return true;
  if (/^(mailto:|tel:)/i.test(href)) return true;
  if (href.includes('/uploads/')) return true;
  if (DOWNLOAD_EXT.test(href)) return true;
  return false;
}
