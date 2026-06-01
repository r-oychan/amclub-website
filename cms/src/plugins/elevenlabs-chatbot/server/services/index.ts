import settings from './settings';
import * as sync from './sync';

interface StrapiArg { strapi: unknown }

export default {
  settings,
  sync: (_: StrapiArg) => sync,
};
