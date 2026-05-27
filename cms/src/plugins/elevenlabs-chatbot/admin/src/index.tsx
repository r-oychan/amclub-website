import { EditViewSidePanel } from './pages/EditViewSidePanel';

interface StrapiAppLike {
  getPlugin?: (name: string) => {
    apis?: { addEditViewSidePanel?: (panels: unknown[]) => void };
  };
  addMenuLink?: (link: {
    to: string;
    icon: React.ComponentType;
    intlLabel: { id: string; defaultMessage: string };
    Component: () => Promise<{ default: unknown }>;
  }) => void;
}

// Speech-bubble outline with ElevenLabs' "II" mark inside. currentColor lets
// the icon adopt Strapi's neutral text color in both light + dark themes.
function ChatbotMenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <line x1="10" y1="9" x2="10" y2="14" />
      <line x1="14" y1="9" x2="14" y2="14" />
    </svg>
  );
}

export default {
  register(app: StrapiAppLike) {
    app.addMenuLink?.({
      to: '/plugins/elevenlabs-chatbot',
      icon: ChatbotMenuIcon,
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
