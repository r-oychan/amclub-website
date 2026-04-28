import type { ReactNode } from 'react';

/**
 * Wraps a page's content so it fades in once data has loaded.
 *
 * - Before `loaded` is true: nothing rendered, no flash of "Loading…" text.
 * - When `loaded` flips to true: children mount and the wrapper transitions
 *   opacity 0 → 1 over 250ms.
 *
 * If a page also has an "unavailable" error path it should be handled
 * outside this wrapper (return early before `<PageFade>`).
 */
export function PageFade({ loaded, children }: { loaded: boolean; children: ReactNode }) {
  return (
    <div
      className="transition-opacity duration-[250ms] ease-out"
      style={{ opacity: loaded ? 1 : 0 }}
    >
      {loaded ? children : null}
    </div>
  );
}
