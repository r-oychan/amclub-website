import { useEffect, useState } from 'react';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { Hero } from '../components/blocks/Hero';
import { AboutSection } from '../components/blocks/AboutSection';
import { CardGrid } from '../components/blocks/CardGrid';
import { FeatureGrid } from '../components/blocks/FeatureGrid';
import { TabsSection } from '../components/blocks/TabsSection';
import { TestimonialSlider } from '../components/blocks/TestimonialSlider';
import { FaqAccordion } from '../components/blocks/FaqAccordion';
import { PageFade } from '../components/shared/PageFade';

type StrapiMedia = { id: number; url: string; alternativeText?: string | null };
type StrapiLink = { label: string; href?: string; isExternal?: boolean; variant?: string };
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
type StrapiFaqBlockChild = { type?: string; text?: string; children?: StrapiFaqBlockChild[] };
type StrapiFaqBlock = { type?: string; children?: StrapiFaqBlockChild[] };
type StrapiFaqItem = {
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

const faqAnswerText = (answer: StrapiFaqItem['answer']): string => {
  if (!answer) return '';
  if (typeof answer === 'string') return answer.trim();
  const walk = (n: StrapiFaqBlockChild): string =>
    (n.text ?? '') + (n.children ?? []).map(walk).join('');
  return answer
    .map((b) => (b.children ?? []).map(walk).join(''))
    .filter(Boolean)
    .join('\n\n')
    .trim();
};

const DUMMY_FAQ_ANSWERS: { match: RegExp; answer: string }[] = [
  {
    match: /membership|join|apply/i,
    answer:
      'Membership applications are reviewed by the Membership Committee on a rolling basis. Reach out to our Membership team to learn about current categories, eligibility, and entrance fees — they will guide you through every step of the application process.',
  },
  {
    match: /facility|gym|pool|spa|tennis/i,
    answer:
      'Members enjoy access to our gym, aquatics centre, sên Spa, tennis courts, and a full suite of fitness studios. Operating hours and class schedules are published weekly in the Member portal.',
  },
  {
    match: /dining|restaurant|food/i,
    answer:
      'Eight restaurants and bars cater to every occasion — from casual all-day dining at Central to refined steakhouse fare at Grillhouse. Reservations can be made via the Member portal or by calling Reservations directly.',
  },
  {
    match: /event|book|venue|wedding|party/i,
    answer:
      'Our private event team can host gatherings from intimate dinners to grand celebrations across our event spaces. Submit an enquiry via the Private Events page and a coordinator will follow up within two business days.',
  },
  {
    match: /kid|child|family/i,
    answer:
      'The Kids Club offers age-appropriate programmes, supervised play, and seasonal camps. Drop-in childcare is available for active members during posted hours.',
  },
  {
    match: /guest|visitor|access|reciprocal/i,
    answer:
      'Members may sponsor guests in line with the House Rules. Reciprocal Club privileges are available worldwide — visit the Reciprocal Clubs section for the current list and booking instructions.',
  },
];

const dummyAnswer = (question: string): string => {
  const m = DUMMY_FAQ_ANSWERS.find((d) => d.match.test(question));
  return (
    m?.answer ??
    'Our Member Services team is happy to help — please reach out via the Contact Us page or call the Club directly for the latest details.'
  );
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

  if (loaded && !data) {
    return <div className="min-h-screen flex items-center justify-center text-text-dark/70">Home page content unavailable.</div>;
  }

  const hero = data?.hero;
  const heroSlides = (hero?.slides ?? []).map((s) => ({
    backgroundImage: mediaUrl(s.backgroundImage),
    backgroundVideo: mediaUrl(s.backgroundVideo),
    title: s.title,
    subtitle: s.subtitle,
    titlePosition: s.titlePosition,
    subtitlePosition: s.subtitlePosition,
    cta: link(s.cta),
  }));

  const about = data?.aboutSection;
  const aboutImages = (about?.images ?? []).map((m) => mediaUrl(m) ?? '').filter(Boolean);

  const evs = events ?? [];
  const eventCards = evs.map((e) => ({
    category: e.category?.name,
    title: e.title,
    date: formatEventDate(e.date),
    image: mediaUrl(e.image),
  }));

  const services = data?.services;
  const serviceItems = (services?.features ?? []).map((f) => ({
    heading: f.heading,
    description: f.description,
    image: mediaUrl(f.image),
  }));

  const exp = data?.experience;
  const expItems = (exp?.tabs ?? []).map((t) => ({
    label: t.label,
    href: t.href,
    image: mediaUrl(t.image),
  }));
  const expCollage = (exp?.collageImages ?? [])
    .map((m) => ({ src: mediaUrl(m) ?? '', alt: m.alternativeText ?? '' }))
    .filter((c) => c.src);

  const moments = data?.moments;
  const momentItems = (moments?.testimonials ?? []).map((t) => ({
    name: t.memberName,
    quote: t.quote,
    cta: t.ctaLabel,
    image: mediaUrl(t.photo),
    href: t.ctaUrl,
  }));

  const faq = data?.faq;
  const faqItems = (faq?.items ?? []).map((i) => ({
    question: i.question,
    answer: faqAnswerText(i.answer) || dummyAnswer(i.question),
  }));
  const faqCtas = (faq?.ctas ?? []).map((c) => ({ label: c.label, href: c.href ?? '#' }));

  return (
    <PageFade loaded={loaded}>
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

      {data?.events && eventCards.length > 0 && (
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
          collageImages={expCollage}
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
    </PageFade>
  );
}
