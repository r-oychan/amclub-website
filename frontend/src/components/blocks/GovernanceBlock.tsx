import type { CtaButton } from '../../lib/types';

interface SidebarLink extends CtaButton {
  caption?: string;
}

export function GovernanceBlock({
  heading,
  body,
  sidebarHeading,
  sidebarBody,
  links,
}: {
  heading: string;
  body: string;
  sidebarHeading: string;
  sidebarBody?: string;
  links: SidebarLink[];
}) {
  return (
    <section className="bg-bg py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-start">
          {/* Left: heading + body */}
          <div className="lg:max-w-[520px]">
            <h2
              className="font-heading italic text-primary mb-5"
              style={{ fontSize: 'clamp(2rem, 2.6vw + 1rem, 2.8rem)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.05 }}
            >
              {heading}
            </h2>
            <div className="h-[2px] w-12 bg-accent mb-7" />
            <div
              className="text-primary leading-relaxed whitespace-pre-line space-y-4"
              style={{ fontSize: '17.6px' }}
            >
              {body.split(/\n\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {/* Right: navy CTA card */}
          <aside className="bg-primary text-white p-8 md:p-10 lg:p-12">
            <h3
              className="font-heading italic text-white mb-5"
              style={{ fontSize: 'clamp(1.5rem, 1.6vw + 1rem, 1.875rem)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.1 }}
            >
              {sidebarHeading}
            </h3>
            {sidebarBody && (
              <p className="text-white/90 leading-relaxed mb-8">{sidebarBody}</p>
            )}
            <ul className="space-y-5">
              {links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href ?? '#'}
                    className="inline-flex items-center gap-2 font-bold uppercase text-white hover:text-accent transition-colors"
                    style={{ fontSize: '13px', letterSpacing: '0.08em' }}
                  >
                    {link.label}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0">
                      <path d="M1 13L13 1M13 1H3M13 1V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                  {link.caption && (
                    <p className="text-white/60 italic text-xs mt-1.5">{link.caption}</p>
                  )}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
