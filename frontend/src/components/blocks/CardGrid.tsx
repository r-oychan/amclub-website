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

function EventMarquee({ items }: { items: CardItem[] }) {
  // Duplicate the items so the sequence is seamless: when the first half
  // has scrolled into the second half's starting position, the transform
  // resets from -50% back to 0 without a visible jump.
  const loop = [...items, ...items];
  return (
    <div className="relative w-full overflow-hidden mt-4 group">
      <div
        className="flex gap-6 w-max animate-marquee-ltr group-hover:[animation-play-state:paused]"
        style={{ animation: 'marquee-ltr 60s linear infinite' }}
      >
        {loop.map((item, i) => (
          <EventCard key={i} item={item} />
        ))}
      </div>
      <style>{`
        @keyframes marquee-ltr {
          from { transform: translateX(-50%); }
          to { transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
}

function EventCard({ item }: { item: CardItem }) {
  const [month, day] = (item.date ?? '').split(' ');
  return (
    <div className="flex-shrink-0 w-[344px]">
      {item.image && (
        <div className="relative mb-10">
          <img
            src={item.image}
            alt={item.title ?? ''}
            className="w-full aspect-[344/217] object-cover block"
          />
          {month && day && (
            <div className="absolute right-[18px] -bottom-[57px] bg-white p-2 flex flex-col items-center w-[60px] z-10">
              <span className="font-body text-[13.6px] font-normal uppercase text-primary tracking-[0.04em] leading-none">
                {month}
              </span>
              <span className="block h-px w-[33px] bg-primary/25 my-1.5" />
              <span className="font-heading italic text-[28.8px] font-light text-primary leading-none">
                {day}
              </span>
            </div>
          )}
        </div>
      )}
      {item.category && (
        <span className="inline-block bg-primary text-white font-body text-[11.2px] font-normal uppercase tracking-[0.04em] px-3.5 py-1.5 rounded-full mb-3">
          {item.category}
        </span>
      )}
      <h3 className="font-body text-[17.6px] font-light text-primary leading-[1.4]">{item.title}</h3>
    </div>
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
