/**
 * Manual KB sync runner. Usage:
 *
 *   npm run sync:elevenlabs -- --mode=delta
 *   npm run sync:elevenlabs -- --mode=full
 *   npm run sync:elevenlabs -- --clear
 *   npm run sync:elevenlabs -- --type=api::home-page.home-page
 *   npm run sync:elevenlabs -- --type=api::restaurant.restaurant --doc-id=abc123
 *
 * Boots Strapi programmatically, runs the elevenlabs-chatbot plugin's sync
 * service, prints a summary.
 */

import { createStrapi } from '@strapi/strapi';

interface CliArgs {
  mode: 'delta' | 'full' | 'one' | 'clear';
  type?: string;
  docId?: string;
}

interface SyncResult {
  documentName: string;
  status: 'created' | 'updated' | 'skipped' | 'deleted' | 'error';
  documentId?: string;
  error?: string;
}

interface SyncService {
  syncEntry: (strapi: unknown, uid: string, documentId?: string) => Promise<SyncResult>;
  syncAllDelta: (strapi: unknown) => Promise<SyncResult[]>;
  syncAllFull: (strapi: unknown) => Promise<SyncResult[]>;
  clearAll: (strapi: unknown) => Promise<{ deleted: number }>;
}

function parseArgs(argv: string[]): CliArgs {
  const out: Partial<CliArgs> = {};
  for (const arg of argv) {
    const [k, v] = arg.startsWith('--') ? arg.slice(2).split('=') : ['', ''];
    if (k === 'mode' && (v === 'delta' || v === 'full')) out.mode = v;
    if (k === 'clear') out.mode = 'clear';
    if (k === 'type') out.type = v;
    if (k === 'doc-id') out.docId = v;
  }
  if (out.type) out.mode = 'one';
  out.mode = out.mode ?? 'delta';
  return out as CliArgs;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  console.log(`[sync-elevenlabs] starting with`, args);

  const strapi = await createStrapi().load();
  const sync = strapi.plugin('elevenlabs-chatbot').service('sync') as SyncService;

  try {
    if (args.mode === 'clear') {
      const r = await sync.clearAll(strapi);
      console.log(`[sync-elevenlabs] cleared ${r.deleted} remote doc(s)`);
      return;
    }
    if (args.mode === 'one') {
      if (!args.type) throw new Error('--type required for single sync');
      const r = await sync.syncEntry(strapi, args.type, args.docId);
      console.log(`[sync-elevenlabs] ${r.status}: ${r.documentName}${r.documentId ? ' (' + r.documentId + ')' : ''}${r.error ? ' — ' + r.error : ''}`);
      return;
    }
    const fn = args.mode === 'full' ? sync.syncAllFull : sync.syncAllDelta;
    const results = await fn(strapi);
    const counts = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {});
    console.log(`[sync-elevenlabs] done: ${JSON.stringify(counts)}`);
    const errors = results.filter((r) => r.status === 'error');
    if (errors.length > 0) {
      console.log(`[sync-elevenlabs] errors:`);
      for (const e of errors) console.log(`  - ${e.documentName}: ${e.error}`);
    }
  } finally {
    await strapi.destroy();
  }
}

main().catch((err) => {
  console.error('[sync-elevenlabs] fatal:', err);
  process.exit(1);
});
