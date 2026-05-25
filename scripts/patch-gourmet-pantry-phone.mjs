// One-off patch: update The Gourmet Pantry restaurant's locationContact.phone.
//
// Run:  SEED_ENV=prod node scripts/patch-gourmet-pantry-phone.mjs
//   or  node scripts/patch-gourmet-pantry-phone.mjs --env=uat
//   or  node scripts/patch-gourmet-pantry-phone.mjs --env=dev
//
// Idempotent: reads current value, skips PUT if already correct.

import { initEnv, api, findOneBySlug } from './seed-helpers.mjs';

const NEW_PHONE = '6739 4407';
const SLUG = 'the-gourmet-pantry';

async function main() {
  const ctx = initEnv();

  const existing = await api(
    ctx,
    `/restaurants?filters[slug][$eq]=${SLUG}&populate[locationContact]=true&pagination[limit]=1`,
  );
  const tgp = existing?.data?.[0];
  if (!tgp) throw new Error(`Restaurant slug=${SLUG} not found.`);

  const lc = tgp.locationContact || {};
  console.log(`▸ Current locationContact:`, JSON.stringify(lc));

  if (lc.phone === NEW_PHONE) {
    console.log(`✓ Phone already ${NEW_PHONE}. No update needed.`);
    return;
  }

  // Strapi v5: do NOT send the component `id` from a GET response — it ties to
  // the document version, not the live component, and PUT 400s with
  // "Some of the provided components in locationContact are not related to the
  // entity". Sending the component without `id` replaces it in place.
  const payload = {
    locationContact: {
      locationLevel: lc.locationLevel ?? null,
      phone: NEW_PHONE,
      email: lc.email ?? null,
    },
  };

  console.log(`▸ Updating to phone=${NEW_PHONE}…`);
  await api(ctx, `/restaurants/${tgp.documentId}`, {
    method: 'PUT',
    body: { data: payload },
  });

  // Verify
  const verifyRes = await api(
    ctx,
    `/restaurants?filters[slug][$eq]=${SLUG}&populate[locationContact]=true&pagination[limit]=1`,
  );
  const after = verifyRes?.data?.[0]?.locationContact;
  console.log(`▸ After PUT  locationContact:`, JSON.stringify(after));

  if (after?.phone !== NEW_PHONE) {
    // Strapi v5 may have written to draft only — explicitly publish.
    console.log(`▸ Phone not yet on published version, calling publish action…`);
    await api(ctx, `/restaurants/${tgp.documentId}/actions/publish`, { method: 'POST' });
    const verify2 = await api(
      ctx,
      `/restaurants?filters[slug][$eq]=${SLUG}&populate[locationContact]=true&pagination[limit]=1`,
    );
    console.log(`▸ After publish locationContact:`, JSON.stringify(verify2?.data?.[0]?.locationContact));
  }

  console.log('✓ Done.');
}

main().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});
