import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';

type StrapiMedia = { id: number; url: string; alternativeText?: string | null };

interface StrapiGalleryAlbum {
  documentId: string;
  title: string;
  slug: string;
  date?: string;
  photoCount?: number;
  coverImage?: StrapiMedia;
}

interface StrapiGalleryPage {
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

export default function GalleryPage() {
  const [data, setData] = useState<StrapiGalleryPage | null>(null);
  const [albums, setAlbums] = useState<StrapiGalleryAlbum[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [page, list] = await Promise.all([
        fetchAPI<StrapiGalleryPage>('/gallery-page'),
        fetchAPI<StrapiGalleryAlbum[]>('/gallery-albums', {
          'sort[0]': 'order:asc',
          'pagination[limit]': '50',
          'populate[coverImage]': 'true',
        }),
      ]);
      if (cancelled) return;
      setData(page);
      setAlbums(list ?? []);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loaded) return <div className="min-h-screen flex items-center justify-center text-text-dark/50">Loading…</div>;

  const visible = albums.slice(0, visibleCount);
  const canLoadMore = visibleCount < albums.length;

  return (
    <>
      <DetailHeroBanner imageUrl={mediaUrl(data?.heroImage)} />

      <DetailBreadcrumb parentLabel="The American Club" parentHref="/home" currentName="Gallery" />

      <section className="bg-bg pb-[120px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl mb-12">
            <h1
              className="font-heading text-primary mb-4"
              style={{ fontSize: '38.4px', fontWeight: 300, fontStyle: 'italic', letterSpacing: '-1.152px', lineHeight: '42.24px' }}
            >
              {data?.introHeading ?? 'Gallery'}
            </h1>
            {data?.introBody && (
              <p className="text-text-dark" style={{ fontSize: '19.2px', lineHeight: '26.88px' }}>
                {data.introBody}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visible.map((album) => (
              <Link
                key={album.slug}
                to={`/home-sub/gallery/${album.slug}`}
                className="group rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-primary/5">
                  {album.coverImage && (
                    <img src={mediaUrl(album.coverImage)} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                </div>
                <div className="p-5 flex flex-col gap-2 flex-1">
                  {album.date && (
                    <span className="text-xs text-secondary font-bold uppercase tracking-wide">
                      {album.date}{album.photoCount ? ` · ${album.photoCount} photos` : ''}
                    </span>
                  )}
                  <h3 className="font-heading text-primary" style={{ fontSize: '17.6px', fontWeight: 700, letterSpacing: '-0.352px', lineHeight: '22.4px' }}>
                    {album.title}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 text-primary uppercase group-hover:text-accent transition-colors mt-auto pt-2" style={{ fontSize: '12.8px', fontWeight: 700, letterSpacing: '0.512px' }}>
                    View Album
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
                onClick={() => setVisibleCount((c) => c + 4)}
                className="inline-block px-6 py-3 rounded-full font-body font-bold text-sm tracking-wide bg-primary text-white hover:bg-primary-dark transition-all duration-200 cursor-pointer"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
