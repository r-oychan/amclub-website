import { useParams, Link } from 'react-router';
import { useEffect, useState } from 'react';
import { fetchAPI } from '../lib/api';
import { getSubpage } from '../data/subpages';
import { Button } from '../components/shared/Button';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';
import { DetailSection } from '../components/detail/DetailSection';
import { ContactRow } from '../components/detail/ContactRow';
import { PhotoGallery } from '../components/detail/PhotoGallery';
import { FaqAccordion } from '../components/blocks/FaqAccordion';

interface VenueData {
  id?: number;
  name: string;
  slug: string;
  description: string;
  detailedDescription?: unknown[];
  openingHours?: unknown[];
  locationLevel?: string;
  phone?: string;
  email?: string;
  hours?: string;
  image?: { url: string; alternativeText?: string };
  gallery?: { url: string; alternativeText?: string }[];
  cuisineType?: string;
  dressCode?: string;
  menuUrl?: string;
  category?: string;
  capacity?: string;
  ctas?: { label: string; href: string; isExternal?: boolean }[];
  extraSections?: {
    title: string;
    content: string;
    bullets?: string[];
  }[];
  promoCards?: {
    heading: string;
    description: string;
    cards: {
      title: string;
      subtitle: string;
      image: string;
      cta: { label: string; href: string };
    }[];
  };
  faq?: { question: string; answer: string }[];
}

const SECTION_MAP: Record<string, { apiPath: string; parentLabel: string; parentHref: string }> = {
  dining: { apiPath: '/restaurants', parentLabel: 'Dining & Retail', parentHref: '/dining' },
  fitness: { apiPath: '/facilities', parentLabel: 'Fitness & Wellness', parentHref: '/fitness' },
  kids: { apiPath: '/facilities', parentLabel: 'Kids', parentHref: '/kids' },
  'event-spaces': { apiPath: '/facilities', parentLabel: 'Private Events & Catering', parentHref: '/event-spaces' },
  membership: { apiPath: '/facilities', parentLabel: 'Membership', parentHref: '/membership' },
  'home-sub': { apiPath: '/facilities', parentLabel: 'The American Club', parentHref: '/home' },
};

function staticFallback(section: string, slug: string): VenueData | null {
  const sp = getSubpage(section, slug);
  if (!sp) return null;
  return {
    name: sp.name,
    slug: sp.slug,
    description: sp.description,
    cuisineType: sp.type,
    locationLevel: sp.level,
    phone: sp.phone,
    email: sp.email,
    hours: sp.hours,
    dressCode: sp.dressCode,
    capacity: sp.capacity,
    image: sp.image ? { url: sp.image } : undefined,
    gallery: sp.gallery?.map((url) => ({ url })),
    ctas: sp.ctas,
    extraSections: sp.extraSections,
    promoCards: sp.promoCards,
    faq: sp.faq,
  };
}

/* Map extra section titles to DetailSection icon names */
function resolveIcon(title: string): 'clock' | 'location' | 'reservation' | 'dresscode' | 'capacity' | 'menu' {
  const lower = title.toLowerCase();
  if (lower.includes('reserv') || lower.includes('book')) return 'reservation';
  if (lower.includes('menu') || lower.includes('food') || lower.includes('cuisine')) return 'menu';
  if (lower.includes('hour') || lower.includes('time')) return 'clock';
  if (lower.includes('location') || lower.includes('contact')) return 'location';
  if (lower.includes('dress') || lower.includes('attire')) return 'dresscode';
  if (lower.includes('capac') || lower.includes('seat')) return 'capacity';
  return 'reservation';
}

export default function VenueDetailPage({ section: sectionProp }: { section?: string }) {
  const { section: sectionParam, slug } = useParams<{ section: string; slug: string }>();
  const section = sectionProp ?? sectionParam;
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [loading, setLoading] = useState(true);

  const config = section ? SECTION_MAP[section] : undefined;

  useEffect(() => {
    if (!config || !slug || !section) return;
    const load = async () => {
      setLoading(true);
      const params: Record<string, string> = {
        'filters[slug][$eq]': slug,
        'populate': '*',
      };
      const items = await fetchAPI<VenueData[]>(config.apiPath, params);
      const fallback = staticFallback(section, slug);
      if (items && items.length > 0) {
        const api = items[0];
        // Enrich with static fallback for fields missing from CMS
        setVenue({
          ...fallback,
          ...api,
          image: api.image ?? fallback?.image,
          gallery: api.gallery?.length ? api.gallery : fallback?.gallery,
          ctas: api.ctas?.length ? api.ctas : fallback?.ctas,
          extraSections: api.extraSections?.length ? api.extraSections : fallback?.extraSections,
          promoCards: api.promoCards ?? fallback?.promoCards,
          faq: api.faq?.length ? api.faq : fallback?.faq,
        });
      } else {
        setVenue(fallback);
      }
      setLoading(false);
    };
    load();
  }, [config, slug, section]);

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

  const hasLocation = venue.locationLevel || venue.phone || venue.email;

  const galleryUrls = venue.gallery?.map((img) =>
    img.url.startsWith('http') ? img.url : `${img.url}`
  );

  return (
    <>
      {/* ── Hero Banner ── */}
      <DetailHeroBanner />

      {/* ── Breadcrumb ── */}
      <DetailBreadcrumb
        parentLabel={config.parentLabel}
        parentHref={config.parentHref}
        currentName={venue.name}
      />

      {/* ── Main Content: two-column ── */}
      <section className="bg-bg">
        <div className="max-w-7xl mx-auto px-10 pb-[120px]">
          <div className="flex flex-col lg:flex-row" style={{ gap: '60px' }}>
            {/* Left — Venue image (sticky) */}
            <div className="lg:w-[52%] shrink-0">
              <div className="lg:sticky lg:top-[120px]">
                {imageUrl ? (
                  <div className="overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={venue.image?.alternativeText ?? venue.name}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                ) : (
                  <div className="bg-primary/10 aspect-[4/3] flex items-center justify-center">
                    <span className="text-primary/20 font-heading text-4xl font-bold">{venue.name}</span>
                  </div>
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

              {/* Category badge — Lato 13.6px / 400 / uppercase */}
              {venue.cuisineType && (
                <p
                  className="text-text-dark uppercase"
                  style={{ fontSize: '13.6px', fontWeight: 400, letterSpacing: '0.544px' }}
                >
                  {venue.cuisineType}
                </p>
              )}

              {/* CTA buttons — white pill, shadow */}
              {venue.ctas && venue.ctas.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {venue.ctas.map((cta) => (
                    <Link
                      key={cta.label}
                      to={cta.href}
                      className="inline-flex items-center gap-2 bg-white rounded-full text-primary uppercase hover:shadow-md transition-shadow"
                      style={{
                        padding: '12px 16px 12px 24px',
                        fontSize: '13.6px',
                        fontWeight: 700,
                        letterSpacing: '0.544px',
                        boxShadow: 'rgba(32, 99, 171, 0.07) 0px 20px 19px -12px',
                      }}
                    >
                      {cta.label}
                      <svg width="24" height="24" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M1 13L13 1M13 1H3M13 1V11"
                          stroke="#DF4661"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  ))}
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

              {/* ── Opening Hours ── */}
              {venue.hours && (
                <DetailSection icon="clock" title="Opening Hours">
                  <div className="flex flex-row gap-8">
                    {venue.hours.split('\n').map((line, i) => (
                      <p
                        key={i}
                        className="text-text-dark"
                        style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </DetailSection>
              )}

              {/* ── Location & Contact ── */}
              {hasLocation && (
                <DetailSection icon="location" title="Location & Contact">
                  <div className="flex flex-col" style={{ gap: '16px' }}>
                    {venue.locationLevel && (
                      <ContactRow icon="pin" text={venue.locationLevel} />
                    )}
                    {venue.phone && (
                      <ContactRow icon="phone" text={venue.phone} href={`tel:${venue.phone}`} />
                    )}
                    {venue.email && (
                      <ContactRow icon="email" text={venue.email} href={`mailto:${venue.email}`} />
                    )}
                  </div>
                </DetailSection>
              )}

              {/* ── Extra Sections (Reservation, etc.) ── */}
              {venue.extraSections?.map((extra, i) => (
                <DetailSection key={i} icon={resolveIcon(extra.title)} title={extra.title}>
                  <div className="flex flex-col" style={{ gap: '16px' }}>
                    {extra.content.split('\n').map((line, j) => (
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
            </div>
          </div>
        </div>
      </section>

      {/* ── Promo Cards ── */}
      {venue.promoCards && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-10">
            <h2
              className="font-heading text-primary text-center mb-4"
              style={{ fontSize: '26.56px', fontWeight: 300, fontStyle: 'italic' }}
            >
              {venue.promoCards.heading}
            </h2>
            {venue.promoCards.description && (
              <p
                className="text-text-dark text-center mb-10"
                style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
              >
                {venue.promoCards.description}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venue.promoCards.cards.map((card, i) => (
                <div key={i} className="bg-bg rounded-lg overflow-hidden shadow-sm">
                  {card.image && (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-6 flex flex-col gap-3">
                    <p
                      className="text-text-dark/60 uppercase"
                      style={{ fontSize: '13.6px', letterSpacing: '0.544px' }}
                    >
                      {card.subtitle}
                    </p>
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
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Photo Gallery ── */}
      {galleryUrls && galleryUrls.length > 0 && (
        <PhotoGallery images={galleryUrls} />
      )}

      {/* ── FAQ ── */}
      {venue.faq && venue.faq.length > 0 && (
        <FaqAccordion
          heading="Frequently Asked Questions"
          items={venue.faq}
        />
      )}

      {/* ── Back link ── */}
      <section className="py-10 bg-bg">
        <div className="max-w-7xl mx-auto px-10">
          <Link
            to={config.parentHref}
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
            Back to {config.parentLabel}
          </Link>
        </div>
      </section>
    </>
  );
}
