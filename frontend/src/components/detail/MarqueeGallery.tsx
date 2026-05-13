interface MarqueeRow {
  images: string[];
  /** 'ltr' scrolls left-to-right; 'rtl' right-to-left. Default: row 0 = rtl, row 1 = ltr. */
  direction?: 'ltr' | 'rtl';
  /** Seconds for one full loop. Default 60. */
  durationSec?: number;
}

export function MarqueeGallery({
  heading,
  rows,
  imageHeightPx = 240,
  gapPx = 16,
}: {
  heading?: string;
  rows: MarqueeRow[];
  imageHeightPx?: number;
  gapPx?: number;
}) {
  if (!rows.length) return null;
  return (
    <section className="bg-bg overflow-hidden" style={{ paddingBottom: '120px' }}>
      <div className="max-w-7xl mx-auto px-10" style={{ marginBottom: heading ? '32px' : 0 }}>
        {heading && (
          <h2
            className="font-heading text-primary text-center"
            style={{
              fontSize: '38.4px',
              fontWeight: 300,
              fontStyle: 'italic',
              letterSpacing: '-1.152px',
              lineHeight: '42.24px',
            }}
          >
            {heading}
          </h2>
        )}
      </div>
      <div className="flex flex-col" style={{ gap: `${gapPx}px` }}>
        {rows.map((row, idx) => {
          const direction = row.direction ?? (idx % 2 === 0 ? 'rtl' : 'ltr');
          const duration = row.durationSec ?? 60;
          const loop = [...row.images, ...row.images];
          const anim = direction === 'rtl' ? 'marquee-gallery-rtl' : 'marquee-gallery-ltr';
          return (
            <div key={idx} className="relative w-full overflow-hidden group">
              <div
                className="flex w-max group-hover:[animation-play-state:paused]"
                style={{
                  gap: `${gapPx}px`,
                  animation: `${anim} ${duration}s linear infinite`,
                }}
              >
                {loop.map((src, i) => (
                  <div
                    key={`${idx}-${i}-${src}`}
                    className="shrink-0 overflow-hidden bg-white/40"
                    style={{ height: `${imageHeightPx}px` }}
                  >
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      className="h-full w-auto object-cover block"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes marquee-gallery-rtl {
          from { transform: translateX(0%); }
          to { transform: translateX(-50%); }
        }
        @keyframes marquee-gallery-ltr {
          from { transform: translateX(-50%); }
          to { transform: translateX(0%); }
        }
      `}</style>
    </section>
  );
}
