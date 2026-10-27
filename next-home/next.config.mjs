import path from 'node:path';
import { fileURLToPath } from 'node:url';
const directory = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
  outputFileTracingRoot: path.resolve(directory, '..'),
  poweredByHeader: false,
  // Return metadata in the head for every client, including plain curl.
  htmlLimitedBots: /.*/,
  webpack(config, { webpack }) {
    config.resolve.alias['react-router'] = path.join(directory, 'compat/router.tsx');
    config.resolve.alias[path.resolve(directory, '../frontend/src/lib/api.ts')] = path.join(directory, 'compat/api.ts');
    config.plugins.push(new webpack.DefinePlugin({ 'import.meta.env': JSON.stringify({}) }));
    return config;
  },
  async rewrites() {
    // Local POC convenience; deployed nginx already proxies these routes.
    const origin = process.env.STRAPI_INTERNAL_URL;
    if (!origin) return [];
    return ['/api/:path*', '/uploads/:path*'].map((source) => ({ source, destination: `${origin}${source}` }));
  },
};
export default config;
