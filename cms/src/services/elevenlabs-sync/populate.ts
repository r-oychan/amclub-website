/**
 * Build a deep `populate` object for any Strapi v5 content type, walking
 * the schema and recursing through components, dynamic zones, and relations.
 * Avoids the "populate: '*' only goes one level" gotcha.
 */

type Strapi = { contentTypes: Record<string, unknown>; components: Record<string, unknown> };

interface AttrDef {
  type: string;
  component?: string;
  components?: string[];
  target?: string;
  multiple?: boolean;
  repeatable?: boolean;
}

interface SchemaLike {
  attributes: Record<string, AttrDef>;
}

const POPULATE_DEPTH_LIMIT = 4;

export function buildDeepPopulate(strapi: Strapi, uid: string, depth = 0): Record<string, unknown> | true {
  if (depth >= POPULATE_DEPTH_LIMIT) return true;
  const schema = strapi.contentTypes[uid] as SchemaLike | undefined;
  if (!schema) return true;
  return walkAttributes(strapi, schema.attributes, depth);
}

function walkAttributes(strapi: Strapi, attrs: Record<string, AttrDef>, depth: number): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [name, attr] of Object.entries(attrs)) {
    switch (attr.type) {
      case 'component': {
        if (!attr.component) break;
        const comp = strapi.components[attr.component] as SchemaLike | undefined;
        if (!comp) {
          out[name] = true;
          break;
        }
        out[name] = { populate: walkAttributes(strapi, comp.attributes, depth + 1) };
        break;
      }
      case 'dynamiczone': {
        const populates: Record<string, unknown> = {};
        for (const ref of attr.components ?? []) {
          const comp = strapi.components[ref] as SchemaLike | undefined;
          if (!comp) continue;
          Object.assign(populates, walkAttributes(strapi, comp.attributes, depth + 1));
        }
        out[name] = { populate: populates };
        break;
      }
      case 'relation': {
        if (!attr.target) {
          out[name] = true;
          break;
        }
        if (depth + 1 >= POPULATE_DEPTH_LIMIT) {
          out[name] = true;
          break;
        }
        const target = strapi.contentTypes[attr.target] as SchemaLike | undefined;
        if (!target) {
          out[name] = true;
          break;
        }
        out[name] = { populate: walkAttributes(strapi, target.attributes, depth + 1) };
        break;
      }
      case 'media':
        out[name] = true;
        break;
      default:
        // scalars handled by default; no populate needed
        break;
    }
  }
  return out;
}
