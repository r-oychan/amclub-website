import { useEffect, useState } from 'react';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { Hero } from '../components/blocks/Hero';
import { AboutSection } from '../components/blocks/AboutSection';
import { CardGrid } from '../components/blocks/CardGrid';
import { FeatureGrid } from '../components/blocks/FeatureGrid';
import { TabsSection } from '../components/blocks/TabsSection';
import { TestimonialSlider } from '../components/blocks/TestimonialSlider';
import { FaqAccordion } from '../components/blocks/FaqAccordion';

type StrapiMedia = { id: number; url: string; alternativeText?: string | null };
type StrapiLink = { label: string; href?: string; isExternal?: boolean; variant?: string };
type StrapiHeroSlide = {
  backgroundImage?: StrapiMedia;
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
};
type StrapiTestimonial = {
  documentId: string;
  memberName: string;
  quote: string;
  photo?: StrapiMedia;
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
type StrapiFaqItem = { documentId: string; question: string };
type StrapiFaqSection = {
  label?: string;
  heading?: string;
  ctas?: StrapiLink[];
  dark?: boolean;
  items?: StrapiFaqItem[];
};

interface StrapiHomePage {
  title: string;
  hero?: StrapiHero;
  aboutSection?: StrapiAboutSection;
  events?: StrapiEventListing;
  services?: StrapiFeatureGrid;
  experience?: StrapiTabsSection;
  moments?: StrapiTestimonialSlider;
  faq?: StrapiFaqSection;
}

interface StrapiEvent {
  documentId: string;
  title: string;
  date: string;
  image?: StrapiMedia;
  category?: { name: string } | null;
}

const mediaUrl = (m?: StrapiMedia | null): string | undefined => {
  if (!m?.url) return undefined;
  if (/^https?:/i.test(m.url)) return m.url;
  return `${STRAPI_URL}${m.url}`;
};

const link = (l?: StrapiLink) =>
  l ? { label: l.label, href: l.href ?? '#', isExternal: l.isExternal } : undefined;

const formatEventDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
};

export default function HomePage() {
  const [data, setData] = useState<StrapiHomePage | null>(null);
  const [events, setEvents] = useState<StrapiEvent[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [home, evs] = await Promise.all([
        fetchAPI<StrapiHomePage>('/home-page'),
        fetchAPI<StrapiEvent[]>('/events', {
          'filters[featured][$eq]': 'true',
          'pagination[limit]': '9',
          'sort[0]': 'date:asc',
          'populate[image]': 'true',
          'populate[category]': 'true',
        }),
      ]);
      if (cancelled) return;
      setData(home);
      setEvents(evs ?? []);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center text-text-dark/50">Loading…</div>;
  }
  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-text-dark/70">Home page content unavailable.</div>;
  }

  const hero = data.hero;
  const heroSlides = (hero?.slides ?? []).map((s) => ({
    backgroundImage: mediaUrl(s.backgroundImage) ?? '',
    title: s.title,
    subtitle: s.subtitle,
    titlePosition: s.titlePosition,
    subtitlePosition: s.subtitlePosition,
    cta: link(s.cta),
  }));

  const about = data.aboutSection;
  const aboutImages = (about?.images ?? []).map((m) => mediaUrl(m) ?? '').filter(Boolean);

  const evs = events ?? [];
  const eventCards = evs.map((e) => ({
    category: e.category?.name,
    title: e.title,
    date: formatEventDate(e.date),
    image: mediaUrl(e.image),
  }));

  const services = data.services;
  const serviceItems = (services?.features ?? []).map((f) => ({
    heading: f.heading,
    description: f.description,
    image: mediaUrl(f.image),
  }));

  const exp = data.experience;
  const expItems = (exp?.tabs ?? []).map((t) => ({
    label: t.label,
    href: t.href,
    image: mediaUrl(t.image),
  }));

  const moments = data.moments;
  const momentItems = (moments?.testimonials ?? []).map((t) => ({
    name: t.memberName,
    quote: t.quote,
    cta: t.ctaLabel,
    image: mediaUrl(t.photo),
    href: t.ctaUrl,
  }));

  const faq = data.faq;
  const faqItems = (faq?.items ?? []).map((i) => ({ question: i.question, answer: '' }));
  const faqCtas = (faq?.ctas ?? []).map((c) => ({ label: c.label, href: c.href ?? '#' }));

  return (
    <>
      {hero && (
        <Hero
          heading={hero.heading}
          subheading={hero.subheading}
          cta={link(hero.cta)}
          backgroundImage={mediaUrl(hero.backgroundImage)}
          variant={hero.variant ?? 'full'}
          autoPlayInterval={hero.autoPlayInterval}
          titlePosition={hero.titlePosition}
          subtitlePosition={hero.subtitlePosition}
          slides={heroSlides.length ? heroSlides : undefined}
        />
      )}

      {about && (
        <AboutSection
          label={about.label}
          heading={about.heading}
          stats={about.stats}
          funFact={about.funFactIntro && about.funFactBody ? `${about.funFactIntro} ${about.funFactBody}` : about.funFactBody}
          cta={link(about.cta)}
          images={aboutImages}
        />
      )}

      {data.events && eventCards.length > 0 && (
        <CardGrid
          label={data.events.label}
          heading={data.events.heading}
          cta={link(data.events.cta)}
          variant="event"
          items={eventCards}
        />
      )}

      {services && serviceItems.length > 0 && (
        <FeatureGrid
          label={services.label}
          heading={services.heading}
          cta={link(services.cta)}
          dark={services.dark}
          items={serviceItems}
        />
      )}

      {exp && expItems.length > 0 && (
        <TabsSection
          label={exp.label}
          heading={exp.heading ?? ''}
          items={expItems}
        />
      )}

      {moments && momentItems.length > 0 && (
        <TestimonialSlider
          label={moments.label}
          heading={moments.heading ?? ''}
          cta={link(moments.cta)}
          items={momentItems}
        />
      )}

      {faq && faqItems.length > 0 && (
        <FaqAccordion
          label={faq.label}
          heading={faq.heading ?? ''}
          ctas={faqCtas}
          items={faqItems}
        />
      )}
    </>
  );
}
