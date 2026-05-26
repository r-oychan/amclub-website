import { registerLifecycleHooks } from './services/lifecycle';

interface StrapiArg {
  strapi: unknown;
}

export default ({ strapi }: StrapiArg) => {
  try {
    registerLifecycleHooks(strapi as never);
  } catch (e) {
    (strapi as { log: { error: (msg: string, e: unknown) => void } }).log.error(
      '[elevenlabs-chatbot] failed to register lifecycle hooks',
      e,
    );
  }
};
