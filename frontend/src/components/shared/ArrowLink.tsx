import { Link } from 'react-router';
import { CtaIcon, type CtaIconName } from './CtaIcon';

export interface ArrowLinkProps {
  label: string;
  href: string;
  dark?: boolean;
  isExternal?: boolean;
  /** Selectable icon (default: 'arrow'). Pass null to render no icon. */
  icon?: CtaIconName | null;
  /** Override icon color class (default: pink accent on light, teal on dark). */
  iconColorClass?: string;
  /** Pixel size for the trailing icon. */
  iconSize?: number;
  /** Override label size. Defaults to the dining-card spec (14.4px). */
  labelClassName?: string;
}

export function ArrowLink({
  label,
  href,
  dark = false,
  isExternal = false,
  icon = 'arrow',
  iconColorClass,
  iconSize = 18,
  labelClassName,
}: ArrowLinkProps) {
  const className = `inline-flex items-center gap-2 font-bold uppercase tracking-[0.04em] transition-colors duration-200 ${
    labelClassName ?? 'text-[14.4px] leading-[1.4]'
  } ${dark ? 'text-white/90 hover:text-white' : 'text-primary hover:text-primary-dark'}`;
  const iconClass = iconColorClass ?? (dark ? 'text-secondary' : 'text-accent');
  const trailing = <CtaIcon name={icon} size={iconSize} className={iconClass} />;

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
        {trailing}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {label}
      {trailing}
    </Link>
  );
}

export function BorderedArrowLink({
  label,
  href,
  dark = false,
  icon = 'arrow',
}: {
  label: string;
  href: string;
  dark?: boolean;
  icon?: CtaIconName | null;
}) {
  return (
    <Link
      to={href}
      className={`flex items-center gap-2 py-2.5 border-l-[3px] border-accent pl-4 transition-colors duration-200 ${
        dark ? 'hover:border-white' : ''
      }`}
    >
      <span
        className={`text-[14.4px] leading-[1.4] font-bold uppercase tracking-[0.04em] ${
          dark ? 'text-white/90 hover:text-white' : 'text-primary'
        }`}
      >
        {label}
      </span>
      <CtaIcon name={icon} size={18} className={dark ? 'text-secondary' : 'text-accent'} />
    </Link>
  );
}
