import type { PartnerLogo } from '../../lib/types';

interface PartnerGroup {
  heading?: string;
  logos: PartnerLogo[];
}

export function PartnerOrganizations({
  heading = 'Partner Organizations',
  groups,
}: {
  heading?: string;
  groups: PartnerGroup[];
}) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl md:text-4xl font-light italic text-primary text-center mb-12">
          {heading}
        </h2>

        {groups.map((group, idx) => (
          <div key={group.heading ?? idx} className={idx > 0 ? 'mt-12' : ''}>
            {group.heading && (
              <h3 className="font-body font-bold text-base text-text-dark text-center mb-8">
                {group.heading}
              </h3>
            )}
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {group.logos.map((logo) => {
                const inner = (
                  <img
                    src={logo.image}
                    alt={logo.name}
                    className="h-16 md:h-20 w-auto object-contain max-w-[180px]"
                    loading="lazy"
                  />
                );
                return logo.href ? (
                  <a
                    key={logo.name}
                    href={logo.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={logo.name}>{inner}</div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
