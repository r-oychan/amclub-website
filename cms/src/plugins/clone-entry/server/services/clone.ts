// Clone an existing collection entry into a new draft. Strips identity,
// rewrites slug to `-copy[-N]`, and forces published=null so the editor
// can review before publishing. Media and relations are referenced
// (linked by id) — we don't duplicate uploads.

import type { Core } from '@strapi/strapi';

type Strapi = Core.Strapi;

interface CloneInput {
  uid: string;
  documentId: string;
  user?: { id: string | number };
}

interface CloneResult {
  uid: string;
  documentId: string;
  slug?: string;
  status: 'draft';
}

// Fields we never want to copy from the source entry.
const IDENTITY_FIELDS = new Set([
  'id',
  'documentId',
  'createdAt',
  'updatedAt',
  'publishedAt',
  'createdBy',
  'updatedBy',
  'locale',
  'localizations',
]);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Strip Strapi's internal identifiers from a populated entry so it can be
 * re-created. Components/dynamiczone items also carry `id` from the join
 * table — those must be dropped or Strapi tries to attach to existing
 * component rows and bails.
 */
function stripIdentity(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(stripIdentity);
  if (!isPlainObject(node)) return node;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) {
    if (IDENTITY_FIELDS.has(k)) continue;
    out[k] = stripIdentity(v);
  }
  return out;
}

/**
 * Build a deep populate map for the content type. We need every field
 * populated so the clone carries everything; components + dynamiczones
 * need explicit populate per attribute name.
 */
function buildDeepPopulate(strapi: Strapi, uid: string): Record<string, unknown> {
  const ct: any = (strapi.contentTypes as unknown as Record<string, unknown>)[uid];
  if (!ct?.attributes) return {};
  const populate: Record<string, unknown> = {};
  for (const [name, attr] of Object.entries(ct.attributes as Record<string, any>)) {
    const t = attr?.type;
    if (t === 'component') {
      populate[name] = { populate: '*' };
    } else if (t === 'dynamiczone') {
      populate[name] = { populate: '*' };
    } else if (t === 'media') {
      populate[name] = true;
    } else if (t === 'relation') {
      populate[name] = true;
    }
  }
  return populate;
}

/**
 * Find an unused slug for the clone. First attempt is `<source>-copy`,
 * then `-copy-2`, `-copy-3`, … until one is free. Bounded by 50 attempts
 * (would only be hit by intentional flooding).
 */
async function uniqueSlug(strapi: Strapi, uid: string, sourceSlug: string): Promise<string> {
  const base = `${sourceSlug}-copy`;
  for (let i = 0; i < 50; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const existing = await strapi.db.query(uid).findOne({ where: { slug: candidate } });
    if (!existing) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function cloneEntry(
  strapi: Strapi,
  { uid, documentId, user }: CloneInput,
): Promise<CloneResult> {
  const ct: any = (strapi.contentTypes as unknown as Record<string, unknown>)[uid];
  if (!ct) throw new Error(`Unknown content type: ${uid}`);
  if (ct.kind !== 'collectionType') {
    throw new Error(`Cloning singletons isn't supported: ${uid}`);
  }

  const populate = buildDeepPopulate(strapi, uid);
  const source = await strapi.documents(uid as any).findOne({ documentId, populate });
  if (!source) throw new Error(`Source entry not found: ${uid}/${documentId}`);

  const stripped = stripIdentity(source as Record<string, unknown>) as Record<string, unknown>;

  // Slug rewrite — most of our collections use a `slug` field; skip when
  // the schema doesn't have one (admin will surface a validation error
  // on save if there's a uniqueness collision on some other field).
  if (typeof stripped.slug === 'string' && stripped.slug) {
    stripped.slug = await uniqueSlug(strapi, uid, stripped.slug);
  }
  // Title visible-rename so the editor immediately sees this is a copy.
  if (typeof stripped.title === 'string' && stripped.title) {
    stripped.title = `${stripped.title} (copy)`;
  } else if (typeof stripped.name === 'string' && stripped.name) {
    stripped.name = `${stripped.name} (copy)`;
  }

  const created = (await strapi.documents(uid as any).create({
    data: stripped as any,
    status: 'draft',
  } as any)) as { documentId: string; slug?: string };

  strapi.log.info(
    `[clone-entry] ${uid}/${documentId} → ${created.documentId}` +
      (user ? ` (by user ${user.id})` : ''),
  );

  return {
    uid,
    documentId: created.documentId,
    slug: typeof stripped.slug === 'string' ? stripped.slug : undefined,
    status: 'draft',
  };
}
