import { useState } from 'react';
import { Link } from 'react-router';
import type { TabItem } from '../../lib/types';

export function TabsSection({
  label,
  heading,
  items,
}: {
  label?: string;
  heading: string;
  items: TabItem[];
}) {
  const [active, setActive] = useState(0);

  return (
    <section className="py-16 bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {label && (
          <p className="text-sm font-bold uppercase tracking-widest text-secondary mb-4 text-center">{label}</p>
        )}
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12 italic">{heading}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <Link
              key={i}
              to={item.href ?? '#'}
              className={`group relative rounded-xl overflow-hidden h-80 flex items-end transition-all ${
                active === i ? 'ring-2 ring-secondary' : ''
              }`}
              onMouseEnter={() => setActive(i)}
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.label}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
              <div className="relative p-6">
                <h3 className="font-heading text-2xl font-bold">{item.label}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
