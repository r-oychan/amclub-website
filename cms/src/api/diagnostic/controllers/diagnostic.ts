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

    // Fetch home-page through Strapi's own documents API with deep populate
    // and log slide 0's full content + the cmps junction rows that connect
    // hero → slides for both the draft and published variants.
    let docCheck: any = null;
    try {
      const draft = await (strapi as any).documents('api::home-page.home-page').findFirst({
        status: 'draft',
        populate: { hero: { populate: { slides: { populate: '*' } } } },
      });
      const published = await (strapi as any).documents('api::home-page.home-page').findFirst({
        status: 'published',
        populate: { hero: { populate: { slides: { populate: '*' } } } },
      });
      const knex = (strapi as any).db?.connection;
      const heroes = knex
        ? await knex('components_blocks_heroes_cmps').select('*')
        : null;
      const homepagesCmps = knex
        ? await knex('home_pages_cmps').select('*').where('component_type', 'shared.hero')
        : null;
      docCheck = {
        draft: draft
          ? {
              id: draft.id,
              documentId: draft.documentId,
              publishedAt: draft.publishedAt,
              slide0Keys: Object.keys(draft.hero?.slides?.[0] ?? {}),
              slide0BackgroundVideo: draft.hero?.slides?.[0]?.backgroundVideo ?? null,
            }
          : null,
        published: published
          ? {
              id: published.id,
              documentId: published.documentId,
              publishedAt: published.publishedAt,
              slide0Keys: Object.keys(published.hero?.slides?.[0] ?? {}),
              slide0BackgroundVideo: published.hero?.slides?.[0]?.backgroundVideo ?? null,
            }
          : null,
        heroesCmps: heroes,
        homepagesCmps,
      };
    } catch (e) {
      docCheck = { error: (e as Error).message };
    }

    // Look at the public-role permission row for home-page.find — Strapi v5
    // attaches a `properties.fields` whitelist when the permission is granted
    // through the admin, and any field added later is silently sanitized out
    // of the REST response.
    let permCheck: any = null;
    try {
      const publicRole = await (strapi as any).db
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: 'public' } });
      if (publicRole) {
        const perms = await (strapi as any).db
          .query('plugin::users-permissions.permission')
          .findMany({
            where: {
              role: publicRole.id,
              action: { $in: ['api::home-page.home-page.find', 'api::home-page.home-page.findOne'] },
            },
          });
        permCheck = perms.map((p: any) => ({
          action: p.action,
          properties: p.properties,
        }));
      }
    } catch (e) {
      permCheck = { error: (e as Error).message };
    }

    ctx.body = {
      heroSlideAttrs: attrs ? Object.keys(attrs) : null,
      backgroundVideoAttr: attrs?.backgroundVideo ?? null,
      morphCheck,
      docCheck,
      permCheck,
    };
  },
};
