import { useEffect, useState } from 'react';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { Hero } from '../components/blocks/Hero';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { PrivateEventPackages } from '../components/event-spaces/PrivateEventPackages';
import { DistinctiveEventSpaces } from '../components/event-spaces/DistinctiveEventSpaces';
import { OffsiteCateringServices } from '../components/event-spaces/OffsiteCateringServices';
import { PageFade } from '../components/shared/PageFade';

type StrapiMedia = { id: number; url: string; alternativeText?: string | null };
type StrapiLink = { label: string; href?: string; isExternal?: boolean; variant?: string };

interface StrapiEventSpacesPage {
  title: string;
  hero?: { heading: string; subheading?: string; variant?: 'full' | 'compact'; backgroundImage?: StrapiMedia };
  privatePackages?: {
    heading?: string; subheading?: string;
    enquireCta?: StrapiLink;
    items?: { name: string; tagline?: string; image?: StrapiMedia; serviceFeatures?: string[]; venues?: string[]; cta?: StrapiLink }[];
  };
  distinctiveSpaces?: {
    heading?: string; subheading?: string; panelBgColor?: string;
    items?: { name: string; capacity?: string[]; description?: string; image?: StrapiMedia; cta?: StrapiLink }[];
  };
  offsiteCatering?: {
    heading?: string; body?: string;
    ctas?: StrapiLink[];
    pillars?: { heading: string; subheading?: string; items?: string[]; image?: StrapiMedia }[];
    subBanner?: { heading?: string; body?: string; image?: StrapiMedia; cta?: StrapiLink };
  };
  finalCta?: { heading: string; body?: string; variant?: 'default' | 'light' | 'dark' | 'accent'; ctas?: StrapiLink[] };
}

const mediaUrl = (m?: StrapiMedia | null): string | undefined => {
  if (!m?.url) return undefined;
  if (/^https?:/i.test(m.url)) return m.url;
  return `${STRAPI_URL}${m.url}`;
};

// Patch CTAs the CMS still seeds with placeholder/wrong hrefs. 'Book a Club
// Tour' should always go to the JotForm membership-enquiry form regardless of
// what the seed/CMS currently carries (it has historically been '#' and
// '/contact-us'). Once the deployed Strapi entry carries the correct URL,
// remove this override.
const TOUR_FORM_URL =
  'https://amclub.jotform.com/260813837273966?parentURL=https%3A%2F%2Famclub.org.sg%2Fmembership-enquiry-form%2F&jsForm=true';
const overrideHref = (label: string, href?: string) => {
  if (label === 'Book a Club Tour') {
    return { href: TOUR_FORM_URL, isExternal: true };
  }
  return { href: href ?? '#', isExternal: undefined };
};

const linkOf = (l?: StrapiLink) => {
  if (!l) return undefined;
  const o = overrideHref(l.label, l.href);
  return { label: l.label, href: o.href };
};
const linksOf = (ls?: StrapiLink[]) =>
  (ls ?? []).map((l) => {
    const o = overrideHref(l.label, l.href);
    return { label: l.label, href: o.href, isExternal: o.isExternal ?? l.isExternal };
  });

export default function EventSpacesPage() {
  const [data, setData] = useState<StrapiEventSpacesPage | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const page = await fetchAPI<StrapiEventSpacesPage>('/event-spaces-page');
      if (cancelled) return;
      setData(page);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loaded) return <PageFade loaded={false}>{null}</PageFade>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-text-dark/70">Event spaces page content unavailable.</div>;

  const packages = (data.privatePackages?.items ?? []).map((p) => ({
    name: p.name,
    tagline: p.tagline ?? '',
    image: mediaUrl(p.image) ?? '',
    serviceFeatures: p.serviceFeatures ?? [],
    venues: p.venues ?? [],
    cta: { label: p.cta?.label ?? 'View Packages', href: p.cta?.href ?? '#' },
  }));

  const venues = (data.distinctiveSpaces?.items ?? []).map((v) => ({
    name: v.name,
    capacity: v.capacity ?? [],
    description: v.description ?? '',
    image: mediaUrl(v.image) ?? '',
    cta: { label: v.cta?.label ?? 'Learn More', href: v.cta?.href ?? '#' },
  }));

  const pillars = (data.offsiteCatering?.pillars ?? []).map((p) => ({
    heading: p.heading,
    subheading: p.subheading ?? '',
    items: p.items ?? [],
    image: mediaUrl(p.image) ?? '',
  }));

  const sb = data.offsiteCatering?.subBanner;
  const subBanner = sb && sb.heading ? {
    heading: sb.heading,
    body: sb.body ?? '',
    image: mediaUrl(sb.image) ?? '',
    cta: {
      label: sb.cta?.label ?? 'Order Now',
      href: sb.cta?.href ?? '#',
      isExternal: sb.cta?.isExternal,
    },
  } : undefined;

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

      {data.privatePackages && packages.length > 0 && (
        <PrivateEventPackages
          heading={data.privatePackages.heading}
          subheading={data.privatePackages.subheading}
          enquireCta={linkOf(data.privatePackages.enquireCta)}
          items={packages}
        />
      )}

      {data.distinctiveSpaces && venues.length > 0 && (
        <DistinctiveEventSpaces
          heading={data.distinctiveSpaces.heading}
          subheading={data.distinctiveSpaces.subheading}
          panelBgColor={data.distinctiveSpaces.panelBgColor}
          items={venues}
        />
      )}

      {data.offsiteCatering && pillars.length > 0 && (
        <OffsiteCateringServices
          heading={data.offsiteCatering.heading}
          body={data.offsiteCatering.body}
          ctas={linksOf(data.offsiteCatering.ctas)}
          pillars={pillars}
          subBanner={subBanner}
        />
      )}

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
