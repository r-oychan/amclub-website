import type { PageSeo } from './seo';
import type { VenueData, HelpContactIcon } from './venue-types';
import type { CtaLink } from '../components/shared/CtaButton';
import type { AnswerBlock } from '../components/blocks/FaqAnswerBlocks';
import type { CmsReader } from './venue-loader';

type Media = { url?: string; alternativeText?: string | null } | null | undefined;

interface TacConnectSingleton {
  seo?: PageSeo | null;
  title?: string | null;
  heading?: string | null;
  label?: string | null;
  parentLabel?: string | null;
  parentHref?: string | null;
  heroImage?: Media;
  description?: string | null;
  ctas?: CtaLink[] | null;
  appDownload?: {
    heading?: string | null;
    description?: string | null;
    links?: { platform: 'ios' | 'android'; label: string; url?: string | null }[] | null;
  } | null;
  helpContacts?: {
    heading?: string | null;
    items?: { icon?: HelpContactIcon | null; text: string; href?: string | null; action?: 'link' | 'open-chat' | null }[] | null;
  } | null;
  features?: {
    heading?: string | null;
    description?: string | null;
    variant?: 'card' | 'overlay' | null;
    columns?: number | null;
    cards?: { title: string; subtitle?: string | null; image?: Media; cta?: CtaLink | null }[] | null;
  } | null;
  steps?: {
    heading?: string | null;
    items?: { title: string; description?: string | null; icon?: Media; cta?: CtaLink | null }[] | null;
  } | null;
  faqHeading?: string | null;
  faqCategory?: { slug?: string | null } | null;
}

interface FaqItemApi {
  question: string;
  answer?: AnswerBlock[] | null;
}

const opt = <T,>(v: T | null | undefined): T | undefined => v ?? undefined;

/** Card links fall back to the page's FAQ anchor when an editor leaves href empty. */
const FALLBACK_CARD_HREF = '#faq';

/**
 * /membership/tac-connect — a single type rendered through VenueDetailPage.
 * FAQs are shared `faq-items` (so they also appear on /faq and in the chatbot
 * knowledge base), selected by the page's `faqCategory` relation.
 */
export async function loadTacConnect(read: CmsReader): Promise<VenueData | null> {
  const s = await read<TacConnectSingleton>('/tac-connect-page');
  if (!s) return null;
  const faqSlug = s.faqCategory?.slug;
  const faqItems = faqSlug
    ? await read<FaqItemApi[]>('/faq-items', {
        'filters[faqCategory][slug][$eq]': faqSlug,
        sort: 'order:asc',
        'pagination[pageSize]': '100',
      })
    : null;

  return {
    slug: 'tac-connect',
    seo: s.seo,
    name: s.heading || s.title || '',
    description: s.description ?? '',
    categoryLabel: opt(s.label),
    parentSection: opt(s.parentLabel),
    parentHref: opt(s.parentHref),
    image: s.heroImage?.url
      ? { url: s.heroImage.url, alternativeText: opt(s.heroImage.alternativeText) }
      : undefined,
    ctas: s.ctas ?? [],
    appDownload: s.appDownload
      ? {
          heading: opt(s.appDownload.heading),
          description: opt(s.appDownload.description),
          links: (s.appDownload.links ?? []).map((l) => ({ platform: l.platform, label: l.label, url: opt(l.url) })),
        }
      : undefined,
    helpContacts: s.helpContacts?.items?.length
      ? {
          heading: opt(s.helpContacts.heading),
          items: s.helpContacts.items.map((i) => ({
            icon: opt(i.icon),
            text: i.text,
            href: opt(i.href),
            action: opt(i.action),
          })),
        }
      : undefined,
    promoCards: s.features?.cards?.length
      ? {
          heading: s.features.heading ?? '',
          description: s.features.description ?? '',
          variant: opt(s.features.variant),
          columns: opt(s.features.columns),
          cards: s.features.cards.map((c) => ({
            title: c.title,
            subtitle: opt(c.subtitle),
            image: c.image?.url ?? '',
            cta: {
              label: c.cta?.label || 'Learn More',
              href: c.cta?.href || FALLBACK_CARD_HREF,
              isExternal: opt(c.cta?.isExternal),
            },
          })),
        }
      : undefined,
    steps: s.steps?.items?.length
      ? {
          heading: opt(s.steps.heading),
          items: s.steps.items.map((i) => ({
            title: i.title,
            description: opt(i.description),
            icon: opt(i.icon?.url),
            cta: i.cta?.href ? i.cta : undefined,
          })),
        }
      : undefined,
    faqHeading: opt(s.faqHeading),
    faq: (faqItems ?? []).map((f) => ({ question: f.question, answer: '', answerBlocks: f.answer ?? undefined })),
  };
}
