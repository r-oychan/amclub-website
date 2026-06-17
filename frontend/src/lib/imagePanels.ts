import type { ImageTextPanel } from '../components/detail/ImageTextPanels';
import type { CtaLink } from '../components/shared/CtaButton';

/**
 * Normalise the raw Strapi `shared.image-text-panel` response into the flat
 * shape the ImageTextPanels renderer expects:
 *  - `image` arrives as a media object ({ url }) → URL string
 *  - `bullets` / `operatingHours.rows` arrive as `shared.text-line` objects
 *    ({ text }) → string[]
 *  - the legacy single `cta` is folded into the multi-CTA `ctas` array
 * Shared by VenueDetailPage and the membership singletons (reciprocal clubs).
 */
const imgSrc = (img: unknown): string | undefined =>
  typeof img === 'string' ? img : (img as { url?: string } | null | undefined)?.url;

const toStrings = (arr: unknown): string[] | undefined =>
  Array.isArray(arr)
    ? arr
        .map((x) => (typeof x === 'string' ? x : (x as { text?: string } | null)?.text))
        .filter((x): x is string => !!x)
    : undefined;

interface RawPanel {
  image?: unknown;
  imageAlt?: string;
  imagePosition?: 'left' | 'right';
  slideWithText?: boolean;
  heading: string;
  ctas?: CtaLink[];
  cta?: CtaLink;
  subheading?: string;
  body?: string;
  bullets?: unknown;
  operatingHours?: unknown;
  extraSections?: ImageTextPanel['extraSections'];
  footnote?: string;
}

export function mapImagePanels(raw: unknown): ImageTextPanel[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return (raw as RawPanel[]).map((p) => ({
    ...p,
    image: imgSrc(p.image) as string,
    ctas: p.ctas?.length ? p.ctas : p.cta ? [p.cta] : undefined,
    bullets: toStrings(p.bullets),
    operatingHours: Array.isArray(p.operatingHours)
      ? p.operatingHours.map((h: { title: string; rows: unknown }) => ({
          title: h.title,
          rows: toStrings(h.rows) ?? [],
        }))
      : undefined,
  }));
}
