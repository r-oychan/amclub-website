#!/usr/bin/env node
// Move the Kids page's QuadSection (3 quad venue cards) and ChildSafetySection
// (badge + heading + body + 3 feature labels + bg image) out of the hardcoded
// React components into the CMS (kids-page.quadSection / kids-page.childSafety).
// Decorative SVG icons stay inline in the component, matched to the CMS feature
// labels by order. SET-ONLY-IF-EMPTY; safe to re-run.
//
// Usage:
//   node scripts/patch-2026-06-16-kids-quad-safety.mjs --env=dev [--dry-run]
//   node scripts/patch-2026-06-16-kids-quad-safety.mjs --env=uat

import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, uploadFile, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const IMG = join(ROOT, 'frontend', 'public', 'images', 'kids');
const DRY = isDryRun();
const ctx = initEnv();
const lines = (...xs) => xs.map((text) => ({ text }));

(async () => {
  console.log(`Patch target: ${ctx.BASE}`);
  const res = await api(ctx, '/kids-page?populate[quadSection]=*&populate[childSafety]=*');
  const page = res?.data;
  if (!page) { console.log('  ! kids-page singleton not found'); return; }

  const data = {};
  const hasQuad = page.quadSection?.cards?.length;
  const hasSafety = !!page.childSafety;

  if (hasQuad && hasSafety) { console.log('  ✓ quadSection + childSafety already set — skip'); return; }
  if (DRY) { console.log(`  [dry] would set ${!hasQuad ? 'quadSection ' : ''}${!hasSafety ? 'childSafety' : ''}`); return; }

  if (!hasQuad) {
    const poolside = await uploadFile(ctx, join(IMG, 'quadpoolside.jpeg'), { path: 'kids/quad' });
    const quad = await uploadFile(ctx, join(IMG, 'quad-card.jpeg'), { path: 'kids/quad' });
    const studios = await uploadFile(ctx, join(IMG, 'quadstudio.jpeg'), { path: 'kids/quad' });
    data.quadSection = {
      cards: [
        {
          heading: 'The Quad Poolside',
          description: 'A safe, imaginative play space perfect for curious kids below 6 years old.',
          image: poolside?.id ?? null,
          imageAlt: 'The Quad Poolside',
          cta: { label: 'Learn More', href: '/kids/the-quad-poolside' },
        },
        {
          heading: 'The Quad',
          description:
            'A dynamic play zone packed with arcade games, interactive challenges, and endless fun for kids 6 years old and above.',
          image: quad?.id ?? null,
          imageAlt: 'The Quad',
          cta: { label: 'Learn More', href: '/kids/the-quad' },
        },
        {
          heading: 'The Quad Studios',
          description:
            "Where learning meets celebration – home to kids' recreational classes and a versatile party space for their most special moments.",
          image: studios?.id ?? null,
          imageAlt: 'The Quad Studios',
          cta: { label: 'Learn More', href: '/kids/the-quad-studios' },
        },
      ],
    };
  }

  if (!hasSafety) {
    const logo = await uploadFile(ctx, join(IMG, 'safety', 'childsafeguarding-logo.png'), { path: 'kids/safety' });
    const bg = await uploadFile(ctx, join(IMG, 'safety', 'climbing-wall.jpg'), { path: 'kids/safety' });
    data.childSafety = {
      badgeLabel: 'Recognized Company',
      badgeLogo: logo?.id ?? null,
      heading: "Your Child's Safety Is Our Priority",
      body:
        'All instructors and supervisors are certified professionals, and low child-to-staff ratios ensure personalized attention and close supervision. Comprehensive safety procedures and on-site, first-aid-trained staff further support a safe, secure environment.',
      backgroundImage: bg?.id ?? null,
      features: lines(
        'Trained & Certified Team Members',
        'Dedicated Attention & Supervision',
        'Safe & Secure Environment',
      ),
    };
  }

  data.publishedAt = new Date().toISOString();
  await api(ctx, '/kids-page?status=published', { method: 'PUT', body: { data } });
  console.log(`  ✓ kids-page: set ${Object.keys(data).filter((k) => k !== 'publishedAt').join(', ')}`);
  console.log('\n✓ Done.');
})().catch((e) => { console.error(e); process.exit(1); });
