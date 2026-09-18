import settings from './settings';
import * as sync from './sync';
import * as teamup from './teamup';

interface StrapiArg { strapi: unknown }

export default {
  settings,
  sync: (_: StrapiArg) => sync,
  teamup: (_: StrapiArg) => teamup,
};
