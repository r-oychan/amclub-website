import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
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
  htmlBody?: { html?: string } | null;
}

const mediaUrl = (m?: StrapiMedia | null): string | undefined => {
  if (!m?.url) return undefined;
  if (/^https?:/i.test(m.url)) return m.url;
  return `${STRAPI_URL}${m.url}`;
};

export default function NewsArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<StrapiNewsArticle | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      const list = await fetchAPI<StrapiNewsArticle[]>('/news-articles', {
        'filters[slug][$eq]': slug,
        'populate[image]': 'true',
        'populate[htmlBody]': 'true',
        'pagination[limit]': '1',
      });
      if (cancelled) return;
      setArticle(list?.[0] ?? null);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (!loaded) return <PageFade loaded={false}>{null}</PageFade>;

  if (!article) {
    return (
      <PageFade loaded={true}>
        <DetailHeroBanner />
        <DetailBreadcrumb parentLabel="Club News" parentHref="/home-sub/news" currentName="Not Found" />
        <section className="bg-bg pb-[120px]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
            <h1 className="font-heading text-primary mb-4" style={{ fontSize: '32px', fontWeight: 300, fontStyle: 'italic' }}>
              Article not found
            </h1>
            <Link to="/home-sub/news" className="text-accent underline">Back to Club News</Link>
          </div>
        </section>
      </PageFade>
    );
  }

  const html = article.htmlBody?.html ?? '';

  return (
    <PageFade loaded={loaded}>
      <DetailHeroBanner imageUrl={mediaUrl(article.image)} />

      <DetailBreadcrumb parentLabel="Club News" parentHref="/home-sub/news" currentName={article.title} />

      <article className="bg-bg pb-[120px]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10">
          <header className="mb-10">
            <div className="flex items-center gap-3 text-xs mb-4">
              {article.date && <span className="text-secondary font-bold uppercase tracking-wide">{article.date}</span>}
              {article.category && <span className="text-primary/60 uppercase tracking-wide">{article.category}</span>}
            </div>
            <h1
              className="font-heading text-primary"
              style={{ fontSize: '38.4px', fontWeight: 300, fontStyle: 'italic', letterSpacing: '-1.152px', lineHeight: '42.24px' }}
            >
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="text-text-dark mt-4" style={{ fontSize: '19.2px', lineHeight: '26.88px' }}>
                {article.excerpt}
              </p>
            )}
          </header>

          {html ? (
            <div
              className="article-html"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="text-text-dark/70">No content yet.</p>
          )}
        </div>
      </article>
    </PageFade>
  );
}
