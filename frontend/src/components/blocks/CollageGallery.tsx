import type { CollageImage } from '../../lib/types';

interface CollageGalleryProps {
  label?: string;
  heading?: string;
  images: CollageImage[];
}

const SLOTS: { col: string; row: string; aspect: string; rotate?: string; offsetY?: string }[] = [
  { col: 'lg:col-start-1 lg:col-span-3', row: 'lg:row-start-1', aspect: 'aspect-[3/2]', offsetY: 'lg:translate-y-8' },
  { col: 'lg:col-start-5 lg:col-span-3', row: 'lg:row-start-1', aspect: 'aspect-[3/2]' },
  { col: 'lg:col-start-9 lg:col-span-4', row: 'lg:row-start-1', aspect: 'aspect-[4/3]', offsetY: 'lg:translate-y-12' },
  { col: 'lg:col-start-3 lg:col-span-3', row: 'lg:row-start-2', aspect: 'aspect-[4/3]', offsetY: 'lg:-translate-y-4' },
  { col: 'lg:col-start-7 lg:col-span-5', row: 'lg:row-start-2', aspect: 'aspect-[4/3]', offsetY: 'lg:translate-y-4' },
];

export function CollageGallery({ label, heading, images }: CollageGalleryProps) {
  if (!images || images.length === 0) return null;
  const visible = images.slice(0, SLOTS.length);

  return (
    <section className="bg-bg py-16 md:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {(label || heading) && (
          <div className="text-center mb-12 md:mb-16">
            {label && (
              <span className="inline-block font-body text-[12.8px] font-bold uppercase tracking-[0.08em] text-primary mb-4">
                {label}
              </span>
            )}
            {heading && (
              <h2
                className="font-heading italic text-primary mx-auto max-w-3xl"
                style={{
                  fontSize: 'clamp(2rem, 2.6vw + 1rem, 2.8rem)',
                  fontWeight: 300,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.05,
                }}
              >
                {heading}
              </h2>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 lg:gap-y-16">
          {visible.map((img, i) => {
            const slot = SLOTS[i];
            return (
              <figure
                key={img.src + i}
                className={`overflow-hidden ${slot.col} ${slot.row} ${slot.offsetY ?? ''} ${slot.rotate ?? ''}`}
              >
                <div className={`w-full ${slot.aspect}`}>
                  <img
                    src={img.src}
                    alt={img.alt ?? ''}
                    className="w-full h-full object-cover block"
                    loading="lazy"
                  />
                </div>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
