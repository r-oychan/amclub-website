import type { StatItem } from '../../lib/types';

export function StatsCounter({
  label,
  heading,
  stats,
  dark = false,
}: {
  label?: string;
  heading?: string;
  stats: StatItem[];
  dark?: boolean;
}) {
  return (
    <section className={`py-16 md:py-24 ${dark ? 'bg-primary text-white' : 'bg-bg'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {label && (
          <p className={`text-sm font-bold uppercase tracking-widest mb-8 text-center ${dark ? 'text-secondary' : 'text-accent'}`}>
            {label}
          </p>
        )}
        {heading && (
          <h2
            className={`font-heading italic text-center mb-12 md:mb-16 ${dark ? 'text-white' : 'text-primary'}`}
            style={{ fontSize: 'clamp(1.75rem, 2vw + 1rem, 2.4rem)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.1 }}
          >
            {heading}
          </h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div
                className="font-heading italic text-accent mb-3"
                style={{ fontSize: 'clamp(2rem, 2.6vw + 1rem, 2.8rem)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1 }}
              >
                {stat.value}
              </div>
              <div
                className={`text-xs md:text-sm uppercase ${dark ? 'text-white/80' : 'text-primary'}`}
                style={{ letterSpacing: '0.12em', fontWeight: 400 }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
