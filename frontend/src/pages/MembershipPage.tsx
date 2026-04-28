import { useEffect, useState } from 'react';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { Hero } from '../components/blocks/Hero';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { TextBlock } from '../components/blocks/TextBlock';
import { FeatureGrid } from '../components/blocks/FeatureGrid';
import { CardGrid } from '../components/blocks/CardGrid';
import { FaqAccordion } from '../components/blocks/FaqAccordion';

type StrapiMedia = { id: number; url: string; alternativeText?: string | null };
type StrapiLink = { label: string; href?: string; isExternal?: boolean; variant?: string };

interface StrapiCtaBanner {
  heading: string;
  body?: string;
  variant?: 'default' | 'light' | 'dark' | 'accent';
  ctas?: StrapiLink[];
}
interface StrapiFeatureItem {
  heading: string;
  description?: string;
  image?: StrapiMedia;
  cta?: StrapiLink;
}
interface StrapiMembershipPage {
  title: string;
  hero?: { heading: string; subheading?: string; variant?: 'full' | 'compact'; backgroundImage?: StrapiMedia };
  joinCta?: StrapiCtaBanner;
  intro?: { heading?: string; body?: string };
  benefits?: { heading?: string; features?: StrapiFeatureItem[] };
  findRightCta?: StrapiCtaBanner;
  programs?: { heading?: string; cards?: StrapiFeatureItem[] };
  faq?: { heading?: string; ctas?: StrapiLink[]; items?: { question: string }[] };
  beginJourneyCta?: StrapiCtaBanner;
}

interface StrapiFaqItem { documentId: string; question: string }

const mediaUrl = (m?: StrapiMedia | null): string | undefined => {
  if (!m?.url) return undefined;
  if (/^https?:/i.test(m.url)) return m.url;
  return `${STRAPI_URL}${m.url}`;
};

const linksOf = (ls?: StrapiLink[]) =>
  (ls ?? []).map((l) => ({ label: l.label, href: l.href ?? '#', isExternal: l.isExternal }));

export default function MembershipPage() {
  const [data, setData] = useState<StrapiMembershipPage | null>(null);
  const [faqs, setFaqs] = useState<StrapiFaqItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [page, faqList] = await Promise.all([
        fetchAPI<StrapiMembershipPage>('/membership-page'),
        fetchAPI<StrapiFaqItem[]>('/faq-items', {
          'sort[0]': 'order:asc',
          'pagination[limit]': '4',
        }),
      ]);
      if (cancelled) return;
      setData(page);
      setFaqs(faqList ?? []);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center text-text-dark/50">Loading…</div>;
  }
  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-text-dark/70">Membership page content unavailable.</div>;
  }

  const benefitItems = (data.benefits?.features ?? []).map((f) => ({
    heading: f.heading,
    description: f.description,
    image: mediaUrl(f.image),
  }));

  const programCards = (data.programs?.cards ?? []).map((c) => ({
    name: c.heading,
    description: c.description,
    image: mediaUrl(c.image),
    cta: c.cta?.label,
  }));

  const faqItems = faqs.map((f) => ({ question: f.question, answer: '' }));

  return (
    <>
      {data.hero && (
        <Hero
          heading={data.hero.heading}
          subheading={data.hero.subheading}
          backgroundImage={mediaUrl(data.hero.backgroundImage)}
          variant={data.hero.variant ?? 'compact'}
        />
      )}

      {data.joinCta && (
        <CtaBanner
          heading={data.joinCta.heading}
          body={data.joinCta.body ?? ''}
          variant={data.joinCta.variant === 'default' ? undefined : data.joinCta.variant}
          ctas={linksOf(data.joinCta.ctas)}
        />
      )}

      {data.intro && (
        <TextBlock heading={data.intro.heading} body={data.intro.body} />
      )}

      {benefitItems.length > 0 && (
        <FeatureGrid items={benefitItems} />
      )}

      {data.findRightCta && (
        <CtaBanner
          heading={data.findRightCta.heading}
          body={data.findRightCta.body ?? ''}
          variant={data.findRightCta.variant === 'default' ? undefined : data.findRightCta.variant}
          ctas={linksOf(data.findRightCta.ctas)}
        />
      )}

      {programCards.length > 0 && (
        <CardGrid columns={3} items={programCards} />
      )}

      {data.faq && faqItems.length > 0 && (
        <FaqAccordion
          heading={data.faq.heading ?? 'Your Questions, Answered'}
          ctas={linksOf(data.faq.ctas)}
          items={faqItems}
        />
      )}

      {data.beginJourneyCta && (
        <CtaBanner
          heading={data.beginJourneyCta.heading}
          body={data.beginJourneyCta.body ?? ''}
          variant={data.beginJourneyCta.variant === 'default' ? undefined : data.beginJourneyCta.variant}
          ctas={linksOf(data.beginJourneyCta.ctas)}
        />
      )}
    </>
  );
}
