import type { PageSeo } from './seo';

type StrapiMedia = { id: number; url: string; alternativeText?: string | null };
export type StrapiLink = { label: string; href?: string; isExternal?: boolean; variant?: string };
type StrapiHeroSlide = {
  backgroundImage?: StrapiMedia;
  backgroundVideo?: StrapiMedia;
  title?: string;
  subtitle?: string;
  titlePosition?: 'bottom-left' | 'bottom-right' | 'middle-left' | 'middle-right';
  subtitlePosition?: 'bottom-left' | 'bottom-right' | 'middle-left' | 'middle-right';
  cta?: StrapiLink;
};
type StrapiHero = {
  heading: string;
  subheading?: string;
  variant?: 'full' | 'compact';
  autoPlayInterval?: number;
  titlePosition?: StrapiHeroSlide['titlePosition'];
  subtitlePosition?: StrapiHeroSlide['subtitlePosition'];
  cta?: StrapiLink;
  backgroundImage?: StrapiMedia;
  slides?: StrapiHeroSlide[];
  mobileFitMedia?: boolean;
};
type StrapiAboutSection = {
  label?: string;
  heading: string;
  stats?: { value: string; label: string }[];
  funFactIntro?: string;
  funFactBody?: string;
  cta?: StrapiLink;
  images?: StrapiMedia[];
};
type StrapiEventListing = {
  label?: string;
  heading?: string;
  cta?: StrapiLink;
  maxItems?: number;
};
type StrapiFeatureGrid = {
  label?: string;
  heading?: string;
  cta?: StrapiLink;
  dark?: boolean;
  features?: { heading: string; description?: string; image?: StrapiMedia }[];
};
type StrapiTabsSection = {
  label?: string;
  heading?: string;
  dark?: boolean;
  tabs?: { label: string; href?: string; isExternal?: boolean; image?: StrapiMedia }[];
  collageImages?: StrapiMedia[];
};
type StrapiTestimonial = {
  documentId: string;
  memberName: string;
  quote: string;
  photo?: StrapiMedia;
  video?: StrapiMedia;
  ctaLabel?: string;
  ctaUrl?: string;
};
type StrapiTestimonialSlider = {
  label?: string;
  heading?: string;
  cta?: StrapiLink;
  dark?: boolean;
  testimonials?: StrapiTestimonial[];
};
export type StrapiFaqBlockChild = { type?: string; text?: string; children?: StrapiFaqBlockChild[] };
type StrapiFaqBlock = { type?: string; children?: StrapiFaqBlockChild[] };
export type StrapiFaqItem = {
  documentId: string;
  question: string;
  answer?: StrapiFaqBlock[] | string | null;
};
type StrapiFaqSection = {
  label?: string;
  heading?: string;
  ctas?: StrapiLink[];
  dark?: boolean;
  items?: StrapiFaqItem[];
};

export interface StrapiHomePage {
  title: string;
  hero?: StrapiHero;
  aboutSection?: StrapiAboutSection;
  events?: StrapiEventListing;
  services?: StrapiFeatureGrid;
  experience?: StrapiTabsSection;
  moments?: StrapiTestimonialSlider;
  faq?: StrapiFaqSection;
  seo?: PageSeo | null;
}

export interface StrapiEvent {
  documentId: string;
  title: string;
  slug?: string;
  date: string;
  image?: StrapiMedia;
  category?: { name: string } | null;
  featuredOnHomepage?: boolean;
}

