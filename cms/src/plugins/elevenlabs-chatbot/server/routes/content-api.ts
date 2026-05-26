/**
 * Public route — no auth. Returns the safe subset of plugin settings + agentId
 * to the on-site chatbot widget.
 */

export default {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/elevenlabs-chatbot/config',
      handler: 'public-config.find',
      config: { auth: false, policies: [] },
    },
  ],
};
