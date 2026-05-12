import { useScrollFadeIn } from '../../hooks/useScrollFadeIn';
import { ArrowLink } from '../shared/ArrowLink';

export interface PartyPackageItem {
  name: string;
  image: string;
  imageAlt?: string;
  cta?: { label: string; href: string; isExternal?: boolean };
}

export function KidsPartyPackages({
  heading = 'Parties Made Easy',
  subheading = "Fun-filled kids' party packages designed for memorable celebrations.",
  items,
}: {
  heading?: string;
  subheading?: string;
  items: PartyPackageItem[];
}) {
  const { ref, isVisible } = useScrollFadeIn({ threshold: 0.05, replay: false });
  const fade = (delay: string) =>
    `transition-all duration-700 ease-out ${delay} ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    }`;

  return (
    <section ref={ref} className="bg-bg pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center max-w-3xl mx-auto mb-10 md:mb-14 ${fade('delay-0')}`}>
          <h2 className="font-heading italic font-light text-[2rem] md:text-[2.4rem] leading-[1.1] tracking-[-0.03em] text-primary">
            {heading}
          </h2>
          {subheading && (
            <p className="mt-3 font-body text-[15px] md:text-[17.6px] font-light leading-[1.4] text-text-dark/80">
              {subheading}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {items.map((item, i) => (
            <div key={item.name} className={fade(`delay-[${100 + i * 120}ms]`)}>
              <PackageCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PackageCard({ item }: { item: PartyPackageItem }) {
  return (
    <article className="group bg-white flex flex-col h-full">
      <div className="relative w-full aspect-[3/2] overflow-hidden">
        <img
          src={item.image}
          alt={item.imageAlt ?? item.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col gap-5 px-8 py-8 md:px-10 md:py-10 flex-1">
        <div>
          <h3 className="font-heading italic font-light text-[1.66rem] leading-[1.1] text-primary">
            {item.name}
          </h3>
          <div className="mt-3 h-px w-[90px] bg-secondary" />
        </div>
        {item.cta && (
          <div className="mt-auto">
            <ArrowLink
              label={item.cta.label}
              href={item.cta.href}
              isExternal={item.cta.isExternal}
            />
          </div>
        )}
      </div>
    </article>
  );
}
