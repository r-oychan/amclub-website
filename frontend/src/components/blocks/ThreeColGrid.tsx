import { ArrowLink } from '../shared/ArrowLink';

export interface ThreeColItem {
  heading: string;
  description: string;
  image: string;
  imageAlt: string;
  cta: { label: string; href: string };
  accentColor?: string;
}

export interface ThreeColGridProps {
  items: ThreeColItem[];
  columns?: 2 | 3;
  variant?: 'centered' | 'left';
  heading?: string;
  subheading?: string;
}

export function ThreeColGrid({
  items,
  columns = 3,
  variant = 'centered',
  heading,
  subheading,
}: ThreeColGridProps) {
  const isLeft = variant === 'left';
  const colClass = columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3';

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
        {(heading || subheading) && (
          <div className="text-center mb-10">
            {heading && (
              <h2 className="font-heading text-3xl md:text-4xl font-light italic text-primary mb-3">
                {heading}
              </h2>
            )}
            {subheading && (
              <p className="text-text-dark/70 text-center max-w-2xl mx-auto text-sm">
                {subheading}
              </p>
            )}
          </div>
        )}

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${colClass} gap-6 lg:gap-8`}>
          {items.map((item) => (
            <div
              key={item.heading}
              className={`group ${isLeft ? '' : 'border border-gray-200 rounded-lg'} overflow-hidden bg-white`}
            >
              <div className="relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.imageAlt}
                  className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {item.accentColor && (
                  <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none overflow-hidden">
                    <div
                      className="absolute -top-1 -right-1 w-[200%] h-6 -rotate-45 origin-top-right"
                      style={{ backgroundColor: item.accentColor }}
                    />
                  </div>
                )}
              </div>
              <div className={`p-6 ${isLeft ? 'text-left' : 'text-center'}`}>
                {isLeft && <div className="w-12 h-[3px] bg-secondary mb-4" />}
                <h3 className="font-heading text-xl md:text-2xl font-light italic text-primary mb-2">
                  {item.heading}
                </h3>
                <p className="text-text-dark/60 text-sm mb-4">
                  {item.description}
                </p>
                <ArrowLink label={item.cta.label} href={item.cta.href} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
