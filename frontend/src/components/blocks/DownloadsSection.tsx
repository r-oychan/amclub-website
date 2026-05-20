import { ArrowLink } from '../shared/ArrowLink';
import type { StrapiLink } from '../../lib/blocks';

export function DownloadsSection({
  heading = "Forms You'll Need",
  items,
}: {
  heading?: string;
  items?: StrapiLink[];
}) {
  const valid = (items ?? []).filter((it) => it.label && it.href);
  if (valid.length === 0) return null;

  return (
    <section className="bg-bg py-16 md:py-24">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading italic font-light text-[1.75rem] md:text-[2.25rem] leading-[1.15] tracking-[-0.03em] text-primary mb-8">
          {heading}
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
          {valid.map((it, idx) => (
            <li key={`${it.href}-${idx}`} className="border-t border-primary/10 pt-3">
              <ArrowLink
                href={it.href!}
                label={it.label!}
                isExternal={Boolean(it.isExternal)}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
