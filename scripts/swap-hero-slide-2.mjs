#!/usr/bin/env node
/**
 * One-off: replace the backgroundImage of hero slide index 1 (the second
 * slide) on the deployed home-page with media/home/hero-slide-2-tennis.jpeg.
 *   node scripts/swap-hero-slide-2.mjs [--dry-run]
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initEnv, api, isDryRun } from './seed-helpers.mjs';

const DRY = isDryRun();
const ctx = initEnv();
const TENNIS_PATH = join(ctx.ROOT, 'media', 'home', 'hero-slide-2-tennis.jpeg');
const TENNIS_NAME = 'hero-slide-2-tennis.jpeg';

async function findUploadedByName(name) {
  const url = `${ctx.BASE}/api/upload/files?filters[name][$eq]=${encodeURIComponent(name)}`;
  const res = await fetch(url, { headers: ctx.auth });
  if (!res.ok) return null;
  const arr = await res.json();
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}

async function uploadFile(localPath, name) {
  const existing = await findUploadedByName(name);
  if (existing) {
    console.log(`  ↺ ${name} already uploaded → id=${existing.id}`);
    return existing;
  }
  const buf = readFileSync(localPath);
  const fd = new FormData();
  const blob = new Blob([buf]);
  fd.append('files', blob, name);
  const res = await fetch(`${ctx.BASE}/api/upload`, {
    method: 'POST',
    headers: ctx.auth,
    body: fd,
  });
  if (!res.ok) throw new Error(`upload ${name} → ${res.status}: ${await res.text()}`);
  const arr = await res.json();
  console.log(`  ✓ uploaded ${name} → id=${arr[0].id}`);
  return arr[0];
}

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);

  const current = await api(
    ctx,
    '/home-page?populate[hero][populate][slides][populate][backgroundImage]=true&populate[hero][populate][slides][populate][backgroundVideo]=true&populate[hero][populate][slides][populate][cta]=true&populate[hero][populate][cta]=true&populate[hero][populate][backgroundImage]=true',
    { method: 'GET' },
  );
  const hero = current?.data?.hero;
  const slides = hero?.slides ?? [];
  console.log(`Current slides: ${slides.length}`);
  slides.forEach((s, i) =>
    console.log(`  [${i}] title=${JSON.stringify(s.title)} bgImage=${s.backgroundImage?.name}`),
  );
  if (slides.length < 2) {
    console.log('Nothing to swap — fewer than 2 slides.');
    return;
  }

  let tennisId;
  if (DRY) {
    const existing = await findUploadedByName(TENNIS_NAME);
    tennisId = existing?.id ?? '<would-upload>';
  } else {
    const uploaded = await uploadFile(TENNIS_PATH, TENNIS_NAME);
    tennisId = uploaded.id;
  }

  const newSlides = slides.map((s, i) => ({
    backgroundImage: i === 1 ? tennisId : s.backgroundImage?.id ?? null,
    backgroundVideo: s.backgroundVideo?.id ?? null,
    title: s.title,
    subtitle: s.subtitle,
    titlePosition: s.titlePosition,
    subtitlePosition: s.subtitlePosition,
    cta: s.cta
      ? {
          label: s.cta.label,
          href: s.cta.href,
          isExternal: s.cta.isExternal,
          variant: s.cta.variant,
        }
      : undefined,
  }));

  const payload = {
    data: {
      hero: {
        heading: hero.heading,
        subheading: hero.subheading,
        variant: hero.variant,
        autoPlayInterval: hero.autoPlayInterval,
        titlePosition: hero.titlePosition,
        subtitlePosition: hero.subtitlePosition,
        backgroundImage: hero.backgroundImage?.id ?? null,
        cta: hero.cta
          ? {
              label: hero.cta.label,
              href: hero.cta.href,
              isExternal: hero.cta.isExternal,
              variant: hero.cta.variant,
              caption: hero.cta.caption,
              bordered: hero.cta.bordered,
              icon: hero.cta.icon,
            }
          : undefined,
        slides: newSlides,
      },
    },
  };

  if (DRY) {
    console.log(`\n[dry] tennis upload id: ${tennisId}`);
    console.log('[dry] PUT /home-page slide[1].backgroundImage →', tennisId);
    return;
  }

  await api(ctx, '/home-page', { method: 'PUT', body: JSON.stringify(payload) });
  console.log(`  ✓ slide[1] backgroundImage swapped → id=${tennisId}`);
}

main().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});
