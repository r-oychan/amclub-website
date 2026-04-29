import type { AwardItem } from '../../lib/types';

export function AwardsGrid({
  heading = 'Awards & Accolades',
  items,
}: {
  heading?: string;
  items: AwardItem[];
}) {
  return (
    <section className="py-16 bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl md:text-4xl font-light italic text-primary text-center mb-12">
          {heading}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {items.map((item) => (
            <div key={item.title} className="flex flex-col items-center text-center">
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  className="h-24 md:h-28 w-auto object-contain mb-5"
                  style={{ mixBlendMode: 'multiply', backgroundColor: 'transparent' }}
                  loading="lazy"
                />
              ) : (
                <div className="h-24 md:h-28 w-24 md:w-28 mb-5 rounded-full bg-primary/10" />
              )}
              <h3 className="font-body font-bold text-base text-text-dark leading-snug max-w-xs mb-1">
                {item.title}
              </h3>
              <p className="font-body text-sm text-secondary font-bold">by {item.issuer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
