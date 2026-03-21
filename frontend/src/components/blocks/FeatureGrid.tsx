import type { FeatureItem, CtaButton } from '../../lib/types';
import { SectionHeader } from '../shared/SectionHeader';
import { Button } from '../shared/Button';

export function FeatureGrid({
  label,
  heading,
  subheading,
  body,
  items,
  cta,
  listItems,
  ctas,
  dark = false,
}: {
  label?: string;
  heading?: string;
  subheading?: string;
  body?: string;
  items?: FeatureItem[];
  cta?: CtaButton;
  listItems?: string[];
  ctas?: CtaButton[];
  dark?: boolean;
}) {
  return (
    <section className={`py-16 ${dark ? 'bg-primary text-white' : 'bg-bg'}`}>
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top accent line */}
        <div className={`h-px ${dark ? 'bg-white/20' : 'bg-secondary/40'} mb-12 md:mb-16`} />

        <SectionHeader label={label} heading={heading} cta={cta} dark={dark} />

        {subheading && (
          <p className={`max-w-2xl mb-4 ${dark ? 'text-white/70' : 'text-text-dark/70'}`}>
            {subheading}
          </p>
        )}
        {body && (
          <p className={`max-w-2xl mb-8 ${dark ? 'text-white/70' : 'text-text-dark/70'}`}>
            {body}
          </p>
        )}

        {items && items.length > 0 && (
          <div className={`grid grid-cols-1 ${items.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'} gap-8`}>
            {items.map((item) => (
              <div
                key={item.heading}
                className={`rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow ${
                  dark ? 'bg-white/10' : 'bg-white'
                }`}
              >
                <h3 className={`font-heading text-lg font-bold mb-3 ${dark ? 'text-white' : 'text-primary'}`}>
                  {item.heading}
                </h3>
                {item.description && (
                  <p className={`text-sm ${dark ? 'text-white/70' : 'text-text-dark/70'}`}>{item.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {listItems && listItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mt-8">
            {listItems.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="text-secondary mt-0.5">&#10003;</span>
                <span className={`text-sm ${dark ? 'text-white/80' : 'text-text-dark/80'}`}>{item}</span>
              </div>
            ))}
          </div>
        )}

        {ctas && ctas.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-10">
            {ctas.map((c) => (
              <Button key={c.label} label={c.label} href={c.href} variant={dark ? 'white' : 'secondary'} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
