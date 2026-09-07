/**
 * Tests for the pure Teamup transforms: series collapsing, cadence wording,
 * and the file-exclusion matcher.
 *
 * Cadence is tested hardest because a wrong cadence is a CONFIDENT FALSEHOOD
 * the agent will repeat — "every Wednesday" for a club that meets twice in
 * two months is exactly the failure this pipeline exists to prevent.
 *
 * Run:  node --test cms/tests/teamup-render.test.mjs
 * (compile step in the npm script builds the TS to a temp dir first)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const OUT = process.env.TEAMUP_TEST_BUILD;
if (!OUT) throw new Error('set TEAMUP_TEST_BUILD to the compiled services dir');
const t = require(`${OUT}/services/teamup.js`);
const u = require(`${OUT}/utils.js`);

const ev = (id, start, end, extra = {}) => ({
  id, title: extra.title ?? 'X', start_dt: `${start}+08:00`, end_dt: `${end}+08:00`, ...extra,
});

test('one-off event renders its exact date, no cadence claim', () => {
  const [s] = t.collapseSeries([ev('1', '2026-09-05T18:00:00', '2026-09-05T23:00:00', { title: 'Birthday Bash' })]);
  const md = t.renderSeriesMarkdown(s, new Map(), 'https://x');
  assert.match(md, /\*\*When:\*\* Saturday, 5 Sep 2026, 6:00 PM – 11:00 PM/);
  assert.doesNotMatch(md, /Every/);
  assert.doesNotMatch(md, /\*\*Runs:\*\*/);
});

test('weekly series is described as Every <weekday>', () => {
  const occ = ['2026-08-19', '2026-08-26', '2026-09-02'].map((d, i) =>
    ev(`m1-rid-${i}`, `${d}T08:00:00`, `${d}T09:00:00`, { title: 'Pilates' }));
  const [s] = t.collapseSeries(occ);
  assert.match(t.renderSeriesMarkdown(s, new Map(), 'x'), /\*\*When:\*\* Every Wednesday, 8:00 AM – 9:00 AM/);
});

test('two sessions five weeks apart are NOT called weekly', () => {
  const occ = ['2026-08-26', '2026-09-30'].map((d, i) =>
    ev(`m2-rid-${i}`, `${d}T19:00:00`, `${d}T20:30:00`, { title: 'Book Club' }));
  const md = t.renderSeriesMarkdown(t.collapseSeries(occ)[0], new Map(), 'x');
  assert.doesNotMatch(md, /Every Wednesday/);
  assert.match(md, /On Wednesday, 26 Aug 2026; Wednesday, 30 Sep 2026/);
});

test('fortnightly and monthly cadences are distinguished', () => {
  const mk = (dates, title) => t.collapseSeries(dates.map((d, i) =>
    ev(`${title}-rid-${i}`, `${d}T10:00:00`, `${d}T11:00:00`, { title })))[0];
  assert.match(t.renderSeriesMarkdown(mk(['2026-08-03','2026-08-17','2026-08-31','2026-09-14'], 'F'), new Map(), 'x'),
    /Every other Monday/);
  assert.match(t.renderSeriesMarkdown(mk(['2026-08-03','2026-08-31','2026-09-28','2026-10-26'], 'M'), new Map(), 'x'),
    /Monthly, on a Monday/);
});

test('a 7-day-a-week series reads "Every day"', () => {
  const dates = Array.from({ length: 14 }, (_, i) => `2026-08-${String(3 + i).padStart(2, '0')}`);
  const s = t.collapseSeries(dates.map((d, i) => ev(`d-rid-${i}`, `${d}T16:00:00`, `${d}T20:00:00`, { title: 'HH' })))[0];
  assert.match(t.renderSeriesMarkdown(s, new Map(), 'x'), /\*\*When:\*\* Every day, 4:00 PM – 8:00 PM/);
});

test('varying times are listed per session rather than collapsed to one', () => {
  const occ = [
    ev('v-rid-1', '2026-08-19T08:00:00', '2026-08-19T09:00:00', { title: 'V' }),
    ev('v-rid-2', '2026-08-26T18:00:00', '2026-08-26T19:00:00', { title: 'V' }),
  ];
  const md = t.renderSeriesMarkdown(t.collapseSeries(occ)[0], new Map(), 'x');
  assert.match(md, /- Wednesday, 19 Aug 2026: 8:00 AM – 9:00 AM/);
  assert.match(md, /- Wednesday, 26 Aug 2026: 6:00 PM – 7:00 PM/);
});

test('occurrences group by series_id, then by master id in the occurrence id', () => {
  const bySeries = t.collapseSeries([
    ev('a', '2026-08-19T08:00:00', '2026-08-19T09:00:00', { series_id: 99, title: 'A' }),
    ev('b', '2026-08-26T08:00:00', '2026-08-26T09:00:00', { series_id: 99, title: 'A' }),
  ]);
  assert.equal(bySeries.length, 1);
  assert.equal(bySeries[0].occurrences.length, 2);

  const byMaster = t.collapseSeries([
    ev('555-rid-1', '2026-08-19T08:00:00', '2026-08-19T09:00:00', { title: 'B' }),
    ev('555-rid-2', '2026-08-26T08:00:00', '2026-08-26T09:00:00', { title: 'B' }),
  ]);
  assert.equal(byMaster.length, 1);

  // Distinct one-offs must NOT be merged.
  assert.equal(t.collapseSeries([
    ev('x', '2026-08-19T08:00:00', '2026-08-19T09:00:00', { title: 'C' }),
    ev('y', '2026-08-20T10:00:00', '2026-08-20T11:00:00', { title: 'D' }),
  ]).length, 2);
});

test('every doc carries a Source line for citation', () => {
  const s = t.collapseSeries([ev('1', '2026-09-05T18:00:00', '2026-09-05T23:00:00', { title: 'E' })])[0];
  assert.match(t.renderSeriesMarkdown(s, new Map(), 'https://amclub.org.sg'),
    /Source: \[What's On\]\(https:\/\/amclub\.org\.sg\/whats-on\)/);
});

test('doc names are stable and unique per series', () => {
  const s = t.collapseSeries([ev('1', '2026-09-05T18:00:00', '2026-09-05T23:00:00', { title: "Chef's Table & Wine!" })])[0];
  const name = t.buildSeriesDocName('am-club:', s);
  assert.match(name, /^am-club:teamup:chef-s-table-wine:/);
  assert.equal(name, t.buildSeriesDocName('am-club:', s), 'stable across calls');
});

test('doc names stay colon-segmented — the fallback key is hashed, not inlined', () => {
  // The signature key is `t<title>|<HH:MM>|<location>`; the time's colon would
  // otherwise split the name into extra segments.
  const s = t.collapseSeries([
    ev('x', '2026-08-26T19:00:00', '2026-08-26T20:30:00', { title: 'Adult Book Club', location: 'library' }),
  ])[0];
  const name = t.buildSeriesDocName('am-club:', s);
  assert.equal(name.split(':').length, 4, `expected 4 segments, got ${name}`);
  assert.doesNotMatch(name, /[ |]/, 'no spaces or pipes in a doc name');
  assert.match(name, /^am-club:teamup:adult-book-club:h[0-9a-f]{12}$/);
  assert.equal(name, t.buildSeriesDocName('am-club:', s), 'hash is stable');
});

test('series-id and master-id keys stay readable (not hashed)', () => {
  const byId = t.collapseSeries([
    ev('a', '2026-08-19T08:00:00', '2026-08-19T09:00:00', { series_id: 2084465114, title: 'Mahjong Social' }),
  ])[0];
  assert.equal(t.buildSeriesDocName('am-club:', byId), 'am-club:teamup:mahjong-social:s2084465114');
});

test('window honours daysBefore/daysAfter', () => {
  const w = t.computeWindow({ daysBefore: 0, daysAfter: 60 });
  assert.match(w.from, /^\d{4}-\d{2}-\d{2}$/);
  const span = (Date.parse(w.to) - Date.parse(w.from)) / 86400000;
  assert.equal(span, 60);
  assert.equal((Date.parse(t.computeWindow({ daysBefore: 7, daysAfter: 7 }).to)
    - Date.parse(t.computeWindow({ daysBefore: 7, daysAfter: 7 }).from)) / 86400000, 14);
});

// ── file exclusion ───────────────────────────────────────────────────

test('exclusion matches on name or url, case-insensitively', () => {
  const f = { name: 'Group Fitness Schedule - August 2026.pdf', url: '/uploads/documents/fitness/gfs_aug.pdf' };
  assert.equal(u.isFileExcluded(f, ['group-fitness-schedule']), false, 'hyphens are not spaces');
  assert.equal(u.isFileExcluded(f, ['group fitness schedule']), true);
  assert.equal(u.isFileExcluded(f, ['GROUP FITNESS']), true);
  assert.equal(u.isFileExcluded(f, ['/documents/fitness/']), true);
  assert.equal(u.isFileExcluded(f, ['menu']), false);
});

test('exclusion supports * wildcards', () => {
  const f = { name: 'Group Fitness Schedule - August 2026.pdf', url: '/uploads/x.pdf' };
  assert.equal(u.isFileExcluded(f, ['group*schedule*.pdf']), true);
  assert.equal(u.isFileExcluded(f, ['sen*menu']), false);
});

test('blank patterns never exclude anything', () => {
  const f = { name: 'menu.pdf', url: '/uploads/menu.pdf' };
  assert.equal(u.isFileExcluded(f, []), false);
  assert.equal(u.isFileExcluded(f, ['', '   ']), false);
});

test('exclusion tolerates missing name/url', () => {
  assert.equal(u.isFileExcluded({}, ['x']), false);
  assert.equal(u.isFileExcluded({ name: null, url: null }, ['x']), false);
});

// ── Registration links, price and signup route ───────────────────────
//
// The bug these cover: notes are HTML and carry the registration / pricing
// links as <a href>. Blanket tag-stripping turned "Refer to this
// <a href="...pdf">file</a>" into "Refer to this file" — the URL vanished, so
// the agent told members to check a file it could not point them to.

test('anchor hrefs in notes survive as markdown links', () => {
  const out = t.htmlNotesToText(
    '<p>Refer to this <a href="https://x.test/a.pdf" rel="noreferrer" target="_blank">file</a> for pricing.</p>',
  );
  assert.match(out, /\[file\]\(https:\/\/x\.test\/a\.pdf\)/);
  assert.ok(!out.includes('<'), 'no raw tags should remain');
});

test('a bare-URL label is not double-wrapped', () => {
  const out = t.htmlNotesToText('<a href="https://x.test/a">https://x.test/a</a>');
  assert.equal(out, 'https://x.test/a');
});

test('non-anchor tags are stripped and entities decoded', () => {
  const out = t.htmlNotesToText('<p>Tea&nbsp;&amp; cake<br>7&#39;s</p>');
  assert.equal(out, "Tea & cake 7's");
});

test('multiple links in one note are all preserved', () => {
  const out = t.htmlNotesToText('<a href="https://a.test">A</a> and <a href="https://b.test">B</a>');
  assert.match(out, /\[A\]\(https:\/\/a\.test\)/);
  assert.match(out, /\[B\]\(https:\/\/b\.test\)/);
});

const evc = (custom, notes) => ({
  id: 'e1', title: 'Thing', start_dt: '2026-09-07T10:00:00+08:00',
  end_dt: '2026-09-07T11:00:00+08:00', custom, notes,
});

test('price and signup method are rendered from custom fields', () => {
  const md = t.renderSeriesMarkdown(
    { key: 'k', title: 'Thing', recurring: false,
      occurrences: [evc({ price: '58.10', sign_up_method: ['tac_book'] })] },
    new Map(), 'https://s.test',
  );
  assert.match(md, /\*\*Price:\*\* \$58\.10/);
  assert.match(md, /\*\*How to register:\*\* Register via the TAC Book app/);
});

test('prose prices are passed through without a bogus $ prefix', () => {
  const md = t.renderSeriesMarkdown(
    { key: 'k', title: 'Thing', recurring: false,
      occurrences: [evc({ price: '$35 for Members and $40 for Guests' })] },
    new Map(), 'https://s.test',
  );
  assert.match(md, /\*\*Price:\*\* \$35 for Members and \$40 for Guests/);
  assert.ok(!md.includes('$$'), 'must not double the dollar sign');
});

test('sign_up_method n_a renders no registration line', () => {
  const md = t.renderSeriesMarkdown(
    { key: 'k', title: 'Thing', recurring: false,
      occurrences: [evc({ sign_up_method: ['n_a'] })] },
    new Map(), 'https://s.test',
  );
  assert.ok(!md.includes('How to register'), 'n_a means there is no registration step');
});

test('missing custom fields render nothing rather than empty labels', () => {
  const md = t.renderSeriesMarkdown(
    { key: 'k', title: 'Thing', recurring: false, occurrences: [evc(undefined)] },
    new Map(), 'https://s.test',
  );
  assert.ok(!md.includes('Price:'));
  assert.ok(!md.includes('How to register'));
});

test('internal BEO attachments are never surfaced', () => {
  const ev = evc({}, null);
  ev.attachments = [{ name: 'BEO Internal.docx', link: 'https://files.teamup.com/secret' }];
  const md = t.renderSeriesMarkdown(
    { key: 'k', title: 'Thing', recurring: false, occurrences: [ev] }, new Map(), 'https://s.test',
  );
  assert.ok(!md.includes('files.teamup.com'), 'attachment links must not leak into the KB');
  assert.ok(!md.includes('BEO'), 'internal doc names must not leak into the KB');
});
