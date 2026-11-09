import { Hero } from '../components/blocks/Hero';
import { AboutSection } from '../components/blocks/AboutSection';
import { CardGrid } from '../components/blocks/CardGrid';
import { FeatureGrid } from '../components/blocks/FeatureGrid';
import { TabsSection } from '../components/blocks/TabsSection';
import { TestimonialSlider } from '../components/blocks/TestimonialSlider';
import { FaqAccordion } from '../components/blocks/FaqAccordion';
import { PageFade } from '../components/shared/PageFade';
import { EVENT_PLACEHOLDER_IMAGE } from '../lib/events';

import type { StrapiHomePage, StrapiEvent, StrapiLink, StrapiFaqItem, StrapiFaqBlockChild } from '../lib/home-types';

const link = (l?: StrapiLink) =>
  l ? { label: l.label, href: l.href ?? '#', isExternal: l.isExternal } : undefined;

const formatEventDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Singapore' }).toUpperCase();
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

export function HomeView({ data, events, mediaOrigin = '' }: { data: StrapiHomePage; events: StrapiEvent[]; mediaOrigin?: string }) {
  const mediaUrl = (m?: { url: string } | null): string | undefined => {
    if (!m?.url) return undefined;
    return /^https?:/i.test(m.url) ? m.url : `${mediaOrigin}${m.url}`;
  };
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

  const evs = events;
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
  const momentItems = (moments?.testimonials ?? [])
    .filter((t) => t.memberName === 'American Club')
    .map((t) => ({
      name: t.memberName,
      quote: t.quote,
      cta: t.ctaLabel,
      image: mediaUrl(t.photo),
      video: mediaUrl(t.video),
      href: t.ctaUrl,
    }));

  const faq = data?.faq;
  const faqItems = (faq?.items ?? [])
    .map((i) => ({ question: i.question, answer: faqAnswerText(i.answer) }))
    .filter((i) => i.answer);
  const faqCtas = (faq?.ctas ?? []).map((c) => ({ label: c.label, href: c.href ?? '#' }));

  return (
    <PageFade loaded>
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
          mobileFitMedia={hero.mobileFitMedia}
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

      {moments?.heading && momentItems.length > 0 && (
        <TestimonialSlider
          label={moments.label}
          heading={moments.heading}
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
