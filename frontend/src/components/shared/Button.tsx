import { Link } from 'react-router';

export function Button({
  label,
  href,
  variant = 'primary',
  className = '',
  iconRight,
}: {
  label: string;
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'white';
  className?: string;
  iconRight?: React.ReactNode;
}) {
  const base =
    'group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-body text-sm transition-all duration-200 cursor-pointer text-center';
  const variants = {
    primary: 'bg-accent text-white font-bold hover:bg-accent/90',
    secondary: 'bg-primary text-white font-bold hover:bg-primary-dark',
    outline: 'border-2 border-white text-white font-bold hover:bg-white/10',
    white: 'bg-white text-primary font-normal hover:bg-white/90',
  };
  const cls = `${base} ${variants[variant]} ${className}`;

  const content = (
    <>
      <span>{label}</span>
      {iconRight}
    </>
  );

  if (href) {
    // A real browser navigation (plain <a>) is required for anything React Router
    // can't resolve to an in-app route: absolute URLs, mailto/tel, in-page anchors,
    // static assets under /uploads/, and any file-extension path. A router <Link>
    // would intercept the click and silently do nothing — e.g. a /uploads/<file>.pdf
    // CTA only worked via "open in new tab". Open external URLs and downloadable
    // assets in a new tab; keep #/mailto/tel in-place.
    const isAsset =
      href.startsWith('/uploads/') ||
      /\.(pdf|jpe?g|png|gif|webp|svg|docx?|xlsx?|pptx?|csv|txt|zip)$/i.test(href);
    const isExternalUrl = href.startsWith('http');
    if (isExternalUrl || isAsset || /^(mailto:|tel:|#)/i.test(href)) {
      const newTab = isExternalUrl || isAsset;
      return (
        <a
          href={href}
          className={cls}
          target={newTab ? '_blank' : undefined}
          rel={newTab ? 'noopener noreferrer' : undefined}
        >
          {content}
        </a>
      );
    }
    return (
      <Link to={href} className={cls}>
        {content}
      </Link>
    );
  }
  return <button className={cls}>{content}</button>;
}
