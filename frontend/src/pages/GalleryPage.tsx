import { useEffect, useMemo, useState } from 'react';
import { fetchAPI, STRAPI_URL } from '../lib/api';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { PageFade } from '../components/shared/PageFade';
import { Lightbox, type LightboxImage } from '../components/shared/Lightbox';

type StrapiMedia = { id: number; url: string; alternativeText?: string | null };

interface StrapiGalleryAlbum {
  documentId: string;
  title: string;
  slug: string;
  date?: string;
  photoCount?: number;
  description?: string;
  coverImage?: StrapiMedia;
  images?: StrapiMedia[];
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

const toLightboxImages = (album: StrapiGalleryAlbum): LightboxImage[] => {
  const list = album.images && album.images.length > 0
    ? album.images
    : (album.coverImage ? [album.coverImage] : []);
  return list
    .map((m) => ({ url: mediaUrl(m) ?? '', alt: m.alternativeText ?? album.title }))
    .filter((i) => i.url);
};

export default function GalleryPage() {
  const [data, setData] = useState<StrapiGalleryPage | null>(null);
  const [albums, setAlbums] = useState<StrapiGalleryAlbum[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const [activeAlbumSlug, setActiveAlbumSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [page, list] = await Promise.all([
        fetchAPI<StrapiGalleryPage>('/gallery-page'),
        fetchAPI<StrapiGalleryAlbum[]>('/gallery-albums', {
          'sort[0]': 'order:asc',
          'pagination[limit]': '50',
          populate: '*',
        }),
      ]);
      if (cancelled) return;
      setData(page);
      setAlbums(list ?? []);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const visible = albums.slice(0, visibleCount);
  const canLoadMore = visibleCount < albums.length;
  const activeAlbum = useMemo(
    () => albums.find((a) => a.slug === activeAlbumSlug) ?? null,
    [albums, activeAlbumSlug]
  );
  const lightboxImages = activeAlbum ? toLightboxImages(activeAlbum) : [];

  if (!loaded) return <PageFade loaded={false}>{null}</PageFade>;

  return (
    <PageFade loaded={loaded}>
      <div className="relative">
        <DetailHeroBanner imageUrl={mediaUrl(data?.heroImage)} />
        <h1
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-heading text-white pointer-events-none"
          style={{ fontSize: '38.4px', fontWeight: 300, fontStyle: 'italic', letterSpacing: '-1.152px', lineHeight: '42.24px' }}
        >
          {data?.introHeading ?? data?.title ?? 'Gallery'}
        </h1>
      </div>

      <section className="bg-bg pt-10 pb-[120px]">
        <div className="max-w-[1440px] mx-auto px-5">
          {data?.introBody && (
            <p
              className="max-w-3xl mx-auto text-text-dark text-center mb-10"
              style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
            >
              {data.introBody}
            </p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {visible.map((album) => (
              <AlbumCard
                key={album.slug}
                album={album}
                onOpen={() => setActiveAlbumSlug(album.slug)}
              />
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

      {activeAlbum && lightboxImages.length > 0 && (
        <Lightbox
          images={lightboxImages}
          title={activeAlbum.title}
          onClose={() => setActiveAlbumSlug(null)}
        />
      )}
    </PageFade>
  );
}

function AlbumCard({ album, onOpen }: { album: StrapiGalleryAlbum; onOpen: () => void }) {
  const cover = mediaUrl(album.coverImage);
  const count = album.photoCount ?? album.images?.length ?? 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group text-left rounded-[32px] bg-[#EBEAE8] p-6 sm:p-10 lg:px-[72px] lg:pt-[72px] lg:pb-10 flex flex-col gap-8 cursor-pointer transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent/60"
      aria-label={`Open ${album.title} album`}
    >
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-primary/5">
          {cover && (
            <img
              src={cover}
              alt={album.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
        </div>
        <div
          className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="#6BBBAE" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3" stroke="#6BBBAE" strokeWidth="1.5" />
          </svg>
          <span
            className="font-body text-primary"
            style={{ fontSize: '14.4px', fontWeight: 700, letterSpacing: '0.576px', lineHeight: '20.16px' }}
          >
            {count}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {album.date && (
          <span
            className="font-body text-secondary uppercase"
            style={{ fontSize: '12.8px', fontWeight: 700, letterSpacing: '0.512px' }}
          >
            {album.date}
          </span>
        )}
        <h3
          className="font-body text-primary"
          style={{ fontSize: '17.6px', fontWeight: 700, lineHeight: '24.64px' }}
        >
          {album.title}
        </h3>
        <span
          className="inline-flex items-center gap-1.5 text-primary group-hover:text-accent transition-colors"
          style={{ fontSize: '14.4px', fontWeight: 700, letterSpacing: '0.576px', lineHeight: '20.16px' }}
        >
          View Album
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1 13L13 1M13 1H3M13 1V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </button>
  );
}
