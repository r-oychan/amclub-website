#!/usr/bin/env node
// SEED_ENV=dev node scripts/seed-crawler-settings.mjs [--dry-run]
// Create once. Never overwrite an editor's existing crawler rules or summary.
import { api, initEnv, isDryRun } from './seed-helpers.mjs';

const ctx = initEnv();
const data = {
  allowIndexing: true,
  sitemapEnabled: true,
  llmsEnabled: true,
  // Title/summary inherit published site-config and page content.
  robotsRules: [{ userAgent: '*', allowPaths: '', disallowPaths: '' }],
  excludedPaths: '',
};
if (isDryRun()) {
  console.log('[dry] Create crawler-settings only if absent:', JSON.stringify(data));
} else {
  const existing = await api(ctx, '/crawler-settings?status=draft&populate=robotsRules').catch((error) => {
    if (error instanceof Error && error.message.includes('→ 404:')) return null;
    throw error;
  });
  if (existing?.data) console.log('Crawler settings already exist; preserved editor values.');
  else {
    await api(ctx, '/crawler-settings?status=published', { method: 'PUT', body: { data } });
    const published = await api(ctx, '/crawler-settings?status=published');
    if (!published?.data?.publishedAt) throw new Error('Crawler settings were not published');
    console.log('Created and published crawler settings. Indexing still requires the deployment gate.');
  }
}
