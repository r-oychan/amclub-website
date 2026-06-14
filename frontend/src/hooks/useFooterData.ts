import { useState, useEffect } from 'react';
import { fetchAPI } from '../lib/api';

export interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface FooterColumnData {
  heading: string;
  links: FooterLink[];
}

export interface FooterSocial {
  platform: string;
  href: string;
}

export interface FooterData {
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  columns: FooterColumnData[];
  socials: FooterSocial[];
  legalLinks: FooterLink[];
  copyright: string;
}

interface StrapiMedia {
  url: string;
}

interface StrapiLink {
  label: string;
  href?: string;
  isExternal?: boolean;
}

interface StrapiFooter {
  logo?: StrapiMedia | null;
  address?: string;
  phone?: string;
  email?: string;
  columns?: { title: string; links?: StrapiLink[] }[];
  socials?: { platform: string; href?: string }[];
  legalLinks?: StrapiLink[];
  copyright?: string;
}

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || '';

// Fallback mirrors what Footer.tsx historically hardcoded, so the footer still
// renders if the CMS is unreachable or the `footer` single type is empty.
export const DEFAULT_FOOTER: FooterData = {
  logoUrl: '/branding/logo.webp',
  address: '10 Claymore Hill Singapore, 229573',
  phone: '+65 6737 3411',
  email: 'info@amclub.org.sg',
  columns: [
    {
      heading: 'Explore the Club',
      links: [
        { label: 'Dining & Retail', href: '/dining' },
        { label: 'Fitness & Wellness', href: '/fitness' },
        { label: 'Kids', href: '/kids' },
        { label: 'Private Events & Catering', href: '/event-spaces' },
        { label: 'Membership', href: '/membership' },
        { label: 'Events Calendar', href: '/whats-on' },
      ],
    },
    {
      heading: 'About Us',
      links: [
        { label: 'Club News', href: '/home-sub/news' },
        { label: 'Gallery', href: '/home-sub/gallery' },
        { label: 'Advertising & Sponsorships', href: '/home-sub/advertise-with-us' },
        { label: 'Contact Us', href: '/home-sub/contact-us' },
      ],
    },
    {
      heading: 'Member',
      links: [
        { label: 'Login', href: 'https://amclub-portal.iontone.com/#/login', isExternal: true },
        { label: 'Reciprocal Clubs', href: '/membership/reciprocal-clubs' },
        { label: 'Refer a Friend', href: '/membership/referal' },
        { label: 'Niche Group Membership', href: '/membership/niche-group-membership' },
      ],
    },
  ],
  socials: [
    { platform: 'instagram', href: 'https://www.instagram.com/americanclubsingapore/' },
    { platform: 'facebook', href: 'https://www.facebook.com/AmericanClubSingapore/' },
    { platform: 'linkedin', href: 'https://www.linkedin.com/company/the-american-club-singapore' },
    { platform: 'whatsapp', href: 'https://www.whatsapp.com/channel/0029Vb6eMBREawdpTErdKE47' },
  ],
  legalLinks: [
    { label: 'Club Constitution', href: '/uploads/documents/club_constitution_6260f2051b.pdf', isExternal: true },
    { label: 'Club By-laws', href: '/uploads/documents/club_bylaws_8dc9bdff4e.pdf', isExternal: true },
    { label: 'Privacy Statement', href: '/privacy-statement' },
  ],
  copyright: '© 2026 The American Club Singapore® All rights reserved.',
};

function resolveMediaUrl(media?: StrapiMedia | null): string | undefined {
  if (!media?.url) return undefined;
  return media.url.startsWith('http') ? media.url : `${STRAPI_URL}${media.url}`;
}

function mapLinks(links?: StrapiLink[]): FooterLink[] {
  return (links ?? [])
    .filter((l) => l.label && l.href)
    .map((l) => ({ label: l.label, href: l.href as string, isExternal: l.isExternal ?? false }));
}

function transformFooter(data: StrapiFooter): FooterData {
  // Per-field fallback: a partially-filled CMS entry never blanks a section.
  const columns = (data.columns ?? [])
    .filter((c) => c.title)
    .map((c) => ({ heading: c.title, links: mapLinks(c.links) }));
  const socials = (data.socials ?? [])
    .filter((s) => s.platform && s.href)
    .map((s) => ({ platform: s.platform, href: s.href as string }));
  const legalLinks = mapLinks(data.legalLinks);

  return {
    logoUrl: resolveMediaUrl(data.logo) ?? DEFAULT_FOOTER.logoUrl,
    address: data.address || DEFAULT_FOOTER.address,
    phone: data.phone || DEFAULT_FOOTER.phone,
    email: data.email || DEFAULT_FOOTER.email,
    columns: columns.length ? columns : DEFAULT_FOOTER.columns,
    socials: socials.length ? socials : DEFAULT_FOOTER.socials,
    legalLinks: legalLinks.length ? legalLinks : DEFAULT_FOOTER.legalLinks,
    copyright: data.copyright || DEFAULT_FOOTER.copyright,
  };
}

export function useFooterData(): FooterData {
  const [data, setData] = useState<FooterData>(DEFAULT_FOOTER);

  useEffect(() => {
    let cancelled = false;

    fetchAPI<StrapiFooter>('/footer', {
      'populate[logo]': '*',
      'populate[columns][populate][links]': '*',
      'populate[socials]': '*',
      'populate[legalLinks]': '*',
    }).then((result) => {
      if (cancelled || !result) return;
      setData(transformFooter(result));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
