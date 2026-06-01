import type { DetailBlock, StrapiMedia } from '../../lib/blocks';
import { toCta, toCtas } from '../../lib/blocks';
import { ImagePanelSlideshow } from './ImagePanelSlideshow';
import { CtaBanner } from './CtaBanner';
import { TextBlock } from './TextBlock';
import { CardGrid } from './CardGrid';
import { FeatureGrid } from './FeatureGrid';
import { ThreeColGrid } from './ThreeColGrid';
import { CollageGallery } from './CollageGallery';
import { FaqAccordion } from './FaqAccordion';
import { KidsPartyPackages } from '../kids/KidsPartyPackages';
import { DownloadsSection } from './DownloadsSection';
import { PricedCardGrid } from './PricedCardGrid';
import { QuotesBlock } from './QuotesBlock';
import { ContactRow } from '../detail/ContactRow';

function imgUrl(m?: StrapiMedia): string | undefined {
  return m?.url || undefined;
}

/**
 * Dispatch a single Strapi dynamiczone block to the matching React block
 * component. Adapter logic lives here so each component keeps its existing
 * (non-Strapi) prop shape and stays usable from non-CMS-driven pages.
 *
 * Blocks with no obvious adapter (`blocks.team-grid` requires a separate
 * committee-members fetch; `blocks.operating-hours-section` is rendered
 * inline in detail pages) return null so the page can render them via its
 * own pre-existing mechanism.
 */
export function BlockRenderer({ blocks }: { blocks?: DetailBlock[] }) {
  if (!blocks?.length) return null;
  return (
    <>
      {blocks.map((block, idx) => (
        <RenderBlock key={`${block.__component}-${idx}`} block={block} />
      ))}
    </>
  );
}

function RenderBlock({ block }: { block: DetailBlock }) {
  switch (block.__component) {
    case 'blocks.text-block':
      return (
        <TextBlock
          label={block.label}
          heading={block.heading}
          body={block.body}
          ctas={toCtas(block.ctas)}
          image={imgUrl(block.image)}
          imagePosition={block.imagePosition}
        />
      );

    case 'blocks.card-grid':
      return (
        <CardGrid
          label={block.label}
          heading={block.heading}
          subheading={block.subheading}
          items={
            (block.cards ?? []).map((c) => ({
              name: c.heading,
              description: c.description,
              image: imgUrl(c.image),
              cta: toCta(c.cta),
            })) as never
          }
          cta={toCta(block.cta)}
          dark={block.dark}
        />
      );

    case 'blocks.feature-grid':
      return (
        <FeatureGrid
          label={block.label}
          heading={block.heading}
          subheading={block.subheading}
          body={block.body}
          items={
            (block.features ?? []).map((f) => ({
              heading: f.heading ?? '',
              description: f.description ?? '',
              image: imgUrl(f.image),
              icon: imgUrl(f.icon),
              cta: toCta(f.cta),
            })) as never
          }
          listItems={block.listItems}
          cta={toCta(block.cta)}
          asideImage={imgUrl(block.asideImage)}
          asideImagePosition={block.asideImagePosition}
          dark={block.dark}
          centered={block.centered}
        />
      );

    case 'blocks.three-col-grid':
      return (
        <ThreeColGrid
          heading={block.heading}
          subheading={block.subheading}
          columns={block.columns === '2' ? 2 : 3}
          variant={block.variant}
          items={(block.items ?? []).map((i) => {
            const cta = toCta(i.cta);
            return {
              heading: i.heading ?? '',
              description: i.description ?? '',
              image: imgUrl(i.image) ?? '',
              imageAlt: i.imageAlt ?? '',
              cta: { label: cta?.label ?? '', href: cta?.href ?? '' },
              accentColor: i.accentColor,
            };
          })}
        />
      );

    case 'blocks.cta-banner':
      return (
        <CtaBanner
          heading={block.heading}
          body={block.body}
          ctas={toCtas(block.ctas)}
          variant={block.variant === 'default' ? 'dark' : block.variant}
        />
      );

    case 'blocks.faq-section':
      return (
        <FaqAccordion
          label={block.label}
          heading={block.heading ?? ''}
          items={(block.items ?? []).map((i) => ({
            question: i.question ?? '',
            answer: i.answer ?? '',
          }))}
          ctas={toCtas(block.ctas)}
          dark={block.dark}
        />
      );

    case 'blocks.downloads-section':
      return <DownloadsSection heading={block.heading} items={block.items} />;

    case 'blocks.party-packages':
      return (
        <KidsPartyPackages
          heading={block.heading}
          subheading={block.subheading}
          items={(block.items ?? [])
            .filter((i) => i.name && i.image?.url)
            .map((i) => {
              const cta = toCta(i.cta);
              return {
                name: i.name!,
                image: i.image!.url!,
                imageAlt: i.imageAlt,
                cta: cta && cta.href ? { label: cta.label, href: cta.href, isExternal: cta.isExternal } : undefined,
              };
            })}
        />
      );

    case 'blocks.image-panel-slideshow':
      return (
        <ImagePanelSlideshow
          slides={(block.slides ?? [])
            .filter((s) => s.image?.url)
            .map((s) => ({
              src: s.image!.url!,
              alt: s.image!.alternativeText,
              caption: s.caption,
              subCaption: s.subCaption,
            }))}
        />
      );

    case 'blocks.priced-card-grid':
      return <PricedCardGrid {...block} />;

    case 'blocks.quotes-block':
      return <QuotesBlock heading={block.heading} items={block.items} />;

    case 'blocks.collage-gallery':
      return (
        <CollageGallery
          label={block.label}
          heading={block.heading}
          images={(block.images ?? [])
            .filter((m) => m.url)
            .map((m) => ({ src: m.url!, alt: m.alternativeText ?? '' }))}
        />
      );

    case 'blocks.location-contact':
      return (
        <section className="bg-bg py-10 md:py-14">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:gap-10 gap-4">
            {block.locationLevel && <ContactRow icon="pin" text={block.locationLevel} />}
            {block.phone && (
              <ContactRow icon="phone" text={block.phone} href={`tel:${block.phone.replace(/\s+/g, '')}`} />
            )}
            {block.email && (
              <ContactRow icon="email" text={block.email} href={`mailto:${block.email}`} />
            )}
          </div>
        </section>
      );

    // Blocks not handled by the generic renderer — page-level code is
    // responsible (e.g. `blocks.operating-hours-section` is rendered
    // inside the venue header, `blocks.tabs-section` needs page-specific
    // collage images, `blocks.team-grid` queries committee-members
    // separately).
    case 'blocks.operating-hours-section':
    case 'blocks.tabs-section':
    case 'blocks.team-grid':
      return null;

    default:
      return null;
  }
}
