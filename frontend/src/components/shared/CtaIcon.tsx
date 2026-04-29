import type { ReactElement } from 'react';

export type CtaIconName =
  | 'arrow'
  | 'menu'
  | 'clock'
  | 'phone'
  | 'mail'
  | 'calendar'
  | 'map-pin'
  | 'external';

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const PATHS: Record<CtaIconName, ReactElement> = {
  arrow: (
    <>
      <path {...STROKE} d="M7 17L17 7" />
      <path {...STROKE} d="M8.25 7H17V15.75" />
    </>
  ),
  menu: (
    <>
      <path {...STROKE} d="M19.25 5.75H14C12.8954 5.75 12 6.6454 12 7.75V19.25L12.828 18.422C13.579 17.671 14.596 17.25 15.657 17.25H19.25V5.75Z" />
      <path {...STROKE} d="M4.75 5.75H10C11.1046 5.75 12 6.6454 12 7.75V19.25L11.172 18.422C10.421 17.671 9.404 17.25 8.343 17.25H4.75V5.75Z" />
    </>
  ),
  clock: (
    <>
      <circle {...STROKE} cx="12" cy="12" r="7.25" />
      <path {...STROKE} d="M12 8V12L14.5 14" />
    </>
  ),
  phone: (
    <path
      {...STROKE}
      d="M5 4.75H8L9.5 8.5L7.6 9.7C8.4 11.4 9.6 12.6 11.3 13.4L12.5 11.5L16.25 13V16C16.25 16.83 15.58 17.5 14.75 17.5C9.06 17.16 4.84 12.94 4.5 7.25C4.5 6.42 5.17 5.75 6 5.75H5V4.75Z"
    />
  ),
  mail: (
    <>
      <rect {...STROKE} x="4" y="6" width="16" height="12" rx="1.5" />
      <path {...STROKE} d="M4.75 7.5L12 12.5L19.25 7.5" />
    </>
  ),
  calendar: (
    <>
      <rect {...STROKE} x="4.75" y="5.75" width="14.5" height="13.5" rx="1.5" />
      <path {...STROKE} d="M4.75 9.75H19.25" />
      <path {...STROKE} d="M8 4V7" />
      <path {...STROKE} d="M16 4V7" />
    </>
  ),
  'map-pin': (
    <>
      <path {...STROKE} d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12Z" />
      <circle {...STROKE} cx="12" cy="9" r="2.5" />
    </>
  ),
  external: (
    <>
      <path {...STROKE} d="M14 5H19V10" />
      <path {...STROKE} d="M19 5L11 13" />
      <path {...STROKE} d="M19 13.5V18.25C19 18.8 18.55 19.25 18 19.25H6.75C6.2 19.25 5.75 18.8 5.75 18.25V7C5.75 6.45 6.2 6 6.75 6H10.5" />
    </>
  ),
};

export function CtaIcon({
  name = 'arrow',
  size = 18,
  className,
}: {
  name?: CtaIconName | null;
  size?: number;
  className?: string;
}) {
  if (!name) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="presentation"
      className={`shrink-0 ${className ?? ''}`}
    >
      {PATHS[name] ?? PATHS.arrow}
    </svg>
  );
}
