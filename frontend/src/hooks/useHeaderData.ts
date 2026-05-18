import { useState, useEffect } from 'react';
import { fetchAPI } from '../lib/api';

export interface NavChild {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface NavColumn {
  heading?: string;
  links?: NavChild[];
  image?: string;
  imageLink?: string;
}

export interface NavItemConfig {
  label: string;
  href: string;
  isExternal?: boolean;
  columns?: NavColumn[];
}

export interface HeaderData {
  logoUrl: string;
  navItems: NavItemConfig[];
  ctaButton?: { label: string; href: string; isExternal?: boolean };
}

interface StrapiMediaFormat {
  url: string;
}

interface StrapiMedia {
  url: string;
  formats?: {
    thumbnail?: StrapiMediaFormat;
    small?: StrapiMediaFormat;
    medium?: StrapiMediaFormat;
    large?: StrapiMediaFormat;
  };
}

interface StrapiNavItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

interface StrapiNavColumn {
  heading?: string;
  links?: StrapiNavItem[];
  image?: StrapiMedia;
  imageLink?: string;
}

interface StrapiNavDropdown {
  label: string;
  href: string;
  isExternal?: boolean;
  columns?: StrapiNavColumn[];
}

interface StrapiHeader {
  logo?: StrapiMedia;
  navItems?: StrapiNavDropdown[];
  ctaButton?: { label: string; href?: string; isExternal?: boolean };
}

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || '';

function resolveMediaUrl(media?: StrapiMedia): string | undefined {
  if (!media?.url) return undefined;
  if (media.url.startsWith('http')) return media.url;
  return `${STRAPI_URL}${media.url}`;
}

function transformHeader(data: StrapiHeader): HeaderData {
  const logoUrl = resolveMediaUrl(data.logo)
    ?? '/branding/logo.webp';

  const navItems: NavItemConfig[] = (data.navItems ?? []).map((item) => ({
    label: item.label,
    href: item.href,
    isExternal: item.isExternal ?? false,
    columns: item.columns?.map((col) => ({
      heading: col.heading,
      links: col.links?.map((link) => ({
        label: link.label,
        href: link.href,
        isExternal: link.isExternal ?? false,
      })),
      image: resolveMediaUrl(col.image),
      imageLink: col.imageLink,
    })),
  }));

  const ctaButton = data.ctaButton
    ? { label: data.ctaButton.label, href: data.ctaButton.href ?? '#', isExternal: data.ctaButton.isExternal }
    : undefined;

  return { logoUrl, navItems, ctaButton };
}

// Loading-state header — renders only the logo until the CMS payload arrives.
// The full nav structure is fully CMS-driven by scripts/seed-header.mjs.
const LOADING_HEADER: HeaderData = {
  logoUrl: '/branding/logo.webp',
  navItems: [],
};

export function useHeaderData(): HeaderData {
  const [data, setData] = useState<HeaderData>(LOADING_HEADER);

  useEffect(() => {
    let cancelled = false;

    fetchAPI<StrapiHeader>('/header', {
      'populate[logo]': 'true',
      'populate[navItems][populate][columns][populate]': '*',
      'populate[ctaButton]': 'true',
    }).then((result) => {
      if (cancelled || !result || !result.navItems?.length) return;
      setData(transformHeader(result));
    });

    return () => { cancelled = true; };
  }, []);

  return data;
}
