import type { ReactNode } from 'react';

type IconName =
  | 'clock'
  | 'location'
  | 'reservation'
  | 'dresscode'
  | 'capacity'
  | 'menu'
  | 'sponsorship';

const ICON_STROKE = '#DF4661';

function SectionIcon({ icon }: { icon: IconName }) {
  switch (icon) {
    case 'clock':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke={ICON_STROKE} strokeWidth="1.5" />
          <path
            d="M12 6V12L16 14"
            stroke={ICON_STROKE}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'location':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
            stroke={ICON_STROKE}
            strokeWidth="1.5"
          />
          <circle cx="12" cy="9" r="2.5" stroke={ICON_STROKE} strokeWidth="1.5" />
        </svg>
      );
    case 'reservation':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect
            x="3"
            y="4"
            width="18"
            height="18"
            rx="2"
            stroke={ICON_STROKE}
            strokeWidth="1.5"
          />
          <path d="M16 2V6" stroke={ICON_STROKE} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 2V6" stroke={ICON_STROKE} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M3 10H21" stroke={ICON_STROKE} strokeWidth="1.5" />
        </svg>
      );
    case 'dresscode':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L15 8H20L16 12L17.5 18L12 15L6.5 18L8 12L4 8H9L12 2Z"
            stroke={ICON_STROKE}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'capacity':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M17 21V19C17 16.79 15.21 15 13 15H5C2.79 15 1 16.79 1 19V21"
            stroke={ICON_STROKE}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="9" cy="7" r="4" stroke={ICON_STROKE} strokeWidth="1.5" />
        </svg>
      );
    case 'menu':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 3V11C3 12.1 3.9 13 5 13H7V21H9V3"
            stroke={ICON_STROKE}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 3V8"
            stroke={ICON_STROKE}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M3 3V8"
            stroke={ICON_STROKE}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M15 3C15 3 15 8 15 11C15 14 17 14 17 14V21H19V14C19 14 21 14 21 11C21 8 21 3 21 3"
            stroke={ICON_STROKE}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'sponsorship':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M20.84 4.61C19.32 3.09 16.85 3.09 15.33 4.61L12 7.94L8.67 4.61C7.15 3.09 4.68 3.09 3.16 4.61C1.64 6.13 1.64 8.6 3.16 10.12L12 18.96L20.84 10.12C22.36 8.6 22.36 6.13 20.84 4.61Z"
            stroke={ICON_STROKE}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

const HEADING_STYLE: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '20.8px',
  fontWeight: 700,
  color: '#DF4661',
  letterSpacing: '-0.416px',
  lineHeight: '29.12px',
};

export function DetailSection({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col" style={{ gap: '24px' }}>
      {/* Header */}
      <div className="flex flex-row items-center gap-2.5">
        <SectionIcon icon={icon} />
        <h2 style={HEADING_STYLE}>{title}</h2>
      </div>
      {/* Teal divider */}
      <div className="h-px bg-secondary" />
      {/* Content */}
      {children}
    </div>
  );
}
