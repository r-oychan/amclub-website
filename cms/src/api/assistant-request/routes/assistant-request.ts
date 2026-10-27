// Only the submit action is routed — no core CRUD, so the request log is
// reachable through /admin alone. Auth is Strapi's default API-token check:
// issue a *custom* token granting just `assistant-request.submit` for the
// ElevenLabs webhook tool, so a leaked token can do nothing else.
export default {
  routes: [
    {
      method: 'POST',
      path: '/assistant-requests/submit',
      handler: 'api::assistant-request.assistant-request.submit',
    },
  ],
};
