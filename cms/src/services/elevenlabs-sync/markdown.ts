/**
 * Render a populated Strapi entry to KB-friendly markdown.
 * Walks every component-typed and dynamic-zone attribute, dispatches to
 * the renderer registry, and stitches the output together.
 */

import { renderBlock } from './renderers';

type Strapi = { contentTypes: Record<string, unknown>; components: Record<string, unknown> };

interface AttrDef {
  type: string;
  component?: string;
  components?: string[];
  repeatable?: boolean;
}
interface SchemaLike {
  info?: { displayName?: string };
  attributes: Record<string, AttrDef>;
}

export interface RenderInput {
  strapi: Strapi;
  uid: string;
  entry: Record<string, unknown>;
  publicUrl?: string;
}

export function renderEntryMarkdown({ strapi, uid, entry, publicUrl }: RenderInput): string {
  const schema = strapi.contentTypes[uid] as SchemaLike | undefined;
  if (!schema) throw new Error(`Unknown content type: ${uid}`);

  const title = (entry.title ?? entry.name ?? schema.info?.displayName ?? uid) as string;
  const lines: string[] = [`# ${title}`, ''];
  if (publicUrl) {
    lines.push(`> Source: ${publicUrl}`);
    lines.push('');
  }

  for (const [name, attr] of Object.entries(schema.attributes)) {
    const value = entry[name];
    if (value == null) continue;

    if (attr.type === 'component' && attr.component) {
      const md = renderBlock(attr.component, value as Record<string, unknown>);
      if (!md) continue;
      lines.push(`## ${humanise(name)}`, md, '');
      continue;
    }

    if (attr.type === 'dynamiczone' && Array.isArray(value)) {
      for (const item of value as Array<Record<string, unknown>>) {
        const componentName = item.__component as string | undefined;
        if (!componentName) continue;
        const md = renderBlock(componentName, item);
        if (!md) continue;
        lines.push(`## ${humaniseComponent(componentName)}`, md, '');
      }
      continue;
    }

    // Scalar text fields included verbatim if substantial.
    if ((attr.type === 'string' || attr.type === 'text') && typeof value === 'string' && value.trim().length > 30) {
      lines.push(`## ${humanise(name)}`, value, '');
    }

    if (attr.type === 'blocks' && Array.isArray(value)) {
      // Strapi rich-text blocks → flatten paragraph children.
      const flattened = flattenRichBlocks(value as Array<Record<string, unknown>>);
      if (flattened.trim()) {
        lines.push(`## ${humanise(name)}`, flattened, '');
      }
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function flattenRichBlocks(nodes: Array<Record<string, unknown>>): string {
  const out: string[] = [];
  const walk = (n: Record<string, unknown>): void => {
    if (typeof n.text === 'string') out.push(n.text);
    if (Array.isArray(n.children)) for (const c of n.children as Array<Record<string, unknown>>) walk(c);
  };
  for (const n of nodes) walk(n);
  return out.join(' ').replace(/\s+/g, ' ').trim();
}

function humanise(camel: string): string {
  return camel.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();
}

function humaniseComponent(qualified: string): string {
  const parts = qualified.split('.');
  const name = parts[parts.length - 1] ?? qualified;
  return humanise(name.replace(/-/g, ' '));
}
