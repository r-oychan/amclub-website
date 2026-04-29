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
    };
  },
};
