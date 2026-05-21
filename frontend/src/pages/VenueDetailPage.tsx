import { useParams, useLocation, Link } from 'react-router';
import { useEffect, useState, type ReactNode } from 'react';
import { fetchAPI } from '../lib/api';
import { getSubpage } from '../data/subpages';
import { Button } from '../components/shared/Button';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';
import { DetailSection } from '../components/detail/DetailSection';
import { ContactRow } from '../components/detail/ContactRow';
import { FaqAccordion } from '../components/blocks/FaqAccordion';
import { MarqueeGallery } from '../components/detail/MarqueeGallery';
import { KidsPartyPackages } from '../components/kids/KidsPartyPackages';
import { Testimonials } from '../components/blocks/Testimonials';
import { BlockRenderer } from '../components/blocks/BlockRenderer';
import { CtaIcon, type CtaIconName } from '../components/shared/CtaIcon';
import type { DetailBody } from '../lib/blocks';

interface ScheduleRow {
  dayRange: string;
  time: string;
  lastOrder?: string;
  note?: string;
}

interface OperatingHoursSection {
  title?: string;
  rows?: ScheduleRow[];
}

interface LocationContact {
  locationLevel?: string;
  phone?: string;
  email?: string;
}

interface VenueData {
  id?: number;
  name: string;
  slug: string;
  /** Optional override of the section's default parent label/href (used by nested entries like aquatics programs). */
  parentSection?: string;
  parentHref?: string;
  description: string;
  detailedDescription?: unknown[];
  openingHours?: unknown[];
  operatingHoursSections?: OperatingHoursSection[];
  locationContact?: LocationContact | null;
  locationLevel?: string;
  phone?: string;
  email?: string;
  hours?: string;
  image?: { url: string; alternativeText?: string };
  video?: { url: string; title?: string };
  cuisineType?: string;
  cuisineIconSlug?: string;
  /** Facility-side equivalents of cuisineType / cuisineIconSlug */
  categoryLabel?: string;
  categoryIconSlug?: string;
  dressCode?: string;
  menuUrl?: string;
  category?: string;
  capacity?: string;
  ctas?: { label: string; href: string; isExternal?: boolean; icon?: CtaIconName | null }[];
  extraSections?: {
    title: string;
    content?: string;
    bullets?: string[];
    contactRows?: { label: string; value: string }[];
    groups?: {
      heading?: string;
      paragraphs?: string[];
      bullets?: string[];
      footer?: string;
    }[];
  }[];
  promoCards?: {
    heading: string;
    description: string;
    variant?: 'card' | 'overlay';
    columns?: number;
    cards: {
      title: string;
      subtitle?: string;
      image: string;
      cta: { label: string; href: string };
    }[];
  };
  teamMembers?: {
    name: string;
    role: string;
    bio?: string;
    image?: string;
    bioImage?: string;
    /** Avatar framing within the circular mask. 0–100 (percent), default 50. */
    imageOffsetX?: number;
    imageOffsetY?: number;
    /** Avatar zoom multiplier (1 = fit, >1 zooms in further). Default 1. */
    imageZoom?: number;
    /** Optional coach-detail URL. When set and no bioImage exists, clicking the avatar navigates here. */
    coachLink?: string;
  }[];
  teamHeading?: string;
  teamLayout?: 'circle' | 'card';
  bottomCtas?: { label: string; href: string; isExternal?: boolean }[];
  cardSections?: {
    heading?: string;
    subheading?: string;
    cards: {
      heading: string;
      description: string;
      image: string;
      imageAlt?: string;
      cta?: { label: string; href: string; isExternal?: boolean };
    }[];
  }[];
  imagePanels?: {
    image: string;
    imageAlt?: string;
    imagePosition?: 'left' | 'right';
    slideWithText?: boolean;
    heading: string;
    cta?: { label: string; href: string; isExternal?: boolean };
    subheading?: string;
    body?: string;
    bullets?: string[];
    operatingHours?: { title: string; rows: string[] }[];
    footnote?: string;
  }[];
  faq?: { question: string; answer: string }[];
  gallery?: {
    heading?: string;
    rows: { images: string[]; direction?: 'ltr' | 'rtl'; durationSec?: number }[];
  };
  quotes?: {
    heading?: string;
    items: { text: string; attribution?: string; role?: string }[];
  };
  partyPackages?: {
    heading?: string;
    subheading?: string;
    items: {
      name: string;
      image: string;
      imageAlt?: string;
      cta?: { label: string; href: string; isExternal?: boolean };
    }[];
  };
  downloads?: {
    heading?: string;
    items: { label: string; href: string; isExternal?: boolean }[];
  };
  tierCards?: {
    heading?: string;
    subheading?: string;
    cards: {
      name: string;
      description: string;
      benefits: string[];
      gradientFrom: string;
      gradientTo: string;
    }[];
  };
  venueCards?: {
    heading?: string;
    subheading?: string;
    columns?: 2 | 3 | 4;
    cards: {
      heading: string;
      capacity?: string;
      description: string;
      image: string;
      imageAlt?: string;
    }[];
  };
  packageCards?: {
    heading?: string;
    subheading?: string;
    columns?: 2 | 3;
    cards: {
      heading: string;
      tagline: string;
      detailsLabel?: string;
      benefits: string[];
      image?: string;
    }[];
  };
  /** Strapi dynamiczone — new in Phase A. Rendered after legacy sections by `<BlockRenderer>`. */
  body?: DetailBody;
}

// Singleton overrides — specific (section, slug) tuples that are backed by
// a dedicated single-type in Strapi rather than a collection. The frontend
// renders them through the same VenueDetailPage layout so authors get a
// tailored admin form (one entry per page) without any visual divergence.
const SINGLETON_OVERRIDES: Record<string, string> = {
  'membership/start-application': '/start-application-page',
  'membership/niche-group-membership': '/niche-group-membership-page',
  // Pages with bespoke layouts use dedicated React components (see App.tsx):
  //   /membership/reciprocal-clubs → ReciprocalClubsPage (two-block layout)
  //   /home-sub/advertise-with-us → AdvertiseWithUsPage (single block with
  //     inline Sponsorship sub-section in the right column)
  // The generic VenueDetailPage shape (one hero column + flat sections
  // underneath) can't represent these without distorting the others.
};

/** Raw shape returned by the membership / advertise-with-us singletons. */
interface SingletonResponse {
  title?: string;
  label?: string;
  heading?: string;
  description?: string;
  intro?: string;
  parentLabel?: string;
  parentHref?: string;
  heroImage?: { url: string; alternativeText?: string };
  locationLevel?: string;
  phone?: string;
  email?: string;
  locationContact?: LocationContact | null;
  operatingHoursSections?: OperatingHoursSection[];
  downloads?: { heading?: string; items?: { label?: string; href?: string; isExternal?: boolean }[] };
  ctas?: { label?: string; href?: string; isExternal?: boolean; icon?: CtaIconName | null }[];
  bottomCtas?: { label?: string; href?: string; isExternal?: boolean }[];
  body?: unknown[];
}

/** Adapt a singleton response into the VenueData shape the page renders. */
function adaptSingleton(s: SingletonResponse, slug: string): VenueData {
  const filterCtas = <T extends { label?: string; href?: string }>(arr?: T[]): { label: string; href: string }[] | undefined => {
    if (!arr?.length) return undefined;
    const filtered = arr
      .filter((c) => c.label && c.href)
      .map((c) => ({ ...c, label: c.label!, href: c.href! }));
    return filtered.length ? filtered : undefined;
  };
  const ctas = filterCtas(s.ctas) as VenueData['ctas'];
  const bottomCtas = filterCtas(s.bottomCtas);
  const downloads =
    s.downloads && s.downloads.items?.length
      ? {
          heading: s.downloads.heading,
          items: s.downloads.items
            .filter((i) => i.label && i.href)
            .map((i) => ({ label: i.label!, href: i.href!, isExternal: i.isExternal })),
        }
      : undefined;
  return {
    name: s.heading || s.title || '',
    slug,
    description: s.description ?? s.intro ?? '',
    parentSection: s.parentLabel,
    parentHref: s.parentHref,
    image: s.heroImage,
    cuisineType: s.label,
    locationLevel: s.locationLevel,
    phone: s.phone,
    email: s.email,
    locationContact: s.locationContact ?? null,
    operatingHoursSections: s.operatingHoursSections,
    downloads,
    ctas,
    bottomCtas,
    body: s.body as VenueData['body'],
  };
}

// Each section now has its own dedicated content type (Phase A). The
// legacy `/facilities` endpoint is still queried as a fallback so any
// entries still living there during the seed cutover keep rendering.
const SECTION_MAP: Record<string, { apiPath: string; fallbackApiPath?: string; parentLabel: string; parentHref: string }> = {
  dining: { apiPath: '/restaurants', parentLabel: 'Dining & Retail', parentHref: '/dining' },
  fitness: {
    apiPath: '/fitness-facilities',
    fallbackApiPath: '/facilities',
    parentLabel: 'Fitness & Wellness',
    parentHref: '/fitness',
  },
  kids: {
    apiPath: '/kids-experiences',
    fallbackApiPath: '/facilities',
    parentLabel: 'Kids',
    parentHref: '/kids',
  },
  'event-spaces': {
    apiPath: '/event-spaces',
    fallbackApiPath: '/facilities',
    parentLabel: 'Private Events & Catering',
    parentHref: '/event-spaces',
  },
  membership: { apiPath: '/facilities', parentLabel: 'Membership', parentHref: '/membership' },
  'home-sub': { apiPath: '/facilities', parentLabel: 'The American Club', parentHref: '/home' },
};

function staticFallback(section: string, slug: string): VenueData | null {
  const sp = getSubpage(section, slug);
  if (!sp) return null;
  return {
    name: sp.name,
    slug: sp.slug,
    parentSection: sp.parentSection,
    parentHref: sp.parentHref,
    description: sp.description,
    cuisineType: sp.type,
    locationLevel: sp.level,
    phone: sp.phone,
    email: sp.email,
    hours: sp.hours,
    dressCode: sp.dressCode,
    capacity: sp.capacity,
    image: sp.image ? { url: sp.image } : undefined,
    video: sp.video,
    ctas: sp.ctas,
    extraSections: sp.extraSections,
    promoCards: sp.promoCards,
    teamMembers: sp.teamMembers,
    teamHeading: sp.teamHeading,
    teamLayout: sp.teamLayout,
    bottomCtas: sp.bottomCtas,
    imagePanels: sp.imagePanels,
    cardSections: sp.cardSections,
    faq: sp.faq,
    gallery: sp.gallery,
    partyPackages: sp.partyPackages,
    quotes: sp.quotes,
    operatingHoursSections: sp.operatingHoursSections,
    locationContact: sp.locationContact ?? null,
    downloads: sp.downloads,
    tierCards: sp.tierCards,
    venueCards: sp.venueCards,
    packageCards: sp.packageCards,
  };
}

/* Map extra section titles to DetailSection icon names */
function resolveIcon(
  title: string
): 'clock' | 'location' | 'reservation' | 'dresscode' | 'capacity' | 'menu' | 'sponsorship' {
  const lower = title.toLowerCase();
  if (lower.includes('sponsor') || lower.includes('partner')) return 'sponsorship';
  if (lower.includes('reserv') || lower.includes('book')) return 'reservation';
  if (lower.includes('menu') || lower.includes('food') || lower.includes('cuisine')) return 'menu';
  if (lower.includes('hour') || lower.includes('time')) return 'clock';
  if (lower.includes('location') || lower.includes('contact')) return 'location';
  if (lower.includes('dress') || lower.includes('attire')) return 'dresscode';
  if (lower.includes('capac') || lower.includes('seat')) return 'capacity';
  return 'reservation';
}

/** Extract a YouTube video ID from a watch URL, youtu.be URL, embed URL, or raw ID. */
function youtubeEmbedUrl(input: string): string | null {
  if (!input) return null;
  let id: string | null = null;
  const m =
    input.match(/youtu\.be\/([\w-]{6,})/i) ||
    input.match(/[?&]v=([\w-]{6,})/i) ||
    input.match(/youtube\.com\/embed\/([\w-]{6,})/i);
  if (m) id = m[1];
  else if (/^[\w-]{6,}$/.test(input)) id = input;
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
}

const STRIPE_PATTERN_SVG =
  'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22126%22 height=%22126%22%3E%3Cpath d=%22M126 0v21.584L21.584 126H0v-17.585L108.415 0H126Zm0 108.414V126h-17.586L126 108.414Zm0-84v39.171L63.585 126H24.414L126 24.414Zm0 42v39.17L105.584 126h-39.17L126 66.414ZM105.586 0 0 105.586V66.415L66.415 0h39.171Zm-42 0L0 63.586V24.415L24.415 0h39.171Zm-42 0L0 21.586V0h21.586Z%22 fill=%22rgb(136,136,136,0.2)%22 fill-rule=%22evenodd%22/%3E%3C/svg%3E")';

export default function VenueDetailPage({ section: sectionProp }: { section?: string }) {
  const { section: sectionParam, slug: slugParam, subSlug } = useParams<{
    section: string;
    slug: string;
    subSlug: string;
  }>();
  const section = sectionProp ?? sectionParam;
  // When a sub-slug is present (e.g. /fitness/aquatics/swimamerica), the
  // detail entry is registered under `<slug>-<subSlug>` in subpages.ts so it
  // stays unique across the section.
  const lookupSlug = subSlug ? `${slugParam}-${subSlug}` : slugParam;
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bioModal, setBioModal] = useState<{ image: string; name: string } | null>(null);
  const location = useLocation();

  // Close bio modal on Esc; lock background scroll while open.
  useEffect(() => {
    if (!bioModal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setBioModal(null); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [bioModal]);

  const config = section ? SECTION_MAP[section] : undefined;

  // React Router doesn't auto-scroll to a URL hash on navigation. After the
  // venue's sections render, look up the target id and bring it into view.
  // Runs whenever the hash or the venue payload changes.
  useEffect(() => {
    if (!location.hash || !venue) return;
    const id = location.hash.slice(1);
    const target = document.getElementById(id);
    if (target) {
      requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }, [location.hash, venue]);

  useEffect(() => {
    if (!config || !lookupSlug || !section) return;
    const load = async () => {
      setLoading(true);
      // Singleton override: certain (section, slug) tuples are backed by a
      // dedicated single-type in Strapi. We fetch that instead of the
      // collection and adapt the response into VenueData shape.
      const singletonEndpoint = SINGLETON_OVERRIDES[`${section}/${lookupSlug}`];
      let items: VenueData[] | null = null;
      if (singletonEndpoint) {
        const s = await fetchAPI<SingletonResponse>(singletonEndpoint);
        if (s) items = [adaptSingleton(s, lookupSlug)];
      } else {
        // Each collection's custom controller (cms/src/api/{restaurant,venue,
        // facility}/controllers/) supplies its own POPULATE map server-side.
        // Strapi 5.46's stricter populate-validator rejects `=*` on leaf fields
        // and unknown keys (e.g. `teamMembers` doesn't exist on restaurant),
        // so we keep populate out of the request entirely.
        // Phase A migrated fitness / kids / event-spaces from /facilities to
        // section-specific endpoints. During the seed cutover we try the new
        // endpoint first, then fall back to /facilities. Once Phase D removes
        // /facilities, fallbackApiPath disappears.
        const primary = await fetchAPI<VenueData[]>(config.apiPath, {
          'filters[slug][$eq]': lookupSlug,
        });
        items =
          primary && primary.length > 0
            ? primary
            : config.fallbackApiPath
              ? await fetchAPI<VenueData[]>(config.fallbackApiPath, {
                  'filters[slug][$eq]': lookupSlug,
                })
              : primary;
      }
      const fallback = staticFallback(section, lookupSlug);
      if (items && items.length > 0) {
        const api = items[0];
        // Strapi v5 returns media as `{ url, alternativeText, ... }`; the team
        // grid renders `image`/`bioImage` as plain string paths, so flatten.
        const apiTeam = api.teamMembers?.map((m) => ({
          ...m,
          image: typeof m.image === 'string' ? m.image : (m.image as { url?: string } | undefined)?.url,
          bioImage:
            typeof m.bioImage === 'string'
              ? m.bioImage
              : (m.bioImage as { url?: string } | undefined)?.url,
        }));
        // Enrich with static fallback for fields missing from CMS
        setVenue({
          ...fallback,
          ...api,
          image: api.image ?? fallback?.image,
          video: api.video ?? fallback?.video,
          ctas: api.ctas?.length ? api.ctas : fallback?.ctas,
          extraSections: api.extraSections?.length ? api.extraSections : fallback?.extraSections,
          promoCards: api.promoCards ?? fallback?.promoCards,
          teamMembers: apiTeam?.length ? apiTeam : fallback?.teamMembers,
          teamHeading: api.teamHeading ?? fallback?.teamHeading,
          bottomCtas: api.bottomCtas?.length ? api.bottomCtas : fallback?.bottomCtas,
          imagePanels: api.imagePanels?.length ? api.imagePanels : fallback?.imagePanels,
          cardSections: api.cardSections?.length ? api.cardSections : fallback?.cardSections,
          faq: api.faq?.length ? api.faq : fallback?.faq,
          gallery: api.gallery ?? fallback?.gallery,
          partyPackages: api.partyPackages ?? fallback?.partyPackages,
          quotes: api.quotes ?? fallback?.quotes,
          downloads: api.downloads ?? fallback?.downloads,
          tierCards: api.tierCards ?? fallback?.tierCards,
          venueCards: api.venueCards ?? fallback?.venueCards,
          packageCards: api.packageCards ?? fallback?.packageCards,
        });
      } else {
        setVenue(fallback);
      }
      setLoading(false);
    };
    load();
  }, [config, lookupSlug, section]);

  if (!config) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-primary/60">Section not found.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-primary/40 text-lg">Loading...</div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-primary/60 text-lg">Page not found.</p>
        <Button label={`Back to ${config.parentLabel}`} href={config.parentHref} variant="secondary" />
      </div>
    );
  }

  const imageUrl = venue.image?.url
    ? venue.image.url.startsWith('http') ? venue.image.url : `${venue.image.url}`
    : undefined;
  const videoEmbed = venue.video?.url ? youtubeEmbedUrl(venue.video.url) : null;

  // Resolve the optional Location & Contact module — prefer the CMS component,
  // fall back to legacy top-level fields if any are populated.
  const locationContact: LocationContact | null =
    venue.locationContact && (
      venue.locationContact.locationLevel || venue.locationContact.phone || venue.locationContact.email
    )
      ? venue.locationContact
      : venue.locationLevel || venue.phone || venue.email
        ? {
            locationLevel: venue.locationLevel,
            phone: venue.phone,
            email: venue.email,
          }
        : null;

  // Resolve operating-hours sections — prefer the new repeatable component,
  // fall back to the legacy single `hours` string (split by newline as columns).
  const operatingHoursSections: OperatingHoursSection[] =
    venue.operatingHoursSections && venue.operatingHoursSections.length > 0
      ? venue.operatingHoursSections
      : venue.hours
        ? [
            {
              title: 'Opening Hours',
              rows: venue.hours.split('\n').filter(Boolean).map((line) => ({
                dayRange: '',
                time: line,
              })),
            },
          ]
        : [];

  // Nested entries (e.g. aquatics programs) carry their own parent label/href
  // so the breadcrumb + back link point one level up instead of the section root.
  const effectiveParentLabel = venue.parentSection ?? config.parentLabel;
  const effectiveParentHref = venue.parentHref ?? config.parentHref;

  return (
    <>
      {/* ── Hero Banner ── */}
      <DetailHeroBanner />

      {/* ── Breadcrumb ── */}
      <DetailBreadcrumb
        parentLabel={effectiveParentLabel}
        parentHref={effectiveParentHref}
        currentName={venue.name}
      />

      {/* ── Main Content: two-column ── */}
      <section className="bg-bg">
        <div className="max-w-7xl mx-auto px-10 pb-[120px]">
          <div className="flex flex-col lg:flex-row" style={{ gap: '60px' }}>
            {/* Left — Venue media (sticky). Video takes priority over image. */}
            <div className="lg:w-[52%] shrink-0">
              <div className="lg:sticky lg:top-[120px]">
                {videoEmbed ? (
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16 / 9' }}>
                    <iframe
                      src={videoEmbed}
                      title={venue.video?.title ?? venue.name}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : imageUrl ? (
                  <div className="overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={venue.image?.alternativeText ?? venue.name}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                ) : (
                  <div
                    aria-hidden
                    className="aspect-[4/3] w-full"
                    style={{
                      backgroundImage: STRIPE_PATTERN_SVG,
                      backgroundSize: '64px',
                      backgroundRepeat: 'repeat',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Right — Details */}
            <div className="flex flex-col" style={{ gap: '32px' }}>
              {/* Title — Noto Serif 38.4px / 300 / italic */}
              <h1
                className="font-heading text-primary"
                style={{
                  fontSize: '38.4px',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  letterSpacing: '-1.152px',
                  lineHeight: '42.24px',
                }}
              >
                {venue.name}
              </h1>

              {/* Category badge — icon + Lato 13.6px / 700 / uppercase club blue.
                  Restaurants supply cuisineType + cuisineIconSlug; facilities
                  supply categoryLabel + categoryIconSlug. Either pair shows the
                  same UI here. */}
              {(() => {
                const label = venue.cuisineType ?? venue.categoryLabel;
                const iconSlug = venue.cuisineIconSlug ?? venue.categoryIconSlug;
                if (!label || !label.trim()) return null;
                const iconHref = iconSlug
                  ? venue.cuisineIconSlug
                    ? `/uploads/icons/cuisine-${iconSlug}.svg`
                    : `/uploads/icons/category-${iconSlug}.svg`
                  : null;
                return (
                  <div className="flex items-center gap-2.5">
                    {iconHref && (
                      <img
                        src={iconHref}
                        alt=""
                        className="w-[26px] h-[26px] shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <span
                      className="text-primary uppercase"
                      style={{ fontSize: '13.6px', fontWeight: 700, letterSpacing: '0.04em' }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })()}

              {/* CTA buttons — up to 3, white pill with selectable icon */}
              {venue.ctas && venue.ctas.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {venue.ctas.slice(0, 3).map((cta) => {
                    const linkClass =
                      'inline-flex items-center gap-2 bg-white rounded-full text-primary uppercase hover:shadow-md transition-shadow';
                    const linkStyle = {
                      padding: '12px 16px 12px 24px',
                      fontSize: '13.6px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      boxShadow: 'rgba(32, 99, 171, 0.07) 0px 20px 19px -12px',
                    } as const;
                    const inner = (
                      <>
                        {cta.label}
                        <CtaIcon name={cta.icon ?? 'arrow'} size={20} className="text-accent" />
                      </>
                    );
                    return cta.isExternal ? (
                      <a
                        key={cta.label}
                        href={cta.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                        style={linkStyle}
                      >
                        {inner}
                      </a>
                    ) : (
                      <Link key={cta.label} to={cta.href} className={linkClass} style={linkStyle}>
                        {inner}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Description — Lato 19.2px / 400, line-height 26.88px */}
              <div className="flex flex-col" style={{ gap: '20px' }}>
                {venue.description.split('\n\n').map((p, i) => (
                  <p
                    key={i}
                    className="text-text-dark"
                    style={{ fontSize: '19.2px', fontWeight: 400, lineHeight: '26.88px' }}
                  >
                    {p}
                  </p>
                ))}
              </div>

              {/* ── Operating Hours ──
                  Single-section venues use the section's own title as the
                  DetailSection heading (e.g. dining's "Opening Hours"). Multi-
                  section venues (e.g. Aquatics: pool / peak hours / office)
                  collapse into one "Operating Hours" DetailSection with bold
                  sub-headings per section. */}
              {operatingHoursSections.length > 0 && (() => {
                const useSubHeadings =
                  operatingHoursSections.length > 1 ||
                  operatingHoursSections.some((s) => !s.title);
                const mainTitle = useSubHeadings
                  ? 'Operating Hours'
                  : operatingHoursSections[0].title ?? 'Operating Hours';
                const renderRows = (rows: ScheduleRow[]) => (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                    {rows.map((row, rIdx) => (
                      <div key={rIdx} className="flex flex-col gap-1">
                        <p
                          className="text-text-dark"
                          style={{ fontSize: '17.6px', fontWeight: 700, lineHeight: '24.64px' }}
                        >
                          {row.dayRange}
                        </p>
                        <p
                          className="text-text-dark whitespace-pre-line"
                          style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                        >
                          {row.time}
                        </p>
                        {row.lastOrder && (
                          <p
                            className="text-text-dark"
                            style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                          >
                            {row.lastOrder}
                          </p>
                        )}
                        {row.note && (
                          <p
                            className="text-text-dark/70 italic"
                            style={{ fontSize: '15.2px', lineHeight: '22px' }}
                          >
                            {row.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                );
                return (
                  <DetailSection icon="clock" title={mainTitle}>
                    {useSubHeadings ? (
                      <div className="flex flex-col" style={{ gap: '24px' }}>
                        {operatingHoursSections.map((section, idx) => (
                          <div key={`oh-${idx}`} className="flex flex-col" style={{ gap: '12px' }}>
                            {section.title && (
                              <p
                                className="text-text-dark"
                                style={{
                                  fontSize: '17.6px',
                                  fontWeight: 700,
                                  lineHeight: '24.64px',
                                }}
                              >
                                {section.title}
                              </p>
                            )}
                            {renderRows(section.rows ?? [])}
                          </div>
                        ))}
                      </div>
                    ) : (
                      renderRows(operatingHoursSections[0].rows ?? [])
                    )}
                  </DetailSection>
                );
              })()}

              {/* ── Location & Contact (optional CMS module) ── */}
              {locationContact && (
                <DetailSection icon="location" title="Location & Contact">
                  <div className="flex flex-col" style={{ gap: '16px' }}>
                    {locationContact.locationLevel && (
                      <ContactRow icon="pin" text={locationContact.locationLevel} />
                    )}
                    {locationContact.phone && (
                      <ContactRow
                        icon="phone"
                        text={locationContact.phone}
                        href={`tel:${locationContact.phone.replace(/\s+/g, '')}`}
                      />
                    )}
                    {locationContact.email && (
                      <ContactRow
                        icon="email"
                        text={locationContact.email}
                        href={`mailto:${locationContact.email}`}
                      />
                    )}
                  </div>
                </DetailSection>
              )}

              {/* ── Extra Sections (Reservation, etc.) ── */}
              {venue.extraSections?.map((extra, i) => (
                <DetailSection key={i} icon={resolveIcon(extra.title)} title={extra.title}>
                  <div className="flex flex-col" style={{ gap: '16px' }}>
                    {extra.content?.split('\n').filter(Boolean).map((line, j) => (
                      <p
                        key={j}
                        className="text-text-dark"
                        style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                      >
                        {line}
                      </p>
                    ))}
                    {extra.bullets && extra.bullets.length > 0 && (
                      <ul className="list-disc pl-6 flex flex-col" style={{ gap: '8px' }}>
                        {extra.bullets.map((bullet, k) => (
                          <li
                            key={k}
                            className="text-text-dark"
                            style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                          >
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                    {extra.groups && extra.groups.length > 0 && extra.groups.map((g, gIdx) => (
                      <div key={`g-${gIdx}`} className="flex flex-col" style={{ gap: '12px', marginTop: gIdx === 0 ? '8px' : '16px' }}>
                        {g.heading && (
                          <p
                            className="text-primary"
                            style={{ fontSize: '17.6px', fontWeight: 700, lineHeight: '24.64px' }}
                          >
                            {g.heading}
                          </p>
                        )}
                        {g.paragraphs?.map((p, pIdx) => (
                          <p
                            key={pIdx}
                            className="text-text-dark"
                            style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                          >
                            {p}
                          </p>
                        ))}
                        {g.bullets && g.bullets.length > 0 && (
                          <ul className="list-disc pl-6 flex flex-col" style={{ gap: '8px' }}>
                            {g.bullets.map((b, bIdx) => (
                              <li
                                key={bIdx}
                                className="text-text-dark"
                                style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                              >
                                {b}
                              </li>
                            ))}
                          </ul>
                        )}
                        {g.footer && g.footer.split('\n').filter(Boolean).map((line, fIdx) => (
                          <p
                            key={`f-${fIdx}`}
                            className="text-text-dark"
                            style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    ))}
                    {extra.contactRows && extra.contactRows.length > 0 && (
                      <div
                        className="grid"
                        style={{
                          gridTemplateColumns: 'auto 1fr',
                          columnGap: '40px',
                          rowGap: '8px',
                          marginTop: '8px',
                        }}
                      >
                        {extra.contactRows.map((row, m) => (
                          <div key={m} className="contents">
                            <p
                              style={{
                                fontFamily: 'Lato, sans-serif',
                                fontSize: '17.6px',
                                fontWeight: 700,
                                lineHeight: '24.64px',
                                color: '#000',
                              }}
                            >
                              {row.label}
                            </p>
                            <p
                              style={{
                                fontFamily: 'Lato, sans-serif',
                                fontSize: '17.6px',
                                fontWeight: 400,
                                lineHeight: '24.64px',
                                color: '#000',
                              }}
                            >
                              {/\S+@\S+\.\S+/.test(row.value) ? (
                                <a
                                  href={`mailto:${row.value}`}
                                  className="hover:underline"
                                  style={{ color: 'inherit' }}
                                >
                                  {row.value}
                                </a>
                              ) : (
                                row.value
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </DetailSection>
              ))}

              {/* ── Dress Code ── */}
              {venue.dressCode && (
                <DetailSection icon="dresscode" title="Dress Code">
                  <p
                    className="text-text-dark"
                    style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                  >
                    {venue.dressCode}
                  </p>
                </DetailSection>
              )}

              {/* ── Capacity ── */}
              {venue.capacity && (
                <DetailSection icon="capacity" title="Capacity">
                  <p
                    className="text-text-dark"
                    style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                  >
                    {venue.capacity}
                  </p>
                </DetailSection>
              )}

              {/* ── Forms You'll Need (downloadable PDFs) ── */}
              {venue.downloads && venue.downloads.items.length > 0 && (
                <DetailSection icon="menu" title={venue.downloads.heading ?? "Forms You'll Need"}>
                  <ul className="flex flex-col" style={{ gap: '8px' }}>
                    {venue.downloads.items.map((item) => (
                      <li key={item.label}>
                        <a
                          href={item.href}
                          target={item.isExternal ? '_blank' : undefined}
                          rel={item.isExternal ? 'noopener noreferrer' : undefined}
                          className="inline-flex items-center gap-3 text-accent hover:underline"
                          style={{ fontSize: '17.6px', lineHeight: '26.4px', fontWeight: 400 }}
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                            className="shrink-0"
                          >
                            <path
                              d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM9 13H15V15H9V13ZM9 16H13V18H9V16Z"
                              fill="currentColor"
                            />
                          </svg>
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </DetailSection>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4-col Tier Cards (Eagles Rewards) ── */}
      {venue.tierCards && venue.tierCards.cards.length > 0 && (
        <section className="bg-bg pb-[120px]">
          <div className="max-w-7xl mx-auto px-10 flex flex-col" style={{ gap: '48px' }}>
            {(venue.tierCards.heading || venue.tierCards.subheading) && (
              <div className="text-center flex flex-col" style={{ gap: '16px' }}>
                {venue.tierCards.heading && (
                  <h2
                    className="font-heading text-primary"
                    style={{
                      fontSize: '38.4px',
                      fontWeight: 300,
                      fontStyle: 'italic',
                      letterSpacing: '-1.152px',
                      lineHeight: '42.24px',
                    }}
                  >
                    {venue.tierCards.heading}
                  </h2>
                )}
                {venue.tierCards.subheading && (
                  <p
                    className="text-text-dark/70 max-w-3xl mx-auto"
                    style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                  >
                    {venue.tierCards.subheading}
                  </p>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {venue.tierCards.cards.map((card, i) => (
                <div key={`${card.name}-${i}`} className="flex flex-col" style={{ gap: '24px' }}>
                  {/* Card image: radial gradient + diagonal stripe overlay */}
                  <div
                    aria-hidden
                    className="w-full mx-auto rounded-2xl"
                    style={{
                      aspectRatio: '252 / 238',
                      maxWidth: '252px',
                      backgroundImage: `${STRIPE_PATTERN_SVG}, radial-gradient(119% 122% at -32% -2.8%, ${card.gradientFrom} 0%, ${card.gradientTo} 100%)`,
                      backgroundSize: '126px, auto',
                      backgroundRepeat: 'repeat, no-repeat',
                    }}
                  />
                  <h3
                    className="font-heading text-primary"
                    style={{
                      fontSize: '26.56px',
                      fontWeight: 300,
                      fontStyle: 'italic',
                      letterSpacing: '-0.797px',
                      lineHeight: '32px',
                    }}
                  >
                    {card.name}
                  </h3>
                  <p
                    className="text-text-dark"
                    style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                  >
                    {card.description}
                  </p>
                  <h4
                    className="font-heading text-primary"
                    style={{
                      fontSize: '17.6px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      marginTop: '4px',
                    }}
                  >
                    Benefits
                  </h4>
                  <ul className="flex flex-col" style={{ gap: '12px' }}>
                    {card.benefits.map((b, j) => (
                      <li
                        key={j}
                        className="text-text-dark flex"
                        style={{ fontSize: '15.2px', lineHeight: '22px', gap: '10px' }}
                      >
                        <span
                          aria-hidden
                          className="text-accent shrink-0"
                          style={{ fontWeight: 700, lineHeight: '22px' }}
                        >
                          ✓
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 2-col Image + Text Cards (e.g. Gym: Personal Training / Group Fitness Classes) ──
          Mirrors the Framer prototype's white card grid: image on top, italic
          serif heading, body copy, then an EXPLORE arrow link. Renders 2-up on
          desktop, stacks on mobile. */}
      {venue.cardSections && venue.cardSections.length > 0 && (
        <section className="bg-bg pb-[120px]">
          <div className="max-w-7xl mx-auto px-10 flex flex-col" style={{ gap: '60px' }}>
            {venue.cardSections.map((group, gIdx) => (
              <div key={`cardgroup-${gIdx}`} className="flex flex-col" style={{ gap: '32px' }}>
                {(group.heading || group.subheading) && (
                  <div className="text-center flex flex-col" style={{ gap: '12px' }}>
                    {group.heading && (
                      <h2
                        className="font-heading text-primary"
                        style={{
                          fontSize: '26.56px',
                          fontWeight: 300,
                          fontStyle: 'italic',
                          letterSpacing: '-0.797px',
                        }}
                      >
                        {group.heading}
                      </h2>
                    )}
                    {group.subheading && (
                      <p
                        className="text-text-dark/70 max-w-2xl mx-auto"
                        style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                      >
                        {group.subheading}
                      </p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {group.cards.map((card, cIdx) => {
                    const inner = (
                      <div className="bg-white overflow-hidden flex flex-col h-full transition-shadow hover:shadow-md">
                        <div className="aspect-[4/3] overflow-hidden">
                          <img
                            src={card.image}
                            alt={card.imageAlt ?? card.heading}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div
                          className="flex flex-col items-center text-center px-8"
                          style={{ paddingTop: '32px', paddingBottom: '32px', gap: '16px' }}
                        >
                          <h3
                            className="font-heading text-primary"
                            style={{
                              fontSize: '26.56px',
                              fontWeight: 300,
                              fontStyle: 'italic',
                              letterSpacing: '-0.797px',
                              lineHeight: '32px',
                            }}
                          >
                            {card.heading}
                          </h3>
                          <p
                            className="text-text-dark"
                            style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                          >
                            {card.description}
                          </p>
                          {card.cta && (
                            <span
                              className="inline-flex items-center gap-2 text-primary uppercase mt-2"
                              style={{ fontSize: '13.6px', fontWeight: 700, letterSpacing: '0.04em' }}
                            >
                              {card.cta.label}
                              <CtaIcon name="arrow" size={18} className="text-accent" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                    const key = `${card.heading}-${cIdx}`;
                    if (!card.cta) return <div key={key}>{inner}</div>;
                    return card.cta.isExternal ? (
                      <a
                        key={key}
                        href={card.cta.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-full"
                      >
                        {inner}
                      </a>
                    ) : (
                      <Link key={key} to={card.cta.href} className="block h-full">
                        {inner}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 3-col Venue Cards (Corporate Functions facility lineup) ──
          Square image, left-aligned italic serif heading, thin divider,
          capacity tagline in accent, then body copy. No CTA — these are
          presentational summaries that mirror Framer's facility grid. */}
      {venue.venueCards && venue.venueCards.cards.length > 0 && (() => {
        const cols = venue.venueCards.columns ?? 3;
        const colsClass =
          cols === 4
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            : cols === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-3';
        return (
          <section className="bg-bg pb-[120px]">
            <div className="max-w-7xl mx-auto px-10 flex flex-col" style={{ gap: '48px' }}>
              {(venue.venueCards.heading || venue.venueCards.subheading) && (
                <div className="text-center flex flex-col" style={{ gap: '16px' }}>
                  {venue.venueCards.heading && (
                    <h2
                      className="font-heading text-primary"
                      style={{
                        fontSize: '38.4px',
                        fontWeight: 300,
                        fontStyle: 'italic',
                        letterSpacing: '-1.152px',
                        lineHeight: '42.24px',
                      }}
                    >
                      {venue.venueCards.heading}
                    </h2>
                  )}
                  {venue.venueCards.subheading && (
                    <p
                      className="text-text-dark/70 max-w-3xl mx-auto"
                      style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                    >
                      {venue.venueCards.subheading}
                    </p>
                  )}
                </div>
              )}
              <div className={`grid ${colsClass} gap-8`}>
                {venue.venueCards.cards.map((card, i) => (
                  <div key={`${card.heading}-${i}`} className="flex flex-col bg-white">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={card.image}
                        alt={card.imageAlt ?? card.heading}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col px-8" style={{ paddingTop: '32px', paddingBottom: '32px', gap: '16px' }}>
                      <h3
                        className="font-heading text-primary"
                        style={{
                          fontSize: '26.56px',
                          fontWeight: 300,
                          fontStyle: 'italic',
                          letterSpacing: '-0.797px',
                          lineHeight: '32px',
                        }}
                      >
                        {card.heading}
                      </h3>
                      <div className="h-px w-12 bg-text-dark/30" aria-hidden />
                      {card.capacity && (
                        <p
                          className="text-accent uppercase"
                          style={{ fontSize: '13.6px', fontWeight: 700, letterSpacing: '0.04em' }}
                        >
                          {card.capacity}
                        </p>
                      )}
                      <p
                        className="text-text-dark"
                        style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                      >
                        {card.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── 3-col Package Cards (Wedding Celebrations: Classic / Signature / Prestige) ──
          Striped placeholder image, italic serif heading, divider, tagline
          subheading, "PACKAGE DETAILS" label, then a checkmark bullet list. */}
      {venue.packageCards && venue.packageCards.cards.length > 0 && (() => {
        const cols = venue.packageCards.columns ?? 3;
        const colsClass = cols === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3';
        return (
          <section className="bg-bg pb-[120px]">
            <div className="max-w-7xl mx-auto px-10 flex flex-col" style={{ gap: '48px' }}>
              {(venue.packageCards.heading || venue.packageCards.subheading) && (
                <div className="text-center flex flex-col" style={{ gap: '16px' }}>
                  {venue.packageCards.heading && (
                    <h2
                      className="font-heading text-primary"
                      style={{
                        fontSize: '38.4px',
                        fontWeight: 300,
                        fontStyle: 'italic',
                        letterSpacing: '-1.152px',
                        lineHeight: '42.24px',
                      }}
                    >
                      {venue.packageCards.heading}
                    </h2>
                  )}
                  {venue.packageCards.subheading && (
                    <p
                      className="text-text-dark/70 max-w-3xl mx-auto"
                      style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                    >
                      {venue.packageCards.subheading}
                    </p>
                  )}
                </div>
              )}
              <div className={`grid ${colsClass} gap-8`}>
                {venue.packageCards.cards.map((card, i) => (
                  <div key={`${card.heading}-${i}`} className="flex flex-col bg-white">
                    {card.image ? (
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={card.image}
                          alt={card.heading}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        aria-hidden
                        className="aspect-square w-full"
                        style={{
                          backgroundImage: STRIPE_PATTERN_SVG,
                          backgroundSize: '64px',
                          backgroundRepeat: 'repeat',
                        }}
                      />
                    )}
                    <div className="flex flex-col px-8" style={{ paddingTop: '32px', paddingBottom: '32px', gap: '20px' }}>
                      <h3
                        className="font-heading text-primary"
                        style={{
                          fontSize: '26.56px',
                          fontWeight: 300,
                          fontStyle: 'italic',
                          letterSpacing: '-0.797px',
                          lineHeight: '32px',
                        }}
                      >
                        {card.heading}
                      </h3>
                      <div className="h-px w-12 bg-text-dark/30" aria-hidden />
                      <p
                        className="text-primary"
                        style={{ fontSize: '17.6px', fontWeight: 700, lineHeight: '24.64px' }}
                      >
                        {card.tagline}
                      </p>
                      <p
                        className="text-accent uppercase"
                        style={{ fontSize: '13.6px', fontWeight: 700, letterSpacing: '0.04em' }}
                      >
                        {card.detailsLabel ?? 'Package Details'}
                      </p>
                      <ul className="flex flex-col" style={{ gap: '12px' }}>
                        {card.benefits.map((b, j) => (
                          <li
                            key={j}
                            className="text-text-dark flex"
                            style={{ fontSize: '15.2px', lineHeight: '22px', gap: '10px' }}
                          >
                            <span aria-hidden className="text-accent shrink-0" style={{ fontWeight: 700 }}>
                              ✓
                            </span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── Image + Text Panels (e.g. Tennis Programs, Tennis Etiquette) ──
          Mirrors the hero's two-column layout (52% image / flex text, 60px gap,
          sticky image by default) and reuses the hero's CTA pill + DetailSection
          treatments so every panel reads as the same component. */}
      {venue.imagePanels && venue.imagePanels.length > 0 && (
        <section className="bg-bg pb-[120px]">
          <div className="max-w-7xl mx-auto px-10 flex flex-col" style={{ gap: '120px' }}>
            {venue.imagePanels.map((panel, idx) => {
              const imageOnLeft = (panel.imagePosition ?? (idx % 2 === 0 ? 'left' : 'right')) === 'left';
              // By default the image stays pinned near the top of the viewport
              // while a long text column scrolls past. Pass `slideWithText` on
              // the panel to opt back into the row's normal flow.
              const stick = !panel.slideWithText;
              const imgEl = (
                <div className="lg:w-[52%] shrink-0">
                  <div className={stick ? 'lg:sticky lg:top-[120px]' : ''}>
                    <div className="overflow-hidden">
                      <img
                        src={panel.image}
                        alt={panel.imageAlt ?? panel.heading}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                </div>
              );
              const textEl = (
                <div className="flex flex-col flex-1" style={{ gap: '32px' }}>
                  <h2
                    className="font-heading text-primary"
                    style={{
                      fontSize: '38.4px',
                      fontWeight: 300,
                      fontStyle: 'italic',
                      letterSpacing: '-1.152px',
                      lineHeight: '42.24px',
                    }}
                  >
                    {panel.heading}
                  </h2>

                  {panel.cta && (() => {
                    const linkClass =
                      'inline-flex items-center gap-2 bg-white rounded-full text-primary uppercase hover:shadow-md transition-shadow self-start';
                    const linkStyle = {
                      padding: '12px 16px 12px 24px',
                      fontSize: '13.6px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      boxShadow: 'rgba(32, 99, 171, 0.07) 0px 20px 19px -12px',
                    } as const;
                    const inner = (
                      <>
                        {panel.cta.label}
                        <CtaIcon name="arrow" size={20} className="text-accent" />
                      </>
                    );
                    return panel.cta.isExternal ? (
                      <a
                        href={panel.cta.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                        style={linkStyle}
                      >
                        {inner}
                      </a>
                    ) : (
                      <Link to={panel.cta.href} className={linkClass} style={linkStyle}>
                        {inner}
                      </Link>
                    );
                  })()}

                  {panel.body && (
                    <p
                      className="text-text-dark"
                      style={{ fontSize: '19.2px', fontWeight: 400, lineHeight: '26.88px' }}
                    >
                      {panel.body}
                    </p>
                  )}

                  {panel.subheading && (() => {
                    // Prefer clock when the subsection carries scheduled hours;
                    // otherwise pick the closest semantic icon by title.
                    const subIcon = panel.operatingHours && panel.operatingHours.length > 0
                      ? 'clock'
                      : resolveIcon(panel.subheading);
                    return (
                      <DetailSection icon={subIcon} title={panel.subheading}>
                        <div className="flex flex-col" style={{ gap: '20px' }}>
                          {panel.bullets && panel.bullets.length > 0 && (
                            <ul className="list-disc pl-6 flex flex-col" style={{ gap: '8px' }}>
                              {panel.bullets.map((b, i) => (
                                <li
                                  key={i}
                                  className="text-text-dark"
                                  style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                                >
                                  {b}
                                </li>
                              ))}
                            </ul>
                          )}
                          {panel.operatingHours && panel.operatingHours.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                              {panel.operatingHours.map((block, i) => (
                                <div key={i} className="flex flex-col gap-1">
                                  <p
                                    className="text-text-dark"
                                    style={{ fontSize: '17.6px', fontWeight: 700, lineHeight: '24.64px' }}
                                  >
                                    {block.title}
                                  </p>
                                  {block.rows.map((row, j) => (
                                    <p
                                      key={j}
                                      className="text-text-dark"
                                      style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                                    >
                                      {row}
                                    </p>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </DetailSection>
                    );
                  })()}

                  {/* If there's no subheading, bullets/operatingHours still render unwrapped. */}
                  {!panel.subheading && panel.bullets && panel.bullets.length > 0 && (
                    <ul className="list-disc pl-6 flex flex-col" style={{ gap: '8px' }}>
                      {panel.bullets.map((b, i) => (
                        <li
                          key={i}
                          className="text-text-dark"
                          style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                        >
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!panel.subheading && panel.operatingHours && panel.operatingHours.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                      {panel.operatingHours.map((block, i) => (
                        <div key={i} className="flex flex-col gap-1">
                          <p
                            className="text-text-dark"
                            style={{ fontSize: '17.6px', fontWeight: 700, lineHeight: '24.64px' }}
                          >
                            {block.title}
                          </p>
                          {block.rows.map((row, j) => (
                            <p
                              key={j}
                              className="text-text-dark"
                              style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                            >
                              {row}
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {panel.footnote && (
                    <p
                      className="text-text-dark/70 italic"
                      style={{ fontSize: '15.2px', lineHeight: '22px' }}
                    >
                      {panel.footnote}
                    </p>
                  )}
                </div>
              );
              return (
                <div
                  key={`${panel.heading}-${idx}`}
                  className="flex flex-col lg:flex-row items-start"
                  style={{ gap: '60px' }}
                >
                  {imageOnLeft ? (
                    <>
                      {imgEl}
                      {textEl}
                    </>
                  ) : (
                    <>
                      {textEl}
                      {imgEl}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Promo Cards ──
          `variant: 'overlay'` renders a 5-up grid (default) of full-bleed
          program images with the title + CTA label overlaid in white at the
          bottom over a dark gradient — matches Framer's "Our Aquatic Programs".
          `variant: 'card'` (default) keeps the original image-on-top card
          layout with subtitle, title, and arrow CTA below. */}
      {venue.promoCards && (() => {
        const variant = venue.promoCards.variant ?? 'card';
        const cols = venue.promoCards.columns ?? (variant === 'overlay' ? 5 : 3);
        const colsClass =
          cols === 5
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
            : cols === 4
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              : cols === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
        return (
          <section id="our-aquatic-programs" className="py-16 bg-white scroll-mt-24">
            <div className="max-w-7xl mx-auto px-10">
              <h2
                className="font-heading text-primary text-center mb-4"
                style={{ fontSize: '26.56px', fontWeight: 300, fontStyle: 'italic' }}
              >
                {venue.promoCards.heading}
              </h2>
              {venue.promoCards.description && (
                <p
                  className="text-text-dark text-center mb-10 max-w-3xl mx-auto"
                  style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                >
                  {venue.promoCards.description}
                </p>
              )}
              <div className={`grid ${colsClass} gap-4`}>
                {venue.promoCards.cards.map((card, i) => {
                  if (variant === 'overlay') {
                    const inner = (
                      <div className="relative w-full overflow-hidden group" style={{ aspectRatio: '213 / 300' }}>
                        {card.image && (
                          <img
                            src={card.image}
                            alt={card.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        )}
                        {/* Dark gradient overlay so white text stays legible */}
                        <div
                          aria-hidden
                          className="absolute inset-0"
                          style={{
                            background:
                              'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)',
                          }}
                        />
                        <div
                          className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center px-2 pb-8"
                          style={{ gap: '10px' }}
                        >
                          <h3
                            className="text-white"
                            style={{
                              fontFamily: 'Lato, sans-serif',
                              fontSize: '24px',
                              fontWeight: 700,
                              lineHeight: '28px',
                              letterSpacing: '-0.48px',
                            }}
                          >
                            {card.title}
                          </h3>
                          {card.cta && (
                            <span
                              className="inline-flex items-center gap-1.5 text-white uppercase"
                              style={{
                                fontSize: '14.4px',
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                              }}
                            >
                              {card.cta.label}
                              <svg width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                <path
                                  d="M1 13L13 1M13 1H3M13 1V11"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                    const key = `${card.title}-${i}`;
                    return card.cta ? (
                      <Link
                        key={key}
                        to={card.cta.href}
                        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        aria-label={`${card.title} — ${card.cta.label}`}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div key={key}>{inner}</div>
                    );
                  }
                  // Default card variant
                  return (
                    <div key={i} className="bg-bg rounded-lg overflow-hidden shadow-sm">
                      {card.image && (
                        <div className="aspect-[16/9] overflow-hidden">
                          <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-6 flex flex-col gap-3">
                        {card.subtitle && (
                          <p
                            className="text-text-dark/60 uppercase"
                            style={{ fontSize: '13.6px', letterSpacing: '0.544px' }}
                          >
                            {card.subtitle}
                          </p>
                        )}
                        <h3
                          className="font-heading text-primary"
                          style={{ fontSize: '20.8px', fontWeight: 700, letterSpacing: '-0.416px' }}
                        >
                          {card.title}
                        </h3>
                        {card.cta && (
                          <Link
                            to={card.cta.href}
                            className="inline-flex items-center gap-2 text-primary uppercase hover:text-accent transition-colors"
                            style={{ fontSize: '13.6px', fontWeight: 700, letterSpacing: '0.544px' }}
                          >
                            {card.cta.label}
                            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                              <path
                                d="M1 13L13 1M13 1H3M13 1V11"
                                stroke="#DF4661"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── Meet the Team ── */}
      {venue.teamMembers && venue.teamMembers.length > 0 && (
        <section className="py-16 bg-bg">
          <div className="max-w-7xl mx-auto px-10">
            <h2
              className="font-heading text-primary text-center mb-10"
              style={{ fontSize: '26.56px', fontWeight: 300, fontStyle: 'italic' }}
            >
              {venue.teamHeading ?? 'Meet Our Team'}
            </h2>
            <div
              className={
                venue.teamLayout === 'card'
                  ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6'
                  : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8'
              }
            >
              {venue.teamMembers.map((m) => {
                const isCard = venue.teamLayout === 'card';
                const offX = m.imageOffsetX ?? 50;
                const offY = m.imageOffsetY ?? 50;
                const zoom = m.imageZoom ?? 1;
                const imgStyle = {
                  objectPosition: `${offX}% ${offY}%`,
                  ...(zoom !== 1
                    ? { transform: `scale(${zoom})`, transformOrigin: `${offX}% ${offY}%` }
                    : null),
                } as const;
                const avatar = m.image ? (
                  isCard ? (
                    <img
                      src={m.image}
                      alt={m.name}
                      className="w-full aspect-[5/7] object-cover bg-[#1a1a1a]"
                      style={imgStyle}
                    />
                  ) : (
                    // Wrap so transform: scale on the img stays clipped to the
                    // circle; img inside object-covers the box at offsetX/Y.
                    <div className="w-28 h-28 rounded-full overflow-hidden mb-3 bg-bg">
                      <img
                        src={m.image}
                        alt={m.name}
                        className="w-full h-full object-cover"
                        style={imgStyle}
                      />
                    </div>
                  )
                ) : null;
                if (isCard) {
                  return (
                    <div key={m.name} className="flex flex-col overflow-hidden">
                      {avatar}
                    </div>
                  );
                }
                const hasModal = !!m.bioImage;
                const hasLink = !hasModal && !!m.coachLink;
                const linkIsExternal = hasLink && /^https?:\/\//i.test(m.coachLink!);
                const nameBlock = (
                  <>
                    <p
                      className="font-heading text-primary"
                      style={{ fontSize: '20.8px', fontWeight: 700, letterSpacing: '-0.416px' }}
                    >
                      {m.name}
                    </p>
                    <p
                      className="text-text-dark/70 mt-1"
                      style={{ fontSize: '13.6px', lineHeight: '19px' }}
                    >
                      {m.role}
                    </p>
                  </>
                );
                // Avatar wrapper: button → bioImage modal, anchor → coachLink, plain otherwise.
                const wrapAvatar = (inner: ReactNode) => {
                  if (hasModal) {
                    return (
                      <button
                        type="button"
                        onClick={() => setBioModal({ image: m.bioImage!, name: m.name })}
                        className="appearance-none bg-transparent p-0 cursor-zoom-in transition-transform hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                        aria-label={`View bio for ${m.name}`}
                      >
                        {inner}
                      </button>
                    );
                  }
                  if (hasLink) {
                    return linkIsExternal ? (
                      <a
                        href={m.coachLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block transition-transform hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                        aria-label={`View bio for ${m.name}`}
                      >
                        {inner}
                      </a>
                    ) : (
                      <Link
                        to={m.coachLink!}
                        className="block transition-transform hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                        aria-label={`View bio for ${m.name}`}
                      >
                        {inner}
                      </Link>
                    );
                  }
                  return inner;
                };
                // No headshot: still allow opening via name (bio modal) or link.
                if (!avatar && (hasModal || hasLink)) {
                  return (
                    <div key={m.name} className="flex flex-col items-center text-center">
                      {hasModal ? (
                        <button
                          type="button"
                          onClick={() => setBioModal({ image: m.bioImage!, name: m.name })}
                          className="appearance-none bg-transparent p-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded transition-transform hover:scale-[1.02] hover:text-accent text-center"
                          aria-label={`View bio for ${m.name}`}
                        >
                          {nameBlock}
                        </button>
                      ) : linkIsExternal ? (
                        <a
                          href={m.coachLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer transition-colors hover:text-accent"
                          aria-label={`View bio for ${m.name}`}
                        >
                          {nameBlock}
                        </a>
                      ) : (
                        <Link
                          to={m.coachLink!}
                          className="cursor-pointer transition-colors hover:text-accent"
                          aria-label={`View bio for ${m.name}`}
                        >
                          {nameBlock}
                        </Link>
                      )}
                      {m.bio && (
                        <p
                          className="text-text-dark/80 mt-2"
                          style={{ fontSize: '14.4px', lineHeight: '20px' }}
                        >
                          {m.bio}
                        </p>
                      )}
                    </div>
                  );
                }
                return (
                  <div key={m.name} className="flex flex-col items-center text-center">
                    {avatar && wrapAvatar(avatar)}
                    {nameBlock}
                    {m.bio && (
                      <p
                        className="text-text-dark/80 mt-2"
                        style={{ fontSize: '14.4px', lineHeight: '20px' }}
                      >
                        {m.bio}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Bottom CTAs (e.g. duplicate Programs Price List link) ── */}
      {venue.bottomCtas && venue.bottomCtas.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-10 flex flex-wrap justify-center gap-3">
            {venue.bottomCtas.map((cta) => {
              const linkClass =
                'inline-flex items-center gap-2 bg-white rounded-full text-primary uppercase hover:shadow-md transition-shadow border border-primary/10';
              const linkStyle = {
                padding: '12px 16px 12px 24px',
                fontSize: '13.6px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                boxShadow: 'rgba(32, 99, 171, 0.07) 0px 20px 19px -12px',
              } as const;
              const inner = (
                <>
                  {cta.label}
                  <CtaIcon name="arrow" size={20} className="text-accent" />
                </>
              );
              return cta.isExternal ? (
                <a
                  key={cta.label}
                  href={cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                  style={linkStyle}
                >
                  {inner}
                </a>
              ) : (
                <Link key={cta.label} to={cta.href} className={linkClass} style={linkStyle}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 3-col Party Packages (kids-parties uses this) ── */}
      {venue.partyPackages && venue.partyPackages.items.length > 0 && (
        <KidsPartyPackages
          heading={venue.partyPackages.heading}
          subheading={venue.partyPackages.subheading}
          items={venue.partyPackages.items}
        />
      )}

      {/* ── Quotes / Testimonials ── */}
      {venue.quotes && venue.quotes.items.length > 0 && (
        <Testimonials heading={venue.quotes.heading} items={venue.quotes.items} />
      )}

      {/* ── Marquee Gallery ── */}
      {venue.gallery && venue.gallery.rows.length > 0 && (
        <MarqueeGallery heading={venue.gallery.heading} rows={venue.gallery.rows} />
      )}

      {/* ── FAQ ── */}
      {venue.faq && venue.faq.length > 0 && (
        <FaqAccordion
          heading="Frequently Asked Questions"
          items={venue.faq}
        />
      )}

      {/* ── CMS dynamiczone body (Phase A). Renders any blocks the entry
            has authored before the back link so the page flow reads
            top-to-bottom; falls through silently if no body. ── */}
      <BlockRenderer blocks={venue?.body} />

      {/* ── Back link ── */}
      <section className="py-10 bg-bg">
        <div className="max-w-7xl mx-auto px-10">
          <Link
            to={effectiveParentHref}
            className="inline-flex items-center gap-2.5 font-bold uppercase text-primary hover:text-accent transition-colors"
            style={{ fontSize: '14.4px', letterSpacing: '0.576px' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="#DF4661"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to {effectiveParentLabel}
          </Link>
        </div>
      </section>

      {/* ── Team member bio modal (click avatar in Meet Our Team) ── */}
      {bioModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${bioModal.name} bio`}
          onClick={() => setBioModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[90vw] max-h-[90vh] flex"
          >
            <img
              src={bioModal.image}
              alt={`${bioModal.name} bio`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-xl bg-white"
            />
            <button
              type="button"
              onClick={() => setBioModal(null)}
              aria-label="Close"
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white text-primary shadow-lg flex items-center justify-center hover:bg-primary hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
