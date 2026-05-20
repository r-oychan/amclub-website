import type { CtaButton } from './types';

/**
 * Strapi v5 dynamiczone payloads — one TS shape per block component the
 * CMS may return inside a `body` array. The discriminant is `__component`
 * (the dotted component UID).
 *
 * Shapes mirror the JSON returned by the controllers in cms/src/api/*. If
 * a controller adds a populate path, mirror it here. Keep optional unless
 * the schema marks the attribute required.
 */
export interface StrapiMedia {
  url?: string;
  alternativeText?: string;
  width?: number;
  height?: number;
  mime?: string;
}

export interface StrapiLink {
  label?: string;
  href?: string;
  isExternal?: boolean;
  variant?: string;
}

export interface BlockTextBlock {
  __component: 'blocks.text-block';
  label?: string;
  heading?: string;
  body?: string;
  ctas?: StrapiLink[];
  image?: StrapiMedia;
  imagePosition?: 'left' | 'right';
}

export interface BlockCardGrid {
  __component: 'blocks.card-grid';
  label?: string;
  heading?: string;
  subheading?: string;
  cards?: Array<{
    heading?: string;
    description?: string;
    image?: StrapiMedia;
    icon?: StrapiMedia;
    cta?: StrapiLink;
  }>;
  cta?: StrapiLink;
  dark?: boolean;
}

export interface BlockFeatureGrid {
  __component: 'blocks.feature-grid';
  label?: string;
  heading?: string;
  subheading?: string;
  body?: string;
  features?: Array<{
    heading?: string;
    description?: string;
    image?: StrapiMedia;
    icon?: StrapiMedia;
    cta?: StrapiLink;
  }>;
  listItems?: string[];
  asideImage?: StrapiMedia;
  asideImagePosition?: 'left' | 'right';
  cta?: StrapiLink;
  dark?: boolean;
  centered?: boolean;
}

export interface BlockThreeColGrid {
  __component: 'blocks.three-col-grid';
  heading?: string;
  subheading?: string;
  columns?: '2' | '3';
  variant?: 'centered' | 'left';
  items?: Array<{
    heading?: string;
    description?: string;
    image?: StrapiMedia;
    imageAlt?: string;
    cta?: StrapiLink;
    accentColor?: string;
  }>;
}

export interface BlockCtaBanner {
  __component: 'blocks.cta-banner';
  label?: string;
  heading: string;
  body?: string;
  ctas?: StrapiLink[];
  variant?: 'default' | 'light' | 'dark' | 'accent';
  image?: StrapiMedia;
  images?: StrapiMedia[];
}

export interface BlockFaqSection {
  __component: 'blocks.faq-section';
  label?: string;
  heading?: string;
  items?: Array<{ question?: string; answer?: string; slug?: string }>;
  ctas?: StrapiLink[];
  dark?: boolean;
}

export interface BlockDownloadsSection {
  __component: 'blocks.downloads-section';
  heading?: string;
  items?: StrapiLink[];
}

export interface BlockTabsSection {
  __component: 'blocks.tabs-section';
  label?: string;
  heading?: string;
  tabs?: Array<{
    label: string;
    href?: string;
    isExternal?: boolean;
    image?: StrapiMedia;
  }>;
  collageImages?: StrapiMedia[];
  dark?: boolean;
}

export interface BlockPartyPackages {
  __component: 'blocks.party-packages';
  heading?: string;
  subheading?: string;
  items?: Array<{
    name?: string;
    image?: StrapiMedia;
    imageAlt?: string;
    cta?: StrapiLink;
  }>;
}

export interface BlockTeamGrid {
  __component: 'blocks.team-grid';
  heading?: string;
  variant?: 'light' | 'dark';
  filterByType?: 'general-committee' | 'management';
}

export interface BlockImagePanelSlideshow {
  __component: 'blocks.image-panel-slideshow';
  heading?: string;
  subheading?: string;
  slides?: Array<{
    image?: StrapiMedia;
    caption?: string;
    subCaption?: string;
  }>;
}

export interface BlockPricedCardGrid {
  __component: 'blocks.priced-card-grid';
  heading?: string;
  subheading?: string;
  variant?: 'tier' | 'package' | 'venue';
  columns?: number;
  items?: Array<{
    name?: string;
    subheading?: string;
    description?: string;
    image?: StrapiMedia;
    feeLabel?: string;
    feeAmount?: string;
    breakdown?: string;
    badge?: string;
    badgeTone?: 'positive' | 'negative';
    bullets?: Array<{ text: string }>;
    cta?: StrapiLink;
    secondaryCta?: StrapiLink;
  }>;
}

export interface BlockQuotesBlock {
  __component: 'blocks.quotes-block';
  heading?: string;
  items?: Array<{
    quote?: string;
    author?: string;
    role?: string;
    image?: StrapiMedia;
  }>;
}

export interface BlockCollageGallery {
  __component: 'blocks.collage-gallery';
  label?: string;
  heading?: string;
  images?: StrapiMedia[];
}

export interface BlockOperatingHoursSection {
  __component: 'blocks.operating-hours-section';
  title?: string;
  rows?: Array<{ dayRange?: string; time?: string; lines?: string[] }>;
}

export interface BlockLocationContact {
  __component: 'blocks.location-contact';
  locationLevel?: string;
  phone?: string;
  email?: string;
}

export type DetailBlock =
  | BlockTextBlock
  | BlockCardGrid
  | BlockFeatureGrid
  | BlockThreeColGrid
  | BlockCtaBanner
  | BlockFaqSection
  | BlockDownloadsSection
  | BlockTabsSection
  | BlockPartyPackages
  | BlockTeamGrid
  | BlockImagePanelSlideshow
  | BlockPricedCardGrid
  | BlockQuotesBlock
  | BlockCollageGallery
  | BlockOperatingHoursSection
  | BlockLocationContact;

export type DetailBody = DetailBlock[];

/** Helper to coerce a StrapiLink → CtaButton (frontend's existing shape). */
export function toCta(link?: StrapiLink): CtaButton | undefined {
  if (!link?.label || !link.href) return undefined;
  return { label: link.label, href: link.href, isExternal: link.isExternal };
}

/** Convert an array of StrapiLinks to CtaButtons, dropping incomplete ones. */
export function toCtas(links?: StrapiLink[]): CtaButton[] | undefined {
  if (!links?.length) return undefined;
  const out = links.map(toCta).filter((c): c is CtaButton => Boolean(c));
  return out.length ? out : undefined;
}
