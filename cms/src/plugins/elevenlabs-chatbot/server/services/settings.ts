import { readRuntimeSettings, writeRuntimeSettings, type RuntimeSettings } from '../utils';

interface StrapiArg {
  strapi: unknown;
}

export default ({ strapi }: StrapiArg) => ({
  async read(): Promise<RuntimeSettings> {
    return readRuntimeSettings(strapi as never);
  },
  async update(next: Partial<RuntimeSettings>): Promise<RuntimeSettings> {
    return writeRuntimeSettings(strapi as never, next);
  },
});
