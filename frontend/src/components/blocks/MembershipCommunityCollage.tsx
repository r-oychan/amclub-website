import type { CollageImage, CtaButton } from '../../lib/types';
import { Button } from '../shared/Button';
import { CtaIcon } from '../shared/CtaIcon';

interface MembershipCommunityCollageProps {
  heading: string;
  body?: string;
  ctas?: CtaButton[];
  images: CollageImage[];
}

const SLOTS: { col: string; row: string; aspect: string; offsetY?: string; alignSelf?: string }[] = [
  { col: 'lg:col-start-1 lg:col-span-3', row: 'lg:row-start-1', aspect: 'aspect-[314/451]' },
  { col: 'lg:col-start-10 lg:col-span-3', row: 'lg:row-start-1', aspect: 'aspect-[335/347]', offsetY: 'lg:translate-y-12' },
  { col: 'lg:col-start-3 lg:col-span-4', row: 'lg:row-start-2', aspect: 'aspect-[420/259]', offsetY: 'lg:-translate-y-8' },
  { col: 'lg:col-start-7 lg:col-span-5', row: 'lg:row-start-2', aspect: 'aspect-[498/333]', offsetY: 'lg:-translate-y-2' },
];

export function MembershipCommunityCollage({
  heading,
  body,
  ctas,
  images,
}: MembershipCommunityCollageProps) {
  if (!images || images.length === 0) return null;
  const visible = images.slice(0, SLOTS.length);

  return (
    <section className="bg-bg pt-16 md:pt-24 pb-20 md:pb-28 overflow-hidden">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-x-8 lg:gap-y-12 relative">
          {visible.map((img, i) => {
            const slot = SLOTS[i];
            return (
              <figure
                key={img.src + i}
                className={`overflow-hidden ${slot.col} ${slot.row} ${slot.offsetY ?? ''}`}
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

          {/* Centered text + CTA, sitting on top of the collage at lg+ */}
          <div className="lg:absolute lg:inset-0 lg:row-start-1 lg:col-start-4 lg:col-span-6 lg:flex lg:items-start lg:justify-center lg:pointer-events-none">
            <div className="text-center max-w-md mx-auto lg:pt-2 lg:pointer-events-auto">
              <h2 className="font-heading italic font-light text-primary mb-6 text-[2rem] md:text-[2.4rem] leading-[1.1] tracking-[-0.03em]">
                {heading}
              </h2>
              {body && (
                <p className="font-body font-light text-primary/80 text-[15px] md:text-[17.6px] leading-[1.4] mb-8">
                  {body}
                </p>
              )}
              {ctas && ctas.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3">
                  {ctas.map((c) => (
                    <Button
                      key={c.label}
                      label={c.label}
                      href={c.href}
                      variant="secondary"
                      className="px-7 py-3.5 uppercase tracking-[0.04em] text-[12.8px]"
                      iconRight={<CtaIcon name="arrow" size={14} className="text-secondary" />}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
