import { useSyncExternalStore } from 'react';
const subscribe = (callback: () => void) => {
  window.addEventListener('hashchange', callback);
  window.addEventListener('popstate', callback);
  return () => { window.removeEventListener('hashchange', callback); window.removeEventListener('popstate', callback); };
};
export function useUrlHash() { return useSyncExternalStore(subscribe, () => window.location.hash, () => ''); }
