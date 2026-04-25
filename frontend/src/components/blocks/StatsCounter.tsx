import type { StatItem } from '../../lib/types';

export function StatsCounter({
  label,
  stats,
  dark = false,
}: {
  label?: string;
  stats: StatItem[];
  dark?: boolean;
}) {
  return (
    <section className={`py-16 ${dark ? 'bg-primary text-white' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {label && (
          <p className={`text-sm font-bold uppercase tracking-widest mb-8 text-center ${dark ? 'text-secondary' : 'text-accent'}`}>
            {label}
          </p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className={`font-heading text-4xl md:text-5xl font-light italic mb-2 ${dark ? 'text-accent' : 'text-primary'}`}>
                {stat.value}
              </div>
              <div className={`text-sm uppercase tracking-wide ${dark ? 'text-text-light' : 'text-text-dark/70'}`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
