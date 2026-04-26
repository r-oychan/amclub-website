import { Link } from 'react-router';
import type { TabItem } from '../../lib/types';
import { SectionHeader } from '../shared/SectionHeader';

export function TabsSection({
  label,
  heading,
  items,
  dark = false,
}: {
  label?: string;
  heading: string;
  items: TabItem[];
  dark?: boolean;
}) {
  return (
    <section className={`py-20 md:py-24 ${dark ? 'bg-primary text-white' : 'bg-bg'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top accent line */}
        <div className={`h-px ${dark ? 'bg-white/20' : 'bg-secondary/40'} mb-12 md:mb-16`} />

        <SectionHeader label={label} heading={heading} dark={dark} />

        <div className="flex flex-wrap gap-x-10 gap-y-4">
          {items.map((item) => (
            <Link
              key={item.label}
              to={item.href ?? '#'}
              className={`inline-flex items-center gap-2 transition-colors duration-200 ${
                dark ? 'text-white hover:text-secondary' : 'text-primary hover:text-accent'
              }`}
            >
              <span className="font-body font-bold uppercase tracking-[0.04em] text-[14.4px]">
                {item.label}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className={`shrink-0 ${dark ? 'text-secondary' : 'text-accent'}`}
              >
                <path
                  d="M1 13L13 1M13 1H3M13 1V11"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
