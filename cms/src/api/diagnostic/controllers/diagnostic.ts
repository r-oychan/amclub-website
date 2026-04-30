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
        const slides = await knex('components_shared_hero_slides').select('*');
        const morph = await knex('files_related_mph')
          .select('*')
          .where({ related_type: 'shared.hero-slide' });

        // Inspect home-page hero linkage. The home-page document holds slides
        // through a *_cmps junction table; we want to verify which slide IDs
        // are actually attached to the published home-page (not just orphan
        // component rows from old saves).
        const cmpsTables = await knex('information_schema.tables')
          .select('table_name')
          .where('table_name', 'like', '%hero%cmps')
          .orWhere('table_name', 'like', '%home_page%cmps')
          .orWhere('table_name', 'like', 'components_shared_heros%');
        const homepageRows = await knex('home_pages').select('*').limit(10);
        // Heros (the parent component for hero) cmps table
        const herosCmps = await knex('components_shared_heros_cmps')
          .select('*')
          .catch((e: Error) => ({ __error: e.message }));

        morphCheck = {
          slideCount: slides.length,
          slides: slides.map((s: any) => ({ id: s.id, title: s.title })),
          morphRows: morph,
          cmpsTables: cmpsTables.map((t: any) => t.table_name),
          homepageRows: homepageRows.map((h: any) => ({
            id: h.id,
            document_id: h.document_id,
            published_at: h.published_at,
            locale: h.locale,
          })),
          herosCmps,
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
