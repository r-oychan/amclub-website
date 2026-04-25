import type { CtaButton } from '../../lib/types';
import { Button } from '../shared/Button';

interface TextBlockProps {
  label?: string;
  heading?: string;
  body?: string;
  funFact?: string;
  vision?: string;
  mission?: string;
  timeline?: string;
  cta?: CtaButton;
  ctas?: CtaButton[];
  image?: string;
  imagePosition?: 'left' | 'right';
}

function TextBlockBody({ label, heading, body, funFact, vision, mission, timeline, cta, ctas }: Omit<TextBlockProps, 'image' | 'imagePosition'>) {
  return (
    <>
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
        <div className="mb-10">
          <h3
            className="font-heading italic text-primary mb-4"
            style={{ fontSize: 'clamp(1.5rem, 1.6vw + 1rem, 1.875rem)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.1 }}
          >
            Our Vision
          </h3>
          <div className="h-[2px] w-12 bg-accent mb-5" />
          <p className="text-text-dark/80 leading-relaxed">{vision}</p>
        </div>
      )}
      {mission && (
        <div className="mb-8">
          <h3
            className="font-heading italic text-primary mb-4"
            style={{ fontSize: 'clamp(1.5rem, 1.6vw + 1rem, 1.875rem)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.1 }}
          >
            Our Mission
          </h3>
          <div className="h-[2px] w-12 bg-accent mb-5" />
          <p className="text-text-dark/80 leading-relaxed">{mission}</p>
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
    </>
  );
}

export function TextBlock(props: TextBlockProps) {
  const { image, imagePosition = 'left', ...body } = props;

  if (image) {
    const imgEl = (
      <img
        src={image}
        alt=""
        className="w-full aspect-[4/5] md:aspect-[3/4] object-cover"
        loading="lazy"
      />
    );
    const textEl = (
      <div>
        <TextBlockBody {...body} />
      </div>
    );
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
            {imagePosition === 'right' ? (
              <>
                {textEl}
                {imgEl}
              </>
            ) : (
              <>
                {imgEl}
                {textEl}
              </>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <TextBlockBody {...body} />
      </div>
    </section>
  );
}
