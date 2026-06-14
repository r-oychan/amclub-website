const HERO_BG = '/branding/detail-hero-fallback.jpg';

export function DetailHeroBanner({
  imageUrl = HERO_BG,
}: {
  imageUrl?: string;
}) {
  return (
    <div className="relative h-[280px] overflow-hidden">
      <img
        src={imageUrl}
        alt=""
        className="absolute w-full h-[600px] -top-[310px] object-cover"
        style={{ filter: 'blur(3px)' }}
      />
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}
