import { Link } from 'react-router';

export function DetailBreadcrumb({
  parentLabel,
  parentHref,
  currentName,
}: {
  parentLabel: string;
  parentHref: string;
  currentName: string;
}) {
  return (
    <div className="bg-bg">
      <div className="max-w-7xl mx-auto px-10 py-10">
        <nav className="flex flex-row items-center gap-2.5">
          <Link
            to={parentHref}
            className="flex items-center gap-2.5 font-bold uppercase text-primary hover:text-accent transition-colors"
            style={{ fontSize: '14.4px', letterSpacing: '0.576px' }}
          >
            {/* Back arrow — rouge */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="#DF4661"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {parentLabel}
          </Link>
          <span
            className="text-text-dark/40 font-bold uppercase"
            style={{ fontSize: '14.4px', letterSpacing: '0.576px' }}
          >
            /
          </span>
          <span
            className="text-text-dark font-bold uppercase"
            style={{ fontSize: '14.4px', letterSpacing: '0.576px' }}
          >
            {currentName}
          </span>
        </nav>
      </div>
    </div>
  );
}
