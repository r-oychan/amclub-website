import fs from 'node:fs';
import path from 'node:path';

export default {
  async schema(ctx: any) {
    const components = (strapi as any).components ?? {};
    const heroSlide = components['shared.hero-slide'];
    const tabsSection = components['blocks.tabs-section'];

    const dirs = (strapi as any).dirs ?? {};
    const candidates = [
      dirs?.dist?.components && path.join(dirs.dist.components, 'shared', 'hero-slide.json'),
      dirs?.app?.components && path.join(dirs.app.components, 'shared', 'hero-slide.json'),
    ].filter(Boolean) as string[];

    const onDisk: Record<string, unknown> = {};
    for (const p of candidates) {
      try {
        onDisk[p] = JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch (e) {
        onDisk[p] = { __error: (e as Error).message };
      }
    }

    // Probe the DB: list columns of components_shared_hero_slides via Knex
    // and try to read its rows including the new backgroundVideo column.
    const dbDiagnostic: Record<string, unknown> = {};
    try {
      const knex = (strapi as any).db?.connection;
      if (knex) {
        const cols = await knex('information_schema.columns')
          .select('column_name')
          .where({ table_name: 'components_shared_hero_slides' });
        dbDiagnostic.columns = cols.map((c: any) => c.column_name);

        // List foreign-key/morph link tables that hold media references for this component
        const morphRows = await knex('information_schema.tables')
          .select('table_name')
          .where('table_name', 'like', 'components_shared_hero_slides%cmps')
          .orWhere('table_name', 'like', 'components_shared_hero_slides%lnk');
        dbDiagnostic.linkTables = morphRows.map((r: any) => r.table_name);

        // Try to fetch one component row and show all column values
        const sample = await knex('components_shared_hero_slides').select('*').limit(1);
        dbDiagnostic.sampleRow = sample[0] ?? null;
      } else {
        dbDiagnostic.error = 'no knex connection on strapi.db';
      }
    } catch (e) {
      dbDiagnostic.error = (e as Error).message;
    }

    ctx.body = {
      registered: Object.keys(components),
      heroSlide: heroSlide
        ? { attrs: Object.keys(heroSlide.attributes ?? {}), full: heroSlide.attributes }
        : null,
      tabsSection: tabsSection
        ? { attrs: Object.keys(tabsSection.attributes ?? {}), full: tabsSection.attributes }
        : null,
      dirs: { dist: dirs.dist, app: dirs.app },
      onDisk,
      db: dbDiagnostic,
    };
  },
};
