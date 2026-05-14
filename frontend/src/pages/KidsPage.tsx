import { useEffect, useState } from 'react';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { Hero } from '../components/blocks/Hero';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { OverlaySection } from '../components/blocks/OverlaySection';
import { ThreeColGrid } from '../components/blocks/ThreeColGrid';
import { QuadSection } from '../components/kids/QuadSection';
import { ChildSafetySection } from '../components/kids/ChildSafetySection';
import { KidsPartyPackages } from '../components/kids/KidsPartyPackages';
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
  partyPackages?: {
    heading?: string;
    subheading?: string;
    items?: { name: string; image?: StrapiMedia; imageAlt?: string; cta?: StrapiLink }[];
  };
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

// Patch CTAs the CMS still seeds with placeholder hrefs. Once the deployed
// Strapi entry carries the real URL these overrides become no-ops.
const CTA_OVERRIDES: Record<string, { href: string; isExternal: boolean }> = {
  'Book a Club Tour': {
    href: 'https://amclub.jotform.com/260813837273966?parentURL=https%3A%2F%2Famclub.org.sg%2Fmembership-enquiry-form%2F&jsForm=true',
    isExternal: true,
  },
};

const linksOf = (ls?: StrapiLink[]) =>
  (ls ?? []).map((l) => {
    const override = CTA_OVERRIDES[l.label];
    if (override && (!l.href || l.href === '#')) {
      return { label: l.label, href: override.href, isExternal: override.isExternal };
    }
    return { label: l.label, href: l.href ?? '#', isExternal: l.isExternal };
  });

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

  const cmsPartyPackageItems = (data.partyPackages?.items ?? [])
    .filter((i) => i.image)
    .map((i) => ({
      name: i.name,
      image: mediaUrl(i.image) ?? '',
      imageAlt: i.imageAlt ?? i.name,
      cta: i.cta
        ? { label: i.cta.label, href: i.cta.href ?? '#', isExternal: i.cta.isExternal }
        : undefined,
    }));

  // Fallback content while the deployed Strapi catches up with the new
  // `partyPackages` component (see project memory: new media fields don't
  // persist on this project until migrations land). Once Strapi returns
  // partyPackages, the CMS data takes over automatically.
  const fallbackPartyPackages = {
    heading: 'Parties Made Easy',
    subheading: "Fun-filled kids' party packages designed for memorable celebrations.",
    items: [
      {
        name: 'The Quad Studio Party Package',
        image:
          'https://amclubdata28a57492.blob.core.windows.net/media/uploads/quadstudio_a820344edb.jpeg',
        imageAlt: 'The Quad Studio Party Package',
        cta: {
          label: 'Download Brochure',
          href: '/documents/kids/the-quad-studios-party-package.pdf',
          isExternal: true,
        },
      },
      {
        name: 'The Bowling Alley Party Package',
        image:
          'https://amclubdata28a57492.blob.core.windows.net/media/uploads/bowling_alley_256914ebd6.jpeg',
        imageAlt: 'The Bowling Alley Party Package',
        cta: {
          label: 'Download Brochure',
          href: '/documents/kids/the-bowling-alley-party-package.pdf',
          isExternal: true,
        },
      },
      {
        name: 'Union Bar x The Bowling Alley',
        image: `${STRAPI_URL}/uploads/union_bar_4a8862c1e3.jpeg`,
        imageAlt: 'Union Bar x The Bowling Alley',
        cta: {
          label: 'View Menu',
          href: '/documents/kids/union-bar-bowling-alley-menu.jpg',
          isExternal: true,
        },
      },
    ],
  };

  const partyPackages =
    cmsPartyPackageItems.length > 0
      ? {
          heading: data.partyPackages?.heading,
          subheading: data.partyPackages?.subheading,
          items: cmsPartyPackageItems,
        }
      : fallbackPartyPackages;

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

      <KidsPartyPackages
        heading={partyPackages.heading}
        subheading={partyPackages.subheading}
        items={partyPackages.items}
      />


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
