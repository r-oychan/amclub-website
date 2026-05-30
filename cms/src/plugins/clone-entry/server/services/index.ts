import * as clone from './clone';

interface StrapiArg { strapi: unknown }

export default {
  clone: (_: StrapiArg) => clone,
};
