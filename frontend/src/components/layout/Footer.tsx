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

export function Footer() {
  return (
    <footer className="relative bg-primary text-white overflow-hidden">
      {/* Background watermark crest */}
      <img
        src={LOGO_URL}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-none opacity-[0.04]"
      />

      <div className="relative mx-auto w-full max-w-[1280px] px-6 sm:px-10 lg:px-[60px] pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr] gap-10 lg:gap-12">
          {/* Brand + contact */}
          <div>
            <img src={LOGO_URL} alt="The American Club Singapore" className="h-20 w-auto mb-6 brightness-0 invert" />
            <address className="not-italic font-body text-[14.4px] leading-[1.6] text-white/85 space-y-1">
              <p>10 Claymore Hill Singapore, 229573</p>
              <p>
                <span className="text-white/60">Tel:</span>{' '}
                <a href="tel:+6567373411" className="hover:text-white transition-colors">+65 6737 3411</a>
              </p>
              <p>
                <span className="text-white/60">Email:</span>{' '}
                <a href="mailto:info@amclub.org.sg" className="hover:text-white transition-colors">info@amclub.org.sg</a>
              </p>
            </address>

            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center text-white/85 hover:text-white hover:border-white transition-colors"
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
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 font-body text-[12.8px] tracking-[-0.02em] text-secondary">
            {LEGAL_LINKS.map((l, i) => (
              <li key={l.label} className="flex items-center gap-x-6">
                <a href={l.href} className="hover:text-white transition-colors">{l.label}</a>
                {i < LEGAL_LINKS.length - 1 && <span className="text-white/20" aria-hidden="true">|</span>}
              </li>
            ))}
          </ul>
          <p className="font-body text-[12.8px] tracking-[-0.02em] text-secondary">
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
      <h3 className="font-body text-[13.6px] font-normal uppercase tracking-[0.04em] text-secondary mb-5">
        {heading}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-[14.4px] leading-[1.4] text-white/85 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                to={link.href}
                className="font-body text-[14.4px] leading-[1.4] text-white/85 hover:text-white transition-colors"
              >
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 22v-8h2.7l.4-3.1H13.5V8.9c0-.9.25-1.5 1.55-1.5H17V4.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.5V14h2.8v8h3.2z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.49 6S0 4.88 0 3.5 1.11 1 2.49 1 4.98 2.12 4.98 3.5zM.22 8.5h4.55V22H.22V8.5zm7.4 0h4.36v1.85h.06c.61-1.15 2.09-2.36 4.31-2.36 4.61 0 5.46 3.03 5.46 6.97V22h-4.55v-6.13c0-1.46-.03-3.34-2.04-3.34-2.04 0-2.36 1.59-2.36 3.24V22H7.62V8.5z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.6 14.2c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.7-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6.1-.1.3-.3.5-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.7-.9-2.4-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.4.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
    </svg>
  );
}
