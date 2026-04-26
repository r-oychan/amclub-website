import { Link } from 'react-router';

const EXPLORE_LINKS = [
  { label: 'Dining & Retail', href: '/dining' },
  { label: 'Fitness & Wellness', href: '/fitness' },
  { label: 'Kids', href: '/kids' },
  { label: 'Private Events & Catering', href: '/event-spaces' },
  { label: 'Membership', href: '/membership' },
  { label: 'Events Calendar', href: '/whats-on' },
];

const ABOUT_LINKS = [
  { label: 'Club News', href: '#' },
  { label: 'Gallery', href: '#' },
  { label: 'Advertising & Sponsorships', href: '#' },
  { label: 'Contact Us', href: '/home-sub/contact-us' },
];

const MEMBER_LINKS = [
  { label: 'Login', href: 'https://amclub-portal.iontone.com/#/login', external: true },
  { label: 'Reciprocal Clubs', href: '#' },
  { label: 'Refer a Friend', href: '#' },
  { label: 'Eagles Reward Program', href: '#' },
];

const LEGAL_LINKS = [
  { label: 'Club Constitution', href: '#' },
  { label: 'Club By-laws', href: '#' },
  { label: 'Data Protection', href: '#' },
  { label: 'Privacy Statement', href: '#' },
];

const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/americanclubsingapore/', icon: InstagramIcon },
  { label: 'Facebook', href: '#', icon: FacebookIcon },
  { label: 'LinkedIn', href: '#', icon: LinkedInIcon },
  { label: 'WhatsApp', href: '#', icon: WhatsAppIcon },
];

const LOGO_URL = 'https://framerusercontent.com/images/jYpgpsEhknSxMZJWxquvCab3o.webp';

// Shared text styles — Framer uses one Lato uppercase scale for almost all footer text
const LINK_CLASSES =
  'font-body text-[13.6px] font-normal uppercase tracking-[0.04em] leading-[1.1] text-white hover:text-secondary transition-colors';
const HEADING_CLASSES =
  'font-body text-[13.6px] font-normal uppercase tracking-[0.04em] leading-[1.1] text-secondary mb-5';
const META_CLASSES =
  'font-body text-[12.8px] font-normal leading-[1.6] tracking-[-0.02em] text-secondary';

export function Footer() {
  return (
    <footer className="relative bg-primary text-white overflow-hidden">
      <img
        src={LOGO_URL}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-none opacity-[0.04]"
      />

      <div className="relative mx-auto w-full max-w-[1280px] px-6 sm:px-10 lg:px-[60px] pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr] gap-10 lg:gap-12">
          <div>
            <img src={LOGO_URL} alt="The American Club Singapore" className="h-20 w-auto mb-6 brightness-0 invert" />
            <address className={`not-italic ${META_CLASSES} space-y-1`}>
              <p>10 Claymore Hill Singapore, 229573</p>
              <p>
                Tel:{' '}
                <a href="tel:+6567373411" className="hover:text-white transition-colors">+65 6737 3411</a>
              </p>
              <p>
                Email:{' '}
                <a href="mailto:info@amclub.org.sg" className="hover:text-white transition-colors">info@amclub.org.sg</a>
              </p>
            </address>

            <div className="mt-6 flex items-center gap-4">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="text-secondary hover:text-white transition-colors"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn heading="Explore the Club" links={EXPLORE_LINKS} />
          <FooterColumn heading="About Us" links={ABOUT_LINKS} />
          <FooterColumn heading="Member" links={MEMBER_LINKS} />
        </div>

        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4">
          <ul className="flex flex-wrap items-center gap-y-2">
            {LEGAL_LINKS.map((l, i) => (
              <li key={l.label} className="flex items-center">
                <a href={l.href} className={LINK_CLASSES}>{l.label}</a>
                {i < LEGAL_LINKS.length - 1 && (
                  <span className="text-secondary mx-5" aria-hidden="true">|</span>
                )}
              </li>
            ))}
          </ul>
          <p className={META_CLASSES}>
            &copy; {new Date().getFullYear()} The American Club Singapore&reg; All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div>
      <h3 className={HEADING_CLASSES} style={{ fontFamily: 'var(--font-body)' }}>{heading}</h3>
      <ul className="space-y-4">
        {links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a href={link.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASSES}>
                {link.label}
              </a>
            ) : (
              <Link to={link.href} className={LINK_CLASSES}>
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 10-11.56 9.88v-6.99h-2.54V12h2.54V9.8c0-2.5 1.5-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10v7M8 7v.01M11.5 17v-4.5a2 2 0 014 0V17M11.5 10v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.78.47 3.45 1.28 4.9L2 22l5.25-1.25A9.92 9.92 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.18 14.13c-.22.62-1.27 1.18-1.78 1.25-.45.06-1.03.09-1.66-.1-.38-.12-.87-.28-1.5-.55-2.65-1.14-4.38-3.81-4.51-3.99-.13-.18-1.08-1.43-1.08-2.73 0-1.3.68-1.94.92-2.21.24-.27.53-.34.7-.34h.5c.16 0 .38-.06.59.45.22.51.74 1.78.81 1.91.07.13.11.28.02.45-.09.18-.13.28-.27.43-.13.16-.28.35-.4.46-.13.13-.27.28-.12.55.16.27.69 1.13 1.48 1.83 1.02.91 1.88 1.19 2.15 1.32.27.13.43.11.59-.07.16-.18.68-.79.86-1.07.18-.27.36-.22.6-.13.24.09 1.51.71 1.77.84.26.13.43.2.49.31.07.11.07.65-.16 1.27z" />
    </svg>
  );
}
