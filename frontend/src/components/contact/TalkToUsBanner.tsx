import { Link } from 'react-router';

interface Props {
  heading: string;
  ctaLabel: string;
  ctaHref: string;
  ctaIsExternal?: boolean;
}

export function TalkToUsBanner({
  heading,
  ctaLabel,
  ctaHref,
  ctaIsExternal = true,
}: Props) {
  return (
    <section
      style={{
        backgroundImage:
          'radial-gradient(82% 95% at 111.1% 145.9%, rgb(107, 187, 174) 0%, rgb(0, 30, 98) 100%)',
        padding: '56px 0',
      }}
    >
      <div className="max-w-7xl mx-auto px-10">
        <div
          className="flex flex-col items-center justify-center text-center"
          style={{ gap: '32px', padding: '32px' }}
        >
          <h2
            className="font-heading"
            style={{
              fontSize: '38.4px',
              fontWeight: 300,
              fontStyle: 'italic',
              letterSpacing: '-1.152px',
              lineHeight: '42.24px',
              color: '#F5F4F2',
              maxWidth: '936px',
            }}
          >
            {heading}
          </h2>
          {(() => {
            const className =
              'inline-flex items-center gap-2 bg-white rounded-full text-primary uppercase hover:shadow-md transition-shadow';
            const style = {
              padding: '12px 16px 12px 24px',
              fontSize: '13.6px',
              fontWeight: 700,
              letterSpacing: '0.544px',
              boxShadow: 'rgba(32, 99, 171, 0.07) 0px 20px 19px -12px',
            } as const;
            const inner = (
              <>
                {ctaLabel}
                <svg width="24" height="24" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 13L13 1M13 1H3M13 1V11"
                    stroke="#DF4661"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </>
            );
            return ctaIsExternal ? (
              <a
                href={ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
                style={style}
              >
                {inner}
              </a>
            ) : (
              <Link to={ctaHref} className={className} style={style}>
                {inner}
              </Link>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
