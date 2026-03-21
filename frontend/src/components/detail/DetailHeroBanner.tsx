const HERO_BG =
  'https://framerusercontent.com/images/uA8oZioX84LwYdHwDPogQJhk13I.jpg';

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
