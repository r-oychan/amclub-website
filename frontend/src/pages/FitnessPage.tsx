import { useEffect, useState } from 'react';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { Hero } from '../components/blocks/Hero';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { OverlaySection } from '../components/blocks/OverlaySection';
import { ThreeColGrid } from '../components/blocks/ThreeColGrid';
import { PageFade } from '../components/shared/PageFade';

type StrapiMedia = { id: number; url: string; alternativeText?: string | null };
type StrapiLink = { label: string; href?: string; isExternal?: boolean; variant?: string; bordered?: boolean };

interface StrapiOverlay {
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
  logo?: StrapiMedia;
}

interface StrapiFitnessPage {
  title: string;
  hero?: { heading: string; subheading?: string; variant?: 'full' | 'compact'; backgroundImage?: StrapiMedia };
  senSpa?: StrapiOverlay;
  aquatics?: StrapiOverlay;
  connectDiscover?: StrapiOverlay;
  gym?: StrapiOverlay;
  tennis?: StrapiOverlay;
  moreActivities?: {
    columns?: '2' | '3';
    variant?: 'centered' | 'left';
    items?: { heading: string; description?: string; image?: StrapiMedia; imageAlt?: string; cta?: StrapiLink; accentColor?: string }[];
  };
  bowling?: StrapiOverlay;
  finalCta?: { heading: string; body?: string; variant?: 'default' | 'light' | 'dark' | 'accent'; ctas?: StrapiLink[] };
}

const mediaUrl = (m?: StrapiMedia | null): string | undefined => {
  if (!m?.url) return undefined;
  if (/^https?:/i.test(m.url)) return m.url;
  return `${STRAPI_URL}${m.url}`;
};

const linksOf = (ls?: StrapiLink[]) =>
  (ls ?? []).map((l) => ({ label: l.label, href: l.href ?? '#', isExternal: l.isExternal, bordered: l.bordered }));

const overlayProps = (s?: StrapiOverlay) => {
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
    logo: mediaUrl(s.logo),
  };
};

export default function FitnessPage() {
  const [data, setData] = useState<StrapiFitnessPage | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const page = await fetchAPI<StrapiFitnessPage>('/fitness-page');
      if (cancelled) return;
      setData(page);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loaded) return <PageFade loaded={false}>{null}</PageFade>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-text-dark/70">Fitness page content unavailable.</div>;

  const overlays: { key: string; props: ReturnType<typeof overlayProps> }[] = [
    { key: 'senSpa',          props: overlayProps(data.senSpa) },
    { key: 'aquatics',        props: overlayProps(data.aquatics) },
    { key: 'connectDiscover', props: overlayProps(data.connectDiscover) },
    { key: 'gym',             props: overlayProps(data.gym) },
    { key: 'tennis',          props: overlayProps(data.tennis) },
  ];

  const moreItems = (data.moreActivities?.items ?? []).map((i) => ({
    heading: i.heading,
    description: i.description ?? '',
    image: mediaUrl(i.image) ?? '',
    imageAlt: i.imageAlt ?? '',
    cta: { label: i.cta?.label ?? 'Explore', href: i.cta?.href ?? '#' },
    accentColor: i.accentColor,
  }));

  const bowlingP = overlayProps(data.bowling);

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

      {overlays.map((o) => (o.props ? <OverlaySection key={o.key} {...o.props} /> : null))}

      {data.moreActivities && moreItems.length > 0 && (
        <ThreeColGrid
          columns={data.moreActivities.columns === '2' ? 2 : 3}
          items={moreItems}
        />
      )}

      {bowlingP && <OverlaySection {...bowlingP} />}

      {data.finalCta && (
        <CtaBanner
          heading={data.finalCta.heading}
          body={data.finalCta.body ?? ''}
          variant={data.finalCta.variant === 'default' ? undefined : data.finalCta.variant}
          ctas={linksOf(data.finalCta.ctas)}
        />
      )}
    </PageFade>
  );
}
