// Shared link helpers. A "hard link" must be rendered as a real <a> (full
// browser navigation) rather than a React Router <Link>, and opened in a new
// tab. This covers external URLs, mailto/tel, and — importantly — asset links
// like `/uploads/*.pdf` that the SPA must not intercept.

export const FILE_HREF_RE = /\.(pdf|jpe?g|png|gif|webp|svg|docx?|xlsx?|pptx?|csv|txt|zip)$/i;

/**
 * True when `href` should be a hard <a target="_blank"> instead of an in-app link.
 * Markdown links have no `isExternal` flag, so the rule is inferred from the href:
 * external protocols, `/uploads/` asset paths, or a downloadable file extension.
 */
export const isHardLink = (href?: string, isExternal?: boolean): boolean =>
  !!href &&
  (isExternal === true ||
    /^(https?:|mailto:|tel:)/i.test(href) ||
    href.startsWith('/uploads/') ||
    FILE_HREF_RE.test(href));
