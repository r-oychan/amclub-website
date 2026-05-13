#!/usr/bin/env node
/**
 * One-off: drop slide index 0 (the "A Home Away From Home" image) from the
 * deployed home-page hero, keeping the remaining slides intact.
 *   node scripts/trim-hero-slides.mjs [--dry-run]
 */
import { initEnv, api, isDryRun } from './seed-helpers.mjs';

const DRY = isDryRun();
const ctx = initEnv();

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);

  const current = await api(
    ctx,
    '/home-page?populate[hero][populate][slides][populate][backgroundImage]=true&populate[hero][populate][slides][populate][backgroundVideo]=true&populate[hero][populate][slides][populate][cta]=true',
    { method: 'GET' },
  );
  const hero = current?.data?.hero;
  const slides = hero?.slides ?? [];
  console.log(`Current slides: ${slides.length}`);
  slides.forEach((s, i) => console.log(`  [${i}] id=${s.id} title=${JSON.stringify(s.title)}`));

  if (slides.length <= 2) {
    console.log('Nothing to trim — already <= 2 slides.');
    return;
  }

  const trimmed = slides.slice(1).map((s) => ({
    backgroundImage: s.backgroundImage?.id ?? null,
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
        slides: trimmed,
      },
    },
  };

  if (DRY) {
    console.log('\n[dry] PUT /home-page payload:');
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  await api(ctx, '/home-page', { method: 'PUT', body: JSON.stringify(payload) });
  console.log(`  ✓ home-page hero trimmed to ${trimmed.length} slides`);
}

main().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});
