import { useEffect, useState } from 'react';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';
import { PageFade } from '../components/shared/PageFade';
import { FaqAccordion } from '../components/blocks/FaqAccordion';
import { FaqAnswerBlocks, type AnswerBlock } from '../components/blocks/FaqAnswerBlocks';

type StrapiMedia = { id: number; url: string; alternativeText?: string | null };

interface StrapiFaqPage {
  title: string;
  introHeading?: string;
  introBody?: string;
  heroImage?: StrapiMedia;
}

interface StrapiFaqCategory {
  documentId: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder?: number;
}

interface StrapiFaqItem {
  documentId: string;
  question: string;
  slug: string;
  answer?: AnswerBlock[] | null;
  category?: string | null;
  order?: number;
  faqCategory?: { documentId: string; slug: string; name: string } | null;
}

const mediaUrl = (m?: StrapiMedia | null): string | undefined => {
  if (!m?.url) return undefined;
  if (/^https?:/i.test(m.url)) return m.url;
  return `${STRAPI_URL}${m.url}`;
};

const UNCATEGORIZED_KEY = '__uncategorized__';
const UNCATEGORIZED_NAME = 'General';

const enumNameMap: Record<string, string> = {
  membership: 'Membership',
  facilities: 'Facilities',
  dining: 'Dining',
  events: 'Events',
  general: 'General',
};

export default function FaqPage() {
  const [page, setPage] = useState<StrapiFaqPage | null>(null);
  const [categories, setCategories] = useState<StrapiFaqCategory[]>([]);
  const [items, setItems] = useState<StrapiFaqItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [pg, cats, list] = await Promise.all([
        fetchAPI<StrapiFaqPage>('/faq-page', {
          'populate[heroImage]': 'true',
        }),
        fetchAPI<StrapiFaqCategory[]>('/faq-categories', {
          'sort[0]': 'displayOrder:asc',
          'pagination[limit]': '50',
        }),
        fetchAPI<StrapiFaqItem[]>('/faq-items', {
          'sort[0]': 'order:asc',
          'pagination[limit]': '200',
          'populate[faqCategory]': 'true',
        }),
      ]);
      if (cancelled) return;
      setPage(pg);
      setCategories(cats ?? []);
      setItems(list ?? []);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loaded) return <PageFade loaded={false}>{null}</PageFade>;

  type Group = { key: string; name: string; description?: string; items: StrapiFaqItem[] };
  const groupMap = new Map<string, Group>();

  categories.forEach((c) => {
    groupMap.set(c.slug, { key: c.slug, name: c.name, description: c.description, items: [] });
  });

  items.forEach((it) => {
    const rel = it.faqCategory;
    let key = rel?.slug;
    let name = rel?.name;
    if (!key && it.category) {
      key = it.category;
      name = enumNameMap[it.category] ?? it.category;
    }
    if (!key) {
      key = UNCATEGORIZED_KEY;
      name = UNCATEGORIZED_NAME;
    }
    if (!groupMap.has(key)) {
      groupMap.set(key, { key, name: name ?? key, items: [] });
    }
    groupMap.get(key)!.items.push(it);
  });

  const groups = Array.from(groupMap.values()).filter((g) => g.items.length > 0);

  return (
    <PageFade loaded={loaded}>
      <DetailHeroBanner imageUrl={mediaUrl(page?.heroImage)} />
      <DetailBreadcrumb parentLabel="The American Club" parentHref="/home" currentName="FAQ" />

      <section className="bg-bg pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl">
            <h1
              className="font-heading text-primary mb-4"
              style={{
                fontSize: '38.4px',
                fontWeight: 300,
                fontStyle: 'italic',
                letterSpacing: '-1.152px',
                lineHeight: '42.24px',
              }}
            >
              {page?.introHeading ?? page?.title ?? 'Frequently Asked Questions'}
            </h1>
            {page?.introBody && (
              <p className="text-text-dark" style={{ fontSize: '19.2px', lineHeight: '26.88px' }}>
                {page.introBody}
              </p>
            )}
          </div>
        </div>
      </section>

      {groups.length === 0 ? (
        <section className="bg-bg pb-[120px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <p className="text-text-dark/70">No FAQs available yet. Please check back soon.</p>
          </div>
        </section>
      ) : (
        groups.map((g) => (
          <FaqAccordion
            key={g.key}
            heading={g.name}
            subheading={g.description}
            items={g.items.map((it) => ({
              question: it.question,
              answer: it.answer && it.answer.length > 0
                ? <FaqAnswerBlocks blocks={it.answer} />
                : '',
            }))}
          />
        ))
      )}
    </PageFade>
  );
}
