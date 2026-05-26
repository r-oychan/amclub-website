import { EditViewSidePanel } from './pages/EditViewSidePanel';

interface StrapiAppLike {
  getPlugin?: (name: string) => {
    apis?: { addEditViewSidePanel?: (panels: unknown[]) => void };
  };
  addMenuLink?: (link: {
    to: string;
    icon: () => unknown;
    intlLabel: { id: string; defaultMessage: string };
    Component: () => Promise<{ default: unknown }>;
  }) => void;
}

export default {
  register(app: StrapiAppLike) {
    app.addMenuLink?.({
      to: '/plugins/elevenlabs-chatbot',
      icon: () => '🔊',
      intlLabel: { id: 'elevenlabs-chatbot.menu.label', defaultMessage: 'ElevenLabs Chatbot' },
      Component: () => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
    });
  },
  bootstrap(app: StrapiAppLike) {
    app
      .getPlugin?.('content-manager')
      ?.apis?.addEditViewSidePanel?.([EditViewSidePanel]);
  },
};
