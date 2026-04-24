import { Link } from 'react-router';

export function ArrowLink({
  label,
  href,
  dark = false,
  isExternal = false,
}: {
  label: string;
  href: string;
  dark?: boolean;
  isExternal?: boolean;
}) {
  const className = `inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors duration-200 ${
    dark ? 'text-white/90 hover:text-white' : 'text-primary hover:text-accent'
  }`;
  const icon = (
    <svg
      width="12"
      height="12"
      viewBox="0 0 14 14"
      fill="none"
      className={`shrink-0 ${dark ? 'text-secondary' : 'text-accent'}`}
    >
      <path
        d="M1 13L13 1M13 1H3M13 1V11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
        {icon}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {label}
      {icon}
    </Link>
  );
}

export function BorderedArrowLink({
  label,
  href,
  dark = false,
}: {
  label: string;
  href: string;
  dark?: boolean;
}) {
  return (
    <Link
      to={href}
      className={`flex items-center gap-2 py-2.5 border-l-[3px] border-accent pl-4 transition-colors duration-200 ${
        dark ? 'hover:border-white' : ''
      }`}
    >
      <span
        className={`text-[11px] font-bold uppercase tracking-[0.15em] ${
          dark ? 'text-white/90 hover:text-white' : 'text-primary'
        }`}
      >
        {label}
      </span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 14 14"
        fill="none"
        className={`shrink-0 ${dark ? 'text-secondary' : 'text-accent'}`}
      >
        <path
          d="M1 13L13 1M13 1H3M13 1V11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
