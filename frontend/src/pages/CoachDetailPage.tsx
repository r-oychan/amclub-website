import { useParams } from 'react-router';
import { useEffect, useState } from 'react';
import { fetchAPI } from '../lib/api';
import { getCoach, type CoachData } from '../data/coaches';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';
import { Button } from '../components/shared/Button';

/** Map a section slug back to a parent label/href for the breadcrumb. */
const SECTION_PARENTS: Record<string, { label: string; href: string; venue: string }> = {
  aquatics: { label: 'Aquatics', href: '/fitness/aquatics', venue: 'Aquatics' },
  tennis: { label: 'Tennis', href: '/fitness/tennis', venue: 'Tennis' },
  squash: { label: 'Squash', href: '/fitness/squash', venue: 'Squash' },
  gym: { label: 'Gym', href: '/fitness/gym', venue: 'Gym' },
  pilates: { label: 'Pilates', href: '/fitness/pilates', venue: 'Pilates' },
  kids: { label: 'Kids', href: '/kids', venue: 'Kids' },
  other: { label: 'Fitness & Wellness', href: '/fitness', venue: 'Fitness' },
};

interface CoachApi {
  name: string;
  slug: string;
  role: string;
  section: CoachData['section'];
  bio?: string;
  /** Strapi stores list as newline-separated text. */
  expertise?: string | string[];
  qualifications?: string | string[];
  photo?: { url: string; alternativeText?: string } | string;
}

function toLines(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value.split('\n').map((l) => l.trim()).filter(Boolean);
}

function photoUrl(p: CoachApi['photo']): string | undefined {
  if (!p) return undefined;
  if (typeof p === 'string') return p;
  return p.url;
}

export default function CoachDetailPage() {
  const { section: sectionParam, slug: slugParam } = useParams<{ section: string; slug: string }>();
  const section = sectionParam ?? 'aquatics';
  const slug = slugParam ?? '';
  const [coach, setCoach] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const fallback = getCoach(section, slug);
      const params = {
        'filters[slug][$eq]': slug,
        'filters[section][$eq]': section,
        'populate[photo]': 'true',
      };
      try {
        const items = await fetchAPI<CoachApi[]>('/coaches', params);
        if (cancelled) return;
        if (items && items.length > 0) {
          const api = items[0];
          setCoach({
            slug: api.slug,
            shortName: fallback?.shortName ?? api.name.split(' ')[0],
            name: api.name,
            role: api.role,
            section: api.section,
            photo: photoUrl(api.photo) ?? fallback?.photo,
            bio: api.bio ?? fallback?.bio ?? '',
            expertise: toLines(api.expertise).length
              ? toLines(api.expertise)
              : fallback?.expertise,
            qualifications: toLines(api.qualifications).length
              ? toLines(api.qualifications)
              : fallback?.qualifications,
          });
        } else if (fallback) {
          setCoach(fallback);
        } else {
          setCoach(null);
        }
      } catch {
        if (!cancelled) setCoach(fallback ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [section, slug]);

  const parent = SECTION_PARENTS[section] ?? SECTION_PARENTS.other;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-primary/40 text-lg">Loading...</div>
      </div>
    );
  }

  if (!coach) {
    return (
      <>
        <DetailHeroBanner />
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 px-10 text-center">
          <p className="text-primary/60 text-lg">Coach not found.</p>
          <Button label={`Back to ${parent.venue}`} href={parent.href} variant="secondary" />
        </div>
      </>
    );
  }

  return (
    <>
      <DetailHeroBanner />
      <DetailBreadcrumb
        parentLabel={parent.venue}
        parentHref={parent.href}
        currentName={coach.name}
      />

      <section className="bg-bg">
        <div className="max-w-7xl mx-auto px-10 pb-[120px]">
          <div className="flex flex-col lg:flex-row" style={{ gap: '60px' }}>
            {/* Photo (sticky on desktop) */}
            <div className="lg:w-[42%] shrink-0">
              <div className="lg:sticky lg:top-[120px]">
                {coach.photo ? (
                  <div className="overflow-hidden rounded-md">
                    <img
                      src={coach.photo}
                      alt={coach.name}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[3/4] w-full bg-white/40" aria-hidden />
                )}
              </div>
            </div>

            {/* Bio / expertise / qualifications */}
            <div className="flex flex-col flex-1" style={{ gap: '32px' }}>
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
                {coach.name}
              </h1>
              <p
                className="text-primary uppercase"
                style={{ fontSize: '13.6px', fontWeight: 700, letterSpacing: '0.04em' }}
              >
                {coach.role}
              </p>

              {coach.bio && (
                <div className="flex flex-col" style={{ gap: '20px' }}>
                  {coach.bio.split('\n\n').map((p, i) => (
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

              {coach.expertise && coach.expertise.length > 0 && (
                <div className="flex flex-col" style={{ gap: '12px' }}>
                  <h2
                    className="font-heading text-primary uppercase"
                    style={{ fontSize: '17.6px', fontWeight: 700, letterSpacing: '0.04em' }}
                  >
                    Areas of Expertise
                  </h2>
                  <ul className="list-disc pl-6 flex flex-col" style={{ gap: '6px' }}>
                    {coach.expertise.map((item, i) => (
                      <li
                        key={i}
                        className="text-text-dark"
                        style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {coach.qualifications && coach.qualifications.length > 0 && (
                <div className="flex flex-col" style={{ gap: '12px' }}>
                  <h2
                    className="font-heading text-primary uppercase"
                    style={{ fontSize: '17.6px', fontWeight: 700, letterSpacing: '0.04em' }}
                  >
                    Accolades &amp; Qualifications
                  </h2>
                  <ul className="list-disc pl-6 flex flex-col" style={{ gap: '6px' }}>
                    {coach.qualifications.map((item, i) => (
                      <li
                        key={i}
                        className="text-text-dark"
                        style={{ fontSize: '17.6px', lineHeight: '26.4px' }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 bg-bg">
        <div className="max-w-7xl mx-auto px-10">
          <Button label={`Back to ${parent.venue}`} href={parent.href} variant="secondary" />
        </div>
      </section>
    </>
  );
}
