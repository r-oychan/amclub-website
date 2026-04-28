import { useEffect, useState } from 'react';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { Hero } from '../components/blocks/Hero';
import { TextBlock } from '../components/blocks/TextBlock';
import { StatsCounter } from '../components/blocks/StatsCounter';
import { TeamGrid } from '../components/blocks/TeamGrid';
import { FeatureGrid } from '../components/blocks/FeatureGrid';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { PartnerOrganizations } from '../components/blocks/PartnerOrganizations';
import { AwardsGrid } from '../components/blocks/AwardsGrid';
import { HeritageTimeline } from '../components/blocks/HeritageTimeline';
import { GovernanceBlock } from '../components/blocks/GovernanceBlock';
import { ManagementSlider } from '../components/blocks/ManagementSlider';

type StrapiMedia = { id: number; url: string; alternativeText?: string | null };
type StrapiLink = { label: string; href?: string; isExternal?: boolean; variant?: string; caption?: string };

interface StrapiAboutPage {
  title: string;
  hero?: { heading: string; subheading?: string; variant?: 'full' | 'compact'; backgroundImage?: StrapiMedia };
  heritage?: {
    heading: string; body?: string;
    backgroundImage?: StrapiMedia;
    slides?: { year: string; body?: string; image?: StrapiMedia }[];
  };
  statsToday?: { label?: string; heading?: string; stats?: { value: string; label: string }[] };
  visionMission?: { vision?: string; mission?: string; image?: StrapiMedia; imagePosition?: 'left' | 'right' };
  governance?: {
    heading: string; body?: string;
    sidebarHeading?: string; sidebarBody?: string;
    links?: StrapiLink[];
  };
  generalCommittee?: { heading?: string; variant?: 'light' | 'dark'; filterByType?: 'general-committee' | 'management' };
  advocacy?: {
    label?: string; heading?: string; subheading?: string; body?: string;
    listItems?: string[];
    asideImage?: StrapiMedia;
    asideImagePosition?: 'left' | 'right';
    dark?: boolean;
  };
  management?: { heading: string; watermark?: StrapiMedia; filterByType?: 'general-committee' | 'management' };
  partners?: {
    heading?: string;
    groups?: { heading?: string; logos?: { name: string; image?: StrapiMedia; href?: string }[] }[];
  };
  awards?: { heading?: string; items?: { title: string; issuer?: string; image?: StrapiMedia }[] };
  ctaBanner?: { heading: string; body?: string; ctas?: StrapiLink[]; variant?: string };
}

interface StrapiCommitteeMember {
  documentId: string;
  name: string;
  role: string;
  bio?: string | null;
  photo?: StrapiMedia;
  memberType: 'general-committee' | 'management';
  order?: number;
}

const mediaUrl = (m?: StrapiMedia | null): string | undefined => {
  if (!m?.url) return undefined;
  if (/^https?:/i.test(m.url)) return m.url;
  return `${STRAPI_URL}${m.url}`;
};

const linksOf = (ls?: StrapiLink[]) =>
  (ls ?? []).map((l) => ({ label: l.label, href: l.href ?? '#', isExternal: l.isExternal, caption: l.caption }));

export default function AboutPage() {
  const [data, setData] = useState<StrapiAboutPage | null>(null);
  const [gc, setGc] = useState<StrapiCommitteeMember[]>([]);
  const [mgmt, setMgmt] = useState<StrapiCommitteeMember[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [page, gcList, mgmtList] = await Promise.all([
        fetchAPI<StrapiAboutPage>('/about-page'),
        fetchAPI<StrapiCommitteeMember[]>('/committee-members', {
          'filters[memberType][$eq]': 'general-committee',
          'sort[0]': 'order:asc',
          'pagination[limit]': '50',
          'populate[photo]': 'true',
        }),
        fetchAPI<StrapiCommitteeMember[]>('/committee-members', {
          'filters[memberType][$eq]': 'management',
          'sort[0]': 'order:asc',
          'pagination[limit]': '50',
          'populate[photo]': 'true',
        }),
      ]);
      if (cancelled) return;
      setData(page);
      setGc(gcList ?? []);
      setMgmt(mgmtList ?? []);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center text-text-dark/50">Loading…</div>;
  }
  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-text-dark/70">About page content unavailable.</div>;
  }

  const heritageSlides = (data.heritage?.slides ?? []).map((s) => ({
    year: s.year,
    body: s.body ?? '',
    image: mediaUrl(s.image) ?? '',
  }));

  const gcMembers = gc.map((m) => ({
    name: m.name,
    role: m.role,
    bio: m.bio ?? undefined,
    image: mediaUrl(m.photo),
  }));

  const mgmtMembers = mgmt.map((m) => ({
    name: m.name,
    role: m.role,
    bio: m.bio ?? undefined,
    image: mediaUrl(m.photo),
  }));

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

      {data.heritage && (
        <HeritageTimeline
          heading={data.heritage.heading}
          body={data.heritage.body ?? ''}
          backgroundImage={mediaUrl(data.heritage.backgroundImage)}
          slides={heritageSlides}
        />
      )}

      {data.statsToday && (
        <StatsCounter
          heading={data.statsToday.heading}
          stats={data.statsToday.stats ?? []}
        />
      )}

      {data.visionMission && (data.visionMission.vision || data.visionMission.mission) && (
        <TextBlock
          vision={data.visionMission.vision ?? ''}
          mission={data.visionMission.mission ?? ''}
          image={mediaUrl(data.visionMission.image)}
          imagePosition={data.visionMission.imagePosition ?? 'left'}
        />
      )}

      {data.governance && (
        <GovernanceBlock
          heading={data.governance.heading}
          body={data.governance.body ?? ''}
          sidebarHeading={data.governance.sidebarHeading ?? ''}
          sidebarBody={data.governance.sidebarBody ?? ''}
          links={linksOf(data.governance.links)}
        />
      )}

      {data.generalCommittee && gcMembers.length > 0 && (
        <TeamGrid
          heading={data.generalCommittee.heading ?? 'General Committee'}
          variant={data.generalCommittee.variant ?? 'light'}
          members={gcMembers}
        />
      )}

      {data.advocacy && (
        <FeatureGrid
          heading={data.advocacy.heading}
          subheading={data.advocacy.subheading}
          body={data.advocacy.body}
          listItems={data.advocacy.listItems ?? []}
          asideImage={mediaUrl(data.advocacy.asideImage)}
          asideImagePosition={data.advocacy.asideImagePosition ?? 'left'}
          dark={data.advocacy.dark}
        />
      )}

      {data.management && mgmtMembers.length > 0 && (
        <ManagementSlider
          heading={data.management.heading}
          watermark={mediaUrl(data.management.watermark)}
          members={mgmtMembers}
        />
      )}

      {data.partners && (data.partners.groups?.length ?? 0) > 0 && (
        <PartnerOrganizations
          heading={data.partners.heading}
          groups={(data.partners.groups ?? []).map((g) => ({
            heading: g.heading,
            logos: (g.logos ?? []).map((l) => ({
              name: l.name,
              image: mediaUrl(l.image) ?? '',
              href: l.href,
            })),
          }))}
        />
      )}

      {data.awards && (data.awards.items?.length ?? 0) > 0 && (
        <AwardsGrid
          heading={data.awards.heading}
          items={(data.awards.items ?? []).map((a) => ({
            title: a.title,
            issuer: a.issuer ?? '',
            image: mediaUrl(a.image),
          }))}
        />
      )}

      {data.ctaBanner && (
        <CtaBanner
          heading={data.ctaBanner.heading}
          body={data.ctaBanner.body ?? ''}
          ctas={(data.ctaBanner.ctas ?? []).map((c) => ({ label: c.label, href: c.href ?? '#' }))}
        />
      )}
    </>
  );
}
