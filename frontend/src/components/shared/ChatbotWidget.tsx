import { useSiteSettings } from '../../hooks/useSiteSettings';

// Temporary: the floating bubble links out to JotForm in a new tab instead of opening the
// ElevenLabs chat panel. Full chat implementation is preserved in git history at 62158e6.
const FEEDBACK_FORM_URL = 'https://amclub.jotform.com/252152095231953';

function FloatingButton() {
  return (
    <a
      href={FEEDBACK_FORM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open feedback form"
      className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-accent text-white shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer flex items-center justify-center"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
        aria-hidden
      >
        <path d="M12 3C6.48 3 2 6.91 2 11.7c0 2.36 1.13 4.5 2.95 6.06L4 22l4.5-2.05c1.07.31 2.22.48 3.5.48 5.52 0 10-3.91 10-8.73S17.52 3 12 3z" />
      </svg>
    </a>
  );
}

export function ChatbotWidget() {
  const settings = useSiteSettings();

  // Wait for settings before deciding — avoids a flash of the button on hard-off configs.
  if (!settings || !settings.chatbotEnabled) return null;

  return <FloatingButton />;
}
