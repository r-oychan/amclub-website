import { Link } from 'react-router';
import { Hero } from '../components/blocks/Hero';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { OverlaySection } from '../components/blocks/OverlaySection';
import { RestaurantCard } from '../components/dining/RestaurantCard';
import { PromoCell } from '../components/dining/PromoCell';

/* ─── Restaurant data ──────────────────────────────────────────── */

interface DiningVenue {
  name: string;
  slug: string;
  cuisineType: string;
  cuisineIconSlug: string;
  description: string;
  image: string;
  logo: string;
  dressCode?: string;
  ctas: { label: string; href?: string }[];
}

const RESTAURANTS: DiningVenue[] = [
  {
    name: 'Central',
    slug: 'central',
    cuisineType: 'Cafe',
    cuisineIconSlug: 'cafe',
    description: 'Your favorite coffee, sandwich and chatter spot.',
    image: '/uploads/restaurants/central.jpeg',
    logo: '/uploads/logos/central.png',
    ctas: [{ label: 'Read More', href: '/dining/central' }],
  },
  {
    name: 'Grillhouse & Tiki Bar',
    slug: 'grillhouse',
    cuisineType: 'American BBQ & Grill',
    cuisineIconSlug: 'american',
    description:
      'The home of American BBQ, pizza and beer at a poolside setting. Devour authentic American cuisine featuring Texas-style BBQ, mouth-watering burgers, and delicious pizzas.',
    image: '/uploads/restaurants/grillhouse.jpeg',
    logo: '/uploads/logos/grillhouse.png',
    ctas: [
      { label: 'Read More', href: '/dining/grillhouse' },
      { label: 'View Menu' },
    ],
  },
  {
    name: 'The 2nd Floor',
    slug: 'the-2nd-floor',
    cuisineType: 'Casual Premium Fine Dining',
    cuisineIconSlug: 'casual-fine-dining',
    description:
      'Experience the best of both worlds, where East and West create a fine dining experience.',
    image: '/uploads/restaurants/the-2nd-floor.jpeg',
    logo: '/uploads/logos/the-2nd-floor.png',
    dressCode: 'Smart Casual',
    ctas: [
      { label: 'Read More', href: '/dining/the-2nd-floor' },
      { label: 'View Menu' },
    ],
  },
  {
    name: 'The Gourmet Pantry',
    slug: 'the-gourmet-pantry',
    cuisineType: 'Wine & Gourmet Store',
    cuisineIconSlug: 'gourmet',
    description:
      'A curated destination for modern tastemakers – offering exceptional wines, artisanal bites, and beautifully crafted tableware.',
    image: '/uploads/restaurants/the-gourmet-pantry.jpeg',
    logo: '/uploads/logos/the-gourmet-pantry.png',
    ctas: [{ label: 'Read More', href: '/dining/the-gourmet-pantry' }],
  },
  {
    name: 'Tradewinds',
    slug: 'tradewinds',
    cuisineType: 'International',
    cuisineIconSlug: 'international',
    description:
      'All-day casual dining featuring an international menu with flavors from America to Singapore.',
    image: '/uploads/restaurants/tradewinds.jpeg',
    logo: '/uploads/logos/tradewinds.png',
    ctas: [
      { label: 'Read More', href: '/dining/tradewinds' },
      { label: 'View Menu' },
    ],
  },
  {
    name: 'Union Bar',
    slug: 'union-bar',
    cuisineType: 'American Bar Food',
    cuisineIconSlug: 'bar',
    description: 'Kick back after work at this classic American sports bar.',
    image: '/uploads/restaurants/union-bar.jpeg',
    logo: '/uploads/logos/the-union-bar.png',
    ctas: [
      { label: 'Read More', href: '/dining/union-bar' },
      { label: 'View Menu' },
    ],
  },
];

/* ─── Delivery & Essentials data ───────────────────────────────── */

interface DeliveryItem {
  name: string;
  slug: string;
  description: string;
  image: string;
  cta: { label: string; href: string };
}

const DELIVERY_ITEMS: DeliveryItem[] = [
  {
    name: 'TAC2Go!',
    slug: 'tac2go',
    description: 'Savor your Club favorites in the comforts of your own home.',
    image: '/uploads/services/tac2go.jpeg',
    cta: { label: 'Order Now', href: '/dining/tac2go' },
  },
  {
    name: 'Bottles2Go!',
    slug: 'bottles2go',
    description:
      "Bringing the Club's cellar to your home with a curated range of premium wines.",
    image: '/uploads/services/bottles2go.jpg',
    cta: { label: 'Order Now', href: '/dining/bottles2go' },
  },
];

const ESSENTIALS = {
  name: 'Essentials',
  slug: 'essentials',
  description:
    'Your one-stop shop for everyday essentials, seasonal treats, and laundry services—all in one convenient spot.',
  image: '/uploads/services/essentials.jpeg',
  ctas: [
    { label: 'Essentials2Go!', href: '/dining/essentials' },
    { label: 'Retail Store & Laundry Services', href: '/dining/essentials' },
  ],
};

/* ─── Page ─────────────────────────────────────────────────────── */

export default function DiningPage() {
  const leftColumn = RESTAURANTS.filter((_, i) => i % 2 === 0);
  const rightColumn = RESTAURANTS.filter((_, i) => i % 2 === 1);

  return (
    <>
      {/* Hero */}
      <Hero
        heading="Dining & Retail"
        subheading="Drink for leisure. Eat for pleasure."
        backgroundImage="/uploads/pages/dining/hero-bg.jpg"
        variant="compact"
      />

      {/* ── Restaurant Zigzag Grid ──────────────────────────────── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop: two-column zigzag */}
          <div className="hidden md:flex items-start gap-x-[80px]">
            {/* Left column */}
            <div className="w-[45%] max-w-[700px] flex flex-col gap-16 lg:gap-20">
              {leftColumn.map((venue) => (
                <RestaurantCard key={venue.slug} {...venue} />
              ))}
            </div>

            {/* Right column — offset down with PromoCell first */}
            <div className="w-[45%] max-w-[700px] flex flex-col gap-16 lg:gap-20">
              <PromoCell />
              {rightColumn.map((venue) => (
                <RestaurantCard key={venue.slug} {...venue} />
              ))}
            </div>
          </div>

          {/* Mobile: single column */}
          <div className="md:hidden space-y-12">
            <PromoCell />
            {RESTAURANTS.map((venue) => (
              <RestaurantCard key={venue.slug} {...venue} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Club Favorites ──────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-bg">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl md:text-4xl font-light italic text-primary text-center mb-3">
            Club Favorites, Straight to Your Door
          </h2>
          <p className="text-text-dark/70 text-center max-w-2xl mx-auto mb-10 text-sm">
            Savor your favorite Club dishes and curated wines from the comfort
            of home, with delivery and takeaway services at your fingertips.
          </p>

          {/* TAC2Go + Bottles2Go */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {DELIVERY_ITEMS.map((item) => (
              <Link
                key={item.slug}
                to={item.cta.href}
                className="group relative rounded-xl overflow-hidden aspect-[16/10]"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-heading text-xl md:text-2xl font-light italic text-white mb-2">
                    {item.name}
                  </h3>
                  <p className="text-white/70 text-sm mb-3 max-w-sm">
                    {item.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white/90 group-hover:text-white transition-colors">
                    {item.cta.label}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 14 14"
                      fill="none"
                      className="text-secondary shrink-0"
                    >
                      <path
                        d="M1 13L13 1M13 1H3M13 1V11"
                        stroke="currentColor"
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
        </div>
      </section>

      {/* ── Essentials (overlay section) ─────────────────────────── */}
      <OverlaySection
        heading={ESSENTIALS.name}
        description={ESSENTIALS.description}
        ctas={ESSENTIALS.ctas}
        image={ESSENTIALS.image}
        imageAlt={ESSENTIALS.name}
        textPosition="right"
        textVerticalAlign="center"
        textBgColor="#F5F4F2"
        textTheme="dark"
      />

      {/* ── CTA Banner ──────────────────────────────────────────── */}
      <CtaBanner
        heading="Savor the Experience"
        body="Become a Member to explore our restaurants, where a variety of cuisines and thoughtfully crafted dining experiences await to delight every palate."
        variant="light"
        ctas={[
          { label: 'Explore Membership', href: '/membership' },
          { label: 'Book a Club Tour' },
        ]}
      />
    </>
  );
}
