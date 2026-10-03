"use client";

import type { AnchorHTMLAttributes } from 'react';
import { useParams as useNextParams, usePathname } from 'next/navigation';

// Full-document navigation lets nginx hand non-home routes to the Vite app.
export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string | { pathname?: string }; reloadDocument?: boolean };
export function Link({ to, reloadDocument: _reloadDocument, ...props }: LinkProps) {
  void _reloadDocument; // Next always uses document navigation during the mixed-app migration.
  return <a href={typeof to === 'string' ? to : to.pathname} {...props} />;
}
export function useLocation() {
  const pathname = usePathname();
  return { pathname, search: '', hash: typeof window === 'undefined' ? '' : window.location.hash };
}
export function useNavigate() {
  return (href: string) => { window.location.assign(href); };
}

export function useParams<T extends Record<string, string>>() {
  return useNextParams() as Partial<T>;
}
