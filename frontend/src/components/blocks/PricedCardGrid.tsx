import type { BlockPricedCardGrid } from '../../lib/blocks';
import { toCta } from '../../lib/blocks';
import { Button } from '../shared/Button';

export function PricedCardGrid({
  heading,
  subheading,
  variant = 'package',
  columns = 3,
  items,
}: Omit<BlockPricedCardGrid, '__component'>) {
  if (!items?.length) return null;

  const cols = Math.min(Math.max(columns, 1), 4);
  const gridClass =
    cols === 1
      ? 'grid-cols-1'
      : cols === 2
        ? 'grid-cols-1 md:grid-cols-2'
        : cols === 3
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section className="bg-bg py-16 md:py-24">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        {(heading || subheading) && (
          <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
            {heading && (
              <h2 className="font-heading italic font-light text-[2rem] md:text-[2.4rem] leading-[1.1] tracking-[-0.03em] text-primary">
                {heading}
              </h2>
            )}
            {subheading && (
              <p className="mt-3 font-body text-[15px] md:text-[17.6px] font-light leading-[1.4] text-text-dark/80">
                {subheading}
              </p>
            )}
          </div>
        )}
        <div className={`grid gap-6 lg:gap-8 ${gridClass}`}>
          {items.map((item, idx) => {
            const cta = toCta(item.cta);
            const secondaryCta = toCta(item.secondaryCta);
            return (
              <article
                key={`${item.name ?? 'card'}-${idx}`}
                className={`flex flex-col bg-white rounded-lg overflow-hidden border ${
                  item.badge ? 'border-accent' : 'border-primary/10'
                }`}
              >
                {item.image?.url && (
                  <div className="aspect-[4/3] overflow-hidden bg-primary/5">
                    <img
                      src={item.image.url}
                      alt={item.image.alternativeText ?? item.name ?? ''}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6 md:p-7 flex flex-col flex-1">
                  {item.badge && (
                    <span
                      className={`inline-block text-[11px] tracking-[0.15em] uppercase font-semibold mb-3 ${
                        item.badgeTone === 'negative' ? 'text-red-600' : 'text-accent'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.name && (
                    <h3 className="font-heading italic font-light text-[1.5rem] leading-tight text-primary mb-1">
                      {item.name}
                    </h3>
                  )}
                  {item.subheading && (
                    <p className="font-body text-[13.5px] text-text-dark/70 mb-3">
                      {item.subheading}
                    </p>
                  )}
                  {item.description && (
                    <p className="font-body text-[14px] leading-[1.5] text-text-dark/80 mb-4 whitespace-pre-line">
                      {item.description}
                    </p>
                  )}
                  {variant === 'tier' && (item.feeLabel || item.feeAmount) && (
                    <div className="mt-2 mb-4 border-t border-primary/10 pt-4">
                      {item.feeLabel && (
                        <p className="text-[11px] uppercase tracking-[0.15em] text-text-dark/60">
                          {item.feeLabel}
                        </p>
                      )}
                      {item.feeAmount && (
                        <p className="font-heading text-[1.75rem] text-primary mt-1">
                          {item.feeAmount}
                        </p>
                      )}
                      {item.breakdown && (
                        <p className="text-[12.5px] text-text-dark/70 mt-2 whitespace-pre-line">
                          {item.breakdown}
                        </p>
                      )}
                    </div>
                  )}
                  {item.bullets?.length ? (
                    <ul className="space-y-2 mb-5">
                      {item.bullets
                        .filter((b) => b.text)
                        .map((b, i) => (
                          <li
                            key={i}
                            className="flex gap-2 font-body text-[14px] leading-[1.5] text-text-dark/85"
                          >
                            <span className="text-accent mt-1">▸</span>
                            <span>{b.text}</span>
                          </li>
                        ))}
                    </ul>
                  ) : null}
                  {(cta || secondaryCta) && (
                    <div className="mt-auto flex flex-wrap gap-3 pt-2">
                      {cta && (
                        <Button href={cta.href} label={cta.label} variant="primary" />
                      )}
                      {secondaryCta && (
                        <Button
                          href={secondaryCta.href}
                          label={secondaryCta.label}
                          variant="secondary"
                        />
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
