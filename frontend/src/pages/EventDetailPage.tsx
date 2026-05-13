import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { EVENT_PLACEHOLDER_IMAGE, normalizeAmPm } from '../lib/events';
import { PageFade } from '../components/shared/PageFade';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';
import { DetailSection } from '../components/detail/DetailSection';
import { CtaIcon, type CtaIconName } from '../components/shared/CtaIcon';
import { Button } from '../components/shared/Button';

type StrapiMedia = { id?: number; url: string; alternativeText?: string | null };
type StrapiCategory = { documentId: string; name: string; slug: string };
type StrapiLink = {
  label: string;
  href?: string;
  isExternal?: boolean;
  icon?: CtaIconName | null;
};

interface StrapiEvent {
  documentId: string;
  title: string;
  subtitle?: string;
  slug: string;
  description?: string;
  longDescription?: string;
  date: string;
  time?: string;
  location?: string;
  locationHref?: string;
  dressCode?: string;
  reservation?: string;
  image?: StrapiMedia;
  category?: StrapiCategory | null;
  ctas?: StrapiLink[];
}

const mediaUrl = (m?: StrapiMedia | null): string | undefined => {
  if (!m?.url) return undefined;
  if (/^https?:/i.test(m.url)) return m.url;
  return `${STRAPI_URL}${m.url}`;
};

const formatEventDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatMonth = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
};

const formatDay = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return String(d.getDate());
};

const paragraphs = (text?: string): string[] =>
  normalizeAmPm(text)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<StrapiEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const items = await fetchAPI<StrapiEvent[]>('/events', {
        'filters[slug][$eq]': slug,
        'populate[image]': 'true',
        'populate[category]': 'true',
        'populate[ctas]': 'true',
      });
      if (cancelled) return;
      setEvent(items && items.length > 0 ? items[0] : null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-primary/40 text-lg">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-primary/60 text-lg">Event not found.</p>
        <Button label="Back to What's On" href="/whats-on" variant="secondary" />
      </div>
    );
  }

  const imageUrl = mediaUrl(event.image);
  const heroImage = imageUrl ?? EVENT_PLACEHOLDER_IMAGE;
  const ctas = event.ctas ?? [];
  const descriptionParas = paragraphs(event.longDescription ?? event.description);

  return (
    <PageFade loaded={!loading}>
      <DetailHeroBanner imageUrl={heroImage} />

      <DetailBreadcrumb
        parentLabel="What's On"
        parentHref="/whats-on"
        currentName={event.title}
      />

      <section className="bg-bg">
        <div className="max-w-7xl mx-auto px-10 pb-[120px]">
          <div className="flex flex-col lg:flex-row" style={{ gap: '60px' }}>
            {/* Left — Event image (sticky) with date-box overlay */}
            <div className="lg:w-[52%] shrink-0">
              <div className="lg:sticky lg:top-[120px]">
                <div className="relative">
                  <div className="overflow-hidden bg-primary">
                    <img
                      src={heroImage}
                      alt={event.image?.alternativeText ?? event.title}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  {formatMonth(event.date) && formatDay(event.date) && (
                    <div className="absolute right-[24px] -bottom-[48px] bg-white px-3 py-3 flex flex-col items-center w-[88px] z-10 shadow-md">
                      <span className="font-body text-[15px] font-normal uppercase text-primary tracking-[0.04em] leading-none">
                        {formatMonth(event.date)}
                      </span>
                      <span className="block h-px w-[42px] bg-accent my-2" />
                      <span className="font-heading italic text-[36px] font-light text-primary leading-none">
                        {formatDay(event.date)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right — Details */}
            <div className="flex flex-col" style={{ gap: '32px' }}>
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
                {event.title}
              </h1>

              {event.subtitle && (
                <p
                  className="text-text-dark/80"
                  style={{
                    fontSize: '20.8px',
                    fontWeight: 400,
                    lineHeight: '29.12px',
                    marginTop: '-12px',
                  }}
                >
                  {event.subtitle}
                </p>
              )}

              {event.category?.name && (
                <span
                  className="self-start bg-primary text-white uppercase rounded-full"
                  style={{
                    fontSize: '11px',
                    fontWeight: 400,
                    letterSpacing: '0.04em',
                    padding: '6px 14px',
                  }}
                >
                  {event.category.name}
                </span>
              )}

              {ctas.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {ctas.slice(0, 3).map((cta) => {
                    const href = cta.href ?? '#';
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
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                        style={linkStyle}
                      >
                        {inner}
                      </a>
                    ) : (
                      <Link key={cta.label} to={href} className={linkClass} style={linkStyle}>
                        {inner}
                      </Link>
                    );
                  })}
                </div>
              )}

              {descriptionParas.length > 0 && (
                <div className="flex flex-col" style={{ gap: '20px' }}>
                  {descriptionParas.map((p, i) => (
                    <p
                      key={i}
                      className="text-text-dark"
                      style={{ fontSize: '19.2px', fontWeight: 400, lineHeight: '26.88px' }}
                    >
                      {p}
                    </p>
                  ))}
                </div>
              )}

              <DetailSection icon="clock" title="Date & Time">
                <div className="flex flex-col" style={{ gap: '6px' }}>
                  <p
                    className="text-text-dark"
                    style={{ fontSize: '17.6px', fontWeight: 700, lineHeight: '24.64px' }}
                  >
                    {formatEventDate(event.date)}
                  </p>
                  {event.time && (
                    <p
                      className="text-text-dark"
                      style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                    >
                      {normalizeAmPm(event.time)}
                    </p>
                  )}
                </div>
              </DetailSection>

              {event.location && (
                <DetailSection icon="location" title="Location">
                  {event.locationHref ? (
                    /^https?:/i.test(event.locationHref) ? (
                      <a
                        href={event.locationHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline decoration-accent hover:text-accent transition-colors"
                        style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                      >
                        {event.location}
                      </a>
                    ) : (
                      <Link
                        to={event.locationHref}
                        className="text-primary underline decoration-accent hover:text-accent transition-colors"
                        style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                      >
                        {event.location}
                      </Link>
                    )
                  ) : (
                    <p
                      className="text-text-dark"
                      style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                    >
                      {event.location}
                    </p>
                  )}
                </DetailSection>
              )}

              {event.reservation && (
                <DetailSection icon="reservation" title="Reservation">
                  <p
                    className="text-text-dark"
                    style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                  >
                    {normalizeAmPm(event.reservation)}
                  </p>
                </DetailSection>
              )}

              {event.dressCode && (
                <DetailSection icon="dresscode" title="Dress Code">
                  <p
                    className="text-text-dark"
                    style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                  >
                    {event.dressCode}
                  </p>
                </DetailSection>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 bg-bg">
        <div className="max-w-7xl mx-auto px-10">
          <Link
            to="/whats-on"
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
            Back to What's On
          </Link>
        </div>
      </section>
    </PageFade>
  );
}
