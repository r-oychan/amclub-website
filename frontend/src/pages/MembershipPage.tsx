import { useEffect, useState } from 'react';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { Hero } from '../components/blocks/Hero';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { FeatureGrid } from '../components/blocks/FeatureGrid';
import { OverlaySection } from '../components/blocks/OverlaySection';
import { MembershipCommunityCollage } from '../components/blocks/MembershipCommunityCollage';
import { MembershipPrograms } from '../components/blocks/MembershipPrograms';
import { PageFade } from '../components/shared/PageFade';

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
  icon?: StrapiMedia;
  cta?: StrapiLink;
}
interface StrapiMembershipPage {
  title: string;
  hero?: { heading: string; subheading?: string; variant?: 'full' | 'compact'; backgroundImage?: StrapiMedia };
  joinCta?: StrapiCtaBanner;
  joinCommunityImages?: StrapiMedia[];
  intro?: { heading?: string; body?: string };
  benefits?: { heading?: string; features?: StrapiFeatureItem[] };
  benefitIcons?: StrapiMedia[];
  findRightCta?: StrapiCtaBanner;
  findMembershipImage?: StrapiMedia;
  programs?: { heading?: string; cards?: StrapiFeatureItem[] };
  beginJourneyCta?: StrapiCtaBanner;
}

const mediaUrl = (m?: StrapiMedia | null): string | undefined => {
  if (!m?.url) return undefined;
  if (/^https?:/i.test(m.url)) return m.url;
  return `${STRAPI_URL}${m.url}`;
};

// Real destinations for CTAs the CMS still seeds with placeholder hrefs.
// When the seed runs against a Strapi instance that supports component
// updates these can be removed; until then we patch the href client-side.
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

// Fallback assets served from /public/membership/ — used until the CMS schema
// migration adds first-class media fields for these slots.
const FALLBACK_COMMUNITY_IMAGES = [
  '/membership/community-kids-tkd.jpg',
  '/membership/community-fitness.jpg',
  '/membership/community-tennis.jpg',
  '/membership/community-dining.jpg',
];
const FALLBACK_BENEFIT_ICONS = [
  '/membership/icon-facilities.svg',
  '/membership/icon-dining.svg',
  '/membership/icon-events.svg',
  '/membership/icon-kids.svg',
  '/membership/icon-community.svg',
  '/membership/icon-reciprocal.svg',
];
const FALLBACK_FIND_MEMBERSHIP_IMAGE = '/membership/find-membership-lobby.jpg';

export default function MembershipPage() {
  const [data, setData] = useState<StrapiMembershipPage | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const page = await fetchAPI<StrapiMembershipPage>('/membership-page', {
        'populate[hero][populate]': '*',
        'populate[joinCta][populate]': '*',
        'populate[joinCommunityImages]': '*',
        'populate[intro]': '*',
        'populate[benefits][populate][features][populate]': '*',
        'populate[benefitIcons]': '*',
        'populate[findRightCta][populate]': '*',
        'populate[findMembershipImage]': '*',
        'populate[programs][populate][cards][populate]': '*',
        'populate[beginJourneyCta][populate]': '*',
      });
      if (cancelled) return;
      setData(page);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loaded) return <PageFade loaded={false}>{null}</PageFade>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-text-dark/70">Membership page content unavailable.</div>;

  const cmsBenefitIcons = (data.benefitIcons ?? []).map((m) => mediaUrl(m));
  const benefitItems = (data.benefits?.features ?? []).map((f, i) => ({
    heading: f.heading,
    description: f.description,
    image: mediaUrl(f.image),
    icon: mediaUrl(f.icon) ?? cmsBenefitIcons[i] ?? FALLBACK_BENEFIT_ICONS[i],
  }));

  const programCards = (data.programs?.cards ?? []).map((c) => ({
    heading: c.heading,
    description: c.description,
    image: mediaUrl(c.image),
    cta: c.cta ? { label: c.cta.label, href: c.cta.href } : undefined,
  }));

  const cmsJoinImages = (data.joinCommunityImages ?? [])
    .map((m) => ({ src: mediaUrl(m) ?? '', alt: m.alternativeText ?? '' }))
    .filter((i) => i.src);
  const joinImages = cmsJoinImages.length > 0
    ? cmsJoinImages
    : FALLBACK_COMMUNITY_IMAGES.map((src) => ({ src, alt: '' }));

  const findImage = mediaUrl(data.findMembershipImage) ?? FALLBACK_FIND_MEMBERSHIP_IMAGE;

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

      {data.joinCta && (
        <MembershipCommunityCollage
          heading={data.joinCta.heading}
          body={data.joinCta.body}
          ctas={linksOf(data.joinCta.ctas)}
          images={joinImages}
        />
      )}

      {(data.intro?.heading || benefitItems.length > 0) && (
        <FeatureGrid
          heading={data.intro?.heading}
          body={data.intro?.body}
          items={benefitItems}
          centered
        />
      )}

      {data.findRightCta && (
        <OverlaySection
          image={findImage}
          imageAlt={data.findMembershipImage?.alternativeText ?? ''}
          textPosition="left"
          textVerticalAlign="end"
          textTheme="light"
          textBgColor="#001E62"
          heading={data.findRightCta.heading}
          description={data.findRightCta.body}
          ctas={(data.findRightCta.ctas ?? []).map((c) => ({
            label: c.label,
            href: c.href ?? '#',
            bordered: false,
            icon: 'arrow' as const,
            isExternal: c.isExternal,
          }))}
        />
      )}

      {programCards.length > 0 && (
        <MembershipPrograms cards={programCards} />
      )}

      {data.beginJourneyCta && (
        <CtaBanner
          heading={data.beginJourneyCta.heading}
          body={data.beginJourneyCta.body ?? ''}
          variant={data.beginJourneyCta.variant === 'default' ? undefined : data.beginJourneyCta.variant}
          ctas={linksOf(data.beginJourneyCta.ctas)}
        />
      )}
    </PageFade>
  );
}
