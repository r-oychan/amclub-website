// Seed events into Strapi from scripts/event-seed-data.json.
// - For each event: downloads the source image, uploads to Strapi (idempotent
//   by filename), resolves the category by slug, then upserts the event by slug.
//
// Run: node scripts/seed-events.mjs            (live)
//      node scripts/seed-events.mjs --dry-run  (no writes)
//
// Reads cms/.env.seed for STRAPI_BASE_URL + STRAPI_API_TOKEN.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, findOneBySlug, uploadFile, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_PATH = join(__dirname, 'event-seed-data.json');
const TMP_DIR = join(ROOT, '.event-image-cache');

const ctx = initEnv();
const DRY = isDryRun();

const sanitizeName = (s) =>
  String(s)
    .replace(/[?#].*$/, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

const decodeEntities = (s) => {
  if (typeof s !== 'string') return s;
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
};

// Normalise "8:00 p.m." / "10am" / "9 P.M." → "8:00 PM" / "10 AM" / "9 PM".
// Mirrors frontend/src/lib/events.ts so canonical CMS data is already clean.
const normalizeAmPm = (s) => {
  if (typeof s !== 'string') return s;
  return s
    .replace(/(\d)\s*([ap])\s*\.?\s*m\s*\.?/gi, (_m, d, ap) => `${d} ${ap.toUpperCase()}M `)
    .replace(/  +/g, ' ')
    .replace(/ ([.,;:!?)])/g, '$1')
    .trim();
};

const clean = (s) => normalizeAmPm(decodeEntities(s));

const cleanEvent = (ev) => ({
  ...ev,
  title: clean(ev.title),
  subtitle: clean(ev.subtitle),
  description: clean(ev.description),
  longDescription: clean(ev.longDescription),
  location: clean(ev.location),
  time: clean(ev.time),
  dressCode: clean(ev.dressCode),
  reservation: clean(ev.reservation),
});

// Best-effort: fetch the source event page and pull the og:image URL.
// Many WP themes drop og:image in &lt;meta&gt; tags even when the markdown-converted
// page omits inline images. Failures are non-fatal — fall back to no image.
async function findOgImage(pageUrl) {
  try {
    const res = await fetch(pageUrl, {
      headers: {
        // Pretend to be a modern browser so WP serves the full HTML.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const og =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (og) return og[1];
    // Fallback: scan body for wp-content/uploads images, skip known theme/template
    // assets (homepage bg, logo), prefer files matching event-banner naming
    // conventions or filed under 2024+ folders.
    const all = [
      ...html.matchAll(
        /https?:\/\/[^"'\s]+\/wp-content\/uploads\/[^"'\s]+\.(?:jpe?g|png|webp)/gi,
      ),
    ].map((m) => m[0]);
    const isTemplate = (u) =>
      /(Hompage-Background|Homepage-Background|TAC-Logo|TAC_Logo|placeholder|sprite|favicon)/i.test(u);
    const isFromRecentYear = (u) => /\/wp-content\/uploads\/202[4-6]\//.test(u);
    const banner = all.find((u) => !isTemplate(u) && /(EDM|Banner|Web-Banner)/i.test(u));
    if (banner) return banner;
    const recent = all.find((u) => !isTemplate(u) && isFromRecentYear(u));
    if (recent) return recent;
    return null;
  } catch {
    return null;
  }
}

async function downloadImage(imageUrl, slug) {
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });
  const ext = (extname(imageUrl.split('?')[0]) || '.jpg').toLowerCase();
  const localName = `event-${sanitizeName(slug)}${ext}`;
  const localPath = join(TMP_DIR, localName);
  if (existsSync(localPath)) return localPath;
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`fetch image ${imageUrl} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(localPath, buf);
  return localPath;
}

async function resolveCategoryId(slug) {
  if (!slug) return null;
  const cat = await findOneBySlug(ctx, 'event-categories', slug);
  if (!cat) {
    console.warn(`  ⚠ category slug "${slug}" not found in CMS — leaving relation empty`);
    return null;
  }
  return cat.documentId;
}

async function upsertEvent(ev, categoryId, mediaId) {
  const ctas = [];
  if (ev.registrationUrl && ev.registrationLabel) {
    ctas.push({
      label: ev.registrationLabel || 'Register',
      href: ev.registrationUrl,
      isExternal: /^https?:/i.test(ev.registrationUrl),
      icon: 'calendar',
      variant: 'primary',
    });
  }
  const data = {
    title: ev.title,
    subtitle: ev.subtitle || undefined,
    slug: ev.slug,
    description: ev.description || undefined,
    longDescription: ev.longDescription || undefined,
    date: ev.date,
    time: ev.time || undefined,
    location: ev.location || undefined,
    locationHref: ev.locationHref || undefined,
    dressCode: ev.dressCode || undefined,
    reservation: ev.reservation || undefined,
    featured: !!ev.featured,
    ...(categoryId ? { category: categoryId } : {}),
    ...(mediaId ? { image: mediaId } : {}),
    ...(ctas.length ? { ctas } : {}),
  };

  const existing = await findOneBySlug(ctx, 'events', ev.slug);
  if (DRY) {
    console.log(`  [dry] ${existing ? 'update' : 'create'} ${ev.slug}`);
    return;
  }
  if (existing) {
    await api(ctx, `/events/${existing.documentId}`, {
      method: 'PUT',
      body: { data },
    });
    console.log(`  ✓ ${ev.slug.padEnd(60)} updated`);
  } else {
    await api(ctx, `/events`, {
      method: 'POST',
      body: { data },
    });
    console.log(`  ✓ ${ev.slug.padEnd(60)} created`);
  }
}

async function main() {
  console.log(`[seed-events] BASE=${ctx.BASE} dry=${DRY}`);
  const raw = readFileSync(DATA_PATH, 'utf8');
  const events = JSON.parse(raw);
  if (!Array.isArray(events)) throw new Error('event-seed-data.json must be an array');
  console.log(`Loaded ${events.length} events from ${DATA_PATH}`);

  for (const rawEv of events) {
    const ev = cleanEvent(rawEv);
    if (!ev.slug || !ev.title || !ev.date) {
      console.warn(`  ⚠ skipping (missing slug/title/date):`, ev);
      continue;
    }
    let imageUrl = ev.imageUrl;
    if (!imageUrl && ev.url) {
      const og = await findOgImage(ev.url);
      if (og) {
        console.log(`  • ${ev.slug.padEnd(60)} og:image ${og.slice(0, 80)}…`);
        imageUrl = og;
      }
    }
    let mediaId = null;
    if (imageUrl && !DRY) {
      try {
        const localPath = await downloadImage(imageUrl, ev.slug);
        const media = await uploadFile(ctx, localPath);
        mediaId = media.id;
      } catch (e) {
        console.warn(`  ⚠ image upload failed for ${ev.slug}: ${e.message}`);
      }
    }
    const categoryId = await resolveCategoryId(ev.categorySlug);
    await upsertEvent(ev, categoryId, mediaId);
  }
  console.log('[seed-events] done');
}

main().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});
