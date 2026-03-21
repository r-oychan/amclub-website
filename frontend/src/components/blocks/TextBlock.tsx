import type { CtaButton } from '../../lib/types';
import { Button } from '../shared/Button';

export function TextBlock({
  label,
  heading,
  body,
  funFact,
  vision,
  mission,
  timeline,
  cta,
  ctas,
}: {
  label?: string;
  heading?: string;
  body?: string;
  funFact?: string;
  vision?: string;
  mission?: string;
  timeline?: string;
  cta?: CtaButton;
  ctas?: CtaButton[];
}) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {label && (
          <p className="text-sm font-bold uppercase tracking-widest text-accent mb-4">{label}</p>
        )}
        {heading && (
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary mb-6 italic">{heading}</h2>
        )}
        {body && (
          <div className="text-text-dark/80 leading-relaxed whitespace-pre-line mb-6">{body}</div>
        )}
        {funFact && (
          <div className="bg-accent/10 border-l-4 border-accent rounded-r-lg p-4 mb-6">
            <p className="text-sm font-medium text-accent">{funFact}</p>
          </div>
        )}
        {timeline && (
          <p className="text-text-dark/70 text-sm mt-4 mb-6">{timeline}</p>
        )}
        {vision && (
          <div className="mb-8">
            <h3 className="font-heading text-xl font-bold text-primary mb-2">Our Vision</h3>
            <p className="text-text-dark/80 italic">{vision}</p>
          </div>
        )}
        {mission && (
          <div className="mb-8">
            <h3 className="font-heading text-xl font-bold text-primary mb-2">Our Mission</h3>
            <p className="text-text-dark/80 italic">{mission}</p>
          </div>
        )}
        {cta && (
          <Button label={cta.label} href={cta.href} variant="secondary" />
        )}
        {ctas && ctas.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-4">
            {ctas.map((c) => (
              <Button key={c.label} label={c.label} href={c.href} variant="secondary" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
