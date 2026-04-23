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
    ?? 'https://framerusercontent.com/images/jYpgpsEhknSxMZJWxquvCab3o.webp';

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

const DEFAULT_HEADER: HeaderData = {
  logoUrl: 'https://framerusercontent.com/images/jYpgpsEhknSxMZJWxquvCab3o.webp',
  ctaButton: { label: 'Member Login', href: 'https://amclub-portal.iontone.com/#/login', isExternal: true },
  navItems: [
    {
      label: 'Home',
      href: '/home',
      columns: [
        {
          links: [
            { label: 'About Us', href: '/about' },
            { label: 'Club News', href: '/home-sub/news' },
            { label: 'Gallery', href: '/home-sub/gallery' },
            { label: 'Advertising & Sponsorship', href: '/home-sub/advertise-with-us' },
            { label: 'Contact Us', href: '/home-sub/contact-us' },
            { label: 'Club Constitution', href: '/documents/club-constitution.pdf', isExternal: true },
            { label: 'Club By-laws', href: '/documents/club-by-laws.pdf', isExternal: true },
          ],
        },
      ],
    },
    {
      label: 'Dining & Retail',
      href: '/dining',
      columns: [
        {
          heading: 'Restaurants & Bars',
          links: [
            { label: 'Central', href: '/dining/central' },
            { label: 'Grillhouse', href: '/dining/grillhouse' },
            { label: 'The 2nd Floor', href: '/dining/the-2nd-floor' },
            { label: 'Tradewinds', href: '/dining/tradewinds' },
            { label: 'Union Bar', href: '/dining/union-bar' },
            { label: 'The Gourmet Pantry', href: '/dining/the-gourmet-pantry' },
          ],
        },
        {
          heading: 'Promotions & Services',
          links: [
            { label: 'Dining Promotions', href: '/dining/dining-promotion' },
            { label: 'TAC2Go!', href: '/dining/tac2go' },
            { label: 'Bottles2Go!', href: '/dining/bottles2go' },
            { label: 'Essentials', href: '/dining/essentials' },
          ],
        },
        {
          image: 'https://framerusercontent.com/images/ALiDWPH3U3VnmiEzcoEet6lPIk.jpeg',
          imageLink: '/dining',
        },
      ],
    },
    {
      label: 'Fitness & Wellness',
      href: '/fitness',
      columns: [
        {
          heading: 'Facilities',
          links: [
            { label: 'sên Spa', href: '/fitness/sen-spa' },
            { label: 'Aquatics', href: '/fitness/aquatics' },
            { label: 'Gym', href: '/fitness/gym' },
            { label: 'Tennis', href: '/fitness/tennis' },
          ],
        },
        {
          heading: 'Activities',
          links: [
            { label: 'Golfing Activities', href: '/fitness/other-activities' },
            { label: 'Multi-purpose Court', href: '/fitness/multi-purpose-court' },
            { label: 'Squash', href: '/fitness/squash' },
          ],
        },
        {
          image: 'https://framerusercontent.com/images/FfQ1mhhWwbjsMQKiahq8SzaqLs.jpeg',
          imageLink: '/fitness',
        },
      ],
    },
    {
      label: 'Kids',
      href: '/kids',
      columns: [
        {
          heading: 'Programs',
          links: [
            { label: 'The Quad Poolside (18 Months – 6 Years Old)', href: '/kids/the-quad-poolside' },
            { label: 'The Quad (6 Years Old & Above)', href: '/kids/the-quad' },
            { label: 'The Quad Studios', href: '/kids/the-quad-studios' },
          ],
        },
        {
          heading: 'Activities',
          links: [
            { label: 'Parties & Celebrations', href: '/kids/kids-parties' },
            { label: 'Seasonal Camps', href: '/kids/camps' },
            { label: 'Recreational Classes', href: '/kids/classes' },
          ],
        },
        {
          image: 'https://framerusercontent.com/images/DytJIjZnqDf7hE6r7WyfxUrNjU.jpeg',
          imageLink: '/kids',
        },
      ],
    },
    {
      label: 'Private Events & Catering',
      href: '/event-spaces',
      columns: [
        {
          heading: 'Packages',
          links: [
            { label: 'Wedding Celebrations', href: '/event-spaces/wedding-celebration' },
            { label: 'Corporate Functions', href: '/event-spaces/corporate-functions' },
            { label: 'Parties', href: '/event-spaces/parties' },
          ],
        },
        {
          heading: 'Venues',
          links: [
            { label: 'The Galbraith Ballroom', href: '/event-spaces/the-gallbrainth-ballroom' },
            { label: 'Thinkspace', href: '/event-spaces/thinkspace' },
            { label: 'The Bowling Alley', href: '/event-spaces/bowling-alley' },
            { label: 'Library', href: '/event-spaces/library' },
            { label: 'Meeting Rooms', href: '/event-spaces/meeting-rooms' },
          ],
        },
      ],
    },
    {
      label: 'Membership',
      href: '/membership',
      columns: [
        {
          heading: 'Join Us',
          links: [
            { label: 'Start Application', href: '/membership/start-application' },
            { label: 'Types & Joining Fees', href: '/membership/joining-fees' },
          ],
        },
        {
          heading: 'Programs',
          links: [
            { label: 'Refer a Friend', href: '/membership/referal' },
            { label: 'Eagles Rewards Program', href: '/membership/the-eagles-rewards-program' },
            { label: 'Reciprocal Clubs', href: '/membership/reciprocal-clubs' },
          ],
        },
      ],
    },
    { label: "What's On", href: '/whats-on' },
  ],
};

export function useHeaderData(): HeaderData {
  const [data, setData] = useState<HeaderData>(DEFAULT_HEADER);

  useEffect(() => {
    let cancelled = false;

    fetchAPI<StrapiHeader>('/header', {
      'populate[logo]': '*',
      'populate[navItems][populate][columns][populate]': '*',
      'populate[ctaButton]': '*',
    }).then((result) => {
      if (cancelled || !result || !result.navItems?.length) return;
      setData(transformHeader(result));
    });

    return () => { cancelled = true; };
  }, []);

  return data;
}
