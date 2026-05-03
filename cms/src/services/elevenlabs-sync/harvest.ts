/**
 * Walk a populated entry to find every Strapi-uploaded document file
 * (PDF, DOCX, TXT, HTML, EPUB) reachable from it. Two harvest paths:
 *
 *   1. Media-relation fields — any attribute typed `media` whose value
 *      points at one or more upload rows. Generic; works for any schema.
 *   2. Configured `mediaUrlPaths` — dot-paths into entry data where a
 *      string URL might point at /uploads/<filename>. Lets us pick up
 *      PDFs already linked from CTAs without adding a new field.
 *
 * Returns deduped file IDs in stable order so harvest output is
 * reproducible across runs (matters for the sync-log diff).
 */

import { config } from './config';

export const KB_DOC_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/html',
  'application/epub+zip',
]);

export interface HarvestedFile {
  id: number;
  url: string;
  name: string;
  ext: string | null;
  mime: string;
  size: number;
  updatedAt: string;
}

interface UploadRow {
  id: number;
  url: string;
  name: string;
  ext?: string | null;
  mime: string;
  size?: number;
  updatedAt?: string;
}

type Strapi = {
  contentTypes: Record<string, { attributes: Record<string, { type: string }> }>;
  components: Record<string, { attributes: Record<string, { type: string }> }>;
  db: { query: (uid: string) => { findOne: (opts: { where: Record<string, unknown> }) => Promise<unknown> } };
};

export async function harvestFiles(
  strapi: Strapi,
  uid: string,
  entry: Record<string, unknown>,
): Promise<HarvestedFile[]> {
  const found = new Map<number, HarvestedFile>();

  // Path 1: walk every media-typed attribute (recursive into components).
  const schema = strapi.contentTypes[uid];
  if (schema) walkForMedia(strapi, schema.attributes, entry, found);

  // Path 2: scan configured CTA href paths for /uploads/* URLs.
  for (const path of config.mediaUrlPaths) {
    const urls = resolvePath(entry, path);
    for (const url of urls) {
      if (typeof url !== 'string') continue;
      const file = await lookupUploadByUrl(strapi, url);
      if (file && KB_DOC_MIMES.has(file.mime)) {
        found.set(file.id, toHarvested(file));
      }
    }
  }

  return Array.from(found.values()).sort((a, b) => a.id - b.id);
}

function walkForMedia(
  strapi: Strapi,
  attrs: Record<string, { type: string; component?: string }>,
  data: Record<string, unknown>,
  found: Map<number, HarvestedFile>,
): void {
  for (const [name, attr] of Object.entries(attrs)) {
    const val = data[name];
    if (val == null) continue;

    if (attr.type === 'media') {
      const rows = Array.isArray(val) ? val : [val];
      for (const r of rows as UploadRow[]) {
        if (r && typeof r === 'object' && r.id && KB_DOC_MIMES.has(r.mime)) {
          found.set(r.id, toHarvested(r));
        }
      }
    } else if (attr.type === 'component' && attr.component) {
      const comp = strapi.components[attr.component];
      if (!comp) continue;
      const items = Array.isArray(val) ? (val as Array<Record<string, unknown>>) : [val as Record<string, unknown>];
      for (const item of items) walkForMedia(strapi, comp.attributes, item, found);
    } else if (attr.type === 'dynamiczone' && Array.isArray(val)) {
      for (const item of val as Array<Record<string, unknown>>) {
        const componentName = item.__component as string | undefined;
        if (!componentName) continue;
        const comp = strapi.components[componentName];
        if (!comp) continue;
        walkForMedia(strapi, comp.attributes, item, found);
      }
    }
  }
}

function resolvePath(root: unknown, path: string): unknown[] {
  const segments = path.split('.');
  let frontier: unknown[] = [root];
  for (const seg of segments) {
    const next: unknown[] = [];
    const isArrayMarker = seg.endsWith('[]');
    const key = isArrayMarker ? seg.slice(0, -2) : seg;
    for (const node of frontier) {
      if (node == null || typeof node !== 'object') continue;
      const value = (node as Record<string, unknown>)[key];
      if (value == null) continue;
      if (isArrayMarker && Array.isArray(value)) next.push(...value);
      else next.push(value);
    }
    frontier = next;
  }
  return frontier;
}

async function lookupUploadByUrl(strapi: Strapi, url: string): Promise<UploadRow | null> {
  // Trim querystring so /uploads/foo.pdf?token=… still resolves.
  const cleaned = url.split('?')[0] ?? url;
  if (!cleaned.includes('/uploads/')) return null;
  const row = (await strapi.db.query('plugin::upload.file').findOne({ where: { url: cleaned } })) as UploadRow | null;
  return row ?? null;
}

function toHarvested(r: UploadRow): HarvestedFile {
  return {
    id: r.id,
    url: r.url,
    name: r.name,
    ext: r.ext ?? null,
    mime: r.mime,
    size: r.size ?? 0,
    updatedAt: r.updatedAt ?? new Date().toISOString(),
  };
}
