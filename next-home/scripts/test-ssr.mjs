import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

let revision = 'Published revision one';
let reads = 0;
const cms = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const draft = req.headers.authorization === 'Bearer test-preview-token' && url.searchParams.get('status') === 'draft';
  const data = {
    '/api/home-page': { title: 'Home', hero: { heading: 'A Home Away From Home' }, aboutSection: { heading: draft ? 'Private draft heading' : revision } },
    '/api/events': [],
    '/api/header': { logo: { url: '/branding/logo.webp' }, navItems: [{ label: 'Home', href: '/home' }] },
    '/api/footer': { address: 'Test address', phone: '+65 1234 5678', email: 'test@example.com' },
    '/api/site-config': { siteName: 'Test Club', defaultSeo: { metaDescription: 'CMS test description' } },
  }[url.pathname];
  if (url.pathname === '/api/home-page') reads++;
  res.writeHead(data ? 200 : 404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ data: data ?? null }));
});
await new Promise((resolve) => cms.listen(0, '127.0.0.1', resolve));
const cmsPort = cms.address().port;
const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const origin = `http://127.0.0.1:${port}`;
let logs = '';
const next = spawn(process.execPath, ['.next/standalone/next-home/server.js'], {
  env: { ...process.env, PORT: String(port), HOSTNAME: '127.0.0.1', STRAPI_INTERNAL_URL: `http://127.0.0.1:${cmsPort}`, PUBLIC_SITE_URL: origin, PREVIEW_TOKEN: 'test-preview-token' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
next.stdout.on('data', (chunk) => { logs += chunk; });
next.stderr.on('data', (chunk) => { logs += chunk; });
const read = async (path) => {
  const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(15000) });
  const html = (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  return { response, html };
};
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { ready = (await fetch(`${origin}/health`)).ok; } catch { /* server starting */ }
    if (ready) break;
    if (next.exitCode !== null) throw new Error(logs);
    await delay(100);
  }
  assert.ok(ready, 'SSR server ready');
  const first = await read('/home');
  assert.equal(first.response.status, 200);
  assert.ok(first.html.includes(revision), 'CMS facts appear in HTML without JavaScript');
  assert.ok(!first.html.includes('Private draft heading'), 'public HTML excludes draft');
  assert.match(first.html, /<meta name="description" content="CMS test description"/);
  assert.match(first.response.headers.get('cache-control'), /no-store/);
  revision = 'Published revision two';
  const second = await read('/home');
  assert.ok(second.html.includes(revision), 'next request sees changed published content without rebuild');
  assert.ok(!second.html.includes('Published revision one'), 'no stale homepage snapshot');
  assert.equal(reads, 2, 'metadata and page share one CMS homepage read per request');
  const draft = await read('/home?preview=test-preview-token&status=draft');
  assert.equal(draft.response.status, 200);
  assert.ok(draft.html.includes('Private draft heading'), 'authenticated preview renders draft');
  assert.match(draft.html, /<meta name="robots" content="noindex, nofollow"/);
  const publicAgain = await read('/home?status=draft');
  assert.ok(publicAgain.html.includes(revision), 'draft status alone does not grant draft access');
  assert.ok(!publicAgain.html.includes('Private draft heading'), 'preview does not leak into following public request');
  const invalid = await read('/home?preview=invalid-token&status=draft');
  assert.equal(invalid.response.status, 500, 'invalid preview is rejected');
  assert.ok(!invalid.html.includes('Private draft heading'));
  assert.ok((await read('/')).html.includes(revision), 'root serves SSR homepage');
  assert.equal((await read('/missing-page')).response.status, 404, 'Next returns a real missing-route status');
  console.log('PASS SSR body, metadata, freshness, request deduplication, preview isolation, root and errors');
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  next.kill('SIGTERM');
  await new Promise((resolve) => cms.close(resolve));
}
