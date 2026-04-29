export interface NavItem {
  label: string;
  href: string;
}

export type HeroZone = 'bottom-left' | 'bottom-right' | 'middle-left' | 'middle-right';

export interface HeroSlide {
  backgroundImage?: string;
  backgroundVideo?: string;
  /** Percent (0–100) of black overlay laid on top of the image. 0 = no overlay. */
  overlayDarken?: number;
  title?: string;
  titleColor?: string;
  titlePosition?: HeroZone;
  subtitle?: string;
  subtitleColor?: string;
  subtitleLink?: string;
  subtitlePosition?: HeroZone;
  cta?: { label: string; href: string };
}

export interface HeroContent {
  heading: string;
  subheading?: string;
  cta?: { label: string; href: string };
  backgroundImage?: string;
  slides?: HeroSlide[];
  variant?: 'full' | 'compact';
  autoPlayInterval?: number;
  titlePosition?: HeroZone;
  subtitlePosition?: HeroZone;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface CardItem {
  name?: string;
  title?: string;
  category?: string;
  date?: string;
  type?: string;
  dressCode?: string;
  description?: string;
  tagline?: string;
  capacity?: string;
  image?: string;
  cta?: string;
  ctas?: (string | { label: string; href?: string })[];
  serviceFeatures?: string[];
  venues?: string[];
  bio?: string;
}

export interface FeatureItem {
  heading: string;
  description?: string;
  image?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface TestimonialItem {
  name: string;
  quote: string;
  cta?: string;
  image?: string;
  href?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  image?: string;
}

export interface PartnerLogo {
  name: string;
  image: string;
  href?: string;
}

export interface AwardItem {
  title: string;
  issuer: string;
  image?: string;
}

export interface TimelineSlide {
  year: string;
  body: string;
  image: string;
}

export interface TabItem {
  label: string;
  href?: string;
  image?: string;
}

export interface CollageImage {
  src: string;
  alt?: string;
}

export type CtaIconKind =
  | 'arrow'
  | 'menu'
  | 'clock'
  | 'phone'
  | 'mail'
  | 'calendar'
  | 'map-pin'
  | 'external';

export interface CtaButton {
  label: string;
  href?: string;
  isExternal?: boolean;
  icon?: CtaIconKind | null;
  bordered?: boolean;
}
