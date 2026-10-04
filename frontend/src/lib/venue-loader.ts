import type { PageSeo } from './seo';
import type { VenueData, LocationContact, OperatingHoursSection } from './venue-types';
import { staticFallback, resolveMarquee } from './venue-data';
import { mapImagePanels } from './imagePanels';
const imgSrc = (img: unknown): string | undefined => typeof img === 'string' ? img : (img as { url?: string } | null | undefined)?.url;
export type CmsReader = <T>(endpoint: string, params?: Record<string, string>) => Promise<T | null>;

export const SECTION_MAP: Record<string, { apiPath: string; parentLabel: string; parentHref: string }> = {
  dining: { apiPath: '/restaurants', parentLabel: 'Dining & Retail', parentHref: '/dining' },
  fitness: { apiPath: '/fitness-facilities', parentLabel: 'Fitness & Wellness', parentHref: '/fitness' },
  kids: { apiPath: '/kids-experiences', parentLabel: 'Kids', parentHref: '/kids' },
  'event-spaces': { apiPath: '/event-spaces', parentLabel: 'Private Events & Catering', parentHref: '/event-spaces' },
  membership: { apiPath: '/facilities', parentLabel: 'Membership', parentHref: '/membership' },
  'home-sub': { apiPath: '/facilities', parentLabel: 'The American Club', parentHref: '/home' },
};



/** Membership subpages backed by SINGLE TYPES rather than a collection.
 *  These render through this page's standard layout (identical to prod), but
 *  fetch their singleton and map it over the static fallback — so copy, hero,
 *  tier-card images and bullets are CMS-editable without any visual change. */
const SINGLETON_OVERRIDES: Record<string, Record<string, string>> = {
  membership: {
    'niche-group-membership': '/niche-group-membership-page',
    // Route to the CMS singleton so its (correct) downloads render; without
    // this entry the page fell through to static subpages, whose form blob
    // hrefs 404 on prod.
    'start-application': '/start-application-page',
  },
};

interface MembershipSingleton {
  seo?: PageSeo | null;
  title?: string;
  heading?: string;
  description?: string;
  heroImage?: { url?: string; alternativeText?: string } | null;
  locationLevel?: string;
  phone?: string;
  email?: string;
  locationContact?: LocationContact | null;
  operatingHoursSections?: OperatingHoursSection[] | null;
  ctas?: { label: string; href: string; isExternal?: boolean }[];
  bottomCtas?: { label: string; href: string; isExternal?: boolean }[];
  downloads?: {
    heading?: string;
    items?: { label?: string; href?: string; isExternal?: boolean }[];
  } | null;
  body?: {
    __component?: string;
    heading?: string;
    subheading?: string;
    items?: {
      name?: string;
      description?: string;
      bulletStyle?: 'check' | 'dot' | 'dash' | 'none';
      image?: { url?: string } | null;
      /** One benefit per line; takes precedence over `bullets` when filled. */
      benefitsText?: string;
      bullets?: { text?: string }[];
    }[];
  }[];
}

/** Map a membership singleton onto VenueData, preserving the fallback's
 *  presentation-only values (tier gradients) by card name. */
function mapSingletonToVenue(s: MembershipSingleton, fallback: VenueData | null): VenueData {
  const grid = (s.body ?? []).find((b) => b.__component === 'blocks.priced-card-grid');
  const fbCards = fallback?.tierCards?.cards ?? [];
  const tierCards = grid
    ? {
        heading: grid.heading ?? fallback?.tierCards?.heading,
        subheading: grid.subheading ?? fallback?.tierCards?.subheading,
        cards: (grid.items ?? []).map((it) => {
          const fb = fbCards.find((c) => c.name === it.name);
          // benefitsText: one benefit per line (editor-friendly single field);
          // falls back to the legacy per-row bullets component.
          const bullets = it.benefitsText
            ? it.benefitsText.split('\n').map((s) => s.trim()).filter(Boolean)
            : (it.bullets ?? []).map((b) => b.text ?? '').filter(Boolean);
          return {
            name: it.name ?? '',
            description: it.description ?? fb?.description ?? '',
            benefits: bullets.length ? bullets : fb?.benefits ?? [],
            bulletStyle: it.bulletStyle ?? undefined,
            image: it.image?.url ?? undefined,
            gradientFrom: fb?.gradientFrom,
            gradientTo: fb?.gradientTo,
          };
        }),
      }
    : fallback?.tierCards;
  const base: VenueData =
    fallback ?? ({ name: '', slug: '', description: '' } as VenueData);
  return {
    ...base,
    seo: s.seo,
    name: s.heading ?? s.title ?? base.name,
    description: s.description ?? base.description,
    image: s.heroImage?.url ? { url: s.heroImage.url } : base.image,
    ctas: s.ctas?.length ? s.ctas : base.ctas,
    downloads: s.downloads?.items?.length
      ? {
          heading: s.downloads.heading,
          items: s.downloads.items
            .filter((i) => i.label && i.href)
            .map((i) => ({ label: i.label!, href: i.href!, isExternal: i.isExternal })),
        }
      : base.downloads,
    locationLevel: s.locationLevel ?? base.locationLevel,
    phone: s.phone ?? base.phone,
    email: s.email ?? base.email,
    // The static fallback may carry a hardcoded locationContact component that
    // would otherwise shadow CMS-edited flat contact fields at render time
    // (the Location & Contact box prefers the component). Prefer the CMS
    // component, then CMS flat fields, and only then the fallback's component.
    locationContact:
      s.locationContact &&
      (s.locationContact.locationLevel || s.locationContact.phone || s.locationContact.email)
        ? s.locationContact
        : s.locationLevel || s.phone || s.email
          ? { locationLevel: s.locationLevel, phone: s.phone, email: s.email }
          : base.locationContact,
    operatingHoursSections: s.operatingHoursSections?.length
      ? s.operatingHoursSections
      : base.operatingHoursSections,
    bottomCtas: s.bottomCtas?.length ? s.bottomCtas : base.bottomCtas,
    tierCards,
  };
}

export async function loadVenue(section: string, lookupSlug: string, read: CmsReader, requireEntry = false): Promise<VenueData | null> {
  const config = SECTION_MAP[section];
  if (!config) return null;


      // Singleton-backed subpages (e.g. /membership/niche-group-membership):
      // fetch the single type and map it over the static fallback so the CMS
      // drives content inside this page's unchanged layout.
      const singletonPath = SINGLETON_OVERRIDES[section]?.[lookupSlug];
      if (singletonPath) {
        // Deep-populate nested components — without this `downloads.items` (and
        // body cards) come back empty and the page silently falls back to the
        // static subpages data, whose blob hrefs 404 on prod.
        const s = await read<MembershipSingleton>(singletonPath, {
          'populate[heroImage]': 'true',
          'populate[ctas]': 'true',
          'populate[downloads][populate]': '*',
          'populate[body][populate]': '*',
        });
        const fb = staticFallback(section, lookupSlug);
        return s ? mapSingletonToVenue(s, fb) : (requireEntry ? null : fb);
      }
      // Strapi v5's `populate=*` only goes one level deep, which leaves
      // operatingHoursSections.rows empty. List each relation explicitly and
      // deep-populate the nested rows.
      const params: Record<string, string> = {
        'filters[slug][$eq]': lookupSlug,
        'populate[image]': 'true',
        'populate[ctas]': 'true',
        'populate[locationContact]': 'true',
        'populate[operatingHoursSections][populate]': '*',
        'populate[teamMembers][populate]': '*',
        'populate[downloads][populate]': '*',
        // promoCards (restaurants, e.g. The Gourmet Pantry) — grid + its image cards.
        'populate[promoCards][populate][cards][populate]': '*',
        // imagePanels (fitness, e.g. Tennis) — image/cta/bullets one level, plus the
        // nested operatingHours.rows (text-line) two levels down.
        'populate[imagePanels][populate][image]': 'true',
        'populate[imagePanels][populate][ctas]': 'true',
        'populate[imagePanels][populate][cta]': 'true',
        'populate[imagePanels][populate][bullets]': 'true',
        'populate[imagePanels][populate][operatingHours][populate]': '*',
        'populate[imagePanels][populate][extraSections]': 'true',
        // quotes / Member Testimonials (e.g. kids camps) — the component stores
        // items as { quote, author, role }; mapped to { text, attribution } below.
        'populate[quotes][populate]': '*',
        // marquee (e.g. kids experiences) — component holds repeatable `rows`,
        // each row holding multiple `images` (two levels deep). Without this the
        // marquee never loads and the page renders the hardcoded 2-row fallback.
        'populate[marquee][populate][rows][populate]': '*',
        'populate[bottomCtas]': 'true',
      };
      const items = await read<VenueData[]>(config.apiPath, params);
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
        // quotes: CMS quote-item uses { quote, author, role }; Testimonials reads
        // { text, attribution, role }. Map field names (fallback subpages already
        // uses text/attribution, so this no-ops on that shape).
        const rawQuotes = api.quotes as
          | { heading?: string; items?: { text?: string; quote?: string; attribution?: string; author?: string; role?: string }[] }
          | undefined;
        const apiQuotes = rawQuotes?.items?.length
          ? {
              heading: rawQuotes.heading,
              items: rawQuotes.items
                .map((q) => ({ text: q.text ?? q.quote ?? '', attribution: q.attribution ?? q.author, role: q.role }))
                .filter((q) => q.text),
            }
          : undefined;
        const apiPanels = mapImagePanels(api.imagePanels);
        // ── Team grid from the per-discipline coach collection ──
        // Fitness facilities have no `teamMembers` field; the team is sourced
        // from the dedicated coach collection (looked up by discipline = slug),
        // falling back to the static subpages team only if the collection is empty.
        const COACH_COLLECTIONS: Record<string, string> = {
          tennis: 'tennis-coaches',
          gym: 'gym-trainers',
          pilates: 'pilates-instructors',
          aquatics: 'aquatics-coaches',
        };
        let coachTeam: VenueData['teamMembers'] | undefined;
        const coachCollection = COACH_COLLECTIONS[lookupSlug];
        if (coachCollection) {
          try {
            const coaches = await read<
              Array<{
                name: string;
                role?: string;
                slug: string;
                shortBio?: string;
                photo?: unknown;
                bioImage?: unknown;
                imageOffsetX?: number;
                imageOffsetY?: number;
                imageZoom?: number;
              }>
            >(`/${coachCollection}`, {
              sort: 'order:asc',
              'populate[photo]': 'true',
              'populate[bioImage]': 'true',
            });
            coachTeam = coaches?.map((c) => ({
              name: c.name,
              role: c.role ?? '',
              bio: c.shortBio,
              image: imgSrc(c.photo),
              bioImage: imgSrc(c.bioImage),
              imageOffsetX: c.imageOffsetX ?? undefined,
              imageOffsetY: c.imageOffsetY ?? undefined,
              imageZoom: c.imageZoom ?? undefined,
              coachLink: `/coaches/${lookupSlug}/${c.slug}`,
            }));
          } catch {
            /* fall back to the static subpages team */
          }
        }
        // Enrich with static fallback for fields missing from CMS
        return {
          ...fallback,
          ...api,
          // Fitness facilities use `heroImage`/`heroVideo`; dining/others use
          // `image`/`video`. Prefer whichever the collection provides, then the
          // static fallback.
          image: api.heroImage ?? api.image ?? fallback?.image,
          video: api.video ?? (api.heroVideo ? { url: api.heroVideo } : undefined) ?? fallback?.video,
          // Null-guards for sparse CMS entries (e.g. event-spaces venues):
          // `...api` above would otherwise overwrite fallback values with null
          // and silently blank phone/hours/etc. that prod currently shows.
          name: api.name || fallback?.name || '',
          description: api.description || fallback?.description || '',
          capacity: api.capacity ?? fallback?.capacity,
          locationLevel: api.locationLevel ?? fallback?.locationLevel,
          phone: api.phone ?? fallback?.phone,
          email: api.email ?? fallback?.email,
          locationContact: api.locationContact ?? fallback?.locationContact,
          operatingHoursSections: api.operatingHoursSections?.length
            ? api.operatingHoursSections
            : fallback?.operatingHoursSections,
          ctas: api.ctas?.length ? api.ctas : fallback?.ctas,
          extraSections: api.extraSections?.length ? api.extraSections : fallback?.extraSections,
          promoCards: api.promoCards ?? fallback?.promoCards,
          teamMembers: coachTeam?.length ? coachTeam : apiTeam?.length ? apiTeam : fallback?.teamMembers,
          teamHeading: api.teamHeading ?? fallback?.teamHeading ?? (coachTeam?.length ? 'Meet Our Team' : undefined),
          bottomCtas: api.bottomCtas?.length ? api.bottomCtas : fallback?.bottomCtas,
          imagePanels: apiPanels?.length ? apiPanels : fallback?.imagePanels,
          cardSections: api.cardSections?.length ? api.cardSections : fallback?.cardSections,
          faq: api.faq?.length ? api.faq : fallback?.faq,
          gallery: resolveMarquee(api, fallback),
          partyPackages: api.partyPackages ?? fallback?.partyPackages,
          quotes: apiQuotes?.items?.length ? apiQuotes : fallback?.quotes,
          downloads: api.downloads ?? fallback?.downloads,
          tierCards: api.tierCards ?? fallback?.tierCards,
          venueCards: api.venueCards ?? fallback?.venueCards,
          packageCards: api.packageCards ?? fallback?.packageCards,
        };
      } else {
        return requireEntry ? null : fallback;
      }


}
