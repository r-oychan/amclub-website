// POC: parse the Group Fitness Schedule PPTX in Node (jszip + fast-xml-parser)
// into structured rows, then render KB markdown. Mirrors the python-pptx
// prototype so the two outputs can be diffed.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const CMS = new URL('../cms/node_modules/', import.meta.url).pathname;
const JSZip = (await import(CMS + 'jszip/lib/index.js')).default;
const { XMLParser } = await import(CMS + 'fast-xml-parser/src/fxp.js');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  // Runs carry significant leading/trailing spaces ("Pilates " + "Matwork").
  // Trimming them concatenates words together.
  trimValues: false,
  isArray: (name) => ['a:tr', 'a:tc', 'a:gridCol', 'a:p', 'a:r', 'p:sp', 'p:pic', 'p:graphicFrame', 'p:grpSp', 'Relationship'].includes(name),
});

const EMU_IN = 914400;
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const LEGEND_LABELS = ['Low Intensity', 'Moderate', 'High Intensity', 'Suitable for Senior & Beginners'];

const arr = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const num = (v) => (v == null ? 0 : Number(v));

/** All text inside a txBody, paragraphs joined by newline. */
function textOf(txBody) {
  if (!txBody) return '';
  return arr(txBody['a:p'])
    .map((p) => arr(p['a:r']).map((r) => (typeof r['a:t'] === 'object' ? '' : String(r['a:t'] ?? ''))).join(''))
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n');
}

/** Solid fill colour of a cell/shape: explicit hex, or THEME when scheme-based. */
function fillOf(props) {
  const sf = props?.['a:solidFill'];
  if (!sf) return null;
  if (sf['a:srgbClr']) return String(sf['a:srgbClr']['@val']).toUpperCase();
  if (sf['a:schemeClr']) return 'THEME';
  return 'THEME';
}

function xfrmOf(sp) {
  const x = sp?.['p:spPr']?.['a:xfrm'] ?? sp?.['p:xfrm'] ?? sp?.['a:xfrm'];
  if (!x) return null;
  return {
    x: num(x['a:off']?.['@x']), y: num(x['a:off']?.['@y']),
    cx: num(x['a:ext']?.['@cx']), cy: num(x['a:ext']?.['@cy']),
  };
}

/** Flatten the shape tree (groups inlined) into {kind, node} entries. */
function walkShapes(tree, out = []) {
  for (const sp of arr(tree['p:sp'])) out.push({ kind: 'sp', node: sp });
  for (const pic of arr(tree['p:pic'])) out.push({ kind: 'pic', node: pic });
  for (const gf of arr(tree['p:graphicFrame'])) out.push({ kind: 'frame', node: gf });
  for (const g of arr(tree['p:grpSp'])) walkShapes(g, out);
  return out;
}

export async function parseDeck(buf) {
  const zip = await JSZip.loadAsync(buf);
  const slideXml = await zip.file('ppt/slides/slide1.xml').async('string');
  const relsXml = await zip.file('ppt/slides/_rels/slide1.xml.rels').async('string');
  const slide = parser.parse(slideXml);
  const rels = {};
  for (const r of arr(parser.parse(relsXml).Relationships?.Relationship)) rels[r['@Id']] = r['@Target'];

  const tree = slide['p:sld']['p:cSld']['p:spTree'];
  const shapes = walkShapes(tree);
  const errors = [];
  const warnings = [];

  // ── table ──────────────────────────────────────────────────────────
  const frames = shapes.filter((s) => s.kind === 'frame' && s.node['a:graphic']?.['a:graphicData']?.['a:tbl']);
  if (frames.length !== 1) errors.push(`expected exactly 1 table, found ${frames.length}`);
  const frame = frames[0];
  const tbl = frame.node['a:graphic']['a:graphicData']['a:tbl'];
  const frameBox = xfrmOf(frame.node);
  const colW = arr(tbl['a:tblGrid']['a:gridCol']).map((c) => num(c['@w']));
  const trs = arr(tbl['a:tr']);
  const rowH = trs.map((r) => num(r['@h']));

  const grid = trs.map((tr) =>
    arr(tr['a:tc']).map((tc) => ({
      text: textOf(tc['a:txBody']),
      fill: fillOf(tc['a:tcPr']),
      gridSpan: num(tc['@gridSpan']) || 1,
      hMerge: tc['@hMerge'] === '1' || tc['@hMerge'] === 'true',
      vMerge: tc['@vMerge'] === '1' || tc['@vMerge'] === 'true',
    })),
  );

  // ── legend (colour → intensity), read from the deck itself ─────────
  const legend = {};
  for (const { kind, node } of shapes) {
    if (kind !== 'sp') continue;
    const t = textOf(node['p:txBody']);
    if (!LEGEND_LABELS.includes(t)) continue;
    legend[fillOf(node['p:spPr']) ?? 'THEME'] = t;
  }
  if (Object.keys(legend).length !== LEGEND_LABELS.length) {
    errors.push(`legend incomplete: resolved ${Object.keys(legend).length}/${LEGEND_LABELS.length} — ${JSON.stringify(legend)}`);
  }

  // ── prices (snip-corner shapes above the table) ────────────────────
  const prices = [];
  for (const { kind, node } of shapes) {
    if (kind !== 'sp') continue;
    const t = textOf(node['p:txBody']);
    if (/\$\d/.test(t) && !LEGEND_LABELS.includes(t)) prices.push(t.replace(/\n/g, ' '));
  }

  // ── "New" badges: overlay images mapped to cells by geometry ───────
  const colX = [frameBox.x];
  for (const w of colW) colX.push(colX[colX.length - 1] + w);
  // `a:tr@h` is a MINIMUM — PowerPoint grows rows to fit their content, and the
  // frame's rendered height reflects that (5.8% taller here). Using the raw
  // values makes boundaries drift further out with every row, which pushed the
  // last-row badge outside the table entirely. Scale them to the real height.
  const rowScale = rowH.reduce((a, b) => a + b, 0) > 0 ? frameBox.cy / rowH.reduce((a, b) => a + b, 0) : 1;
  const rowY = [frameBox.y];
  for (const h of rowH) rowY.push(rowY[rowY.length - 1] + h * rowScale);

  const badges = [];
  const badgeHashes = new Set();
  for (const { kind, node } of shapes) {
    if (kind !== 'pic') continue;
    const box = xfrmOf(node);
    if (!box || box.y < frameBox.y) continue; // above the table = logo, not a badge
    const embed = node['p:blipFill']?.['a:blip']?.['@r:embed'];
    const target = rels[embed];
    if (target) {
      const path = 'ppt/' + target.replace(/^\.\.\//, '');
      const f = zip.file(path);
      if (f) badgeHashes.add(createHash('md5').update(await f.async('nodebuffer')).digest('hex').slice(0, 8));
    }
    const cx = box.x + box.cx / 2;
    const cy = box.y + box.cy / 2;
    // Clamp: a badge nudged past the last gridline still belongs to the last
    // row/column, and specified row heights are only a lower bound on what
    // PowerPoint renders.
    let ci = 0; while (ci + 1 < colX.length && colX[ci + 1] <= cx) ci += 1;
    let ri = 0; while (ri + 1 < rowY.length && rowY[ri + 1] <= cy) ri += 1;
    ri = Math.min(ri, trs.length - 1); ci = Math.min(ci, colW.length - 1);
    // Badge→cell mapping is the one geometric inference here, so it is also
    // the only thing that could go wrong SILENTLY (a table nudged without its
    // badges tags the wrong class). A badge deliberately placed on a cell sits
    // well inside it; one that has drifted sits near an edge — so flag that.
    const fx = (cx - colX[ci]) / (colX[ci + 1] - colX[ci]);
    const fy = (cy - rowY[ri]) / (rowY[ri + 1] - rowY[ri]);
    const margin = Math.min(fx, 1 - fx, fy, 1 - fy);
    badges.push({ ri, ci, margin });
  }
  if (badgeHashes.size > 1) warnings.push(`overlay images are not identical: ${[...badgeHashes].join(', ')}`);

  // ── column → day, from the merged header row ───────────────────────
  const dayOf = {};
  const header = grid[0] ?? [];
  header.forEach((cell, ci) => {
    if (ci === 0 || !cell.text) return;
    for (let k = 0; k < cell.gridSpan; k += 1) dayOf[ci + k] = cell.text.trim().toUpperCase();
  });
  const foundDays = [...new Set(Object.values(dayOf))];
  if (JSON.stringify(foundDays) !== JSON.stringify(DAYS)) errors.push(`day headers changed: ${JSON.stringify(foundDays)}`);

  // ── classes ────────────────────────────────────────────────────────
  const classes = [];
  let unmapped = 0;
  const unknownColours = new Set();
  for (let ri = 1; ri < grid.length; ri += 1) {
    const time = normaliseTime(grid[ri][0]?.text ?? '');
    if (!time) errors.push(`row ${ri} has no time label`);
    for (let ci = 1; ci < grid[ri].length; ci += 1) {
      const cell = grid[ri][ci];
      if (!cell || cell.hMerge || cell.vMerge || !cell.text) continue;
      const intensity = legend[cell.fill ?? ''] ?? null;
      if (!intensity) { unmapped += 1; unknownColours.add(String(cell.fill)); }
      const hit = badges.find((b) => b.ri === ri && b.ci >= ci && b.ci < ci + cell.gridSpan);
      const isNew = !!hit;
      if (hit && hit.margin < 0.12) {
        warnings.push(
          `${dayOf[ci]} ${time}: a NEW badge sits ${Math.round(hit.margin * 100)}% from the cell edge — ` +
          `it may belong to the neighbouring class. Check the badge positions in the deck.`,
        );
      }
      const blocks = splitCell(cell.text);
      if (isNew && blocks.length > 1) {
        warnings.push(
          `${dayOf[ci]} ${time}: a NEW badge sits on a cell holding ${blocks.length} classes ` +
          `(${blocks.map((b) => b.name).join(', ')}) — tagging the first. Put one class per cell to disambiguate.`,
        );
      }
      blocks.forEach((b, bi) => {
        classes.push({ day: dayOf[ci] ?? '?', time, intensity, isNew: isNew && bi === 0, ...b });
      });
    }
  }
  if (unmapped > 0) {
    errors.push(`${unmapped} class cell(s) have a fill colour not in the legend: ${[...unknownColours].join(', ')}`);
  }
  return { classes, legend, prices, badges, errors, warnings, stats: { cells: classes.length, unmapped } };
}

/** "8:00 a.m. \n– \n9:00 a.m." → "8:00 AM – 9:00 AM" */
function normaliseTime(raw) {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/a\.m\./gi, 'AM')
    .replace(/p\.m\./gi, 'PM')
    .replace(/\s*–\s*/g, ' – ')
    .trim();
}

/**
 * A cell holds the class name, then optional notes, then instructor and
 * studio on the last two lines. Notes are the "Aug 10 – No Class" /
 * "Starts Aug 19" / "Change to ..." annotations.
 */
const CODE_ONLY = /^\([SLMH](?:\s*-\s*[SLMH])?\)$/i;
const STUDIO_LINE = /(Studio|Studios)(\s*\d+)?$/i;
// Schedule annotations rather than part of the class name.
const NOTE_LINE = /^(Starts\b|Change to\b|Aug\b|Sep\b|Oct\b|Nov\b|Dec\b|Jan\b|Feb\b|Mar\b|Apr\b|May\b|Jun\b|Jul\b)|No Class|^\(\d/i;

/**
 * A cell is one or more class blocks, each ending with its studio line:
 *   <name lines…> <notes…> <instructor> <studio>
 * The Friday 8:00 AM cell holds two classes this way, so returning an array
 * is what keeps the second one from being dropped.
 */
function splitCell(text) {
  const lines = text.split('\n').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const blocks = [];
  let cur = [];
  for (const line of lines) {
    cur.push(line);
    if (STUDIO_LINE.test(line)) { blocks.push(cur); cur = []; }
  }
  if (cur.length) blocks.push(cur);

  return blocks.map((b) => {
    let studio = null;
    let instructor = null;
    let body = b;
    if (STUDIO_LINE.test(b[b.length - 1] ?? '')) {
      studio = b[b.length - 1];
      instructor = b[b.length - 2] ?? null;
      body = b.slice(0, -2);
    }
    // Intensity codes are redundant with the colour-derived level. Strip them
    // wherever they appear; "(HIIT)" and "(55mins)" are left alone because the
    // pattern only matches S/L/M/H tokens.
    const dropCode = (s) => s.replace(/\s*\((?:[SLMH](?:\s*-\s*[SLMH])?)\)\s*/gi, ' ').replace(/\s+/g, ' ').trim();
    const notes = body.filter((l) => NOTE_LINE.test(l) && !CODE_ONLY.test(l)).map(dropCode).filter(Boolean);
    // Name may wrap across lines ("Body Rock" / "Indoor Cycling" / "(55mins)").
    const name = dropCode(body.filter((l) => !NOTE_LINE.test(l) && !CODE_ONLY.test(l)).join(' '));
    return { name, instructor, studio, notes };
  });
}

export function toMarkdown({ classes, legend, prices }, meta) {
  const L = [];
  L.push(`# ${meta.title}`, '');
  L.push(`> Source: [${meta.sourceLabel}](${meta.sourceUrl})`, '');
  L.push('Group fitness class timetable. Each entry lists the day, time, class, instructor, studio and intensity level.', '');
  if (prices.length) L.push('## Pricing', ...prices.map((p) => `- ${p}`), '');
  L.push('## Intensity levels', ...Object.values(legend).map((v) => `- ${v}`), '');
  for (const day of DAYS) {
    const rows = classes.filter((c) => c.day === day);
    if (!rows.length) continue;
    L.push(`## ${day.charAt(0) + day.slice(1).toLowerCase()}`, '');
    for (const c of rows) {
      const bits = [`**${c.time}** — ${c.name}`];
      if (c.intensity) bits.push(`(${c.intensity})`);
      if (c.instructor) bits.push(`with ${c.instructor}`);
      if (c.studio) bits.push(`at ${c.studio}`);
      let line = `- ${bits.join(' ')}`;
      if (c.isNew) line += ' — NEW CLASS';
      if (c.notes.length) line += ` — ${c.notes.join('; ')}`;
      L.push(line);
    }
    L.push('');
    L.push(`Source: [${meta.sourceLabel}](${meta.sourceUrl})`, '');
  }
  return L.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

if (process.argv[2]) {
  const res = await parseDeck(readFileSync(process.argv[2]));
  console.error('legend  :', JSON.stringify(res.legend));
  console.error('prices  :', JSON.stringify(res.prices));
  console.error('badges  :', JSON.stringify(res.badges));
  console.error('stats   :', JSON.stringify(res.stats));
  console.error('ERRORS  :', res.errors.length ? res.errors : 'none');
  console.error('WARNINGS:', res.warnings.length ? res.warnings : 'none');
  if (process.argv[3] === '--md') {
    console.log(toMarkdown(res, {
      title: 'Group Fitness Class Schedule — August 10–31, 2026',
      sourceLabel: 'Gym',
      sourceUrl: 'https://amclub.org.sg/fitness/gym',
    }));
  } else {
    console.log(JSON.stringify(res.classes, null, 1));
  }
}
