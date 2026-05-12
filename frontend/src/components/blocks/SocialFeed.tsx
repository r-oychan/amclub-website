import { SectionHeader } from '../shared/SectionHeader';
import type { CtaButton } from '../../lib/types';

export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'youtube';

export interface SocialPost {
  title?: string;
  platform?: SocialPlatform;
  href?: string;
  image?: string;
  video?: string;
  caption?: string;
}

export function SocialFeed({
  label,
  heading,
  description,
  cta,
  dark = false,
  posts,
}: {
  label?: string;
  heading?: string;
  description?: string;
  cta?: CtaButton;
  dark?: boolean;
  posts: SocialPost[];
}) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className={`py-16 ${dark ? 'bg-primary text-white' : 'bg-bg'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`h-px ${dark ? 'bg-white/20' : 'bg-secondary/40'} mb-12 md:mb-16`} />

        <SectionHeader label={label} heading={heading} cta={cta} dark={dark} />

        {description && (
          <p className={`max-w-2xl mb-10 md:mb-12 text-[17.6px] font-light leading-[1.45] ${dark ? 'text-white/75' : 'text-primary/80'}`}>
            {description}
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {posts.map((post, i) => (
            <SocialTile key={i} post={post} dark={dark} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialTile({ post, dark }: { post: SocialPost; dark: boolean }) {
  const hasVideo = Boolean(post.video);
  const fallback = post.image;

  const media = hasVideo ? (
    <video
      src={post.video}
      poster={fallback}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      aria-hidden="true"
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  ) : fallback ? (
    <img
      src={fallback}
      alt={post.title ?? ''}
      loading="lazy"
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  ) : null;

  const inner = (
    <>
      <div className={`relative aspect-square overflow-hidden rounded-[14px] ${dark ? 'bg-white/5' : 'bg-secondary/10'}`}>
        {media}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm">
          <PlatformIcon platform={post.platform} />
        </span>
        {post.title && (
          <div className="absolute inset-x-0 bottom-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="text-[13.6px] font-medium leading-tight line-clamp-2">{post.title}</p>
          </div>
        )}
      </div>
      {post.caption && (
        <p className={`mt-3 text-[13.6px] font-light leading-snug ${dark ? 'text-white/70' : 'text-primary/70'}`}>
          {post.caption}
        </p>
      )}
    </>
  );

  if (post.href) {
    return (
      <a
        href={post.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={post.title ?? `Open on ${post.platform ?? 'social'}`}
        className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[14px]"
      >
        {inner}
      </a>
    );
  }
  return <div className="group">{inner}</div>;
}

function PlatformIcon({ platform }: { platform?: SocialPlatform }) {
  switch (platform) {
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.6-.1-1.4-.2-2.4-.2-2.4 0-4 1.4-4 4v2.3H8v3h2v7h3.5z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d="M14 3v9.5a2.5 2.5 0 1 1-2.5-2.5v-2A4.5 4.5 0 1 0 16 12.5V8.2c.9.6 2 .9 3.3.9V7c-1.6 0-2.9-.6-3.3-1.3V3H14z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" />
        </svg>
      );
    case 'instagram':
    default:
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}
