"use client";

import type { AnchorHTMLAttributes } from 'react';
import { usePathname } from 'next/navigation';

// Full-document navigation lets nginx hand non-home routes to the Vite app.
export function Link({ to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  return <a href={to} {...props} />;
}
export function useLocation() {
  const pathname = usePathname();
  return { pathname, search: '' };
}
export function useNavigate() {
  return (href: string) => { window.location.assign(href); };
}
