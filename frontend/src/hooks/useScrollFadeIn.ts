import { useEffect, useRef, useState } from 'react';

interface Options {
  threshold?: number;
  /** Negative bottom value shrinks the trigger box so partial peeks don't toggle visibility. */
  rootMargin?: string;
  /** When true, isVisible flips back to false once the element scrolls out — animation replays on re-entry. */
  replay?: boolean;
}

export function useScrollFadeIn<T extends HTMLElement = HTMLDivElement>(
  thresholdOrOpts: number | Options = 0.15,
) {
  const opts: Options =
    typeof thresholdOrOpts === 'number' ? { threshold: thresholdOrOpts } : thresholdOrOpts;
  const { threshold = 0.15, rootMargin = '0px 0px -10% 0px', replay = true } = opts;

  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (!replay) observer.unobserve(el);
        } else if (replay) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, replay]);

  return { ref, isVisible };
}
