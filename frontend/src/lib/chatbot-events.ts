// Lets page content (e.g. a "Chat with Eli" help row) open the site chat
// assistant without importing the widget module itself.
export const OPEN_CHATBOT_EVENT = 'amclub:open-chatbot';

export const openChatbot = (): void => {
  window.dispatchEvent(new Event(OPEN_CHATBOT_EVENT));
};
