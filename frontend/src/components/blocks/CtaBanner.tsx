import type { CtaButton } from '../../lib/types';
import { ArrowLink } from '../shared/ArrowLink';

export function CtaBanner({
  heading,
  subheading,
  body,
  ctas,
  variant = 'dark',
}: {
  heading: string;
  subheading?: string;
  body?: string;
  ctas?: CtaButton[];
  variant?: 'dark' | 'light' | 'accent';
}) {
  const bgClass = {
    dark: 'bg-primary text-white',
    light: 'bg-bg text-primary',
    accent: 'bg-accent text-white',
  }[variant];

  const isDark = variant === 'dark' || variant === 'accent';

  return (
    <section className={`py-16 md:py-24 ${bgClass}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-heading italic font-light text-[2rem] md:text-[2.4rem] leading-[1.1] tracking-[-0.03em] mb-4">
          {heading}
        </h2>
        {subheading && <p className="text-lg opacity-80 mb-4">{subheading}</p>}
        {body && (
          <p
            className={`max-w-xl mx-auto mb-8 font-body text-[15px] md:text-[17.6px] font-light leading-[1.4] ${
              isDark ? 'text-white/77' : 'text-primary'
            }`}
          >
            {body}
          </p>
        )}
        {ctas && ctas.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
            {ctas.map((cta) => (
              <ArrowLink
                key={cta.label}
                label={cta.label}
                href={cta.href ?? '#'}
                dark={isDark}
                icon={cta.icon ?? 'arrow'}
                isExternal={cta.isExternal}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
