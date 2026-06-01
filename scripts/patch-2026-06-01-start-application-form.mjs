// 2026-06-01 follow-up — add Visiting Membership Application Form to
// the start-application facility's downloads.items in Strapi. Frontend
// subpages.ts fallback already has it, but Strapi's downloads list wins
// in the VenueDetailPage merge, so the form wasn't appearing on the
// live page until this Strapi write.
//
// Also restores Camp Eagle's <br /> separator — now that rehype-raw is
// in the markdown pipeline, the inline HTML renders properly instead
// of showing as literal text.

import { initEnv, api, findOneBySlug } from './seed-helpers.mjs';

const ctx = initEnv();
const DRY = process.argv.includes('--dry-run');

const stripId = (c) => ({
  label: c.label, href: c.href, caption: c.caption ?? null,
  isExternal: c.isExternal, bordered: c.bordered, variant: c.variant, icon: c.icon,
});

const NEW_FORM = {
  label: 'Visiting Membership Application Form',
  href: 'https://amclub.jotform.com/260038799703970',
  caption: null,
  isExternal: true,
  bordered: false,
  variant: 'outline',
  icon: 'arrow',
};

const CAMP_EAGLE_BODY_WITH_BR =
  'Members: $140 per day | $700 per week\n' +
  'Guests: $160 per day | $800 per week\n\n' +
  '4-7 years old\n' +
  'Time: 9:00 AM – 3:00 PM\n<br />\n' +
  '8 years old and above\n' +
  'Time: 8:30 AM – 3:00 PM';

async function main() {
  console.log(`[patch-2026-06-01-start-application-form] target=${ctx.BASE} dry=${DRY}`);

  // ---- 1) start-application facility downloads ----
  console.log('\n[1] start-application — append Visiting Membership Application Form to downloads.items');
  const r = await api(
    ctx,
    '/facilities?filters[slug][$eq]=start-application&populate[downloads][populate]=*&pagination[limit]=1',
  );
  const f = r?.data?.[0];
  if (!f) {
    console.log('  ✗ start-application facility not found');
  } else {
    const existing = f.downloads?.items || [];
    const hasVisiting = existing.some((it) => /visiting membership/i.test(it.label || ''));
    if (hasVisiting) {
      console.log('  = already in list — skip');
    } else {
      const newItems = [...existing.map(stripId), NEW_FORM];
      const payload = {
        downloads: {
          heading: f.downloads?.heading ?? "Forms You'll Need",
          items: newItems,
        },
      };
      if (DRY) {
        console.log(`  [dry] PUT — appending "${NEW_FORM.label}" (total items: ${newItems.length})`);
      } else {
        await api(ctx, `/facilities/${f.documentId}`, { method: 'PUT', body: { data: payload } });
        console.log(`  ✓ updated  total items=${newItems.length}`);
      }
    }
  }

  // ---- 2) Camp Eagle body — restore <br /> separator ----
  console.log('\n[2] camp-eagle — restore <br /> separator between age groups');
  const ce = await api(
    ctx,
    '/events?filters[slug][$eq]=camp-eagle-explorers-summer-2026&publicationState=preview&pagination[limit]=1',
  );
  const e = ce?.data?.[0];
  if (!e) {
    console.log('  ✗ camp-eagle event not found');
  } else if ((e.longDescription || '') === CAMP_EAGLE_BODY_WITH_BR) {
    console.log('  = already has <br /> — skip');
  } else if (DRY) {
    console.log('  [dry] PUT body with <br /> between age groups');
  } else {
    await api(ctx, `/events/${e.documentId}`, { method: 'PUT', body: { data: { longDescription: CAMP_EAGLE_BODY_WITH_BR } } });
    console.log('  ✓ updated — <br /> restored (rehype-raw now parses it as HTML)');
  }

  console.log('\n— done —');
}

main().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
