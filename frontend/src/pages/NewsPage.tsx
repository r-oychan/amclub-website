import { useState } from 'react';
import { Link } from 'react-router';
import { DetailHeroBanner } from '../components/detail/DetailHeroBanner';
import { DetailBreadcrumb } from '../components/detail/DetailBreadcrumb';

interface NewsArticle {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  category?: string;
}

const NEWS_ARTICLES: NewsArticle[] = [
  {
    slug: 'essentials-renovation',
    title: 'Essentials Renovation',
    date: 'OCT 11, 2025',
    excerpt:
      'Essentials is getting a fresh new look. Discover the refreshed layout, new product selections, and enhanced shopping experience.',
    image:
      'https://framerusercontent.com/images/ALiDWPH3U3VnmiEzcoEet6lPIk.jpeg',
    category: 'Announcement',
  },
  {
    slug: 'chinese-new-year-2025-hours',
    title: 'Chinese New Year 2025 Operating Hours',
    date: 'OCT 11, 2025',
    excerpt:
      'Take note of updated outlet hours across the Club for the Chinese New Year festive period.',
    image:
      'https://framerusercontent.com/images/uA8oZioX84LwYdHwDPogQJhk13I.jpg',
    category: 'Operations',
  },
  {
    slug: 'expat-living-readers-choice-2025',
    title: 'Expat Living Reader’s Choice Award 2025',
    date: 'OCT 11, 2025',
    excerpt:
      'The American Club is honoured to be recognised in the Expat Living Reader’s Choice Awards — thank you to our community.',
    image:
      'https://framerusercontent.com/images/bdz4bVfeQtZyQC6ebpW09r3ujU.jpg',
    category: 'Awards',
  },
  {
    slug: 'whatsapp-channels',
    title: 'Join our WhatsApp Channels & Stay Connected with Us!',
    date: 'OCT 11, 2025',
    excerpt:
      'Follow The American Club’s WhatsApp Channels for real-time updates on dining, events, and exclusive Member news.',
    image:
      'https://framerusercontent.com/images/9Wx98RDzkCICF2QMOXQadZLRTH4.jpg',
    category: 'Community',
  },
  {
    slug: 'club-closure-switchgear',
    title: 'Club Closure for Switchgear Replacement',
    date: 'OCT 11, 2025',
    excerpt:
      'Scheduled maintenance will temporarily affect Club operations. Please review the notice for details on outlet hours.',
    image:
      'https://framerusercontent.com/images/zd8RpGTpCNZnJ1FkyAtkThpEy9s.png',
    category: 'Operations',
  },
  {
    slug: 'uncorked-wine-society',
    title: 'UNCORKED: An Exclusive World for Wine Lovers',
    date: 'SEP 20, 2025',
    excerpt:
      'Connect with fellow vinophiles through UNCORKED — enjoy curated wine events, flash sales, and priority access.',
    image:
      'https://framerusercontent.com/images/e85HYNka8NYlE7SuZFJQ6qajxg.jpg',
    category: 'Dining',
  },
];

export default function NewsPage() {
  const [visibleCount, setVisibleCount] = useState(6);
  const visible = NEWS_ARTICLES.slice(0, visibleCount);
  const canLoadMore = visibleCount < NEWS_ARTICLES.length;

  return (
    <>
      <DetailHeroBanner />

      <DetailBreadcrumb
        parentLabel="The American Club"
        parentHref="/home"
        currentName="Club News"
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
              Club News
            </h1>
            <p
              className="text-text-dark"
              style={{ fontSize: '19.2px', lineHeight: '26.88px' }}
            >
              Stay up to date with the latest happenings, announcements, and stories
              from The American Club.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visible.map((article) => (
              <article
                key={article.slug}
                className="rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="h-52 overflow-hidden bg-primary/5">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col gap-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="inline-block bg-accent text-white text-xs font-bold px-2 py-1 rounded">
                      {article.date}
                    </span>
                    {article.category && (
                      <span className="text-xs text-secondary font-bold uppercase tracking-wide">
                        {article.category}
                      </span>
                    )}
                  </div>
                  <h3
                    className="font-heading text-primary"
                    style={{
                      fontSize: '20.8px',
                      fontWeight: 700,
                      letterSpacing: '-0.416px',
                      lineHeight: '26px',
                    }}
                  >
                    {article.title}
                  </h3>
                  <p
                    className="text-text-dark flex-1"
                    style={{ fontSize: '15px', lineHeight: '22px' }}
                  >
                    {article.excerpt}
                  </p>
                  <Link
                    to={`/home-sub/news/${article.slug}`}
                    className="inline-flex items-center gap-2 text-primary uppercase hover:text-accent transition-colors mt-2"
                    style={{
                      fontSize: '13.6px',
                      fontWeight: 700,
                      letterSpacing: '0.544px',
                    }}
                  >
                    Read More
                    <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M1 13L13 1M13 1H3M13 1V11"
                        stroke="#DF4661"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </div>
              </article>
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
    </>
  );
}
