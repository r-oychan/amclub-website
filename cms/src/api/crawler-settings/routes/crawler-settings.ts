import { factories } from '@strapi/strapi';

// Editor/API-token writes remain authenticated; only generated files are public.
export default factories.createCoreRouter('api::crawler-settings.crawler-settings');
