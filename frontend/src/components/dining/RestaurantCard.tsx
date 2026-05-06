import { ArrowLink } from '../shared/ArrowLink';
import type { CtaIconName } from '../shared/CtaIcon';

export interface RestaurantCardCta {
  label: string;
  href?: string;
  icon?: CtaIconName | null;
  isExternal?: boolean;
}

interface RestaurantCardProps {
  name: string;
  slug: string;
  cuisineType: string;
  cuisineIconSlug: string;
  description: string;
  image: string;
  logo: string;
  dressCode?: string;
  /** When true, renders the Smart Casual icon + "SMART CASUAL" badge. */
  smartCasual?: boolean;
  ctas: RestaurantCardCta[];
  /** Label for the auto-prepended detail-page link. Defaults to "Read More". */
  readMoreLabel?: string;
}

export function RestaurantCard({
  name,
  slug,
  cuisineType,
  cuisineIconSlug,
  description,
  image,
  logo,
  dressCode,
  smartCasual,
  ctas,
  readMoreLabel = 'Read More',
}: RestaurantCardProps) {
  const detailHref = `/dining/${slug}`;

  // The CMS introduced a `smartCasual` boolean to replace the legacy free-text
  // `dressCode`. Until every entry is migrated, also treat dressCode === "Smart Casual"
  // (whitespace/case-insensitive) as the same signal so the deployed badge renders
  // correctly without waiting for editors to tick the new checkbox.
  const showSmartCasual =
    smartCasual === true ||
    (typeof dressCode === 'string' &&
      dressCode.trim().toLowerCase().replace(/\s+/g, ' ') === 'smart casual');

  // Always lead with a Read More link back to the restaurant detail page.
  // Drop any duplicate Read More entries supplied by the CMS so the auto-prepended
  // link is the single source of truth.
  const trailingCtas = ctas.filter(
    (c) => c.label.trim().toLowerCase() !== readMoreLabel.toLowerCase(),
  );

  return (
    <article className="group">
      <div className="relative">
        <div className="overflow-hidden h-[220px] md:h-[375px]">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        {logo && (
          <img
            src={logo}
            alt={`${name} logo`}
            className="pointer-events-none absolute right-6 md:right-10 bottom-0 translate-y-1/2 h-[100px] w-[100px] md:h-[124px] md:w-[124px] object-contain z-10"
          />
        )}
      </div>

      <h3 className="font-heading text-2xl md:text-[32px] font-normal italic text-primary leading-[1] mt-4 mb-3">
        {name}
      </h3>

      {/* Cuisine row */}
      <div className="flex items-center gap-2 mb-1">
        {cuisineIconSlug && (
          <img
            src={`/uploads/icons/cuisine-${cuisineIconSlug}.svg`}
            alt=""
            className="w-[26px] h-[26px] opacity-70"
          />
        )}
        <span className="text-[13.6px] font-bold uppercase tracking-[0.04em] text-primary">
          {cuisineType}
        </span>
      </div>

      {/* Smart Casual badge (CMS-toggled) — preferred over the legacy free-text dressCode */}
      {showSmartCasual ? (
        <div className="flex items-center gap-2 mb-2">
          <img
            src="/icons/smart-casual.png"
            alt=""
            className="w-[26px] h-[26px] object-contain"
          />
          <span className="text-[13.6px] font-normal uppercase tracking-[0.04em] leading-[1.1] text-[#3F4452]">
            Smart Casual
          </span>
        </div>
      ) : (
        dressCode && (
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-text-dark/50">
              <path
                d="M8 1L6.5 6H2L5.5 9L4 14L8 11L12 14L10.5 9L14 6H9.5L8 1Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[13.6px] font-bold uppercase tracking-[0.04em] text-text-dark/70">
              {dressCode}
            </span>
          </div>
        )
      )}

      {/* Description */}
      <p className="text-[17.6px] font-light leading-[1.4] text-primary mb-5 mt-3">
        {description}
      </p>

      {/* CTAs — Read More first, then CMS-configured links */}
      <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
        <ArrowLink label={readMoreLabel} href={detailHref} icon="arrow" />
        {trailingCtas.map((cta) => (
          <ArrowLink
            key={cta.label}
            label={cta.label}
            href={cta.href ?? detailHref}
            icon={cta.icon ?? 'arrow'}
            isExternal={cta.isExternal}
          />
        ))}
      </div>
    </article>
  );
}
