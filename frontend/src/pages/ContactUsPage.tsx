import { useEffect, useState } from 'react';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';
import { MapGettingHere } from '../components/contact/MapGettingHere';
import { OutletOperatingHours } from '../components/contact/OutletOperatingHours';
import { TalkToUsBanner } from '../components/contact/TalkToUsBanner';
import type { ContactInfo, OutletGroup } from '../data/contactUs';
import { PageFade } from '../components/shared/PageFade';

type StrapiMedia = { id: number; url: string; alternativeText?: string | null };
type StrapiLink = { label: string; href?: string; isExternal?: boolean; variant?: string };

interface StrapiContactUsPage {
  title: string;
  heroImage?: StrapiMedia;
  address?: string[];
  operatingHours?: string[];
  phone?: string;
  email?: string;
  mapEmbedSrc?: string;
  outletGroups?: OutletGroup[];
  talkToUsCta?: { heading?: string; body?: string; variant?: string; ctas?: StrapiLink[] };
}

const mediaUrl = (m?: StrapiMedia | null): string | undefined => {
  if (!m?.url) return undefined;
  if (/^https?:/i.test(m.url)) return m.url;
  return `${STRAPI_URL}${m.url}`;
};

export default function ContactUsPage() {
  const [data, setData] = useState<StrapiContactUsPage | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const page = await fetchAPI<StrapiContactUsPage>('/contact-us-page');
      if (cancelled) return;
      setData(page);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loaded) return <PageFade loaded={false}>{null}</PageFade>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-text-dark/70">Contact page content unavailable.</div>;

  const contactInfo: ContactInfo = {
    address: data.address ?? [],
    operatingHours: data.operatingHours ?? [],
    phone: data.phone ?? '',
    email: data.email ?? '',
    mapEmbedSrc: data.mapEmbedSrc ?? '',
  };

  const outletGroups = data.outletGroups ?? [];

  return (
    <PageFade loaded={loaded}>
      <DetailHeroBanner imageUrl={mediaUrl(data.heroImage)} />
      <DetailBreadcrumb parentLabel="The American Club" parentHref="/home" currentName="Contact Us" />
      <MapGettingHere info={contactInfo} />
      {outletGroups.length > 0 && (
        <OutletOperatingHours groups={outletGroups} defaultGroupId={outletGroups[0].id} />
      )}
      <TalkToUsBanner />
    </PageFade>
  );
}
