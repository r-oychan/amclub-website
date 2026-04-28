import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';
import { PageFade } from '../components/shared/PageFade';

type StrapiMedia = { id: number; url: string; alternativeText?: string | null };

interface StrapiNewsArticle {
  documentId: string;
  title: string;
  slug: string;
  date?: string;
  excerpt?: string;
  category?: string;
  image?: StrapiMedia;
}

interface StrapiNewsPage {
  title: string;
  introHeading?: string;
  introBody?: string;
  heroImage?: StrapiMedia;
}

const mediaUrl = (m?: StrapiMedia | null): string | undefined => {
  if (!m?.url) return undefined;
  if (/^https?:/i.test(m.url)) return m.url;
  return `${STRAPI_URL}${m.url}`;
};

export default function NewsPage() {
  const [data, setData] = useState<StrapiNewsPage | null>(null);
  const [articles, setArticles] = useState<StrapiNewsArticle[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [page, list] = await Promise.all([
        fetchAPI<StrapiNewsPage>('/news-page'),
        fetchAPI<StrapiNewsArticle[]>('/news-articles', {
          'sort[0]': 'order:asc',
          'pagination[limit]': '50',
          'populate[image]': 'true',
        }),
      ]);
      if (cancelled) return;
      setData(page);
      setArticles(list ?? []);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loaded) return <PageFade loaded={false}>{null}</PageFade>;

  const visible = articles.slice(0, visibleCount);
  const canLoadMore = visibleCount < articles.length;

  return (
    <PageFade loaded={loaded}>
      <DetailHeroBanner imageUrl={mediaUrl(data?.heroImage)} />

      <DetailBreadcrumb parentLabel="The American Club" parentHref="/home" currentName="Club News" />

      <section className="bg-bg pb-[120px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl mb-12">
            <h1
              className="font-heading text-primary mb-4"
              style={{ fontSize: '38.4px', fontWeight: 300, fontStyle: 'italic', letterSpacing: '-1.152px', lineHeight: '42.24px' }}
            >
              {data?.introHeading ?? 'Club News'}
            </h1>
            {data?.introBody && (
              <p className="text-text-dark" style={{ fontSize: '19.2px', lineHeight: '26.88px' }}>{data.introBody}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visible.map((a) => (
              <Link
                key={a.slug}
                to={`/home-sub/club-news/${a.slug}`}
                className="group rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="aspect-[16/10] overflow-hidden bg-primary/5">
                  {a.image && <img src={mediaUrl(a.image)} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                </div>
                <div className="p-6 flex flex-col gap-3 flex-1">
                  <div className="flex items-center gap-3 text-xs">
                    {a.date && <span className="text-secondary font-bold uppercase tracking-wide">{a.date}</span>}
                    {a.category && <span className="text-primary/60 uppercase tracking-wide">{a.category}</span>}
                  </div>
                  <h3 className="font-heading text-primary" style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.4px', lineHeight: '26px' }}>
                    {a.title}
                  </h3>
                  {a.excerpt && <p className="text-text-dark/70 text-sm">{a.excerpt}</p>}
                  <span className="inline-flex items-center gap-1.5 text-primary uppercase group-hover:text-accent transition-colors mt-auto pt-2" style={{ fontSize: '12.8px', fontWeight: 700, letterSpacing: '0.512px' }}>
                    Read More
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 13L13 1M13 1H3M13 1V11" stroke="#DF4661" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {canLoadMore && (
            <div className="text-center mt-12">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 3)}
                className="inline-block px-6 py-3 rounded-full font-body font-bold text-sm tracking-wide bg-primary text-white hover:bg-primary-dark transition-all duration-200 cursor-pointer"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </section>
    </PageFade>
  );
}
