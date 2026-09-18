#!/usr/bin/env node
// Cross-content-type draft report — the global "what's unpublished?" view the
// Strapi admin does not provide. The Content Manager can filter by status, but
// only one content type at a time; with 40 draftAndPublish types on this
// project that is 40 manual passes.
//
// Reports two states per document:
//   DRAFT    — no published version exists (never published)
//   MODIFIED — a published version exists, but the draft is newer
//
// IMPORTANT (Strapi v5 semantics): every document has BOTH a draft and a
// published version, and the draft version always carries `publishedAt: null`.
// So `?status=draft` is NOT a list of unpublished work — it returns the draft
// version of every document, published ones included. The only correct way to
// classify is to fetch both lists and compare by documentId + updatedAt, which
// is what this script does.
//
// Read-only: issues GETs only, never writes.
//
// Usage:
//   node scripts/list-drafts.mjs --env=prod
//   node scripts/list-drafts.mjs --env=dev --all      # include clean types
//   node scripts/list-drafts.mjs --env=uat --json     # machine-readable

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SHOW_ALL = process.argv.includes('--all');
const AS_JSON = process.argv.includes('--json');

// Resolved in main() rather than at module scope, so importing this file for
// tests does not require an env file (initEnv exits the process when missing).
let ctx;

const PAGE_SIZE = 100;

/** Read every content type off disk — the source of truth for what to sweep. */
function contentTypes() {
  const dir = join(ROOT, 'cms', 'src', 'api');
  const out = [];
  for (const apiName of readdirSync(dir)) {
    const ctDir = join(dir, apiName, 'content-types');
    if (!existsSync(ctDir)) continue;
    for (const t of readdirSync(ctDir)) {
      const f = join(ctDir, t, 'schema.json');
      if (!existsSync(f)) continue;
      const s = JSON.parse(readFileSync(f, 'utf8'));
      if (!s.options?.draftAndPublish) continue;
      out.push({
        kind: s.kind,
        singular: s.info.singularName,
        plural: s.info.pluralName,
        display: s.info.displayName || s.info.singularName,
      });
    }
  }
  return out.sort((a, b) => a.display.localeCompare(b.display));
}

/** Best-effort human label for an entry. */
const labelOf = (e) =>
  e.name || e.title || e.heading || e.label || e.slug || `#${e.id ?? e.documentId}`;

/** Fetch every page of one status for a type. Returns [] on 403/404. */
async function fetchAll({ kind, plural, singular }, status) {
  const path = kind === 'singleType' ? singular : plural;
  const rows = [];
  let page = 1;
  for (;;) {
    let res;
    try {
      res = await api(
        ctx,
        `/${path}?status=${status}&pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}&sort=updatedAt:desc`,
      );
    } catch (e) {
      // 404 = single type never created; 403 = token lacks find permission.
      const m = String(e.message);
      if (/→ (403|404)/.test(m)) return { rows: [], skipped: m.includes('403') ? 'no permission' : 'not created' };
      throw e;
    }
    const data = res?.data;
    if (!data) break;
    if (!Array.isArray(data)) { rows.push(data); break; } // single type
    rows.push(...data);
    const pageCount = res?.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
    page += 1;
  }
  return { rows };
}

/**
 * Split draft-version rows into DRAFT (no published counterpart) and MODIFIED
 * (published counterpart exists but the draft is newer).
 *
 * Pure and exported so the classification can be unit-tested without hitting an
 * environment — the MODIFIED branch is rare in practice and would otherwise
 * ship unexercised. See list-drafts.test.mjs.
 */
export function classifyDocuments(draftRows, publishedRows) {
  const pubByDoc = new Map(publishedRows.map((e) => [e.documentId, e]));
  const drafts = [];
  const modified = [];
  for (const d of draftRows) {
    const p = pubByDoc.get(d.documentId);
    if (!p) { drafts.push(d); continue; }
    // Compare at second granularity — publishing rewrites both rows, and
    // sub-second skew between them is noise, not a real pending edit.
    const dt = Math.floor(new Date(d.updatedAt).getTime() / 1000);
    const pt = Math.floor(new Date(p.updatedAt).getTime() / 1000);
    if (dt > pt) modified.push(d);
  }
  return { drafts, modified };
}

/** Classify one content type by fetching both status views and comparing. */
async function inspect(type) {
  const [draft, published] = await Promise.all([fetchAll(type, 'draft'), fetchAll(type, 'published')]);
  if (draft.skipped) return { type, skipped: draft.skipped, drafts: [], modified: [], total: 0 };
  const { drafts, modified } = classifyDocuments(draft.rows, published.rows);
  return { type, drafts, modified, total: draft.rows.length };
}

const fmt = (d) => (d ? new Date(d).toISOString().replace('T', ' ').slice(0, 16) : '—');

async function main() {
  // initEnv() prints a "Seed target" banner on stdout. In --json mode that
  // would corrupt the payload, so divert its logging to stderr and keep stdout
  // parseable.
  if (AS_JSON) {
    const orig = console.log;
    console.log = console.error;
    try { ctx = initEnv(); } finally { console.log = orig; }
  } else {
    ctx = initEnv();
  }
  const types = contentTypes();
  if (!AS_JSON) console.log(`Sweeping ${types.length} draftAndPublish content types…\n`);

  const results = [];
  for (const t of types) results.push(await inspect(t));

  if (AS_JSON) {
    console.log(JSON.stringify(
      results.map((r) => ({
        contentType: r.type.singular,
        kind: r.type.kind,
        skipped: r.skipped ?? null,
        total: r.total,
        draft: r.drafts.map((e) => ({ documentId: e.documentId, label: labelOf(e), updatedAt: e.updatedAt })),
        modified: r.modified.map((e) => ({ documentId: e.documentId, label: labelOf(e), updatedAt: e.updatedAt })),
      })),
      null, 2,
    ));
    return;
  }

  let nDraft = 0, nMod = 0, nSkipped = 0;
  for (const r of results) {
    const pending = r.drafts.length + r.modified.length;
    nDraft += r.drafts.length;
    nMod += r.modified.length;
    if (r.skipped) nSkipped += 1;

    if (!pending && !SHOW_ALL) continue;
    const tag = r.type.kind === 'singleType' ? 'single' : 'collection';
    if (r.skipped) { console.log(`${r.type.display}  (${tag})  — skipped: ${r.skipped}`); continue; }
    if (!pending) { console.log(`${r.type.display}  (${tag})  ✓ clean  [${r.total} entries]`); continue; }

    console.log(`${r.type.display}  (${tag})  ${r.drafts.length} draft, ${r.modified.length} modified  [${r.total} entries]`);
    for (const e of r.drafts)   console.log(`    DRAFT     ${fmt(e.updatedAt)}  ${labelOf(e)}`);
    for (const e of r.modified) console.log(`    MODIFIED  ${fmt(e.updatedAt)}  ${labelOf(e)}`);
    console.log('');
  }

  console.log('─'.repeat(60));
  console.log(`${nDraft} never published, ${nMod} with unpublished changes, across ${types.length} types.`);
  if (nSkipped) console.log(`${nSkipped} type(s) skipped (not created or no read permission) — re-run with --all to list them.`);
  if (!nDraft && !nMod) console.log('Everything is published and up to date.');
}

// Only sweep when run directly — importing for tests must not hit the network.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
