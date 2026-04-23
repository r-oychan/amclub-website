import { useState } from 'react';
import { Link } from 'react-router';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';

interface GalleryAlbum {
  slug: string;
  title: string;
  coverImage: string;
  date?: string;
  photoCount?: number;
}

const GALLERY_ALBUMS: GalleryAlbum[] = [
  {
    slug: 'tree-lighting-evening-2025',
    title: 'Tree Lighting Evening 2025',
    coverImage:
      'https://framerusercontent.com/images/YCNFJanBoXdJFKJlpWh9tMfwrQ.jpg',
    date: 'DEC 2025',
    photoCount: 42,
  },
  {
    slug: 'annual-vip-party-2025',
    title: 'Annual VIP Party 2025',
    coverImage:
      'https://framerusercontent.com/images/9Wx98RDzkCICF2QMOXQadZLRTH4.jpg',
    date: 'NOV 2025',
    photoCount: 58,
  },
  {
    slug: 'wonder-of-women-2025',
    title: 'Wonder of Women 2025',
    coverImage:
      'https://framerusercontent.com/images/bdz4bVfeQtZyQC6ebpW09r3ujU.jpg',
    date: 'MAR 2025',
    photoCount: 36,
  },
  {
    slug: 'elite-party-2025',
    title: 'Elite Party 2025',
    coverImage:
      'https://framerusercontent.com/images/A9M0VHDW2FE6UoaFatzINqucGp0.jpg',
    date: 'FEB 2025',
    photoCount: 47,
  },
  {
    slug: 'super-bowl-lix-finals',
    title: 'Super Bowl LIX Finals Live Screening',
    coverImage:
      'https://framerusercontent.com/images/MlqKdegxMYfk5tpETtAaDIaV2w.jpg',
    date: 'FEB 2025',
    photoCount: 29,
  },
  {
    slug: 'club-wide-cny-2025',
    title: 'Club-wide Chinese New Year Celebration 2025',
    coverImage:
      'https://framerusercontent.com/images/uA8oZioX84LwYdHwDPogQJhk13I.jpg',
    date: 'JAN 2025',
    photoCount: 64,
  },
  {
    slug: 'team-members-cny-2025',
    title: 'Team Members’ Chinese New Year Celebration 2025',
    coverImage:
      'https://framerusercontent.com/images/mVJDWpQ45XvCKY8vEOKrFiKZta0.jpg',
    date: 'JAN 2025',
    photoCount: 22,
  },
  {
    slug: 'shop-treasures',
    title: 'Shop Treasures & One-of-a-Kind Finds @ The American Club',
    coverImage:
      'https://framerusercontent.com/images/rA4tJSoJzyWMv0VxMzxueeloOKI.jpg',
    date: 'DEC 2024',
    photoCount: 18,
  },
];

export default function GalleryPage() {
  const [visibleCount, setVisibleCount] = useState(8);
  const visible = GALLERY_ALBUMS.slice(0, visibleCount);
  const canLoadMore = visibleCount < GALLERY_ALBUMS.length;

  return (
    <>
      <DetailHeroBanner />

      <DetailBreadcrumb
        parentLabel="The American Club"
        parentHref="/home"
        currentName="Gallery"
      />

      <section className="bg-bg pb-[120px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl mb-12">
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
              Gallery
            </h1>
            <p
              className="text-text-dark"
              style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
            >
              Browse photos from recent events and celebrations at The American Club.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visible.map((album) => (
              <Link
                key={album.slug}
                to={`/home-sub/gallery/${album.slug}`}
                className="group rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-primary/5">
                  <img
                    src={album.coverImage}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 flex flex-col gap-2 flex-1">
                  {album.date && (
                    <span className="text-xs text-secondary font-bold uppercase tracking-wide">
                      {album.date}
                      {album.photoCount ? ` · ${album.photoCount} photos` : ''}
                    </span>
                  )}
                  <h3
                    className="font-heading text-primary"
                    style={{
                      fontSize: '17.6px',
                      fontWeight: 700,
                      letterSpacing: '-0.352px',
                      lineHeight: '22.4px',
                    }}
                  >
                    {album.title}
                  </h3>
                  <span
                    className="inline-flex items-center gap-1.5 text-primary uppercase group-hover:text-accent transition-colors mt-auto pt-2"
                    style={{
                      fontSize: '12.8px',
                      fontWeight: 700,
                      letterSpacing: '0.512px',
                    }}
                  >
                    View Album
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M1 13L13 1M13 1H3M13 1V11"
                        stroke="#DF4661"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
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
