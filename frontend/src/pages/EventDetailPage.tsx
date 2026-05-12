import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { fetchAPI, STRAPI_URL } from '../lib/api';
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
  slug: string;
  description?: string;
  longDescription?: string;
  date: string;
  time?: string;
  location?: string;
  dressCode?: string;
  reservation?: string;
  image?: StrapiMedia;
  category?: StrapiCategory | null;
  ctas?: StrapiLink[];
}

const STRIPE_PATTERN_SVG =
  'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22126%22 height=%22126%22%3E%3Cpath d=%22M126 0v21.584L21.584 126H0v-17.585L108.415 0H126Zm0 108.414V126h-17.586L126 108.414Zm0-84v39.171L63.585 126H24.414L126 24.414Zm0 42v39.17L105.584 126h-39.17L126 66.414ZM105.586 0 0 105.586V66.415L66.415 0h39.171Zm-42 0L0 63.586V24.415L24.415 0h39.171Zm-42 0L0 21.586V0h21.586Z%22 fill=%22rgb(136,136,136,0.2)%22 fill-rule=%22evenodd%22/%3E%3C/svg%3E")';

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

const paragraphs = (text?: string): string[] =>
  (text ?? '')
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
  const ctas = event.ctas ?? [];
  const descriptionParas = paragraphs(event.longDescription ?? event.description);

  return (
    <PageFade loaded={!loading}>
      <DetailHeroBanner imageUrl={imageUrl} />

      <DetailBreadcrumb
        parentLabel="What's On"
        parentHref="/whats-on"
        currentName={event.title}
      />

      <section className="bg-bg">
        <div className="max-w-7xl mx-auto px-10 pb-[120px]">
          <div className="flex flex-col lg:flex-row" style={{ gap: '60px' }}>
            {/* Left — Event image (sticky) */}
            <div className="lg:w-[52%] shrink-0">
              <div className="lg:sticky lg:top-[120px]">
                {imageUrl ? (
                  <div className="overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={event.image?.alternativeText ?? event.title}
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
                      {event.time}
                    </p>
                  )}
                </div>
              </DetailSection>

              {event.location && (
                <DetailSection icon="location" title="Location">
                  <p
                    className="text-text-dark"
                    style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                  >
                    {event.location}
                  </p>
                </DetailSection>
              )}

              {event.reservation && (
                <DetailSection icon="reservation" title="Reservation">
                  <p
                    className="text-text-dark"
                    style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
                  >
                    {event.reservation}
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
