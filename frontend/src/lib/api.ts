const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || '';

// ── Preview mode ────────────────────────────────────────────────────────────
// When Strapi's admin opens a page in its Preview panel, the URL carries
// `?preview=<read-only-token>&status=draft`. We capture those once and persist
// them in sessionStorage so client-side navigation inside the preview iframe
// stays in preview. With a token present, every fetch sends it as a Bearer auth
// and requests draft content — so editors see unpublished changes. The token is
// NEVER baked into the public build; it only exists when Strapi hands it over,
// and sessionStorage is scoped to that iframe tab, so the live site is unaffected.
function readPreviewState(): { token: string | null; status: string } {
  if (typeof window === 'undefined') return { token: null, status: 'published' };
  try {
    const sp = new URLSearchParams(window.location.search);
    const urlToken = sp.get('preview');
    if (urlToken) {
      sessionStorage.setItem('amclub:previewToken', urlToken);
      sessionStorage.setItem('amclub:previewStatus', sp.get('status') || 'draft');
    }
    return {
      token: sessionStorage.getItem('amclub:previewToken'),
      status: sessionStorage.getItem('amclub:previewStatus') || 'draft',
    };
  } catch {
    return { token: null, status: 'published' };
  }
}

const preview = readPreviewState();
export const isPreview = Boolean(preview.token);

interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

function buildApiUrl(endpoint: string, params?: Record<string, string>): string {
  const path = `/api${endpoint}`;
  const searchParams = new URLSearchParams(params);
  const qs = searchParams.toString();

  if (STRAPI_URL) {
    return `${STRAPI_URL}${path}${qs ? `?${qs}` : ''}`;
  }
  return `${path}${qs ? `?${qs}` : ''}`;
}

export async function fetchAPI<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T | null> {
  // In preview, request drafts and authenticate with the read-only token so
  // Strapi returns unpublished content (the preview document-middleware honours
  // status=draft only for authenticated requests).
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  let effectiveParams = params;
  if (preview.token) {
    headers.Authorization = `Bearer ${preview.token}`;
    effectiveParams = { ...params, status: preview.status };
  }
  const url = buildApiUrl(endpoint, effectiveParams);

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    const json: StrapiResponse<T> = await response.json();
    return json.data;
  } catch {
    return null;
  }
}

export { STRAPI_URL };
