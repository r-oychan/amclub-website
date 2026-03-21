type ContactIcon = 'pin' | 'phone' | 'email';

const TEAL = '#6BBBAE';

function ContactIconSvg({ icon }: { icon: ContactIcon }) {
  switch (icon) {
    case 'pin':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0"
        >
          <circle cx="12" cy="12" r="4" stroke={TEAL} strokeWidth="1.5" />
          <path
            d="M12 2V4M12 20V22M2 12H4M20 12H22"
            stroke={TEAL}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'phone':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0"
        >
          <path
            d="M22 16.92V19.92C22 20.48 21.56 20.93 21 20.97C20.6 21 20.2 21 19.8 20.97C10.35 20.16 3.84 13.65 3.03 4.2C3 3.8 3 3.4 3.03 3C3.07 2.44 3.52 2 4.08 2H7.08C7.56 2 7.97 2.35 8.05 2.82C8.14 3.49 8.3 4.13 8.52 4.74L6.91 6.35C8.43 9.21 10.79 11.57 13.65 13.09L15.26 11.48C15.87 11.7 16.51 11.86 17.18 11.95C17.65 12.03 18 12.44 18 12.92"
            stroke={TEAL}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'email':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0"
        >
          <rect
            x="2"
            y="4"
            width="20"
            height="16"
            rx="2"
            stroke={TEAL}
            strokeWidth="1.5"
          />
          <path
            d="M2 7L12 13L22 7"
            stroke={TEAL}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

const TEXT_STYLE: React.CSSProperties = {
  fontSize: '19.2px',
  lineHeight: '26.88px',
};

export function ContactRow({
  icon,
  text,
  href,
}: {
  icon: ContactIcon;
  text: string;
  href?: string;
}) {
  return (
    <div className="flex flex-row items-center gap-3.5">
      <ContactIconSvg icon={icon} />
      {href ? (
        <a
          href={href}
          className="text-text-dark hover:text-accent transition-colors"
          style={TEXT_STYLE}
        >
          {text}
        </a>
      ) : (
        <span className="text-text-dark" style={TEXT_STYLE}>
          {text}
        </span>
      )}
    </div>
  );
}
