import type { PageSeo } from './seo';
import type { CtaLink } from '../components/shared/CtaButton';
import type { DetailIconName } from './detailIcons';

export interface ScheduleRow {
  dayRange: string;
  time: string;
  lastOrder?: string;
  note?: string;
}

export interface OperatingHoursSection {
  title?: string;
  rows?: ScheduleRow[];
}

export interface LocationContact {
  locationLevel?: string;
  phone?: string;
  email?: string;
}

export interface VenueData {
  id?: number;
  name: string;
  slug: string;
  seo?: PageSeo | null;
  /** Optional override of the section's default parent label/href (used by nested entries like aquatics programs). */
  parentSection?: string;
  parentHref?: string;
  description: string;
  operatingHoursSections?: OperatingHoursSection[];
  locationContact?: LocationContact | null;
  locationLevel?: string;
  phone?: string;
  email?: string;
  hours?: string;
  image?: { url: string; alternativeText?: string };
  video?: { url: string; title?: string };
  /** Fitness facilities expose the hero as `heroImage`/`heroVideo` (vs dining's `image`). */
  heroImage?: { url: string; alternativeText?: string } | null;
  heroVideo?: string | null;
  cuisineType?: string;
  cuisineIconSlug?: string;
  /** Facility-side equivalents of cuisineType / cuisineIconSlug */
  categoryLabel?: string;
  categoryIconSlug?: string;
  dressCode?: string;
  menuUrl?: string;
  category?: string;
  capacity?: string;
  ctas?: CtaLink[];
  extraSections?: {
    title: string;
    icon?: DetailIconName | null;
    content?: string;
    bullets?: string[];
    contactRows?: { label: string; value: string }[];
    groups?: {
      heading?: string;
      paragraphs?: string[];
      bullets?: string[];
      footer?: string;
    }[];
  }[];
  promoCards?: {
    heading: string;
    description: string;
    variant?: 'card' | 'overlay';
    columns?: number;
    cards: {
      title: string;
      subtitle?: string;
      image: string;
      cta: { label: string; href: string; isExternal?: boolean };
    }[];
  };
  teamMembers?: {
    name: string;
    role: string;
    bio?: string;
    image?: string;
    bioImage?: string;
    /** Avatar framing within the circular mask. 0–100 (percent), default 50. */
    imageOffsetX?: number;
    imageOffsetY?: number;
    /** Avatar zoom multiplier (1 = fit, >1 zooms in further). Default 1. */
    imageZoom?: number;
    /** Optional coach-detail URL. When set and no bioImage exists, clicking the avatar navigates here. */
    coachLink?: string;
  }[];
  teamHeading?: string;
  teamLayout?: 'circle' | 'card';
  bottomCtas?: CtaLink[];
  cardSections?: {
    heading?: string;
    subheading?: string;
    cards: {
      heading: string;
      description: string;
      image: string;
      imageAlt?: string;
      cta?: { label: string; href: string; isExternal?: boolean };
    }[];
  }[];
  imagePanels?: {
    image: string;
    imageAlt?: string;
    imagePosition?: 'left' | 'right';
    slideWithText?: boolean;
    heading: string;
    ctas?: CtaLink[];
    /** @deprecated single-CTA shape from before imagePanels supported multiple; read as fallback. */
    cta?: CtaLink;
    subheading?: string;
    body?: string;
    bullets?: string[];
    operatingHours?: { title: string; rows: string[] }[];
    extraSections?: { title: string; content?: string; bullets?: string[] }[];
    footnote?: string;
  }[];
  faq?: { question: string; answer: string }[];
  gallery?: {
    heading?: string;
    rows: { images: string[]; direction?: 'ltr' | 'rtl'; durationSec?: number }[];
  };
  /** CMS marquee component (kids-experiences). When present it overrides the
   *  static `gallery` fallback; `enabled: false` hides the marquee entirely. */
  marquee?: {
    enabled?: boolean | null;
    heading?: string | null;
    rows?: {
      direction?: 'ltr' | 'rtl' | null;
      durationSec?: number | null;
      images?: { url: string }[] | null;
    }[] | null;
  } | null;
  quotes?: {
    heading?: string;
    items: { text: string; attribution?: string; role?: string }[];
  };
  partyPackages?: {
    heading?: string;
    subheading?: string;
    items: {
      name: string;
      image: string;
      imageAlt?: string;
      cta?: { label: string; href: string; isExternal?: boolean };
    }[];
  };
  downloads?: {
    heading?: string;
    items: { label: string; href: string; isExternal?: boolean }[];
  };
  tierCards?: {
    heading?: string;
    subheading?: string;
    cards: {
      name: string;
      description: string;
      benefits: string[];
      /** Editor-selectable bullet glyph (CMS `bulletStyle`); default check. */
      bulletStyle?: 'check' | 'dot' | 'dash' | 'none';
      /** Optional photo (CMS-editable) — replaces the gradient tile when set. */
      image?: string;
      gradientFrom?: string;
      gradientTo?: string;
    }[];
  };
  venueCards?: {
    heading?: string;
    subheading?: string;
    columns?: 2 | 3 | 4;
    cards: {
      heading: string;
      capacity?: string;
      description: string;
      image: string;
      imageAlt?: string;
    }[];
  };
  packageCards?: {
    heading?: string;
    subheading?: string;
    columns?: 2 | 3;
    cards: {
      heading: string;
      tagline: string;
      detailsLabel?: string;
      benefits: string[];
      image?: string;
    }[];
  };
}

