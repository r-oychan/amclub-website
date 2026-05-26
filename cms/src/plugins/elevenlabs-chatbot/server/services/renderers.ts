/**
 * Block-to-markdown renderer registry.
 *
 * Each renderer takes the populated component attrs and returns a markdown
 * snippet. Phase 2 plugin exposes this as `register(componentName, renderFn)`
 * — the registry shape here is intentionally compatible.
 */

type RendererFn = (attrs: Record<string, unknown>) => string;

interface LinkAttrs {
  label?: string;
  href?: string;
  caption?: string;
}

const linkLine = (link: LinkAttrs | undefined | null): string => {
  if (!link?.label) return '';
  if (link.href) return `- ${link.label} → ${link.href}`;
  return `- ${link.label}`;
};

const linksList = (links: LinkAttrs[] | undefined | null): string =>
  (links ?? []).map(linkLine).filter(Boolean).join('\n');

const heading = (text: string | undefined | null, level = 2): string =>
  text ? `${'#'.repeat(level)} ${text}\n` : '';

const para = (text: string | undefined | null): string =>
  text ? `${text}\n` : '';

const bulleted = (items: string[]): string =>
  items.filter(Boolean).map((s) => `- ${s}`).join('\n');

// ── Specific renderers ───────────────────────────────────────────────

const renderHero: RendererFn = (a) => {
  const slides = a.slides as Array<Record<string, unknown>> | undefined;
  if (slides && slides.length > 0) {
    const lines: string[] = [];
    slides.forEach((s, i) => {
      lines.push(`### Slide ${i + 1}`);
      if (s.title) lines.push(String(s.title));
      if (s.subtitle) lines.push(String(s.subtitle));
      const cta = s.cta as LinkAttrs | undefined;
      const c = linkLine(cta);
      if (c) lines.push(c);
    });
    return lines.join('\n\n');
  }
  return [
    para(a.heading as string | undefined),
    para(a.subheading as string | undefined),
    linkLine(a.cta as LinkAttrs | undefined),
  ].filter(Boolean).join('\n');
};

const renderTextBlock: RendererFn = (a) =>
  [
    heading(a.heading as string | undefined, 3),
    para(a.body as string | undefined),
    linkLine(a.cta as LinkAttrs | undefined),
  ].filter(Boolean).join('\n');

const renderAboutSection: RendererFn = (a) => {
  const stats = (a.stats as Array<{ label?: string; value?: string }> | undefined) ?? [];
  const lines: string[] = [];
  if (a.heading) lines.push(heading(a.heading as string, 3));
  if (stats.length) {
    lines.push('**Key stats**');
    lines.push(bulleted(stats.map((s) => `${s.value ?? ''}${s.value && s.label ? ' — ' : ''}${s.label ?? ''}`)));
  }
  if (a.funFactIntro) lines.push(`**${a.funFactIntro}**`);
  if (a.funFactBody) lines.push(String(a.funFactBody));
  const cta = linkLine(a.cta as LinkAttrs | undefined);
  if (cta) lines.push(cta);
  return lines.filter(Boolean).join('\n\n');
};

const renderCardGrid: RendererFn = (a) => {
  const cards = (a.cards as Array<{ heading?: string; description?: string; cta?: LinkAttrs }> | undefined) ?? [];
  const lines: string[] = [];
  if (a.heading) lines.push(heading(a.heading as string, 3));
  if (a.subheading) lines.push(para(a.subheading as string));
  cards.forEach((c) => {
    if (c.heading) lines.push(`**${c.heading}**`);
    if (c.description) lines.push(String(c.description));
    const cl = linkLine(c.cta);
    if (cl) lines.push(cl);
    lines.push('');
  });
  const cta = linkLine(a.cta as LinkAttrs | undefined);
  if (cta) lines.push(cta);
  return lines.filter(Boolean).join('\n');
};

const renderFeatureGrid: RendererFn = (a) => {
  const features = (a.features as Array<{ heading?: string; description?: string; cta?: LinkAttrs }> | undefined) ?? [];
  const listItems = a.listItems as string[] | undefined;
  const lines: string[] = [];
  if (a.heading) lines.push(heading(a.heading as string, 3));
  if (a.subheading) lines.push(para(a.subheading as string));
  if (a.body) lines.push(para(a.body as string));
  if (listItems && Array.isArray(listItems)) {
    lines.push(bulleted(listItems.map(String)));
  }
  features.forEach((f) => {
    if (f.heading) lines.push(`**${f.heading}**`);
    if (f.description) lines.push(String(f.description));
    const cl = linkLine(f.cta);
    if (cl) lines.push(cl);
    lines.push('');
  });
  const cta = linkLine(a.cta as LinkAttrs | undefined);
  if (cta) lines.push(cta);
  return lines.filter(Boolean).join('\n');
};

const renderCtaBanner: RendererFn = (a) =>
  [
    heading(a.heading as string | undefined, 3),
    para(a.body as string | undefined),
    linksList(a.ctas as LinkAttrs[] | undefined),
  ].filter(Boolean).join('\n');

const renderFaqSection: RendererFn = (a) => {
  const items = (a.items as Array<{ question?: string; answer?: string }> | undefined) ?? [];
  const lines: string[] = [];
  if (a.heading) lines.push(heading(a.heading as string, 3));
  items.forEach((q) => {
    if (q.question) lines.push(`**Q: ${q.question}**`);
    if (q.answer) lines.push(`A: ${q.answer}`);
    lines.push('');
  });
  return lines.filter(Boolean).join('\n');
};

const renderStatsCounter: RendererFn = (a) => {
  const stats = (a.stats as Array<{ label?: string; value?: string }> | undefined) ?? [];
  const lines: string[] = [];
  if (a.heading) lines.push(heading(a.heading as string, 3));
  if (stats.length) {
    lines.push(bulleted(stats.map((s) => `${s.value ?? ''}${s.value && s.label ? ' — ' : ''}${s.label ?? ''}`)));
  }
  return lines.filter(Boolean).join('\n');
};

const renderTabs: RendererFn = (a) => {
  const tabs = (a.tabs as Array<{ label?: string; heading?: string; body?: string }> | undefined) ?? [];
  const lines: string[] = [];
  if (a.heading) lines.push(heading(a.heading as string, 3));
  tabs.forEach((t) => {
    if (t.label) lines.push(`**${t.label}**`);
    if (t.heading) lines.push(String(t.heading));
    if (t.body) lines.push(String(t.body));
    lines.push('');
  });
  return lines.filter(Boolean).join('\n');
};

const renderTeamGrid: RendererFn = (a) => {
  const members = (a.members as Array<{ name?: string; role?: string; bio?: string }> | undefined) ?? [];
  const lines: string[] = [];
  if (a.heading) lines.push(heading(a.heading as string, 3));
  members.forEach((m) => {
    if (m.name) lines.push(`**${m.name}**${m.role ? ` — ${m.role}` : ''}`);
    if (m.bio) lines.push(String(m.bio));
  });
  return lines.filter(Boolean).join('\n');
};

const renderTestimonialSlider: RendererFn = (a) => {
  const items = (a.items as Array<{ quote?: string; author?: string; role?: string }> | undefined) ?? [];
  const lines: string[] = [];
  if (a.heading) lines.push(heading(a.heading as string, 3));
  items.forEach((t) => {
    if (t.quote) lines.push(`> ${t.quote}`);
    if (t.author) lines.push(`— ${t.author}${t.role ? `, ${t.role}` : ''}`);
    lines.push('');
  });
  return lines.filter(Boolean).join('\n');
};

// ── Generic fallback for unregistered block components ───────────────

// Field names that are pure presentation/configuration — never emit them.
const SKIP_FIELDS = new Set([
  'id',
  '__component',
  'createdAt',
  'updatedAt',
  'publishedAt',
  'locale',
  'icon',
  'variant',
  'dark',
  'centered',
  'titlePosition',
  'subtitlePosition',
  'asideImagePosition',
  'titleColor',
  'subtitleColor',
  'overlayDarken',
  'autoPlayInterval',
  'isExternal',
  'bordered',
  'order',
  'cuisineIconSlug',
]);

const renderGeneric: RendererFn = (a) => {
  const lines: string[] = [];
  if (a.heading) lines.push(heading(a.heading as string, 3));
  if (a.label && a.label !== a.heading) lines.push(`*${a.label as string}*`);
  if (a.subheading) lines.push(para(a.subheading as string));
  if (a.body) lines.push(para(a.body as string));
  for (const [key, value] of Object.entries(a)) {
    if (SKIP_FIELDS.has(key)) continue;
    if (key === 'heading' || key === 'subheading' || key === 'body' || key === 'label') continue;
    if (typeof value === 'string' && value.length > 20) {
      lines.push(`**${humanise(key)}:** ${value}`);
    }
  }
  return lines.filter(Boolean).join('\n');
};

const humanise = (camel: string): string =>
  camel
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

// ── Registry ─────────────────────────────────────────────────────────

const registry: Record<string, RendererFn> = {
  'blocks.hero': renderHero,
  'blocks.text-block': renderTextBlock,
  'blocks.about-section': renderAboutSection,
  'blocks.card-grid': renderCardGrid,
  'blocks.three-col-grid': renderCardGrid,
  'blocks.feature-grid': renderFeatureGrid,
  'blocks.cta-banner': renderCtaBanner,
  'blocks.overlay-section': renderCtaBanner,
  'blocks.faq-section': renderFaqSection,
  'blocks.stats-counter': renderStatsCounter,
  'blocks.tabs-section': renderTabs,
  'blocks.team-grid': renderTeamGrid,
  'blocks.testimonial-slider': renderTestimonialSlider,
};

export function renderBlock(componentName: string, attrs: Record<string, unknown>): string {
  const fn = registry[componentName] ?? renderGeneric;
  return fn(attrs);
}

export function listRegisteredBlocks(): string[] {
  return Object.keys(registry);
}
