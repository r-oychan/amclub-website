"use client";

import { useUrlHash } from '../../frontend/src/hooks/use-url-hash';
import type { AnchorHTMLAttributes } from 'react';
import { useParams as useNextParams, usePathname, useSearchParams } from 'next/navigation';

// Document navigation keeps every page request on the server during the rollout.
export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string | { pathname?: string }; reloadDocument?: boolean };
export function Link({ to, reloadDocument: _reloadDocument, ...props }: LinkProps) {
  void _reloadDocument; // Next always uses document navigation during the mixed-app migration.
  const query = useSearchParams();
  let href = typeof to === 'string' ? to : to.pathname;
  const preview = query.get('preview');
  if (preview && href?.startsWith('/') && !href.startsWith('//') && !/^\/(?:uploads|branding|icons|_next)(?:\/|$)/.test(href)) {
    const url = new URL(href, 'https://preview.local');
    url.searchParams.set('preview', preview);
    url.searchParams.set('status', query.get('status') ?? 'draft');
    href = `${url.pathname}${url.search}${url.hash}`;
  }
  return <a href={href} {...props} />;
}
export function useLocation() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const hash = useUrlHash();
  return { pathname, search: query ? `?${query}` : '', hash };
}
export function useNavigate() {
  return (href: string) => { window.location.assign(href); };
}

export function useParams<T extends Record<string, string>>() {
  const params = useNextParams();
  const segments = usePathname().split('/').filter(Boolean);
  const detail = segments[0] === 'coaches'
    ? { section: segments[1], slug: segments[2] }
    : segments[0] === 'home-sub' && segments[1] === 'club-news'
      ? { section: 'home-sub', slug: segments[2] }
      : { section: segments[0], slug: segments[1], subSlug: segments[2] };
  return { ...params, ...detail } as unknown as Partial<T>;
}
