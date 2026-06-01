import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    locales: [],
  },
  bootstrap(_app: StrapiApp) {
    // Admin UI for ElevenLabs chatbot (menu link, settings page, edit-view side panel)
    // is contributed by the elevenlabs-chatbot plugin's admin/src/index.tsx.

    // Inject a "Continue with Microsoft" button under the password login
    // form on /admin/auth/login. The free strapi-plugin-sso doesn't add a
    // login-page button (Gold Plan only), so we DOM-inject one ourselves.
    // The button navigates to /strapi-plugin-sso/azuread which kicks off the
    // OAuth flow.
    //
    // We use a MutationObserver instead of running once at bootstrap because
    // the login form is rendered client-side after the admin shell mounts,
    // and again on every route change to /auth/login (user logs out, etc.).
    installSsoLoginButton();
  },
};

function installSsoLoginButton() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const BUTTON_ID = 'amclub-sso-login-button';
  const SSO_URL = '/strapi-plugin-sso/azuread';

  const tryInject = () => {
    if (document.getElementById(BUTTON_ID)) return; // already added
    if (!window.location.pathname.endsWith('/auth/login')) return; // not on login page
    // Strapi v5's login form is the only <form> on the login page.
    const form = document.querySelector('main form') as HTMLFormElement | null;
    if (!form) return;

    const btn = document.createElement('a');
    btn.id = BUTTON_ID;
    btn.href = SSO_URL;
    btn.textContent = 'Continue with Microsoft';
    btn.setAttribute('data-amclub-sso', 'true');
    Object.assign(btn.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      width: '100%',
      marginTop: '16px',
      padding: '10px 16px',
      borderRadius: '4px',
      border: '1px solid #d9d8ff',
      background: '#ffffff',
      color: '#32324d',
      fontWeight: '600',
      fontSize: '14px',
      textDecoration: 'none',
      cursor: 'pointer',
      boxSizing: 'border-box',
    } as Record<string, string>);

    // Tiny inline Microsoft logo (4-square)
    const logo = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    logo.setAttribute('width', '16');
    logo.setAttribute('height', '16');
    logo.setAttribute('viewBox', '0 0 21 21');
    logo.innerHTML =
      '<rect x="1" y="1" width="9" height="9" fill="#f25022"/>' +
      '<rect x="11" y="1" width="9" height="9" fill="#7fba00"/>' +
      '<rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>' +
      '<rect x="11" y="11" width="9" height="9" fill="#ffb900"/>';
    btn.prepend(logo);

    // Place the button after the form (below "Forgot password" / submit row).
    form.parentElement?.insertBefore(btn, form.nextSibling);
  };

  // Run once for initial render, then keep watching for re-renders / route changes.
  const observer = new MutationObserver(() => tryInject());
  observer.observe(document.body, { childList: true, subtree: true });
  // Initial best-effort
  tryInject();
}
