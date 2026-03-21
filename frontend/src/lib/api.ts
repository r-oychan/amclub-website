const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || '';

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
  const url = buildApiUrl(endpoint, params);

  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) return null;
    const json: StrapiResponse<T> = await response.json();
    return json.data;
  } catch {
    return null;
  }
}

export { STRAPI_URL };
