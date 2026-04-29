#!/usr/bin/env npx tsx
/**
 * Content Migration Runner
 *
 * Reads content-inventory.json and populates a running Strapi instance.
 * Idempotent: safe to re-run without creating duplicate entries.
 *
 * Usage:
 *   npx tsx scripts/migrate-content.ts --token <api-token> [--url http://localhost:1337]
 *
 * Or set environment variables:
 *   STRAPI_URL=http://localhost:1337
 *   STRAPI_API_TOKEN=<token>
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as https from 'node:https';
import * as http from 'node:http';

// --- Types ---

interface ContentInventory {
  version: string;
  sourceUrl: string;
  extractedAt: string;
  pages: PageContent[];
  globalContent?: GlobalContent;
  media?: MediaAsset[];
}

interface PageContent {
  pageId: string;
  path: string;
  title: string;
  seo?: SeoContent;
  sections: SectionContent[];
}

interface SeoContent {
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

interface SectionContent {
  componentId: string;
  componentType: string;
  content?: Record<string, unknown>;
  items?: Array<Record<string, unknown>>;
}

interface GlobalContent {
  siteName?: string;
  logo?: ImageContent;
  headerContent?: SectionContent;
  footerContent?: SectionContent;
  socialLinks?: Array<{ platform: string; url: string }>;
  copyright?: string;
}

interface ImageContent {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  caption?: string;
}

interface MediaAsset {
  id: string;
  type: string;
  originalUrl: string;
  alt?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  fileSize?: number;
  usedOn?: string[];
}

interface ContentTypeSchema {
  kind: string;
  collectionName: string;
  info: {
    singularName: string;
    pluralName: string;
    displayName: string;
    description?: string;
  };
  attributes: Record<string, AttributeSchema>;
}

interface AttributeSchema {
  type: string;
  relation?: string;
  target?: string;
  required?: boolean;
  repeatable?: boolean;
  component?: string;
  components?: string[];
  multiple?: boolean;
  [key: string]: unknown;
}

interface MigrationReport {
  version: string;
  migratedAt: string;
  strapiUrl: string;
  summary: {
    totalEntries: number;
    created: number;
    skipped: number;
    failed: number;
    mediaUploaded: number;
    mediaFailed: number;
  };
  entries: EntryReport[];
  media: MediaReport[];
}

interface EntryReport {
  contentType: string;
  slug: string;
  status: 'created' | 'skipped' | 'failed';
  strapiId?: number | null;
  documentId?: string | null;
  reason?: string | null;
  error?: string | null;
}

interface MediaReport {
  originalUrl: string;
  status: 'uploaded' | 'failed' | 'skipped';
  strapiId?: number | null;
  strapiUrl?: string | null;
  error?: string | null;
}

// --- Configuration ---

const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
};

const STRAPI_URL = getArg('url') || process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = getArg('token') || process.env.STRAPI_API_TOKEN || '';
const PROJECT_ROOT = getArg('root') || process.cwd();
const MEDIA_TMP_DIR = path.join(PROJECT_ROOT, '.migration-tmp', 'media');
const RATE_LIMIT_DELAY_MS = 100; // 10 requests/second
const MEDIA_RATE_LIMIT_DELAY_MS = 200; // 5 requests/second

// --- Helpers ---

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const fetchJSON = async (
  urlPath: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<unknown> => {
  const fullUrl = `${STRAPI_URL}${urlPath}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  const response = await fetch(fullUrl, {
    method: options.method || 'GET',
    headers,
    body: options.body,
  });

  const data: unknown = await response.json();
  if (!response.ok) {
    const errorData = data as { error?: { message?: string } };
    throw new Error(
      `API ${response.status}: ${errorData?.error?.message || response.statusText}`,
    );
  }
  return data;
};

const downloadFile = (url: string, dest: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    protocol
      .get(url, { headers: { 'User-Agent': 'ContentMigration/1.0' } }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            fs.unlinkSync(dest);
            downloadFile(redirectUrl, dest).then(resolve).catch(reject);
            return;
          }
        }
        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          reject(new Error(`Download failed: ${response.statusCode} for ${url}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(err);
      });
  });
};

const sanitizeFilename = (url: string): string => {
  const urlObj = new URL(url);
  const basename = path.basename(urlObj.pathname);
  return decodeURIComponent(basename)
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-');
};

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  pdf: 'application/pdf',
};

const mimeFromFilename = (filename: string): string => {
  const ext = path.extname(filename).slice(1).toLowerCase();
  return MIME_BY_EXT[ext] || 'application/octet-stream';
};

// --- Content Type Schema Loading ---

const loadContentTypeSchemas = (): Map<string, ContentTypeSchema> => {
  const schemasDir = path.join(PROJECT_ROOT, 'content-types');
  const schemas = new Map<string, ContentTypeSchema>();

  if (!fs.existsSync(schemasDir)) {
    console.warn('Warning: content-types/ directory not found. Using flat migration.');
    return schemas;
  }

  const files = fs.readdirSync(schemasDir);
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const filePath = path.join(schemasDir, file);
    const schema = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ContentTypeSchema;
    schemas.set(schema.info.pluralName, schema);
  }
  return schemas;
};

// --- Dependency Graph ---

const buildDependencyOrder = (
  schemas: Map<string, ContentTypeSchema>,
): string[] => {
  const graph = new Map<string, Set<string>>();
  const allTypes = new Set<string>();

  for (const [pluralName, schema] of schemas) {
    allTypes.add(pluralName);
    graph.set(pluralName, new Set());

    for (const attr of Object.values(schema.attributes)) {
      if (attr.type === 'relation' && attr.target) {
        // target format: "api::category.category"
        const targetParts = attr.target.split('.');
        const targetSingular = targetParts[targetParts.length - 1];
        // Find the plural name for this target
        for (const [otherPlural, otherSchema] of schemas) {
          if (
            otherSchema.info.singularName === targetSingular &&
            otherPlural !== pluralName
          ) {
            graph.get(pluralName)!.add(otherPlural);
          }
        }
      }
    }
  }

  // Topological sort (Kahn's algorithm)
  const inDegree = new Map<string, number>();
  for (const type of allTypes) {
    inDegree.set(type, 0);
  }
  for (const deps of graph.values()) {
    for (const dep of deps) {
      inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
    }
  }

  // We want dependencies FIRST, so nodes with inDegree 0 = no one depends on them.
  // Actually, we need: nodes that have no dependencies go first.
  // inDegree here counts how many types depend ON this type.
  // We want outDegree 0 first (no dependencies).
  // Let's recalculate: count of dependencies per type.

  const depCount = new Map<string, number>();
  for (const [type, deps] of graph) {
    depCount.set(type, deps.size);
  }

  const queue: string[] = [];
  for (const [type, count] of depCount) {
    if (count === 0) queue.push(type);
  }

  const result: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    // Find types that depend on current and reduce their dep count
    for (const [type, deps] of graph) {
      if (deps.has(current)) {
        const newCount = depCount.get(type)! - 1;
        depCount.set(type, newCount);
        if (newCount === 0) {
          queue.push(type);
        }
      }
    }
  }

  // If there are types not in result (circular deps), add them at the end
  for (const type of allTypes) {
    if (!result.includes(type)) {
      result.push(type);
    }
  }

  // Put single types first
  const singleTypes: string[] = [];
  const collectionTypes: string[] = [];
  for (const type of result) {
    const schema = schemas.get(type);
    if (schema?.kind === 'singleType') {
      singleTypes.push(type);
    } else {
      collectionTypes.push(type);
    }
  }

  return [...singleTypes, ...collectionTypes];
};

// --- Media Migration ---

const migrateMedia = async (
  mediaAssets: MediaAsset[],
  report: MigrationReport,
): Promise<Map<string, { strapiId: number; strapiUrl: string }>> => {
  const mediaMap = new Map<string, { strapiId: number; strapiUrl: string }>();

  if (mediaAssets.length === 0) {
    console.log('No media assets to migrate.');
    return mediaMap;
  }

  fs.mkdirSync(MEDIA_TMP_DIR, { recursive: true });
  console.log(`Downloading ${mediaAssets.length} media assets...`);

  for (const asset of mediaAssets) {
    const filename = sanitizeFilename(asset.originalUrl);
    const localPath = path.join(MEDIA_TMP_DIR, filename);

    // Download if not already cached
    if (!fs.existsSync(localPath)) {
      try {
        await downloadFile(asset.originalUrl, localPath);
        console.log(`  Downloaded: ${filename}`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`  Failed to download: ${asset.originalUrl} - ${errorMsg}`);
        report.media.push({
          originalUrl: asset.originalUrl,
          status: 'failed',
          error: `Download failed: ${errorMsg}`,
        });
        report.summary.mediaFailed++;
        continue;
      }
    } else {
      console.log(`  Cached: ${filename}`);
    }

    // Upload to Strapi
    try {
      const fileBuffer = fs.readFileSync(localPath);
      const formData = new FormData();
      // Pass mime explicitly; without it the Blob defaults to '' which the
      // multipart parser turns into application/octet-stream. Strapi stores
      // that mime verbatim, and the admin Media Library's image filter then
      // hides the file.
      const mime = asset.mimeType || mimeFromFilename(filename);
      const blob = new Blob([fileBuffer], { type: mime });
      formData.append('files', blob, filename);
      formData.append(
        'fileInfo',
        JSON.stringify({
          alternativeText: asset.alt || '',
          caption: '',
        }),
      );

      const uploadUrl = `${STRAPI_URL}/api/upload`;
      const headers: Record<string, string> = {};
      if (API_TOKEN) {
        headers['Authorization'] = `Bearer ${API_TOKEN}`;
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const uploadResult = (await response.json()) as Array<{
        id: number;
        url: string;
      }>;
      const uploaded = uploadResult[0];

      mediaMap.set(asset.originalUrl, {
        strapiId: uploaded.id,
        strapiUrl: uploaded.url,
      });

      report.media.push({
        originalUrl: asset.originalUrl,
        status: 'uploaded',
        strapiId: uploaded.id,
        strapiUrl: uploaded.url,
      });
      report.summary.mediaUploaded++;
      console.log(`  Uploaded: ${filename} -> ID ${uploaded.id}`);

      await delay(MEDIA_RATE_LIMIT_DELAY_MS);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`  Failed to upload: ${filename} - ${errorMsg}`);
      report.media.push({
        originalUrl: asset.originalUrl,
        status: 'failed',
        error: `Upload failed: ${errorMsg}`,
      });
      report.summary.mediaFailed++;
    }
  }

  return mediaMap;
};

// --- Entry Migration ---

const checkEntryExists = async (
  pluralName: string,
  slug: string,
  fieldName: string = 'slug',
): Promise<{ exists: boolean; documentId?: string }> => {
  try {
    const result = (await fetchJSON(
      `/api/${pluralName}?filters[${fieldName}][$eq]=${encodeURIComponent(slug)}`,
    )) as { data: Array<{ documentId: string }> };
    if (result.data && result.data.length > 0) {
      return { exists: true, documentId: result.data[0].documentId };
    }
  } catch {
    // If the query fails, assume entry does not exist
  }
  return { exists: false };
};

const replaceMediaUrls = (
  content: string,
  mediaMap: Map<string, { strapiId: number; strapiUrl: string }>,
): string => {
  let result = content;
  for (const [originalUrl, media] of mediaMap) {
    result = result.replaceAll(originalUrl, media.strapiUrl);
  }
  return result;
};

// --- Main ---

const main = async (): Promise<void> => {
  console.log('=== Content Migration Runner ===\n');

  // Validate inputs
  if (!API_TOKEN) {
    console.error(
      'Error: API token required. Pass --token <token> or set STRAPI_API_TOKEN.',
    );
    process.exit(1);
  }

  const inventoryPath = path.join(PROJECT_ROOT, 'content-inventory.json');
  if (!fs.existsSync(inventoryPath)) {
    console.error('Error: content-inventory.json not found at project root.');
    process.exit(1);
  }

  // Verify Strapi connection
  try {
    await fetchJSON('/_health');
    console.log(`Connected to Strapi at ${STRAPI_URL}\n`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`Error: Cannot connect to Strapi at ${STRAPI_URL}: ${errorMsg}`);
    process.exit(1);
  }

  // Load inputs
  const inventory = JSON.parse(
    fs.readFileSync(inventoryPath, 'utf-8'),
  ) as ContentInventory;
  const schemas = loadContentTypeSchemas();
  const dependencyOrder = buildDependencyOrder(schemas);

  console.log(`Content types in migration order: ${dependencyOrder.join(', ')}`);
  console.log(`Pages to process: ${inventory.pages.length}`);
  console.log(`Media assets: ${inventory.media?.length || 0}\n`);

  // Initialize report
  const report: MigrationReport = {
    version: '1.0.0',
    migratedAt: new Date().toISOString(),
    strapiUrl: STRAPI_URL,
    summary: {
      totalEntries: 0,
      created: 0,
      skipped: 0,
      failed: 0,
      mediaUploaded: 0,
      mediaFailed: 0,
    },
    entries: [],
    media: [],
  };

  // Step 1: Migrate media
  const mediaMap = await migrateMedia(inventory.media || [], report);
  console.log(`\nMedia migration complete: ${mediaMap.size} uploaded\n`);

  // Step 2: Create entries in dependency order
  // This is a simplified entry creation loop. In practice, the agent
  // should map content-inventory sections to content types intelligently.
  // This script provides the framework; the agent adapts it to the
  // specific content structure.

  console.log('Creating entries...\n');

  for (const pluralName of dependencyOrder) {
    const schema = schemas.get(pluralName);
    if (!schema) continue;

    console.log(`--- ${schema.info.displayName} (${pluralName}) ---`);

    // Determine the slug field name
    const slugField = Object.entries(schema.attributes).find(
      ([, attr]) => attr.type === 'uid',
    );
    const identifierField = slugField ? slugField[0] : 'title';

    if (schema.kind === 'singleType') {
      // Single types: check and update
      try {
        const existing = (await fetchJSON(`/api/${schema.info.singularName}`)) as {
          data: Record<string, unknown> | null;
        };
        if (existing.data) {
          console.log(`  Single type already has content, skipping.`);
          report.entries.push({
            contentType: pluralName,
            slug: schema.info.singularName,
            status: 'skipped',
            reason: 'Single type already has content',
          });
          report.summary.skipped++;
        }
      } catch {
        console.log(`  Single type not yet populated.`);
        // Would create content here — agent fills in the data mapping
      }
      report.summary.totalEntries++;
      continue;
    }

    // Collection types: process page sections that match this content type
    // The agent should customize this mapping based on the actual content structure
    console.log(`  (Agent should map content-inventory entries to ${pluralName})`);
    await delay(RATE_LIMIT_DELAY_MS);
  }

  // Write report
  const reportPath = path.join(PROJECT_ROOT, 'migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n=== Migration Complete ===`);
  console.log(`Report written to: ${reportPath}`);
  console.log(`  Total: ${report.summary.totalEntries}`);
  console.log(`  Created: ${report.summary.created}`);
  console.log(`  Skipped: ${report.summary.skipped}`);
  console.log(`  Failed: ${report.summary.failed}`);
  console.log(`  Media uploaded: ${report.summary.mediaUploaded}`);
  console.log(`  Media failed: ${report.summary.mediaFailed}`);
};

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
