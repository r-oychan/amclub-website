import { factories } from '@strapi/strapi';
import { withExpiryFilter } from '../../../utils/expiry-filter';

// Listing endpoints (no slug/documentId filter) drop past events by
// requiring `date >= today`. Detail-by-slug queries from the frontend
// (filters[slug][$eq]=…) bypass the filter so the URL stays alive after
// an event ends. The hourly cron in cms/src/index.ts unsyncs newly
// expired events from the ElevenLabs KB on a separate track.
export default factories.createCoreController(
  'api::event.event',
  () => ({
    async find(ctx) {
      ctx.query = withExpiryFilter(ctx.query, 'date');
      return await super.find(ctx);
    },
  }),
);
