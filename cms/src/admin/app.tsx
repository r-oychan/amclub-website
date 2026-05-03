import type { StrapiApp } from '@strapi/strapi/admin';
import { ElevenLabsSyncPanel } from './extensions/elevenlabs-sync-panel';

export default {
  config: {
    locales: [],
  },
  bootstrap(app: StrapiApp) {
    // Inject a sync button into the right-side panel of every Content
    // Manager edit view. Panel internally checks whether the current
    // entry's content type is in the elevenlabs-sync allow-list.
    (app as unknown as {
      getPlugin: (name: string) => {
        apis?: {
          addEditViewSidePanel?: (panels: unknown[]) => void;
        };
      };
    })
      .getPlugin('content-manager')
      ?.apis
      ?.addEditViewSidePanel?.([ElevenLabsSyncPanel]);
  },
};
