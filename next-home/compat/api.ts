export const STRAPI_URL = '';
export const isPreview = false;
export async function fetchAPI<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
  const query = new URLSearchParams(params).toString();
  try {
    const response = await fetch(`/api${endpoint}${query ? `?${query}` : ''}`);
    if (!response.ok) return null;
    const result: { data: T } = await response.json();
    return result.data;
  } catch { return null; }
}
