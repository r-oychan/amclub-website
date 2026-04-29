import { Link } from 'react-router';
import type { TabItem, CollageImage } from '../../lib/types';
import { SectionLabel } from '../shared/SectionLabel';

// Random scattered collage layout extracted from the Framer prototype's
// Experience section (https://tactesting.framer.website/home).
// Positions/sizes are percentages of the collage container so the layout
// stays the same shape at any width while images can be swapped in CMS.
const COLLAGE_LAYOUT: { left: string; top: string; width: string; aspectRatio: string }[] = [
  { left: '2.1%',  top: '5.2%',  width: '25.45%', aspectRatio: '314 / 451' },  // tall left
  { left: '36.2%', top: '0%',    width: '35.49%', aspectRatio: '438 / 293' },  // wide top center
  { left: '72.85%',top: '5.6%',  width: '27.15%', aspectRatio: '335 / 347' },  // square top right
  { left: '16.1%', top: '58.9%', width: '27.23%', aspectRatio: '336 / 207' },  // wide bottom left
  { left: '57.4%', top: '64.4%', width: '32.25%', aspectRatio: '398 / 266' },  // wide bottom right
];

export function TabsSection({
  label,
  heading,
  items,
  collageImages,
  dark = false,
}: {
  label?: string;
  heading: string;
  items: TabItem[];
  collageImages?: CollageImage[];
  dark?: boolean;
}) {
  const collage = (collageImages ?? []).slice(0, COLLAGE_LAYOUT.length);

  return (
    <section className={`py-20 md:py-24 ${dark ? 'bg-primary text-white' : 'bg-bg'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top accent line */}
        <div className={`h-px ${dark ? 'bg-white/20' : 'bg-secondary/40'} mb-12 md:mb-16`} />

        {/* Header row: label left, heading + tab links right (links sit under the heading). */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(160px,1fr)_3fr] gap-4 lg:gap-8">
          <div className="pt-2">
            {label && <SectionLabel label={label} dark={dark} />}
          </div>

          <div>
            {heading && (
              <h2 className={`heading-h2-serif mb-6 ${dark ? 'text-white' : 'text-primary'}`}>
                {heading}
              </h2>
            )}

            {items.length > 0 && (
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
            )}
          </div>
        </div>

        {collage.length > 0 && (
          <div
            className="relative w-full mt-16 md:mt-24"
            style={{ aspectRatio: '1234 / 750' }}
          >
            {collage.map((img, i) => {
              const pos = COLLAGE_LAYOUT[i];
              return (
                <div
                  key={i}
                  className="absolute overflow-hidden shadow-md"
                  style={{
                    left: pos.left,
                    top: pos.top,
                    width: pos.width,
                    aspectRatio: pos.aspectRatio,
                  }}
                >
                  <img src={img.src} alt={img.alt ?? ''} className="w-full h-full object-cover block" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
