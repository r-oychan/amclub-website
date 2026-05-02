import { Link } from 'react-router';
import { useScrollFadeIn } from '../../hooks/useScrollFadeIn';

export interface PackageItem {
  name: string;
  tagline: string;
  image: string;
  serviceFeatures: string[];
  venues: string[];
  cta?: { label: string; href?: string };
}

export function PrivateEventPackages({
  heading = 'Private Event Packages',
  subheading = 'Carefully curated venues with customizable packages for every occasion.',
  enquireCta,
  items,
}: {
  heading?: string;
  subheading?: string;
  enquireCta?: { label: string; href?: string };
  items: PackageItem[];
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
          {enquireCta && (
            <div className="mt-5">
              <ArrowLink label={enquireCta.label} href={enquireCta.href ?? '#'} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {items.map((item, i) => (
            <div
              key={item.name}
              className={fade(`delay-[${100 + i * 120}ms]`)}
            >
              <PackageCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PackageCard({ item }: { item: PackageItem }) {
  return (
    <article className="bg-bg flex flex-col h-full">
      <div className="relative w-full aspect-[3/2] overflow-hidden">
        <img
          src={item.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col gap-5 px-8 py-10 md:px-[46px] md:py-[46px] flex-1">
        <div>
          <h3 className="font-heading italic font-light text-[1.66rem] leading-[1.1] text-primary">
            {item.name}
          </h3>
          <div className="mt-3 h-px w-16 bg-primary/25" />
        </div>
        <p className="font-body text-[15px] md:text-[16px] font-semibold leading-[1.35] text-primary">
          {item.tagline}
        </p>

        <PackageList eyebrow="Service Features" items={item.serviceFeatures} />
        <PackageList eyebrow="Venues" items={item.venues} />

        {item.cta && (
          <div className="mt-auto pt-2">
            <ArrowLink label={item.cta.label} href={item.cta.href ?? '#'} />
          </div>
        )}
      </div>
    </article>
  );
}

function PackageList({ eyebrow, items }: { eyebrow: string; items: string[] }) {
  return (
    <div>
      <p className="font-body text-[12.8px] font-bold uppercase tracking-[0.06em] text-accent mb-2">
        {eyebrow}
      </p>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li
            key={it}
            className="flex items-start gap-2 font-body text-[15px] font-light leading-[1.4] text-primary"
          >
            <CheckIcon className="mt-1 shrink-0 text-secondary" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2.5 7.5L5.5 10.5L11.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowLink({ label, href }: { label: string; href: string }) {
  const className =
    'inline-flex items-center gap-2 font-body text-[14.4px] font-bold uppercase tracking-[0.06em] text-primary hover:text-primary-dark transition-colors duration-200';
  const icon = (
    <svg
      width="12"
      height="12"
      viewBox="0 0 14 14"
      fill="none"
      className="shrink-0 text-accent transition-transform duration-200 group-hover:translate-x-1"
      aria-hidden="true"
    >
      <path
        d="M1 13L13 1M13 1H3M13 1V11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (href.startsWith('http')) {
    return (
      <a className={`group ${className}`} href={href} target="_blank" rel="noopener noreferrer">
        {label}
        {icon}
      </a>
    );
  }
  return (
    <Link className={`group ${className}`} to={href}>
      {label}
      {icon}
    </Link>
  );
}
