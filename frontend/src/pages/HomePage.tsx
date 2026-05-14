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
import { EVENT_PLACEHOLDER_IMAGE } from '../lib/events';

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
  slug?: string;
  date: string;
  image?: StrapiMedia;
  category?: { name: string } | null;
}

const mediaUrl = (m?: StrapiMedia | null): string | undefined => {
  if (!m?.url) return undefined;
  if (/^https?:/i.test(m.url)) return m.url;
  return `${STRAPI_URL}${m.url}`;
};

// Patch CTAs the CMS still seeds with placeholder hrefs. Once the deployed
// Strapi entry carries the real URL these overrides become no-ops.
const CTA_OVERRIDES: Record<string, { href: string; isExternal: boolean }> = {
  'Request for a Club Tour': {
    href: 'https://amclub.jotform.com/260813837273966?parentURL=https%3A%2F%2Famclub.org.sg%2Fmembership-enquiry-form%2F&jsForm=true',
    isExternal: true,
  },
  'Book a Club Tour': {
    href: 'https://amclub.jotform.com/260813837273966?parentURL=https%3A%2F%2Famclub.org.sg%2Fmembership-enquiry-form%2F&jsForm=true',
    isExternal: true,
  },
  'Explore Membership': { href: '/membership', isExternal: false },
};

const link = (l?: StrapiLink) => {
  if (!l) return undefined;
  const override = CTA_OVERRIDES[l.label];
  if (override && (!l.href || l.href === '#')) {
    return { label: l.label, href: override.href, isExternal: override.isExternal };
  }
  return { label: l.label, href: l.href ?? '#', isExternal: l.isExternal };
};

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

const AMCLUB_INSTAGRAM = 'https://www.instagram.com/americanclubsingapore/';

const MOMENTS_FALLBACK: Array<{
  name: string;
  quote: string;
  cta?: string;
  image?: string;
  video?: string;
  href?: string;
}> = [
  {
    name: 'American Club',
    quote: 'Stars, Stripes & Big Breakfast Bites',
    cta: 'Watch More',
    image: '/images/social/stars-stripes-breakfast.jpg',
    video: '/images/social/stars-stripes-breakfast.mp4',
    href: 'https://www.instagram.com/reels/DUiQHUrgeK-/',
  },
  {
    name: 'American Club',
    quote: 'Mahjong Social',
    cta: 'Watch More',
    image: '/images/social/mahjong-social.jpg',
    video: '/images/social/mahjong-social.mp4',
    href: 'https://www.instagram.com/p/DUz9gdFgYXs/',
  },
  {
    name: 'American Club',
    quote: 'Shaken not Sorry',
    cta: 'Watch More',
    image: '/images/social/shaken-not-sorry.jpg',
    href: 'https://www.instagram.com/p/DW6DPmhgYl_/',
  },
  {
    name: 'American Club',
    quote: 'Daddy Daughter Dance',
    cta: 'Watch More',
    image: '/images/social/daddy-daughter-dance.jpg',
    href: 'https://www.instagram.com/p/DXoQXI7AfHN/',
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
      const today = new Date().toISOString().slice(0, 10);
      const [home, evs] = await Promise.all([
        fetchAPI<StrapiHomePage>('/home-page'),
        fetchAPI<StrapiEvent[]>('/events', {
          'filters[date][$gte]': today,
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
    image: mediaUrl(e.image) ?? EVENT_PLACEHOLDER_IMAGE,
    href: e.slug ? `/whats-on/${e.slug}` : undefined,
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
  // CMS testimonials are kept for migration but, until the deployed Strapi is
  // re-seeded with the new social-style posts (memberName = "American Club"),
  // render the local fallback so every card is branded consistently. Each
  // card links out to its own social post URL (t.ctaUrl), not a shared profile link.
  const cmsMomentItems = (moments?.testimonials ?? [])
    .filter((t) => t.memberName === 'American Club')
    .map((t) => ({
      name: 'American Club',
      quote: t.quote,
      cta: t.ctaLabel,
      image: mediaUrl(t.photo),
      video: mediaUrl(t.video),
      href: t.ctaUrl || AMCLUB_INSTAGRAM,
    }));
  const momentItems = cmsMomentItems.length > 0 ? cmsMomentItems : MOMENTS_FALLBACK;

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

      {momentItems.length > 0 && (
        <TestimonialSlider
          label={moments?.label ?? 'Moments'}
          heading={moments?.heading ?? 'Moments that matter, captured and shared by you'}
          cta={
            link(moments?.cta) ?? {
              label: 'Follow Our Socials',
              href: AMCLUB_INSTAGRAM,
              isExternal: true,
            }
          }
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
