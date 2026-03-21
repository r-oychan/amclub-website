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
    light: 'bg-white text-primary',
    accent: 'bg-accent text-white',
  }[variant];

  const isDark = variant === 'dark' || variant === 'accent';

  return (
    <section className={`py-16 ${bgClass}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 italic">{heading}</h2>
        {subheading && <p className="text-lg opacity-80 mb-4">{subheading}</p>}
        {body && <p className="opacity-80 mb-8 max-w-xl mx-auto">{body}</p>}
        {ctas && ctas.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6">
            {ctas.map((cta) => (
              <ArrowLink
                key={cta.label}
                label={cta.label}
                href={cta.href ?? '#'}
                dark={isDark}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
