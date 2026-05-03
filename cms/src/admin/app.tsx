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
        apis?: { addEditViewSidePanel?: (panels: unknown[]) => void };
      };
    })
      .getPlugin('content-manager')
      ?.apis
      ?.addEditViewSidePanel?.([ElevenLabsSyncPanel]);

    // Top-level admin page with bulk sync / clear buttons + status table.
    (app as unknown as {
      addMenuLink: (link: {
        to: string;
        icon: () => React.ReactNode;
        intlLabel: { id: string; defaultMessage: string };
        Component: () => Promise<{ default: React.ComponentType }>;
      }) => void;
    }).addMenuLink({
      to: '/elevenlabs-sync',
      icon: () => '🔊',
      intlLabel: { id: 'elevenlabs-sync.menu.label', defaultMessage: 'ElevenLabs Sync' },
      Component: async () => import('./extensions/sync-all-page'),
    });
  },
};
