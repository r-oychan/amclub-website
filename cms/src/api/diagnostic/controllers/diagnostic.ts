export default {
  async schema(ctx: any) {
    const components = (strapi as any).components ?? {};
    const heroSlide = components['shared.hero-slide'];
    const attrs = heroSlide?.attributes ?? null;

    // Inspect storage of a slide's morph rows for backgroundVideo
    let morphCheck: any = { error: 'no knex' };
    try {
      const knex = (strapi as any).db?.connection;
      if (knex) {
        // Look for the morph row table for hero-slide media
        const tables = await knex('information_schema.tables')
          .select('table_name')
          .where('table_name', 'like', 'files%');
        const slideRows = await knex('components_shared_hero_slides').select('id').limit(5);
        // Strapi v5 morph table name pattern
        const morph = await knex('files_related_mph')
          .select('*')
          .where({ related_type: 'shared.hero-slide' })
          .limit(20)
          .catch((e: Error) => ({ __error: e.message }));
        morphCheck = {
          fileTables: tables.map((t: any) => t.table_name),
          slideIds: slideRows.map((r: any) => r.id),
          morphRows: morph,
        };
      }
    } catch (e) {
      morphCheck = { error: (e as Error).message };
    }

    ctx.body = {
      heroSlideAttrs: attrs ? Object.keys(attrs) : null,
      backgroundVideoAttr: attrs?.backgroundVideo ?? null,
      morphCheck,
    };
  },
};
