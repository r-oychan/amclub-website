import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  // We sit behind nginx (in the all-in-one Azure Container App image), which
  // terminates TLS at the Azure ingress and forwards to Strapi over HTTP on
  // 127.0.0.1:1337. Without `proxy: true`, Koa sees req.secure === false and
  // refuses to issue cookies with the Secure flag — breaking the OAuth flow
  // for strapi-plugin-sso ("Error: Cannot send secure cookie over unencrypted
  // connection"). `proxy: true` makes Koa honor X-Forwarded-Proto, which
  // nginx is already setting (see infra/docker/nginx.conf).
  proxy: env.bool('IS_PROXIED', true),
});

export default config;
