/**
 * Text extraction for PDFs too large for ElevenLabs' file upload (20 MB).
 * Brochure-style PDFs (e.g. the Festive Guide) are mostly images, so the
 * extracted text is a few dozen KB and fits the text-doc endpoint easily.
 */

// ElevenLabs answers `400 content_too_large … Maximum allowed size is 20 MB`.
// Use the decimal MB so files just under 20 MiB don't trip the limit either.
export const ELEVENLABS_MAX_FILE_BYTES = 20_000_000;

export function isPdf(file: { mime?: string | null; ext?: string | null; name?: string }): boolean {
  return file.mime === 'application/pdf' || /\.pdf$/i.test(file.ext ?? file.name ?? '');
}

export async function extractPdfText(buffer: Buffer): Promise<{ pages: number; text: string }> {
  // unpdf is ESM-only; Node 24 loads it through require(esm).
  const { extractText, getDocumentProxy } = await import('unpdf');
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, text } = await extractText(pdf, { mergePages: false });
  const pages = (text as string[]).map((t, i) => `## Page ${i + 1}\n\n${t.trim()}`).filter((p) => !/^## Page \d+\n\n$/.test(p));
  return { pages: totalPages, text: pages.join('\n\n') };
}
