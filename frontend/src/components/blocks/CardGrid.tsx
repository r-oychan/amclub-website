import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react';
import { Link } from 'react-router';
import type { CardItem, CtaButton } from '../../lib/types';
import { SectionHeader } from '../shared/SectionHeader';
import { Button } from '../shared/Button';

export function CardGrid({
  label,
  heading,
  subheading,
  items,
  cta,
  columns = 3,
  variant = 'default',
  dark = false,
}: {
  label?: string;
  heading?: string;
  subheading?: string;
  items: CardItem[];
  cta?: CtaButton;
  columns?: 2 | 3 | 4;
  variant?: 'default' | 'event' | 'venue' | 'delivery';
  dark?: boolean;
}) {
  const colClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <section className={`py-16 ${dark ? 'bg-primary text-white' : 'bg-bg'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top accent line */}
        <div className={`h-px ${dark ? 'bg-white/20' : 'bg-secondary/40'} mb-12 md:mb-16`} />

        <SectionHeader label={label} heading={heading} cta={cta} dark={dark} />

        {subheading && (
          <p className={`max-w-2xl mb-8 ${dark ? 'text-white/70' : 'text-text-dark/70'}`}>
            {subheading}
          </p>
        )}
      </div>

      {variant === 'event' ? (
        <EventMarquee items={items} />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid grid-cols-1 ${colClass} gap-8`}>
            {items.map((item, i) => (
              <DefaultCard key={i} item={item} variant={variant} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// Auto-scrolling, draggable event marquee. The motion eases in and out so
// there are no abrupt starts/stops: hovering decelerates to a gentle pause,
// pressing and dragging scrubs the row left/right, and releasing waits a beat
// before easing back up to cruising speed. Infinite loop via scrollLeft wrap
// on the duplicated item set. The container stays the `group`, so hovering any
// card still lights up every title at once (matching the Framer prototype).
const MARQUEE_CRUISE_SPEED = 45; // px per second when auto-scrolling
const MARQUEE_EASE_RATE = 2.4; // velocity easing (frame-rate independent)
const MARQUEE_RESUME_DELAY_MS = 1400; // pause after the pointer leaves before resuming
const MARQUEE_DRAG_THRESHOLD = 5; // px of movement before a press counts as a drag

function EventMarquee({ items }: { items: CardItem[] }) {
  // Duplicate the items so scrollLeft can wrap seamlessly for an infinite loop.
  const loop = [...items, ...items];
  const viewportRef = useRef<HTMLDivElement>(null);

  const speedRef = useRef(0); // current velocity (px/sec), eased toward target
  const targetRef = useRef(MARQUEE_CRUISE_SPEED); // desired velocity
  const draggingRef = useRef(false);
  const movedRef = useRef(false); // did the current press move past the threshold?
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    // Respect reduced-motion preferences: no auto-scroll, drag still works.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targetRef.current = 0;
      speedRef.current = 0;
    }

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Ease current speed toward the target (exponential smoothing → ease in/out).
      const k = 1 - Math.exp(-MARQUEE_EASE_RATE * dt);
      speedRef.current += (targetRef.current - speedRef.current) * k;
      if (!draggingRef.current && Math.abs(speedRef.current) > 0.05) {
        el.scrollLeft += speedRef.current * dt;
      }
      // Seamless wrap: content is duplicated, so one full set === half the width.
      const half = el.scrollWidth / 2;
      if (half > 0) {
        if (el.scrollLeft >= half) el.scrollLeft -= half;
        else if (el.scrollLeft < 0) el.scrollLeft += half;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const clearResume = () => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  };
  const scheduleResume = () => {
    clearResume();
    resumeTimerRef.current = setTimeout(() => {
      targetRef.current = MARQUEE_CRUISE_SPEED;
    }, MARQUEE_RESUME_DELAY_MS);
  };

  const handlePointerEnter = () => {
    clearResume();
    targetRef.current = 0; // decelerate to a pause while hovering
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = viewportRef.current;
    if (!el) return;
    draggingRef.current = true;
    movedRef.current = false;
    targetRef.current = 0;
    speedRef.current = 0;
    clearResume();
    dragStartXRef.current = e.clientX;
    dragStartScrollRef.current = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const el = viewportRef.current;
    if (!el) return;
    const dx = e.clientX - dragStartXRef.current;
    if (Math.abs(dx) > MARQUEE_DRAG_THRESHOLD) movedRef.current = true;
    el.scrollLeft = dragStartScrollRef.current - dx;
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const el = viewportRef.current;
    if (el && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    scheduleResume();
  };

  const handlePointerLeave = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) endDrag(e);
    else scheduleResume();
  };

  // Swallow the click that fires after a drag so cards don't navigate on release.
  const handleClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = false;
    }
  };

  return (
    <div
      ref={viewportRef}
      className="relative w-full overflow-hidden mt-4 group cursor-grab touch-pan-y select-none active:cursor-grabbing"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={handleClickCapture}
    >
      <div className="flex gap-6 w-max">
        {loop.map((item, i) => (
          <EventCard key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

function EventCard({ item }: { item: CardItem }) {
  const [month, day] = (item.date ?? '').split(' ');
  // The marquee container is the `group` — hovering ANY card lights up
  // every title at once, matching the Framer prototype.
  const inner = (
    <div className="flex-shrink-0 w-[344px]">
      {item.image && (
        <div className="relative mb-10">
          <img
            src={item.image}
            alt={item.title ?? ''}
            draggable={false}
            className="w-full aspect-[344/217] object-cover block"
          />
          {month && day && (
            <div className="absolute right-[18px] -bottom-[57px] bg-white p-2 flex flex-col items-center w-[60px] z-10">
              <span className="font-body text-[13.6px] font-normal uppercase text-primary tracking-[0.04em] leading-none">
                {month}
              </span>
              <span className="block h-px w-[33px] bg-accent my-1.5" />
              <span className="font-heading italic text-[28.8px] font-light text-primary leading-none">
                {day}
              </span>
            </div>
          )}
        </div>
      )}
      {item.category && (
        <span className="inline-block bg-primary text-white font-body text-[11.2px] font-normal uppercase tracking-[0.04em] px-3.5 py-0.5 rounded-full mb-3">
          {item.category}
        </span>
      )}
      <h3 className="font-body text-[17.6px] font-normal text-primary leading-[1.4] group-hover:text-accent transition-colors">
        {item.title}
      </h3>
    </div>
  );
  if (!item.href) return inner;
  return (
    <Link to={item.href} draggable={false} className="block">
      {inner}
    </Link>
  );
}

function DefaultCard({ item, variant }: { item: CardItem; variant: string }) {
  return (
    <div className="rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow flex flex-col">
      {item.image && (
        <div className="h-52 overflow-hidden">
          <img src={item.image} alt={item.name ?? item.title ?? ''} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-6 flex flex-col flex-1">
        {item.category && (
          <p className="text-xs text-secondary font-bold uppercase tracking-wide mb-1">{item.category}</p>
        )}
        <h3 className="font-heading text-xl font-bold text-primary mb-1">
          {item.name ?? item.title}
        </h3>
        {item.type && <p className="text-xs text-accent font-semibold uppercase mb-2">{item.type}</p>}
        {item.tagline && <p className="text-sm italic text-text-dark/70 mb-2">{item.tagline}</p>}
        {item.capacity && <p className="text-xs text-text-dark/60 mb-2">{item.capacity}</p>}
        {item.description && <p className="text-sm text-text-dark/80 mb-4 flex-1">{item.description}</p>}
        {item.serviceFeatures && item.serviceFeatures.length > 0 && (
          <ul className="text-xs text-text-dark/70 mb-3 space-y-1">
            {item.serviceFeatures.map((f) => (
              <li key={f} className="flex items-center gap-1">
                <span className="text-secondary">&#10003;</span> {f}
              </li>
            ))}
          </ul>
        )}
        {variant === 'venue' && item.venues && (
          <p className="text-xs text-text-dark/60 mb-3">Venues: {item.venues.join(', ')}</p>
        )}
        {item.ctas && item.ctas.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-auto">
            {item.ctas.map((c) => {
              const label = typeof c === 'string' ? c : c.label;
              const href = typeof c === 'string' ? undefined : c.href;
              return (
                <Button key={label} label={label} href={href} variant="secondary" className="text-xs px-4 py-2" />
              );
            })}
          </div>
        )}
        {item.cta && !item.ctas && (
          <Button label={item.cta} variant="secondary" className="text-xs px-4 py-2 mt-auto self-start" />
        )}
      </div>
    </div>
  );
}
