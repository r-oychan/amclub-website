import { useState } from 'react';
import type { OutletCard, OutletGroup, OutletScheduleBlock } from '../../data/contactUs';

interface Props {
  groups: OutletGroup[];
  defaultGroupId?: string;
}

export function OutletOperatingHours({ groups, defaultGroupId }: Props) {
  const [activeId, setActiveId] = useState(defaultGroupId ?? groups[0]?.id);
  const active = groups.find((g) => g.id === activeId) ?? groups[0];

  return (
    <section className="bg-bg">
      <div className="max-w-7xl mx-auto px-10 pt-10 pb-[110px]">
        <h2
          className="font-heading text-primary text-center"
          style={{
            fontSize: '38.4px',
            fontWeight: 300,
            fontStyle: 'italic',
            letterSpacing: '-1.152px',
            lineHeight: '42.24px',
            marginBottom: '40px',
          }}
        >
          Outlet Operating Hours
        </h2>

        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {groups.map((g) => {
            const isActive = g.id === active.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveId(g.id)}
                className={
                  'inline-flex items-center rounded-full transition-colors cursor-pointer ' +
                  (isActive
                    ? 'bg-accent text-white'
                    : 'bg-transparent text-primary hover:bg-primary/5')
                }
                style={{
                  padding: '12px 16px',
                  fontSize: '13.6px',
                  fontWeight: 700,
                  letterSpacing: '0.544px',
                  textTransform: 'uppercase',
                  lineHeight: '14.96px',
                }}
              >
                {g.label}
              </button>
            );
          })}
        </div>

        {/* Card grid — 4-column masonry-style on desktop */}
        <div className="columns-1 md:columns-2 xl:columns-4" style={{ columnGap: '24px' }}>
          {active.cards.map((card) => (
            <div key={card.name} className="break-inside-avoid mb-6">
              <OutletCardView card={card} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OutletCardView({ card }: { card: OutletCard }) {
  return (
    <div
      className="bg-white"
      style={{
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <h3
        className="text-text-dark"
        style={{
          fontFamily: 'Inter, var(--font-body)',
          fontSize: '24px',
          fontWeight: 700,
          letterSpacing: '-0.48px',
          lineHeight: '33.6px',
          color: '#000',
        }}
      >
        {card.name}
      </h3>
      <div className="flex flex-col" style={{ gap: '24px' }}>
        {card.blocks.map((block, i) => (
          <ScheduleBlockView key={i} block={block} />
        ))}
      </div>
    </div>
  );
}

function ScheduleBlockView({ block }: { block: OutletScheduleBlock }) {
  return (
    <div className="flex flex-col" style={{ gap: '8px' }}>
      {block.subtitle && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '17.6px',
            fontWeight: 700,
            color: '#000',
            lineHeight: '24.64px',
          }}
        >
          {block.subtitle}
        </p>
      )}
      {block.rows.map((row, i) => (
        <div key={i} className="flex flex-col" style={{ gap: '4px' }}>
          {row.dayRange && (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '17.6px',
                fontWeight: 700,
                color: '#000',
                lineHeight: '24.64px',
              }}
            >
              {row.dayRange}
            </p>
          )}
          {row.time && (
            <p
              className="text-text-dark"
              style={{ fontSize: '17.6px', fontWeight: 400, lineHeight: '26.4px' }}
            >
              {row.time}
            </p>
          )}
          {row.lastOrder && (
            <p
              className="text-text-dark"
              style={{ fontSize: '17.6px', fontWeight: 400, lineHeight: '26.4px' }}
            >
              {row.lastOrder}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
