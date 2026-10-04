import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { test } from 'node:test';
import Koa from 'koa';

const require = createRequire(import.meta.url);
const format = require('../../src/api/crawler-settings/utils/discovery-format.ts');
const createService = require('../../src/api/crawler-settings/services/crawler-settings.ts').default;
const createController = require('../../src/api/crawler-settings/controllers/crawler-settings.ts').default;
const { SOURCES } = require('../../src/api/crawler-settings/services/crawler-settings.ts');
const origin = 'https://club.example';
const settings = { allowIndexing: true, sitemapEnabled: true, llmsEnabled: true };

function fixture() {
  const rows = new Map();
  const reads = [];
  const contentTypes = {};
  for (const source of SOURCES) {
    const uid = `api::${source.type}.${source.type}`;
    const schema = JSON.parse(readFileSync(new URL(`../../src/api/${source.type}/content-types/${source.type}/schema.json`, import.meta.url)));
    contentTypes[uid] = { ...schema, uid };
    rows.set(uid, []);
  }
  const settingsUid = 'api::crawler-settings.crawler-settings';
  contentTypes[settingsUid] = { kind: 'singleType', uid: settingsUid };
  rows.set(settingsUid, [settings]);
  rows.set('api::site-config.site-config', [{ siteName: 'Fixture Club', defaultSeo: { metaDescription: 'A community in Singapore.' } }]);
  const strapi = {
    contentTypes,
    contentType: (uid) => contentTypes[uid],
    documents: (uid) => ({
      async findFirst(params) { reads.push({ uid, ...params }); return rows.get(uid)?.[0] ?? null; },
      async findMany(params) { reads.push({ uid, ...params }); return (rows.get(uid) ?? []).slice(params.start, params.start + params.limit); },
    }),
    log: { error() {} },
  };
  const service = createService({ strapi });
  strapi.service = () => service;
  return { strapi, service, rows, reads };
}

test('robots protects unconfigured/nonproduction sites and supports CMS crawler groups', () => {
  assert.equal(format.robots(settings, origin, false), 'User-agent: *\nDisallow: /\n');
  assert.equal(format.robots({}, origin, true), 'User-agent: *\nDisallow: /\n');
  const body = format.robots({ ...settings, robotsRules: [{ userAgent: 'GPTBot', disallowPaths: '/\nSitemap: https://injected.example' }] }, origin, true);
  assert.match(body, /User-agent: \*/);
  assert.match(body, /User-agent: GPTBot\n/);
  assert.match(body, /Disallow: \/admin/);
  assert.match(body, /Disallow: \/\*\?\*preview=\*/);
  assert.match(body, /Sitemap: https:\/\/club.example\/sitemap.xml/);
  assert.doesNotMatch(body, /injected/);
});

test('sitemap and Markdown escape CMS content; canonicals stay local and query-free', () => {
  const pages = [{ url: `${origin}/example`, title: 'Title [unsafe]', description: '<b>CMS</b> description', modified: '2026-10-04T00:00:00Z', group: 'Club' }];
  const xml = format.sitemap(pages);
  assert.match(xml, /<lastmod>2026-10-04T00:00:00.000Z<\/lastmod>/);
  assert.doesNotMatch(format.sitemap([{ ...pages[0], modified: 'invalid' }]), /lastmod/);
  assert.match(format.sitemap([{ ...pages[0], url: `${origin}/a&b` }]), /a&amp;b/);
  const md = format.llms({ llmsSummary: 'CMS summary' }, pages, 'Fixture Club');
  assert.match(md, /^# Fixture Club\n\n> CMS summary/);
  assert.ok(md.includes('Title \\[unsafe\\]'));
  assert.match(md, /CMS description/);
  assert.equal(format.canonicalUrl('https://other.example/a', '/a', origin), undefined);
  assert.equal(format.canonicalUrl('/a?preview=token', '/a', origin), undefined);
  assert.equal(format.canonicalUrl('/canonical', '/alias', origin), `${origin}/canonical`);
  assert.equal(format.localUrl('//other.example/a', origin), undefined);
  assert.throws(() => format.siteOrigin('https://user:password@club.example'));
});

test('all published page families, pagination, nested routes, exclusions, canonical dedup and freshness', async () => {
  const { service, rows, reads } = fixture();
  for (const source of SOURCES.filter((source) => !source.collection)) rows.set(`api::${source.type}.${source.type}`, [{ title: source.type, updatedAt: '2026-10-01T00:00:00Z' }]);
  rows.set('api::event.event', Array.from({ length: 205 }, (_, i) => ({ title: `Event ${i}`, slug: `event-${i}` })));
  rows.set('api::fitness-facility.fitness-facility', [{ name: 'Swim School', slug: 'aquatics-swimamerica' }]);
  rows.set('api::restaurant.restaurant', [
    { name: 'Hidden', slug: 'hidden' },
    { name: 'Alias', slug: 'alias', seo: { canonicalURL: '/home' } },
    { name: 'External', slug: 'external', seo: { canonicalURL: 'https://other.example/external' } },
    { name: 'Malformed slug', slug: '../admin' },
  ]);
  const first = await service.pages({ ...settings, excludedPaths: '/dining/hidden' }, origin);
  assert.equal(first.filter((page) => page.url.includes('/whats-on/event-')).length, 205);
  assert.ok(first.some((page) => page.url.endsWith('/fitness/aquatics/swimamerica')));
  assert.equal(first.filter((page) => page.url.endsWith('/home')).length, 1);
  assert.ok(first.every((page) => !/hidden|external|alias|admin/.test(page.url)));
  assert.ok(reads.every((read) => read.status === 'published'));
  assert.deepEqual(reads.filter((read) => read.uid === 'api::event.event').map((read) => read.start), [0, 100, 200]);
  rows.set('api::event.event', [{ title: 'Changed event', slug: 'changed' }]);
  const second = await service.pages(settings, origin);
  assert.equal(second.filter((page) => page.url.includes('/whats-on/event-')).length, 0);
  assert.ok(second.some((page) => page.title === 'Changed event'));
  assert.equal(typeof service.createOrUpdate, 'function', 'CMS editor retains core singleton writes');
});

test('public HTTP controllers ignore preview/auth, respond with proper types, and fail 503 on outages', async () => {
  const { strapi, rows, reads } = fixture();
  rows.set('api::home-page.home-page', [{ title: 'Published home' }]);
  const controller = createController({ strapi });
  const app = new Koa();
  const server = createServer(async (req, res) => {
    const ctx = app.createContext(req, res);
    await controller[ctx.path.slice(1)](ctx);
    res.end(ctx.body);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const previousOrigin = process.env.PUBLIC_SITE_URL;
  const previousGate = process.env.SITE_INDEXING_ALLOWED;
  process.env.PUBLIC_SITE_URL = origin;
  process.env.SITE_INDEXING_ALLOWED = 'true';
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const response = await fetch(`${base}/sitemap?status=draft&preview=invalid`, { headers: { Authorization: 'Bearer invalid' } });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /application\/xml/);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.match(await response.text(), /https:\/\/club.example\/home/);
    assert.ok(reads.every((read) => read.status === 'published'));
    const md = await fetch(`${base}/llms`);
    assert.equal(md.status, 200);
    assert.match(md.headers.get('content-type'), /text\/plain/);
    assert.match(await md.text(), /^# Fixture Club/);
    process.env.SITE_INDEXING_ALLOWED = 'false';
    assert.equal(await (await fetch(`${base}/robots`)).text(), 'User-agent: *\nDisallow: /\n');
    assert.doesNotMatch(await (await fetch(`${base}/sitemap`)).text(), /<loc>/);
    assert.equal((await fetch(`${base}/llms`)).status, 404);
    strapi.documents = () => ({ findFirst: async () => { throw new Error('Database down'); } });
    const unavailable = await fetch(`${base}/robots`);
    assert.equal(unavailable.status, 503);
    assert.equal(unavailable.headers.get('retry-after'), '60');
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    if (previousOrigin === undefined) delete process.env.PUBLIC_SITE_URL; else process.env.PUBLIC_SITE_URL = previousOrigin;
    if (previousGate === undefined) delete process.env.SITE_INDEXING_ALLOWED; else process.env.SITE_INDEXING_ALLOWED = previousGate;
  }
});
