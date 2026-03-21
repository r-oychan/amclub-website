import { ArrowLink } from '../shared/ArrowLink';

interface RestaurantCardProps {
  name: string;
  slug: string;
  cuisineType: string;
  cuisineIconSlug: string;
  description: string;
  image: string;
  logo: string;
  dressCode?: string;
  ctas: { label: string; href?: string }[];
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
  ctas,
}: RestaurantCardProps) {
  return (
    <article className="group">
      {/* Photo with logo overlay */}
      <div className="relative h-[200px] md:h-[375px] overflow-hidden mb-4">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <img
          src={logo}
          alt={`${name} logo`}
          className="absolute bottom-4 right-4 h-[60px] w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
        />
      </div>

      {/* Name */}
      <h3 className="font-heading text-xl md:text-2xl font-light italic text-primary mb-2">
        {name}
      </h3>

      {/* Cuisine row */}
      <div className="flex items-center gap-2 mb-1">
        <img
          src={`/uploads/icons/cuisine-${cuisineIconSlug}.svg`}
          alt=""
          className="w-4 h-4 opacity-60"
        />
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-dark/70">
          {cuisineType}
        </span>
      </div>

      {/* Dress code (optional) */}
      {dressCode && (
        <div className="flex items-center gap-2 mb-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-text-dark/50">
            <path
              d="M8 1L6.5 6H2L5.5 9L4 14L8 11L12 14L10.5 9L14 6H9.5L8 1Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-dark/70">
            {dressCode}
          </span>
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-text-dark/80 leading-relaxed mb-4 mt-2">
        {description}
      </p>

      {/* CTAs */}
      <div className="flex flex-wrap items-center gap-4">
        {ctas.map((cta) => (
          <ArrowLink
            key={cta.label}
            label={cta.label}
            href={cta.href ?? `/dining/${slug}`}
          />
        ))}
      </div>
    </article>
  );
}
