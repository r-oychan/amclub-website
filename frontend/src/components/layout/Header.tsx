import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router';
import { useHeaderData } from '../../hooks/useHeaderData';
import type { NavItemConfig, NavChild } from '../../hooks/useHeaderData';

function NavLink({ href, isExternal, className, style, onClick, children }: {
  href: string;
  isExternal?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style} onClick={onClick}>
        {children}
      </a>
    );
  }
  return <Link to={href} className={className} style={style} onClick={onClick}>{children}</Link>;
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();
  const headerData = useHeaderData();

  const { logoUrl, navItems, ctaButton } = headerData;
  const leftItems = navItems.slice(0, 4);
  const rightItems = navItems.slice(4);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    // Reset UI state on navigation — intentional synchronous setState
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
    setActiveDropdown(null);
    setMobileExpanded(null);
  }, [location.pathname]);

  const handleDropdownEnter = useCallback((href: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(href);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => setActiveDropdown(null), 200);
  }, []);

  const renderDropdownLink = (link: NavChild) => (
    <NavLink
      key={link.href}
      href={link.href}
      isExternal={link.isExternal}
      onClick={() => setActiveDropdown(null)}
      className="block py-2 text-[13.6px] font-body text-black hover:opacity-60 transition-opacity"
    >
      {link.label}
    </NavLink>
  );

  const renderDesktopNavItem = (item: NavItemConfig, fontSize: string) => {
    const hasDropdown = !!item.columns?.length;
    const isOpen = activeDropdown === item.href;

    return (
      <div
        key={item.href}
        className="relative"
        onMouseEnter={hasDropdown ? () => handleDropdownEnter(item.href) : undefined}
        onMouseLeave={hasDropdown ? handleDropdownLeave : undefined}
      >
        <NavLink
          href={item.href}
          isExternal={item.isExternal}
          className="px-3 py-1.5 font-body uppercase tracking-[0.04em] transition-colors duration-200 inline-flex items-center whitespace-nowrap border-b border-accent/0 text-[#F5F4F2] hover:border-accent"
          style={{ fontSize }}
        >
          {item.label}
        </NavLink>

        {hasDropdown && (
          <div
            className="absolute left-0 top-full z-50 transition-all duration-200 ease-in-out"
            style={{
              opacity: isOpen ? 1 : 0,
              pointerEvents: isOpen ? 'auto' : 'none',
              transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
            }}
          >
            <div className="pt-4">
              <div
                className="bg-white p-10 flex gap-8 w-fit"
                style={{
                  borderRadius: '24px',
                  boxShadow: '0 10px 20px rgba(0, 0, 0, 0.05)',
                }}
              >
                {item.columns!.map((col, ci) =>
                  col.image ? (
                    <div key={ci} className="flex-shrink-0 w-48 h-full">
                      <NavLink href={col.imageLink ?? '#'} onClick={() => setActiveDropdown(null)}>
                        <img
                          src={col.image}
                          alt=""
                          className="w-48 h-full min-h-[200px] object-cover rounded-2xl hover:opacity-90 transition-opacity"
                        />
                      </NavLink>
                    </div>
                  ) : (
                    <div key={ci} className="flex-1 min-w-[160px]">
                      {col.heading && (
                        <p className="text-[13.6px] font-body uppercase tracking-[0.04em] text-black/50 mb-3 font-semibold">
                          {col.heading}
                        </p>
                      )}
                      <div className="flex flex-col gap-0.5">
                        {col.links?.map(renderDropdownLink)}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out 2xl:flex 2xl:justify-center ${
          scrolled ? '' : '2xl:pt-[60px] 2xl:px-6'
        }`}
      >
        <div
          className={`relative w-full transition-all duration-300 ease-in-out origin-top ${
            scrolled
              ? '2xl:max-w-[1070px] 2xl:rounded-b-3xl'
              : '2xl:max-w-[1280px] 2xl:rounded-[20px]'
          }`}
          style={{
            backgroundColor: 'rgba(0, 29, 97, 0.75)',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
          }}
        >
          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ opacity: 0.1, borderRadius: 'inherit' }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                backgroundImage: 'url(https://framerusercontent.com/images/6mcf62RlDfRfU61Yg5vb2pefpi4.png?width=256&height=256)',
                backgroundRepeat: 'repeat',
                backgroundPosition: 'left top',
                backgroundSize: '155px auto',
              }}
            />
          </div>

          {/* ===== Desktop XL (≥1440px) — floating bar ===== */}
          <div
            className="hidden 2xl:block relative transition-all duration-300"
            style={{ padding: scrolled ? '18px 24px 18px' : '30px 32px 23px' }}
          >
            {/* CTA button (Member Login) — inside bar, top-right (matches Framer) */}
            {ctaButton && (
              <NavLink
                href={ctaButton.href}
                isExternal={ctaButton.isExternal}
                className="absolute top-5 right-8 z-10 inline-flex items-center gap-2 px-5 py-2.5 text-white text-xs font-body uppercase tracking-wider hover:opacity-90 transition-all duration-300"
                style={{
                  backgroundColor: 'rgb(0, 22, 74)',
                  borderRadius: '100px',
                  opacity: scrolled ? 0 : 1,
                  pointerEvents: scrolled ? 'none' : 'auto',
                }}
              >
                <UserIcon className="text-[#6BBBAE]" />
                {ctaButton.label}
              </NavLink>
            )}

            {/* Nav row: left links | logo (center) | right links */}
            <div className={`flex justify-center transition-all duration-300 ${scrolled ? 'items-center' : 'items-end'}`}>
              <nav className="flex-1 flex items-center justify-end gap-0.5 pb-0.5">
                {leftItems.map((item) => renderDesktopNavItem(item, scrolled ? '11.5px' : '13.6px'))}
              </nav>

              {/* Logo — centered, scales down + clips text on scroll */}
              <Link
                to="/home"
                className="flex-shrink-0 mx-5 overflow-hidden transition-all duration-300"
                style={{ height: scrolled ? '33px' : '87px' }}
              >
                <img
                  src={logoUrl}
                  alt="The American Club Singapore"
                  className="transition-all duration-300"
                  style={{
                    width: scrolled ? '162px' : '180px',
                    height: scrolled ? '78px' : '87px',
                  }}
                />
              </Link>

              <nav className="flex-1 flex items-center justify-start gap-0.5 pb-0.5">
                {rightItems.map((item) => renderDesktopNavItem(item, scrolled ? '11.5px' : '13.6px'))}
              </nav>
            </div>
          </div>

          {/* ===== Desktop L (1200px–1439px) — full-width, touching top, full logo ===== */}
          <div className="hidden xl:block 2xl:hidden relative px-6 py-4">
            {/* CTA button — absolute top-right */}
            {ctaButton && (
              <NavLink
                href={ctaButton.href}
                isExternal={ctaButton.isExternal}
                className="absolute top-4 right-6 z-10 inline-flex items-center gap-2 px-5 py-2.5 text-white text-xs font-body uppercase tracking-wider hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: 'rgb(0, 22, 74)',
                  borderRadius: '100px',
                }}
              >
                <UserIcon className="text-[#6BBBAE]" />
                {ctaButton.label}
              </NavLink>
            )}

            {/* Single row: left links | full logo (center) | right links */}
            <div className="flex items-end justify-center">
              <nav className="flex-1 flex items-center justify-end gap-0.5 pb-0.5">
                {leftItems.map((item) => renderDesktopNavItem(item, '13.6px'))}
              </nav>

              {/* Logo — centered, full height */}
              <Link to="/home" className="flex-shrink-0 mx-4">
                <img
                  src={logoUrl}
                  alt="The American Club Singapore"
                  style={{ width: '150px', height: '73px' }}
                />
              </Link>

              <nav className="flex-1 flex items-center justify-start gap-0.5 pb-0.5">
                {rightItems.map((item) => renderDesktopNavItem(item, '13.6px'))}
              </nav>
            </div>
          </div>

          {/* ===== Tablet + Mobile (< 1200px) — hamburger ===== */}
          <div className="xl:hidden flex items-center justify-between px-6 h-[64px]">
            <Link to="/home" className="flex-shrink-0">
              <img
                src={logoUrl}
                alt="The American Club Singapore"
                className="h-9 w-auto"
              />
            </Link>
            <button
              className="p-2 text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <HamburgerIcon />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet full-screen overlay (< 1200px) */}
      <div
        className={`fixed inset-0 z-[60] xl:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          backgroundColor: 'rgba(0,29,97,0.95)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Close button */}
          <div className="flex justify-end p-5">
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 text-white"
              aria-label="Close menu"
            >
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-8 py-4">
            {navItems.map((item) => {
              const hasDropdown = !!item.columns?.length;
              const isExpanded = mobileExpanded === item.href;
              const allChildren = item.columns?.flatMap((c) => c.links ?? []) ?? [];

              if (!hasDropdown) {
                return (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    isExternal={item.isExternal}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-4 border-b border-white/10 text-white text-lg font-body"
                  >
                    <span>{item.label}</span>
                    <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </NavLink>
                );
              }

              return (
                <div key={item.href} className="border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <NavLink
                      href={item.href}
                      isExternal={item.isExternal}
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 py-4 text-white text-lg font-body"
                    >
                      {item.label}
                    </NavLink>
                    <button
                      type="button"
                      onClick={() => setMobileExpanded(isExpanded ? null : item.href)}
                      aria-expanded={isExpanded}
                      aria-label={`Toggle ${item.label} submenu`}
                      className="p-3 text-white/60 hover:text-white transition-colors"
                    >
                      <svg
                        className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  {isExpanded && allChildren.length > 0 && (
                    <div className="pb-3 pl-4 flex flex-col">
                      {allChildren.map((child) => (
                        <NavLink
                          key={child.href}
                          href={child.href}
                          isExternal={child.isExternal}
                          onClick={() => setMobileOpen(false)}
                          className="py-2.5 text-white/80 hover:text-white text-base font-body transition-colors"
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* CTA button at bottom */}
          {ctaButton && (
            <div className="px-8 pb-8">
              <NavLink
                href={ctaButton.href}
                isExternal={ctaButton.isExternal}
                className="flex items-center justify-center gap-2 w-full py-3 border border-white/60 rounded-full text-white font-body uppercase tracking-wider hover:bg-white/10 transition-colors"
              >
                <UserIcon />
                {ctaButton.label}
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function HamburgerIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 ${className ?? ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
