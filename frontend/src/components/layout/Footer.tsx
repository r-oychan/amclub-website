import { Link } from 'react-router';

const EXPLORE_LINKS = [
  { label: 'Dining & Retail', href: '/dining' },
  { label: 'Fitness & Wellness', href: '/fitness' },
  { label: 'Kids', href: '/kids' },
  { label: 'Private Events & Catering', href: '/event-spaces' },
  { label: 'Membership', href: '/membership' },
  { label: "What's On", href: '/whats-on' },
  { label: 'About Us', href: '/about' },
];

const MEMBER_LINKS = [
  { label: 'Login', href: '#' },
  { label: 'Reciprocal Clubs', href: '#' },
  { label: 'Refer a Friend', href: '#' },
  { label: 'Eagles Reward Program', href: '#' },
];

const LEGAL_LINKS = [
  { label: 'Club Constitution', href: '#' },
  { label: 'Club By-Laws', href: '#' },
  { label: 'Data Protection', href: '#' },
  { label: 'Privacy Statement', href: '#' },
];

export function Footer() {
  return (
    <footer className="bg-primary-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Contact */}
          <div>
            <img
              src="https://framerusercontent.com/images/jYpgpsEhknSxMZJWxquvCab3o.webp"
              alt="The American Club Singapore"
              className="h-16 w-auto mb-6 brightness-0 invert"
            />
            <address className="not-italic text-sm text-text-light space-y-2">
              <p>10 Claymore Hill</p>
              <p>Singapore, 229573</p>
              <p className="mt-4">
                <a href="tel:+6567373411" className="hover:text-white">+65 6737 3411</a>
              </p>
              <p>
                <a href="mailto:info@amclub.org.sg" className="hover:text-white">info@amclub.org.sg</a>
              </p>
            </address>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-heading text-lg font-bold mb-4">Explore the Club</h3>
            <ul className="space-y-2">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-text-light hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Member */}
          <div>
            <h3 className="font-heading text-lg font-bold mb-4">Member</h3>
            <ul className="space-y-2">
              {MEMBER_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-text-light hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-heading text-lg font-bold mb-4">Legal</h3>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-text-light hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-12 pt-8 text-center text-sm text-text-light">
          &copy; {new Date().getFullYear()} The American Club Singapore&reg; All rights reserved.
        </div>
      </div>
    </footer>
  );
}
