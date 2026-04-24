export interface NavItem {
  label: string;
  href: string;
}

export type HeroZone = 'bottom-left' | 'bottom-right' | 'middle-left' | 'middle-right';

export interface HeroSlide {
  backgroundImage: string;
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
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface TestimonialItem {
  name: string;
  quote: string;
  cta?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  bio?: string;
}

export interface TabItem {
  label: string;
  href?: string;
  image?: string;
}

export interface CtaButton {
  label: string;
  href?: string;
  isExternal?: boolean;
}
