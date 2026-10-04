import 'server-only';

/** Local Next preview uses the same CMS generator as deployed nginx. */
export async function discoveryResponse(file: 'robots.txt' | 'sitemap.xml' | 'llms.txt'): Promise<Response> {
  try {
    const origin = process.env.STRAPI_INTERNAL_URL;
    if (!origin) throw new Error('STRAPI_INTERNAL_URL must be configured');
    const response = await fetch(new URL(`/api/site-discovery/${file}`, origin), { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex',
        ...(response.status === 503 ? { 'Retry-After': '60' } : {}),
      },
    });
  } catch {
    return new Response('Discovery temporarily unavailable\n', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '60', 'X-Robots-Tag': 'noindex' } });
  }
}
