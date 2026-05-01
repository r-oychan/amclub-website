import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface LightboxImage {
  url: string;
  alt?: string;
}

interface LightboxProps {
  images: LightboxImage[];
  startIndex?: number;
  title?: string;
  onClose: () => void;
}

const SWIPE_THRESHOLD = 50; // px — minimum horizontal travel to trigger nav

export function Lightbox({ images, startIndex = 0, title, onClose }: LightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);
  const total = images.length;
  const hasMany = total > 1;

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && hasMany) prev();
      else if (e.key === 'ArrowRight' && hasMany) next();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, prev, next, hasMany]);

  if (total === 0) return null;
  const current = images[index];

  // Swipe handlers — track from touchstart, compare at touchend.
  // Vertical swipes are ignored (user is likely scrolling or pinching).
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = touchDeltaX.current;
    const dy = (e.changedTouches[0]?.clientY ?? touchStartY.current) - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    touchDeltaX.current = 0;
    if (!hasMany) return;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) prev(); else next();
    }
  };

  // Tap-zone navigation — splits the image into left/right halves.
  // Used on touch devices (and mouse) as an alternative to the prev/next buttons.
  const onImageZoneClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // do not close on image tap
    if (!hasMany) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) prev();
    else next();
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={title ? `${title} photo viewer` : 'Photo viewer'}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-5 right-5 z-30 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {title && (
        <div className="absolute top-5 left-5 right-20 z-30 text-white/90 font-heading italic" style={{ fontSize: '20px', fontWeight: 300 }}>
          {title}
        </div>
      )}

      {hasMany && (
        <>
          {/* Visible chevrons — hidden on small screens; mobile users get tap zones + swipe instead */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous photo"
            className="hidden sm:flex absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next photo"
            className="hidden sm:flex absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M8 4L14 10L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      <figure
        className="relative max-w-[92vw] max-h-[85vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div onClick={onImageZoneClick}>
          <img
            src={current.url}
            alt={current.alt ?? ''}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl select-none"
            draggable={false}
          />
        </div>
        {hasMany && (
          <figcaption className="mt-4 text-white/80 font-body text-sm tracking-wide">
            {index + 1} / {total}
          </figcaption>
        )}
      </figure>
    </div>,
    document.body
  );
}
