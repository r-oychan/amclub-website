import { useEffect, useState } from 'react';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { Hero } from '../components/blocks/Hero';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { OverlaySection } from '../components/blocks/OverlaySection';
import { ThreeColGrid } from '../components/blocks/ThreeColGrid';
import { QuadSection } from '../components/kids/QuadSection';
import { ChildSafetySection } from '../components/kids/ChildSafetySection';
import { PageFade } from '../components/shared/PageFade';

type StrapiMedia = { id: number; url: string; alternativeText?: string | null };
type StrapiLink = { label: string; href?: string; isExternal?: boolean; variant?: string };

interface StrapiOverlaySection {
  heading?: string;
  description?: string;
  image?: StrapiMedia;
  imageAlt?: string;
  textPosition?: 'left' | 'right';
  textVerticalAlign?: 'start' | 'center' | 'end';
  textBgColor?: string;
  textBgImage?: StrapiMedia;
  textTheme?: 'light' | 'dark';
  ctas?: StrapiLink[];
}

interface StrapiKidsPage {
  title: string;
  hero?: { heading: string; subheading?: string; variant?: 'full' | 'compact'; backgroundImage?: StrapiMedia };
  hangout?: StrapiOverlaySection;
  parties?: StrapiOverlaySection;
  learning?: {
    heading?: string; subheading?: string;
    columns?: '2' | '3';
    variant?: 'centered' | 'left';
    items?: { heading: string; description?: string; image?: StrapiMedia; imageAlt?: string; cta?: StrapiLink }[];
  };
  safety?: {
    heading?: string; body?: string; centered?: boolean;
    features?: { heading: string; description?: string }[];
  };
  finalCta?: { heading: string; body?: string; variant?: 'default' | 'light' | 'dark' | 'accent'; ctas?: StrapiLink[] };
}

const mediaUrl = (m?: StrapiMedia | null): string | undefined => {
  if (!m?.url) return undefined;
  if (/^https?:/i.test(m.url)) return m.url;
  return `${STRAPI_URL}${m.url}`;
};

const linksOf = (ls?: StrapiLink[]) =>
  (ls ?? []).map((l) => ({ label: l.label, href: l.href ?? '#', isExternal: l.isExternal }));

const overlayProps = (s?: StrapiOverlaySection) => {
  if (!s || !s.image) return null;
  return {
    heading: s.heading,
    description: s.description,
    image: mediaUrl(s.image) ?? '',
    imageAlt: s.imageAlt ?? '',
    textPosition: s.textPosition,
    textVerticalAlign: s.textVerticalAlign,
    textBgColor: s.textBgColor,
    textBgImage: mediaUrl(s.textBgImage),
    textTheme: s.textTheme,
    ctas: linksOf(s.ctas),
  };
};

export default function KidsPage() {
  const [data, setData] = useState<StrapiKidsPage | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const page = await fetchAPI<StrapiKidsPage>('/kids-page');
      if (cancelled) return;
      setData(page);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loaded) return <PageFade loaded={false}>{null}</PageFade>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-text-dark/70">Kids page content unavailable.</div>;

  const hangoutP = overlayProps(data.hangout);
  const partiesP = overlayProps(data.parties);

  const learningItems = (data.learning?.items ?? []).map((i) => ({
    heading: i.heading,
    description: i.description ?? '',
    image: mediaUrl(i.image) ?? '',
    imageAlt: i.imageAlt ?? '',
    cta: { label: i.cta?.label ?? 'Explore', href: i.cta?.href ?? '#' },
  }));

  return (
    <PageFade loaded={loaded}>
      {data.hero && (
        <Hero
          heading={data.hero.heading}
          subheading={data.hero.subheading}
          backgroundImage={mediaUrl(data.hero.backgroundImage)}
          variant={data.hero.variant ?? 'compact'}
        />
      )}

      {/* Custom QuadSection — local enhancement, not yet CMS-driven */}
      <QuadSection />

      {hangoutP && <OverlaySection {...hangoutP} />}
      {partiesP && <OverlaySection {...partiesP} />}

      {data.learning && learningItems.length > 0 && (
        <ThreeColGrid
          heading={data.learning.heading}
          subheading={data.learning.subheading}
          columns={data.learning.columns === '2' ? 2 : 3}
          items={learningItems}
        />
      )}

      {/* Custom Child Safety section — sits between Learning and the final CTA, matches Framer order.
          Replaces the legacy FeatureGrid driven by data.safety, which duplicated this heading. */}
      <ChildSafetySection />

      {data.finalCta && (
        <CtaBanner
          heading={data.finalCta.heading}
          body={data.finalCta.body ?? ''}
          variant="light"
          ctas={linksOf(data.finalCta.ctas)}
        />
      )}
    </PageFade>
  );
}
