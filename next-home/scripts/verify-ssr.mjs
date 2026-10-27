import assert from 'node:assert/strict';

const origin = process.argv[2];
if (!origin) throw new Error('Usage: node scripts/verify-ssr.mjs https://dev.amclub.org.sg');
const get = async (path) => {
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, `${path} status`);
  return { response, body: await response.text() };
};
const cms = JSON.parse((await get('/api/home-page')).body).data;
assert.ok(cms?.aboutSection?.heading, 'CMS homepage heading is available');
const escapeHtml = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
for (const path of ['/', '/home']) {
  const { response, body } = await get(path);
  // Strip React's serialized data: facts must be in actual HTML, not just JS.
  const html = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  assert.ok(html.includes(escapeHtml(cms.aboutSection.heading)), `${path} CMS heading in HTML`);
  assert.match(html, /<main\b[^>]*>[\s\S]*<h2\b/, `${path} populated main content`);
  assert.match(html, /<title>[^<]+<\/title>/, `${path} title`);
  assert.match(html, /<meta name="description" content="[^"]+"/, `${path} description`);
  assert.ok(html.includes(`href="${new URL('/home', origin).href}"`), `${path} canonical`);
  assert.match(response.headers.get('cache-control') ?? '', /no-store/, `${path} uncached SSR`);
  const css = html.match(/href="([^\"]+\.css[^\"]*)"/);
  assert.ok(css, `${path} stylesheet`);
  const asset = await get(css[1]);
  assert.match(asset.response.headers.get('content-type') ?? '', /text\/css/, 'Next stylesheet served');
  console.log(`PASS ${path}: CMS body, metadata, no-store and CSS`);
}
for (const path of ['/about', '/dining', '/dining/dining-promotion', '/fitness', '/kids', '/event-spaces', '/membership', '/membership/joining-fees', '/whats-on', '/home-sub/news', '/home-sub/gallery', '/home-sub/contact-us', '/faq', '/privacy-statement']) {
  const { response, body } = await get(path);
  const html = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  assert.match(html, /<main\b[^>]*>[\s\S]*<h[12]\b/, `${path} populated main content`);
  assert.match(html, /<title>[^<]+<\/title>/, `${path} title`);
  assert.ok(html.includes(`href="${new URL(path, origin).href}"`), `${path} canonical`);
  assert.match(html, /\/_next\//, `${path} Next assets`);
  assert.match(response.headers.get('cache-control') ?? '', /no-store/, `${path} uncached SSR`);
  assert.doesNotMatch(html, /<div id="root"><\/div>/, `${path} server-rendered body`);
  console.log(`PASS ${path}: populated SSR body, title, canonical and no-store`);
}
const missing = await fetch(new URL('/fitness/unknown-ssr-verification-route', origin));
assert.equal(missing.status, 404, 'Missing detail returns 404');
console.log('PASS missing detail: HTTP 404');
