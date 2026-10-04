import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

let revision = 'Published revision one';
let reads = 0;
let fitnessReads = 0;
let fitnessUnavailable = false;
const cms = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const draft = req.headers.authorization === 'Bearer test-preview-token' && url.searchParams.get('status') === 'draft';
  if (url.pathname === '/api/fitness-page') {
    fitnessReads++;
    if (fitnessUnavailable) { res.writeHead(503); res.end('CMS unavailable'); return; }
  }
  const data = {
    '/api/home-page': { title: 'Home', hero: { heading: 'A Home Away From Home' }, aboutSection: { heading: draft ? 'Private draft heading' : revision } },
    '/api/events': url.searchParams.has('filters[slug][$eq]') ? (url.searchParams.get('filters[slug][$eq]') === 'fixture-event' ? [{ documentId: 'event-1', title: 'Fixture event title', slug: 'fixture-event', date: '2026-10-03', description: 'Fixture event description' }] : []) : [],
    '/api/about-page': { title: 'About fixture', hero: { heading: draft ? 'Draft about fixture' : 'Published about fixture' }, generalCommittee: { heading: 'Fixture committee' } },
    '/api/committee-members': [{ documentId: 'member-1', name: 'Fixture member', role: 'Chair', memberType: 'general-committee' }],
    '/api/restaurants': url.searchParams.get('filters[slug][$eq]') === 'fixture-venue' ? [{ name: 'Fixture restaurant', slug: 'fixture-venue', description: 'Fixture restaurant description', operatingHoursSections: [{ title: 'Opening Hours', rows: [{ dayRange: 'Monday', time: '12pm to 9pm' }] }] }] : [],
    '/api/dining-page': { title: 'Fixture dining', hero: { heading: 'Fixture dining heading' } },
    '/api/dining-promotions-page': { title: 'Fixture promotions', hero: { heading: 'Fixture promotions heading' } },
    '/api/dining-promotions': [],
    '/api/fitness-page': { title: 'Fixture fitness', hero: { heading: draft ? 'Fixture draft fitness' : `Fixture fitness ${revision}` } },
    '/api/kids-page': { title: 'Fixture kids', hero: { heading: 'Fixture kids heading' } },
    '/api/event-spaces-page': { title: 'Fixture spaces', hero: { heading: 'Fixture event spaces heading' } },
    '/api/membership-page': { title: 'Fixture membership', hero: { heading: 'Fixture membership heading' } },
    '/api/whats-on-page': { title: 'Fixture whats on', hero: { heading: 'Fixture events heading' } },
    '/api/event-categories': [],
    '/api/news-page': { title: 'Fixture news', introHeading: 'Fixture news heading' },
    '/api/news-articles': url.searchParams.get('filters[slug][$eq]') === 'missing' ? [] : [{ documentId: 'article-1', title: 'Fixture article title', slug: 'fixture-article', htmlBody: { html: '<p>Fixture article body</p>' } }],
    '/api/gallery-page': { title: 'Fixture gallery', introHeading: 'Fixture gallery heading' },
    '/api/gallery-albums': [],
    '/api/contact-us-page': { title: 'Fixture contact', address: ['Fixture address'], phone: '+65 1111 2222', email: 'fixture@example.com' },
    '/api/faq-page': { title: 'Fixture FAQ', introHeading: 'Fixture FAQ heading' },
    '/api/faq-categories': [],
    '/api/faq-items': [{ documentId: 'faq-1', question: 'Fixture FAQ question', slug: 'fixture-question', category: 'general' }],
    '/api/privacy-statement-page': { title: 'Fixture privacy', body: 'Fixture privacy body' },
    '/api/advertise-with-us-page': { heading: 'Fixture advertising heading', description: 'Fixture advertising body' },
    '/api/reciprocal-clubs-page': { heading: 'Fixture reciprocity heading', description: 'Fixture reciprocity body' },
    '/api/joining-fees-page': { individualHeading: 'Fixture fee heading' },
    '/api/referral-page': { heading: 'Fixture referral heading' },
    '/api/start-application-page': { heading: 'Fixture application heading', description: 'Fixture application description', downloads: { items: [{ label: 'Fixture application PDF', href: '/uploads/application.pdf' }] } },
    '/api/niche-group-membership-page': { heading: 'Fixture niche heading', description: 'Fixture niche description' },
    '/api/fitness-facilities': url.searchParams.get('filters[slug][$eq]') === 'aquatics-fixture' ? [{ name: 'Fixture nested fitness', slug: 'aquatics-fixture', description: 'Fixture nested fitness description' }] : [],
    '/api/kids-experiences': url.searchParams.get('filters[slug][$eq]') === 'fixture' ? [{ name: 'Fixture kids venue', slug: 'fixture', description: 'Fixture kids venue description' }] : [],
    '/api/event-spaces': url.searchParams.get('filters[slug][$eq]') === 'fixture' ? [{ name: 'Fixture event venue', slug: 'fixture', description: 'Fixture event venue description' }] : [],
    '/api/aquatics-coaches': url.searchParams.get('filters[slug][$eq]') === 'fixture-coach' ? [{ name: 'Fixture coach', slug: 'fixture-coach', role: 'Coach', section: 'aquatics', bio: 'Fixture coach biography' }] : [],
    '/api/header': { logo: { url: '/branding/logo.webp' }, navItems: [{ label: 'Home', href: '/home' }] },
    '/api/footer': { address: 'Test address', phone: '+65 1234 5678', email: 'test@example.com' },
    '/api/site-config': { siteName: 'Test Club', loadMoreLabel: 'Show more fixture entries', defaultSeo: { metaDescription: 'CMS test description' } },
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
  const about = await read('/about');
  assert.equal(about.response.status, 200);
  assert.ok(about.html.includes('Published about fixture'));
  assert.ok(about.html.includes('Fixture member'));
  assert.ok((await read('/about?preview=test-preview-token')).html.includes('Draft about fixture'));
  const dining = await read('/dining/fixture-venue');
  assert.equal(dining.response.status, 200);
  assert.ok(dining.html.includes('Fixture restaurant description'));
  assert.ok(dining.html.includes('12pm to 9pm'));
  assert.ok(dining.html.includes('/dining/fixture-venue'));
  assert.equal((await read('/dining/missing-venue')).response.status, 404);
  const cases = [
    ['/dining', 'Fixture dining heading'], ['/dining/dining-promotion', 'Fixture promotions heading'],
    ['/fitness', `Fixture fitness ${revision}`], ['/kids', 'Fixture kids heading'],
    ['/event-spaces', 'Fixture event spaces heading'], ['/membership', 'Fixture membership heading'],
    ['/whats-on', 'Fixture events heading'], ['/whats-on/fixture-event', 'Fixture event description'],
    ['/home-sub/news', 'Fixture news heading'], ['/home-sub/club-news/fixture-article', 'Fixture article body'],
    ['/home-sub/gallery', 'Fixture gallery heading'], ['/home-sub/contact-us', 'Fixture address'],
    ['/faq', 'Fixture FAQ question'], ['/privacy-statement', 'Fixture privacy body'],
    ['/home-sub/advertise-with-us', 'Fixture advertising heading'], ['/membership/reciprocal-clubs', 'Fixture reciprocity heading'],
    ['/membership/joining-fees', 'Fixture fee heading'], ['/membership/referal', 'Fixture referral heading'],
    ['/membership/start-application', 'Fixture application PDF'], ['/membership/niche-group-membership', 'Fixture niche heading'],
    ['/fitness/aquatics/fixture', 'Fixture nested fitness description'], ['/kids/fixture', 'Fixture kids venue description'],
    ['/event-spaces/fixture', 'Fixture event venue description'], ['/coaches/aquatics/fixture-coach', 'Fixture coach biography'],
  ];
  for (const [path, content] of cases) {
    const result = await read(path);
    assert.equal(result.response.status, 200, `${path} returns 200`);
    assert.ok(result.html.includes(content), `${path} contains CMS content without JavaScript`);
    assert.match(result.response.headers.get('cache-control'), /no-store/, `${path} stays fresh`);
    assert.ok(result.html.includes('<title>'), `${path} renders metadata`);
  }
  assert.equal(fitnessReads, 1, 'catch-all metadata and body share one CMS read');
  revision = 'Updated content after migration';
  assert.ok((await read('/fitness')).html.includes(revision), 'section content updates without rebuilding');
  const sectionDraft = await read('/fitness?preview=test-preview-token&status=draft');
  assert.ok(sectionDraft.html.includes('Fixture draft fitness'));
  assert.ok(sectionDraft.html.includes('/home?preview=test-preview-token&amp;status=draft'), 'internal navigation preserves preview authentication');
  assert.match(sectionDraft.html, /<meta name="robots" content="noindex, nofollow"/);
  assert.ok(!(await read('/fitness')).html.includes('Fixture draft fitness'), 'section preview is isolated');
  for (const path of ['/fitness/missing', '/membership/missing', '/coaches/other/missing', '/whats-on/missing', '/home-sub/club-news/missing']) {
    assert.equal((await read(path)).response.status, 404, `${path} returns a real 404`);
  }
  const legacy = await fetch(`${origin}/membership/the-eagles-rewards-program`, { redirect: 'manual' });
  assert.equal(legacy.status, 307);
  assert.equal(legacy.headers.get('location'), '/membership/niche-group-membership');
  fitnessUnavailable = true;
  assert.equal((await read('/fitness')).response.status, 500, 'CMS outage is a server error, not a false 404 or stale fallback');
  console.log('PASS all page families, nested details, CMS freshness, request deduplication, preview isolation, redirects, 404s and CMS outage');
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  next.kill('SIGTERM');
  await new Promise((resolve) => cms.close(resolve));
}
