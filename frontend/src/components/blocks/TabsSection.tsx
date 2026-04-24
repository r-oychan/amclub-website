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
  return (
    <section className="py-20 md:py-24 bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top accent line */}
        <div className="h-px bg-secondary/40 mb-12 md:mb-16" />

        {label && (
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-accent mb-6">{label}</p>
        )}
        <h2 className="font-heading italic font-light text-primary text-3xl md:text-5xl leading-[1.1] mb-10 md:mb-14 max-w-4xl">
          {heading}
        </h2>

        <div className="flex flex-wrap gap-x-10 gap-y-4">
          {items.map((item) => (
            <Link
              key={item.label}
              to={item.href ?? '#'}
              className="inline-flex items-center gap-2 text-primary hover:text-accent transition-colors duration-200"
            >
              <span className="font-body font-bold uppercase tracking-[0.04em] text-[14.4px]">
                {item.label}
              </span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-accent">
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
