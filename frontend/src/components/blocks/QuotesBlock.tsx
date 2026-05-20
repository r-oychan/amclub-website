import type { BlockQuotesBlock } from '../../lib/blocks';

export function QuotesBlock({ heading, items }: Omit<BlockQuotesBlock, '__component'>) {
  const valid = (items ?? []).filter((it) => it.quote);
  if (valid.length === 0) return null;

  return (
    <section className="bg-bg py-16 md:py-24">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        {heading && (
          <h2 className="font-heading italic font-light text-[2rem] md:text-[2.4rem] leading-[1.1] tracking-[-0.03em] text-primary text-center mb-10">
            {heading}
          </h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {valid.map((it, idx) => (
            <figure
              key={idx}
              className="bg-white rounded-lg p-7 md:p-8 border border-primary/10"
            >
              <blockquote className="font-heading italic text-[1.125rem] md:text-[1.25rem] leading-[1.5] text-primary">
                "{it.quote}"
              </blockquote>
              {(it.author || it.role || it.image?.url) && (
                <figcaption className="mt-5 flex items-center gap-3">
                  {it.image?.url && (
                    <img
                      src={it.image.url}
                      alt={it.image.alternativeText ?? it.author ?? ''}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    {it.author && (
                      <div className="font-body font-semibold text-[14px] text-primary">
                        {it.author}
                      </div>
                    )}
                    {it.role && (
                      <div className="font-body text-[12.5px] text-text-dark/70">{it.role}</div>
                    )}
                  </div>
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
