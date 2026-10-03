import { getSubpage } from '../data/subpages';
import type { VenueData } from '../pages/VenueDetailPage';

export function staticFallback(section: string, slug: string): VenueData | null {
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

export function resolveMarquee(api: VenueData, fallback: VenueData | null): VenueData['gallery'] {
  const m = api.marquee;
  if (m) {
    if (m.enabled === false) return undefined;
    const rows = (m.rows ?? [])
      .map((r) => ({
        direction: r.direction ?? undefined,
        durationSec: r.durationSec ?? undefined,
        images: (r.images ?? []).map((img) => img.url),
      }))
      .filter((r) => r.images.length > 0);
    return rows.length > 0 ? { heading: m.heading ?? undefined, rows } : undefined;
  }
  return fallback?.gallery;
}
