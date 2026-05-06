import { ArrowLink } from '../shared/ArrowLink';

export interface MembershipProgramItem {
  heading: string;
  description?: string;
  image?: string;
  cta?: { label: string; href?: string };
}

interface MembershipProgramsProps {
  cards: MembershipProgramItem[];
}

export function MembershipPrograms({ cards }: MembershipProgramsProps) {
  if (!cards || cards.length === 0) return null;

  return (
    <section
      className="text-white"
      style={{
        backgroundImage:
          'radial-gradient(82% 95% at 98% 167.5%, rgb(107, 187, 174) 0%, rgb(0, 30, 98) 100%)',
        backgroundColor: '#001E62',
      }}
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 lg:gap-x-14 gap-y-14">
          {cards.map((c) => (
            <article key={c.heading} className="flex flex-col">
              {c.image && (
                <div className="w-full aspect-square overflow-hidden mb-7">
                  <img
                    src={c.image}
                    alt=""
                    className="w-full h-full object-cover block"
                    loading="lazy"
                  />
                </div>
              )}
              <h3 className="font-heading italic font-light text-white text-[2rem] md:text-[26.56px] leading-[1.1] mb-4">
                {c.heading}
              </h3>
              <div className="h-px w-12 bg-secondary mb-5" />
              {c.description && (
                <p className="font-body font-light text-[15px] md:text-[17.6px] leading-[1.4] text-white/85 mb-7">
                  {c.description}
                </p>
              )}
              {c.cta?.label && (
                <div className="mt-auto">
                  <ArrowLink
                    label={c.cta.label}
                    href={c.cta.href ?? '#'}
                    dark
                    icon="arrow"
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
