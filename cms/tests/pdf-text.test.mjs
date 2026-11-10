// Runs against the CommonJS build from `npm run test:plugin`, which also
// proves the ESM-only `unpdf` loads through the compiled require().
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const build = process.env.TEAMUP_TEST_BUILD;
const { extractPdfText, isPdf, ELEVENLABS_MAX_FILE_BYTES } = require(
  path.join(build, 'services', 'pdf-text.js'),
);

// Smallest valid one-page PDF showing `text`, with a correct xref table.
function tinyPdf(text) {
  const stream = `BT /F1 24 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let out = '%PDF-1.4\n';
  const offsets = objects.map((body, i) => {
    const at = out.length;
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return at;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

test('extracts per-page text from a PDF', async () => {
  const { pages, text } = await extractPdfText(tinyPdf('Christmas Eve Feasts'));
  assert.equal(pages, 1);
  assert.match(text, /^## Page 1\n\nChristmas Eve Feasts/);
});

test('recognises PDFs by mime or extension', () => {
  assert.equal(isPdf({ mime: 'application/pdf' }), true);
  assert.equal(isPdf({ mime: 'application/octet-stream', ext: '.PDF' }), true);
  assert.equal(isPdf({ mime: 'image/jpeg', ext: '.jpg' }), false);
});

test('limit sits at or under ElevenLabs 20 MB cap', () => {
  assert.ok(ELEVENLABS_MAX_FILE_BYTES <= 20 * 1024 * 1024);
  assert.ok(26_733_672 > ELEVENLABS_MAX_FILE_BYTES);
});
