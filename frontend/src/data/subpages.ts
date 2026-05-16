export interface SubpageData {
  slug: string;
  name: string;
  type: string;
  description: string;
  hours?: string;
  level?: string;
  phone?: string;
  email?: string;
  capacity?: string;
  dressCode?: string;
  image?: string;
  /**
   * When set, renders an embedded YouTube player in the sticky left column
   * instead of the static image. Accepts a YouTube URL (https://youtu.be/ID,
   * https://www.youtube.com/watch?v=ID, or already-embed-form URL) or a raw
   * video ID. Falls back to `image` when not set.
   */
  video?: { url: string; title?: string };
  parentSection: string;
  parentHref: string;
  /**
   * Rich operating-hours blocks. Each block renders as one DetailSection
   * with a clock icon, title, and a grid of day/time rows.
   */
  operatingHoursSections?: {
    title?: string;
    rows?: { dayRange: string; time: string; lastOrder?: string; note?: string }[];
  }[];
  /**
   * Inline location & contact module. Falls back to the legacy
   * `level`/`phone`/`email` fields when this isn't set.
   */
  locationContact?: { locationLevel?: string; phone?: string; email?: string };
  ctas?: { label: string; href: string; isExternal?: boolean }[];
  extraSections?: {
    title: string;
    content?: string;
    bullets?: string[];
    contactRows?: { label: string; value: string }[];
    /**
     * Nested sub-blocks rendered after content/bullets. Used when one
     * extraSection holds several mini-sections (e.g. Camps' "For Ages 4–7"
     * and "For Ages 8 & Above" both live under "Upcoming Camps").
     */
    groups?: {
      heading?: string;
      paragraphs?: string[];
      bullets?: string[];
      footer?: string;
    }[];
  }[];
  promoCards?: {
    heading: string;
    description: string;
    /**
     * Layout variant.
     * - `'card'` (default): image-on-top card with subtitle + title + CTA below.
     * - `'overlay'`: full-bleed image with title + CTA label overlaid in white at
     *   the bottom. Matches Framer's "Our Aquatic Programs" 5-up grid.
     */
    variant?: 'card' | 'overlay';
    /** Optional fixed column count for the grid. Defaults to 3 for `card`, 5 for `overlay`. */
    columns?: number;
    cards: {
      title: string;
      subtitle?: string;
      image: string;
      cta: { label: string; href: string };
    }[];
  };
  /** Optional roster shown as a "Meet the Team" section. */
  teamMembers?: {
    name: string;
    role: string;
    bio?: string;
    image?: string;
    bioImage?: string;
    /** Avatar framing within the circular mask (CSS object-position, 0–100 percent, default 50). */
    imageOffsetX?: number;
    imageOffsetY?: number;
    /** Avatar zoom multiplier (1 = fit, >1 zooms in). Default 1. */
    imageZoom?: number;
    /** Optional URL for a coach detail page. If no bioImage is set, clicking the avatar navigates here. */
    coachLink?: string;
  }[];
  teamHeading?: string;
  /**
   * Visual layout for the team grid.
   * - `'circle'` (default): small circular headshot avatars; suited for portrait shots.
   * - `'card'`: rectangle tiles that show the full image uncropped; suited for
   *   full-bio-card images (like amclub.org.sg's PT/Pilates profile cards).
   */
  teamLayout?: 'circle' | 'card';
  /** Extra CTAs rendered at the bottom of the page (e.g. duplicate price-list link). */
  bottomCtas?: { label: string; href: string; isExternal?: boolean }[];
  /**
   * 2-column image + heading + description + EXPLORE link card grid, rendered
   * between the main two-column section and the imagePanels block. Mirrors the
   * Framer prototype's "Personal Training / Group Fitness Classes" cards on the
   * Gym page. Each entry produces one card row (typically `cards.length === 2`).
   */
  cardSections?: {
    heading?: string;
    subheading?: string;
    cards: {
      heading: string;
      description: string;
      image: string;
      imageAlt?: string;
      cta?: { label: string; href: string; isExternal?: boolean };
    }[];
  }[];
  /**
   * Full-width image+text panels rendered between the main two-column section
   * and the promo cards. Used for sections like Framer's "Tennis Programs"
   * and "Tennis Etiquette" — image on one side, structured text on the other.
   * Each panel can optionally include grouped operating-hours blocks; omit
   * them for pure-text panels (e.g. etiquette).
   */
  imagePanels?: {
    image: string;
    imageAlt?: string;
    /** Side that holds the image. Defaults to alternating starting from 'left'. */
    imagePosition?: 'left' | 'right';
    /**
     * When true, the image scrolls together with the text column (its row's
     * normal flow). Default false → image is sticky to the top so it stays in
     * view while a long text column scrolls past it.
     */
    slideWithText?: boolean;
    heading: string;
    cta?: { label: string; href: string; isExternal?: boolean };
    subheading?: string;
    body?: string;
    bullets?: string[];
    operatingHours?: { title: string; rows: string[] }[];
    footnote?: string;
  }[];
  faq?: { question: string; answer: string }[];
  /**
   * Marquee gallery rendered between the main content and the FAQ. Each row
   * scrolls horizontally; row 0 scrolls right-to-left, row 1 left-to-right by
   * default. Pass any number of images per row — they're duplicated for a
   * seamless loop. Pass an empty array to disable.
   */
  gallery?: {
    heading?: string;
    rows: { images: string[]; direction?: 'ltr' | 'rtl'; durationSec?: number }[];
  };
  /**
   * 3-col card grid mirroring the "Parties Made Easy" block on /kids. Each
   * card shows a thumbnail, italic title, secondary divider, and a CTA
   * (typically a brochure PDF). Rendered via the shared KidsPartyPackages
   * component for visual consistency with the parent kids page.
   */
  /**
   * Centered testimonial block rendered between the gallery and the FAQ.
   * One or more quote cards under a shared heading.
   */
  quotes?: {
    heading?: string;
    items: { text: string; attribution?: string; role?: string }[];
  };
  partyPackages?: {
    heading?: string;
    subheading?: string;
    items: {
      name: string;
      image: string;
      imageAlt?: string;
      cta?: { label: string; href: string; isExternal?: boolean };
    }[];
  };
  /**
   * "Forms You'll Need" download list — rendered as a DetailSection on
   * the right of the venue's main two-column layout. Each entry produces
   * one orange PDF-icon row that opens the file in a new tab.
   */
  downloads?: {
    heading?: string;
    items: { label: string; href: string; isExternal?: boolean }[];
  };
  /**
   * 4-column tier card grid (Niche Group Membership). Each card renders a
   * radial-gradient + stripe-pattern "membership card" image above the
   * tier name, short eligibility blurb, and a checkmark benefits list.
   */
  tierCards?: {
    heading?: string;
    subheading?: string;
    cards: {
      name: string;
      description: string;
      benefits: string[];
      gradientFrom: string;
      gradientTo: string;
    }[];
  };
  /**
   * 3-col facility cards (used on /event-spaces/corporate-functions and
   * similar pages). Each card shows a square image, italic serif heading,
   * thin divider, a capacity tagline (e.g. "Up to 40 pax"), and a body
   * paragraph. No CTA — these are presentational summaries.
   */
  venueCards?: {
    heading?: string;
    subheading?: string;
    columns?: 2 | 3 | 4;
    cards: {
      heading: string;
      capacity?: string;
      description: string;
      image: string;
      imageAlt?: string;
    }[];
  };
  /**
   * 3-col card grid for wedding/event packages. Each card shows a striped
   * placeholder image, italic serif heading, thin divider, a tagline
   * subheading, a "PACKAGE DETAILS" label, and a checkmark bullet list.
   */
  packageCards?: {
    heading?: string;
    subheading?: string;
    columns?: 2 | 3;
    cards: {
      heading: string;
      tagline: string;
      detailsLabel?: string;
      benefits: string[];
      image?: string;
    }[];
  };
}

const PLACEHOLDER_FAQ: { question: string; answer: string }[] = [
  { question: 'What types of membership do you offer?', answer: '' },
  { question: 'What facilities and services are included?', answer: '' },
  { question: 'Is membership transferable?', answer: '' },
  { question: 'Can I upgrade or change my membership type?', answer: '' },
];

export const diningSubpages: SubpageData[] = [
  {
    slug: 'central',
    name: 'Central',
    type: 'Cafe',
    description:
      'Have a cup of joe, bagels, pastries and salads at this contemporary café with counter service and self check-out kiosk. Customized cake orders must be placed at least three working days in advance.\n\nNo wet attire allowed in the cafe.',
    hours: 'Daily\n7:00 AM – 7:00 PM',
    operatingHoursSections: [
      {
        title: 'Opening Hours',
        rows: [{ dayRange: 'Daily', time: '7:00 AM - 7:00 PM' }],
      },
    ],
    level: 'Level 1',
    phone: '6739 4359',
    email: 'central@amclub.org.sg',
    image:
      '/uploads/restaurants/central.jpeg',
    parentSection: 'Dining & Retail',
    parentHref: '/dining',
    ctas: [
      { label: 'View Menu', href: '/menus/central-menu.pdf', isExternal: true },
      { label: 'Promotions', href: '/dining/dining-promotion#promo-central' },
    ],
  },
  {
    slug: 'the-2nd-floor',
    name: 'The 2nd Floor',
    type: 'Fusion Fine Dining',
    description:
      'Amidst the plethora of fusion restaurants in Singapore, none is as exquisite as the award-winning, The 2nd Floor. The logo suggests its East and West origin. The two bold strokes represent the Chinese character for 2 – "er". The Eastern menu is in perfect harmony with authentic Asian flavors and unique contemporary presentations.\n\nThe Western menu is an interpretation of the Modern American Steakhouse and combines bistro ambiance with fine dining fare. The restaurant attained the Excellent Dining Venue award at the Global Gourmet 2020 Chef par Excellence Culinary Competition.',
    hours:
      'Tuesday to Sunday\nLunch: 11:30 AM – 2:30 PM\nDinner: 5:30 PM – 10:00 PM\nThe 2nd Floor is closed on Mondays',
    operatingHoursSections: [
      {
        title: 'Operating Hours',
        rows: [
          {
            dayRange: 'Tuesday to Sunday',
            time: 'Lunch: 11:30 AM – 2:30 PM\nDinner: 5:30 PM – 10:00 PM',
            note: 'The 2nd Floor is closed on Mondays',
          },
        ],
      },
    ],
    level: 'Level 2',
    phone: '6739 4329',
    email: '2ndfloor@amclub.org.sg',
    dressCode: 'Smart Casual',
    image:
      '/uploads/restaurants/the-2nd-floor.jpeg',
    parentSection: 'Dining & Retail',
    parentHref: '/dining',
    ctas: [
      { label: 'View Menu', href: '/menus/the-2nd-floor-menu.pdf', isExternal: true },
      { label: 'Reserve a Table', href: 'mailto:2ndfloor@amclub.org.sg', isExternal: true },
      { label: 'Promotions', href: '/dining/dining-promotion#promo-the-2nd-floor' },
    ],
    extraSections: [
      {
        title: 'Reservation',
        content:
          'Or contact The 2nd Floor at 6739 4329 or 2ndfloor@amclub.org.sg to make a reservation.',
      },
      {
        title: 'Wine Corkage Policy',
        content:
          'Enjoy complimentary corkage with every bottle purchased from our restaurants.\nStandard corkage is $20 per bottle.',
      },
      {
        title: 'Cancellation Policy',
        content:
          'Cancellation of reservations within 24 hours will incur a $25 per person fee*. Exceptions for compassionate or medical reasons apply. No discounts or vouchers can be applied to the cancellation fee.\n\n*Excluding ticketed and private events where a separate cancellation policy applies.',
      },
    ],
  },
  {
    slug: 'tradewinds',
    name: 'Tradewinds',
    type: 'International',
    description:
      'Tradewinds takes your tastebuds around the world with its international menu offering. The menu selection features nuances of flavors from America to Singapore.\n\nThis restaurant takes its name from the prevailing surface winds – also known as trade winds – that blow predominantly from the northeast in the Northern Hemisphere and from the southeast in the Southern Hemisphere.\n\nFor centuries, trade winds have facilitated ships to cross the world\'s oceans, establishing trade routes across the Atlantic and Pacific oceans.\n\nTradewinds brings the world\'s flavors to The American Club table.',
    hours:
      'Sunday to Thursday\n8:00 AM – 9:00 PM (Last order at 8:30 PM)\nFriday & Saturday\n8:00 AM – 10:00 PM (Last order at 9:30 PM)',
    operatingHoursSections: [
      {
        title: 'Opening Hours',
        rows: [
          { dayRange: 'Sunday to Thursday', time: '8:00 AM - 9:00 PM',  lastOrder: 'Last order at 8:30 PM' },
          { dayRange: 'Friday & Saturday',  time: '8:00 AM - 10:00 PM', lastOrder: 'Last order at 9:30 PM' },
        ],
      },
    ],
    level: 'Level 1',
    phone: '6739 4361',
    email: 'tradewinds@amclub.org.sg',
    image:
      '/uploads/restaurants/tradewinds.jpeg',
    parentSection: 'Dining & Retail',
    parentHref: '/dining',
    ctas: [
      { label: 'View Menu', href: '/menus/tradewinds-menu.pdf', isExternal: true },
      { label: 'Promotions', href: '/dining/dining-promotion#promo-tradewinds' },
    ],
    extraSections: [
      {
        title: 'Wine Corkage Policy',
        content:
          'Enjoy complimentary corkage with every bottle purchased from our restaurants.\nStandard corkage is $20 per bottle.',
      },
    ],
  },
  {
    slug: 'grillhouse',
    name: 'Grillhouse & Tiki Bar',
    type: 'American BBQ and Grill',
    description:
      'Welcome to a casual poolside dining restaurant – perfect for families with children and swimmers looking to have a delicious meal.\n\nDevour authentic American cuisine featuring Texas-style BBQ, mouth-watering burgers, delicious pizzas and salads with ice-cold American beer and special Grillhouse shakes.',
    hours:
      'Grillhouse\nSunday to Thursday: 11:00 AM – 9:00 PM (Last order at 8:30 PM)\nFriday and Saturday: 11:00 AM – 9:30 PM (Last order at 9:00 PM)\n\nTiki Bar\nFridays & Saturdays: 11:30 AM – 12:00 AM (Last order at 11:30 PM)\nSundays: 11:30 AM – 11:00 PM (Last order at 10:30 PM)',
    operatingHoursSections: [
      {
        title: 'Grillhouse Operating Hours',
        rows: [
          { dayRange: 'Sunday to Thursday', time: '11:00 AM - 9:00 PM', lastOrder: 'Last order at 8:30 PM' },
          { dayRange: 'Friday',             time: '11:00 AM - 9:30 PM', lastOrder: 'Last order at 9:00 PM' },
          { dayRange: 'Saturday',           time: '8:30 AM - 9:30 PM',  lastOrder: 'Last order at 9:00 PM' },
        ],
      },
      {
        title: 'Tiki Bar Operating Hours',
        rows: [
          { dayRange: 'Friday & Saturday', time: '11:30 AM - 12:00 AM', lastOrder: 'Last order at 11:30 PM' },
          { dayRange: 'Sunday',            time: '11:30 AM - 11:00 PM', lastOrder: 'Last order at 10:30 PM' },
        ],
      },
    ],
    level: 'Level 1',
    phone: '6739 4357',
    email: 'grillhouse@amclub.org.sg',
    image:
      '/uploads/restaurants/grillhouse.jpeg',
    parentSection: 'Dining & Retail',
    parentHref: '/dining',
    ctas: [
      { label: 'View Menu', href: '/menus/grillhouse-menu.pdf', isExternal: true },
      { label: 'Promotions', href: '/dining/dining-promotion#promo-grillhouse' },
    ],
  },
  {
    slug: 'union-bar',
    name: 'Union Bar',
    type: 'American Bar Food',
    description:
      'Nothing feels like a Friday night than bar bites and a cold beer. Grab a bite and a drink after work, and watch the latest football or basketball game on TV, only at the Union Bar.\n\nHappy Hours are even happier now that you can enjoy 20% off house pour and beer starting an hour earlier, from 4:00 PM, until 8:00 PM, daily!\n\nPlease be informed that Union Bar does not take any reservations. Strictly walk-ins only.',
    hours:
      'Sunday to Thursday\n12:00 PM – 11:00 PM\nFriday and Saturday & Eve of PH\n12:00 PM – 12:00 AM',
    operatingHoursSections: [
      {
        title: 'Opening Hours',
        rows: [
          { dayRange: 'Sunday to Thursday',              time: '12:00 PM - 11:00 PM' },
          { dayRange: 'Friday and Saturday & Eve of PH', time: '12:00 PM - 12:00 AM' },
        ],
      },
    ],
    level: 'Basement 2',
    phone: '6739 4340',
    email: 'unionbar@amclub.org.sg',
    image:
      '/uploads/restaurants/union-bar.jpeg',
    parentSection: 'Dining & Retail',
    parentHref: '/dining',
    ctas: [
      { label: 'View Menu', href: '/menus/union-bar-menu.pdf', isExternal: true },
      { label: 'Sports Screening Schedule', href: '/menus/union-bar-menu.pdf', isExternal: true },
      { label: 'Promotions', href: '/dining/dining-promotion#promo-union-bar' },
    ],
    extraSections: [
      {
        title: 'Wine Corkage Policy',
        content:
          'Members and Guests are welcome to bring their own wine with a standard corkage of $20. You can also enjoy 1-for-1 corkage or complimentary corkage with the purchase of one of our bottles.\n\nPlease note that Union Bar operates on a walk-in basis only, and reservations are not accepted. Members and Guests must be above 18 years old to order alcoholic beverages.',
      },
      {
        title: 'Age Policy',
        content:
          'Members and Guests above 18 years of age are welcome.\n\nMembers and Guests ordering alcoholic beverages are required to present a valid photo ID. The following IDs are recognized: Club membership card, passport, Singapore NRIC, driver\'s license and government issued IDs only.',
      },
    ],
  },
  {
    slug: 'the-gourmet-pantry',
    name: 'The Gourmet Pantry',
    type: 'Retail',
    description:
      'The Gourmet Pantry brings together an excellent selection of wines, featuring more than 100 American wine labels alongside over 300 international labels, thoughtfully curated for every occasion – from easy-drinking table wines to premium selections and celebratory bubblies.\n\nComplementing the wine collection is a distinctive range of homeware and table settings, making it a convenient, one-stop destination for both everyday needs and special moments.',
    hours:
      'Monday to Thursday\n11:00 AM – 8:00 PM\nFriday to Sunday\n10:00 AM – 8:00 PM',
    operatingHoursSections: [
      {
        title: 'Opening Hours',
        rows: [
          { dayRange: 'Monday to Thursday', time: '11:00 AM - 8:00 PM' },
          { dayRange: 'Friday to Sunday',   time: '10:00 AM - 8:00 PM' },
        ],
      },
    ],
    level: 'Level 1',
    phone: '6739 4340',
    email: 'gourmetpantry@amclub.org.sg',
    image:
      '/uploads/restaurants/the-gourmet-pantry.jpeg',
    parentSection: 'Dining & Retail',
    parentHref: '/dining',
    ctas: [
      { label: 'View Menu', href: '/menus/the-gourmet-pantry-menu.pdf', isExternal: true },
    ],
    extraSections: [
      {
        title: 'A Refined Way to Unwind',
        content:
          'Unwind at the Wine Bar @ The Gourmet Pantry and enjoy your favourite pours from Monday to Sunday, 12:00 PM – 8:00 PM',
      },
    ],
    promoCards: {
      heading: 'From Our Cellar to Your Home',
      description:
        'Shop a curated selection of wines, available for convenient delivery or takeaway. Become an UNCORKED Member for first access to exclusive wine offers and privileges.',
      cards: [
        {
          title: 'UNCORKED',
          subtitle: 'An exclusive world for wine lovers.',
          image:
            'https://framerusercontent.com/images/e85HYNka8NYlE7SuZFJQ6qajxg.jpg',
          cta: { label: 'Learn More', href: '/dining/uncorked' },
        },
        {
          title: 'Bottles2Go!',
          subtitle:
            'Bringing the Club\'s cellar to your home with a curated range of premium wines.',
          image:
            'https://framerusercontent.com/images/aGxaO43vaHmXI1ULbrj1nuKNM74.jpg',
          cta: { label: 'Order Now', href: 'https://amclub.jotform.com/252638314015956' },
        },
      ],
    },
  },
  {
    // UNCORKED — name/description/image/CTAs come from the seeded restaurant
    // entry (scripts/seed-dining-page.mjs). Only the membership bullet list
    // lives here because the restaurant schema has no `extraSections` field.
    slug: 'uncorked',
    name: 'UNCORKED',
    type: 'Wine Club',
    description: '',
    parentSection: 'Dining & Retail',
    parentHref: '/dining',
    extraSections: [
      {
        title: 'Membership',
        content: 'Annual Membership Fee: $125',
        bullets: [
          'Welcome gift',
          'Exclusive 10% off regular priced wines (by the bottle) across all of the Club\'s dining outlets',
          'Exclusive 5% off regular priced wines at The Gourmet Pantry. Stackable with Niche Group discounts',
          'Exclusive 10% off regular priced liquor (by the bottle) from the Union Bar Beverage Menu',
          'Enjoy 10% off wine accessories at The Gourmet Pantry',
          'Early access to Flash Wine Sales and wine/liquor updates',
          'Exclusive UNCORKED promotions at all of the Club\'s dining outlets',
          'Exclusive access to limited wines from The Gourmet Pantry',
          'Priority booking and special prices for wine dinners and events',
        ],
      },
    ],
  },
  {
    slug: 'essentials',
    name: 'Essentials',
    type: 'Retail',
    description:
      'Essentials is your convenient one-stop shop for everyday needs – featuring exclusive items imported directly from the US, as well as pantry staples, seasonal treats, premium beverages, baking supplies, and laundry services.\n\nEssentials2Go!, our online platform, makes shopping effortless – available for home delivery or self-collection at Essentials, whichever suits you best.',
    hours: 'Daily\n8:00 AM – 8:00 PM',
    operatingHoursSections: [
      {
        title: 'Opening Hours',
        rows: [{ dayRange: 'Daily', time: '8:00 AM - 8:00 PM' }],
      },
    ],
    level: 'Level 1',
    phone: '6739 4332',
    email: 'essentials@amclub.org.sg',
    image:
      '/uploads/services/essentials.jpeg',
    parentSection: 'Dining & Retail',
    parentHref: '/dining',
    ctas: [{ label: 'Essentials2Go!', href: 'https://amclub.jotform.com/253312807189965', isExternal: true }],
  },
  {
    slug: 'dining-promotion',
    name: 'Dining Promotions',
    type: 'Promotions',
    description:
      'Browse the latest dining experiences and seasonal highlights.',
    image: '/promotions/dining-promotions-hero.jpg',
    parentSection: 'Dining & Retail',
    parentHref: '/dining',
  },
];

export const fitnessSubpages: SubpageData[] = [
  {
    slug: 'sen-spa',
    name: 'sên Spa',
    type: 'Wellness',
    description:
      'sên means life force, echoing the concept of Chi (Chinese), Ki (Japanese), or Prana (Sanskrit), and embodies the pursuit of balance and wellness.\n\nImmerse yourself in a curated selection of indulgent treatments, including massages, facials, hair care, mani-pedis, scrubs, wraps, and more specialized services – all crafted with premium products and delivered by our team of skilled professionals.\n\nAt sên Spa, every experience is tailored to your individual needs, making it the perfect urban retreat for relaxation, rejuvenation, and holistic well-being.',
    hours:
      'Monday to Saturday: 9:00 AM – 8:00 PM\nSunday & Public Holiday: 9:00 AM – 6:00 PM',
    operatingHoursSections: [
      {
        title: 'Opening Hours',
        rows: [
          { dayRange: 'Monday to Saturday',       time: '9:00 AM - 8:00 PM' },
          { dayRange: 'Sunday & Public Holiday',  time: '9:00 AM - 6:00 PM' },
        ],
      },
    ],
    level: 'Basement 3',
    phone: '6739 4449',
    email: 'spa@amclub.org.sg',
    image: '/images/fitness/senspa.jpeg',
    ctas: [
      { label: 'View Menu & Promotions', href: '/documents/fitness/sen-spa-menu.pdf', isExternal: true },
      { label: 'Book an Appointment', href: 'mailto:spa@amclub.org.sg', isExternal: true },
    ],
    extraSections: [
      {
        title: 'Reservation',
        content:
          'Bookings for standard facials, massages, waxing, and nail services can be made up to one month in advance.\nManage your sên Spa reservations easily through the TAC Book app. Click here for a step-by-step guide on how to use the app to schedule and manage your bookings.\nAlternatively, you may contact the sên Spa team via WhatsApp at 9630 1877 for inquiries or booking changes. Please note that WhatsApp support is available during the Spa\'s operating hours only.',
        bullets: [
          'Please arrive at least 5 minutes before your scheduled appointment',
          'Late arrivals may result in a shortened treatment. If you expect to be late, please inform the Spa via WhatsApp at 9630 187',
          'Cancellations or changes must be made at least 48 hours in advance',
          'A 50% charge applies for cancellations made less than 48 hours in advance',
          '100% charge applies for same-day cancellations or no-shows',
          'Click here for full details on our cancellation policy',
        ],
      },
    ],
    parentSection: 'Fitness & Wellness',
    parentHref: '/fitness',
  },
  {
    slug: 'aquatics',
    name: 'Aquatics',
    type: 'Swimming',
    description:
      'Our Aquatics Team is dedicated to enriching lives through swimming, offering programs for all ages – from babies and toddlers to school-age children and adults.\n\nOur Aquatics program features SwimAmerica, a nationally recognized learn-to-swim program from the United States developed by the American Swimming Coaches Association. Using techniques inspired by world-class and Olympic swimmers, SwimAmerica follows a structured, progressive approach that helps beginners build confidence, proper technique, and strong swimming fundamentals in a safe and effective way.\n\nMembers can further enhance their experience through private lessons, holiday swim camps, intensive stroke clinics, and a variety of in-house swim meets. On weekends, the whole family can enjoy fun in the water with inflatables and play structures.',
    hours:
      'Pool Operating Hours\nDaily: 6:00 AM – 9:00 PM\nLifeguards on duty daily 7:00 AM – 7:00 PM\n\nAquatics Office\nWeekdays: 9:30 AM – 6:00 PM\nSaturdays: 9:00 AM – 12:00 PM\nClosed on Sundays',
    operatingHoursSections: [
      {
        title: 'Pool Operating Hours',
        rows: [
          {
            dayRange: 'Daily',
            time: '6:00 AM – 9:00 PM',
            note: 'Lifeguards are on duty daily from 7:00 AM – 7:00 PM.',
          },
        ],
      },
      {
        title: 'Social lap swimming is unavailable during these peak hours',
        rows: [
          { dayRange: 'Mondays to Fridays', time: '4:30 PM – 6:00 PM' },
          { dayRange: 'Saturdays',          time: '8:00 AM – 11:30 AM' },
        ],
      },
      {
        title: 'Aquatics Office Operating Hours',
        rows: [
          { dayRange: 'Weekdays',  time: '9:30 AM – 6:00 PM' },
          { dayRange: 'Saturdays', time: '9:00 AM – 12:00 PM', note: 'Closed on Sundays' },
        ],
      },
    ],
    level: 'Level 1',
    phone: '6739 4450',
    email: 'aquatics@amclub.org.sg',
    image: '/images/fitness/aquatics.jpeg',
    parentSection: 'Fitness & Wellness',
    parentHref: '/fitness',
    ctas: [
      { label: 'Programs Price List', href: '/documents/fitness/aquatics-program-price-list.pdf', isExternal: true },
      { label: 'Book an Assessment', href: 'mailto:aquatics@amclub.org.sg', isExternal: true },
    ],
    promoCards: {
      heading: 'Our Aquatic Programs',
      description:
        "The Club's teaching program builds skills through simple, achievable progressions, while the Swim Team focuses on guiding junior swimmers into competitive swimming.",
      variant: 'overlay',
      columns: 5,
      cards: [
        {
          title: 'SwimAmerica',
          image: '/images/fitness/programs/aquatic-program-swimamerica.jpeg',
          cta: { label: 'View More', href: '/fitness/aquatics/swimamerica' },
        },
        {
          title: 'Swim Team',
          image: '/images/fitness/programs/aquatic-program-swim-team.jpg',
          cta: { label: 'View More', href: '/fitness/aquatics/swim-team' },
        },
        {
          title: 'Masters Swimming',
          image: '/images/fitness/programs/aquatic-program-masters-swimming.jpg',
          cta: { label: 'View More', href: '/fitness/aquatics/masters-swimming' },
        },
        {
          title: 'Aquatics Group Fitness Classes',
          image: '/images/fitness/programs/aquatic-program-group-class.jpg',
          cta: { label: 'View More', href: '/fitness/aquatics/group-fitness-classes' },
        },
        {
          title: 'Infant & Toddlers',
          image: '/images/fitness/programs/aquatic-program-infant-toddlers.jpg',
          cta: { label: 'View More', href: '/fitness/aquatics/infants-toddlers' },
        },
      ],
    },
    teamHeading: 'Meet Our Team',
    teamMembers: [
      { name: 'Greg',      role: 'Aquatics Manager & Head Swim Coach',         image: '/images/fitness/team-aquatics/greg.jpg',      imageOffsetX: 48, imageOffsetY: 25, imageZoom: 1.7, coachLink: '/coaches/aquatics/greg' },
      { name: 'Zack',      role: 'Aquatics Coordinator',                        image: '/images/fitness/team-aquatics/zack.jpg',      imageOffsetX: 48, imageOffsetY: 25, imageZoom: 1.8, coachLink: '/coaches/aquatics/zack' },
      { name: 'Hariz',     role: 'Assistant Swim Coach & Coordinator',          image: '/images/fitness/team-aquatics/hariz.jpg',     imageOffsetX: 48, imageOffsetY: 28, imageZoom: 1.8, coachLink: '/coaches/aquatics/hariz' },
      { name: 'Abdul',     role: 'Chief Lifeguard Trainer',                     image: '/images/fitness/team-aquatics/abdul.jpg',     imageOffsetX: 48, imageOffsetY: 25, imageZoom: 1.8, coachLink: '/coaches/aquatics/abdul' },
      { name: 'Marc',      role: 'Swim Coach',                                  image: '/images/fitness/team-aquatics/marc.png',      imageOffsetX: 48, imageOffsetY: 35, imageZoom: 1.4 },
      { name: 'Rodel',     role: 'Swim Coach / Lifeguard Trainer',              image: '/images/fitness/team-aquatics/rodel.jpg',     imageOffsetX: 48, imageOffsetY: 22, imageZoom: 1.8, coachLink: '/coaches/aquatics/rodel' },
      { name: 'Ben',       role: 'Swim Coach / Lifeguard Trainer',              image: '/images/fitness/team-aquatics/ben.jpeg',      imageOffsetX: 48, imageOffsetY: 28, imageZoom: 2.0 },
      { name: 'Francesca', role: 'Swim Coach',                                  image: '/images/fitness/team-aquatics/francesca.jpg', imageOffsetX: 48, imageOffsetY: 32, imageZoom: 1.7 },
      { name: 'Caroline',  role: 'Part-time Swim Coach',                        image: '/images/fitness/team-aquatics/caroline.jpg',  imageOffsetX: 50, imageOffsetY: 28, imageZoom: 1.55 },
      { name: 'Daniel',    role: 'Part-time Swim Coach',                        image: '/images/fitness/team-aquatics/daniel.jpg',    imageOffsetX: 48, imageOffsetY: 25, imageZoom: 1.8 },
      { name: 'Yat',       role: 'Part-time Swim Coach / Lifeguard Trainer',    image: '/images/fitness/team-aquatics/yat.jpg',       imageOffsetX: 48, imageOffsetY: 22, imageZoom: 1.6 },
      { name: 'Sia',       role: 'Part-time Lifeguard Trainer',                 image: '/images/fitness/team-aquatics/sia.jpg',       imageOffsetX: 50, imageOffsetY: 30, imageZoom: 1.5 },
    ],
    bottomCtas: [
      { label: 'View Programs Price List', href: '/documents/fitness/aquatics-program-price-list.pdf', isExternal: true },
    ],
    faq: [
      {
        question: "How do I determine my child's swim level?",
        answer:
          "Book a free assessment for children over three years old by emailing aquatics@amclub.org.sg or submitting the assessment form at the Aquatics Counter. Babies and toddlers do not require assessment as levels are age-based.",
      },
      {
        question: 'Can I enroll after the term has started?',
        answer:
          'Yes — enrollment is possible at any point subject to class availability. Submit an enrollment form to the Aquatics Counter and the team will respond within five working days.',
      },
      {
        question: 'When will my child move to the next level?',
        answer:
          "There is no fixed duration. Once an instructor confirms the swimmer confidently completes all required skills, the Aquatics Coordinator runs a level assessment. The Spring and Fall programs also include dedicated assessment weeks.",
      },
      {
        question: "Will swimming lessons be held if it's raining?",
        answer:
          'Lessons continue during light rain but are cancelled for thunder, lightning, or extremely heavy rain. Call the Aquatics Counter at 6739-4470 (or the office at 6739-4450) thirty minutes before class to confirm.',
      },
      {
        question: 'I missed my class. Can I attend a make-up class?',
        answer:
          'With nearly 900 weekly swimmers and limited resources, the Club is unable to offer make-up classes.',
      },
      {
        question: 'What if my child is sick?',
        answer:
          "Present a Medical Certificate covering the missed lesson dates at the Aquatics Counter within one week, or before the end of the month. Receipts are not accepted in place of an MC.",
      },
      {
        question: 'Are Guests able to enroll in the Starfish Swim School Program?',
        answer:
          'Guests may only enroll in the Aquastars program and swimming camps. Terms and conditions apply — please check with the Aquatics Counter for details.',
      },
      {
        question: 'How do I withdraw my child from a program?',
        answer:
          'Submit a cancellation request at the Aquatics Counter at least two weeks before the final lesson date. Phone cancellations are not accepted.',
      },
    ],
  },
  {
    slug: 'aquatics-swimamerica',
    name: 'SwimAmerica',
    type: 'Aquatics Program',
    description:
      'SwimAmerica is a nationally recognized learn-to-swim program from the United States, developed by the American Swimming Coaches Association. Using techniques inspired by world-class and Olympic swimmers, SwimAmerica follows a structured, progressive station-based approach that helps beginners build confidence, proper technique, and strong swimming fundamentals in a safe and effective way.\n\nAt The American Club, certified SwimAmerica coaches guide students from their very first day in the water through to advanced stroke development. Each station has clear learning goals so swimmers — and their parents — can track progress at every step.',
    hours: 'Weekday afternoons and weekend mornings.\nFull schedule available from the Aquatics Office.',
    level: 'Level 1',
    phone: '6739 4450',
    email: 'aquatics@amclub.org.sg',
    image: '/images/fitness/programs/aquatic-program-swimamerica.jpeg',
    parentSection: 'Aquatics',
    parentHref: '/fitness/aquatics',
    ctas: [
      { label: 'Programs Price List', href: '/documents/fitness/aquatics-program-price-list.pdf', isExternal: true },
      { label: 'Enquire', href: 'mailto:aquatics@amclub.org.sg', isExternal: true },
    ],
  },
  {
    slug: 'aquatics-swim-team',
    name: 'Swim Team',
    type: 'Aquatics Program',
    description:
      'The American Club Swim Team is for swimmers ready to take their training to the next level. Members of the team train regularly with our coaches, compete at in-house and external meets, and develop the discipline, technique, and teamwork that make competitive swimming so rewarding.\n\nTeam placement is by coach assessment. Existing SwimAmerica swimmers who have completed the foundation stations are typically the strongest candidates.',
    hours: 'Multiple training sessions per week.\nSchedule confirmed at registration.',
    level: 'Level 1',
    phone: '6739 4450',
    email: 'aquatics@amclub.org.sg',
    image: '/images/fitness/aquatics.jpeg',
    parentSection: 'Aquatics',
    parentHref: '/fitness/aquatics',
    ctas: [
      { label: 'Programs Price List', href: '/documents/fitness/aquatics-program-price-list.pdf', isExternal: true },
      { label: 'Enquire', href: 'mailto:aquatics@amclub.org.sg', isExternal: true },
    ],
  },
  {
    slug: 'aquatics-masters-swimming',
    name: 'Masters Swimming',
    type: 'Aquatics Program',
    description:
      'Masters Swimming is designed for adult swimmers who want to keep fit, improve technique, and enjoy a structured training environment. Coaches set the workouts; participants follow at their own pace and stroke choice. Whether you are a former competitive swimmer or simply someone who wants a serious workout in the pool, you are welcome to join.',
    hours: 'Early-morning and evening sessions during the week.\nFull schedule available from the Aquatics Office.',
    level: 'Level 1',
    phone: '6739 4450',
    email: 'aquatics@amclub.org.sg',
    image: '/images/fitness/programs/aquatic-program-masters-swimming.jpg',
    parentSection: 'Aquatics',
    parentHref: '/fitness/aquatics',
    ctas: [
      { label: 'Programs Price List', href: '/documents/fitness/aquatics-program-price-list.pdf', isExternal: true },
      { label: 'Enquire', href: 'mailto:aquatics@amclub.org.sg', isExternal: true },
    ],
  },
  {
    slug: 'aquatics-group-fitness-classes',
    name: 'Aquatics Group Fitness Classes',
    type: 'Aquatics Program',
    description:
      'Our Aquatics Group Fitness Classes combine the resistance of water with energetic, low-impact training led by qualified instructors. These classes are easier on the joints than land-based workouts while still building strength, cardiovascular fitness, and flexibility. Open to Members of all fitness levels.',
    hours: 'Weekday mornings and selected evenings.\nFull schedule available from the Aquatics Office.',
    level: 'Level 1',
    phone: '6739 4450',
    email: 'aquatics@amclub.org.sg',
    image: '/images/fitness/programs/aquatic-program-group-class.jpg',
    parentSection: 'Aquatics',
    parentHref: '/fitness/aquatics',
    ctas: [
      { label: 'Programs Price List', href: '/documents/fitness/aquatics-program-price-list.pdf', isExternal: true },
      { label: 'Enquire', href: 'mailto:aquatics@amclub.org.sg', isExternal: true },
    ],
  },
  {
    slug: 'aquatics-infants-toddlers',
    name: 'Infant & Toddlers',
    type: 'Aquatics Program',
    description:
      'Our Infant & Toddlers program introduces our youngest Members to the water in a safe, parent-supported environment. The focus is on water confidence, gentle skill-building, and bonding between parent and child. Each session is led by an Aquatics instructor experienced in early-childhood teaching.',
    hours: 'Weekday mornings and weekends.\nFull schedule available from the Aquatics Office.',
    level: 'Level 1',
    phone: '6739 4450',
    email: 'aquatics@amclub.org.sg',
    image: '/images/fitness/programs/aquatic-program-infant-toddlers.jpg',
    parentSection: 'Aquatics',
    parentHref: '/fitness/aquatics',
    ctas: [
      { label: 'Programs Price List', href: '/documents/fitness/aquatics-program-price-list.pdf', isExternal: true },
      { label: 'Enquire', href: 'mailto:aquatics@amclub.org.sg', isExternal: true },
    ],
  },
  {
    slug: 'gym',
    name: 'Gym',
    type: 'Fitness Center',
    description:
      'Whether you\'re a long-time fitness enthusiast or just starting your wellness journey, our team of qualified Personal Trainers and Group Fitness Instructors is here to support you.\n\nThe Gym also offers a wide range of state-of-the-art cardio and strength equipment, along with a dedicated Group Fitness Studio.\n\nWork out independently, join a group class, or book a personal training session with a trainer of your choice.',
    hours:
      'Monday to Friday\n6:00 AM – 9:00 PM\nSaturday, Sunday & Public Holidays\n6:00 AM – 8:30 PM',
    level: 'Basement 2',
    phone: '6739 4312',
    email: 'sportscenter@amclub.org.sg',
    image: '/images/fitness/gym.jpeg',
    parentSection: 'Fitness & Wellness',
    parentHref: '/fitness',
    ctas: [
      { label: 'Personal Training & Group Fitness Classes', href: '/documents/fitness/personal-training-group-fitness-class.pdf', isExternal: true },
      { label: 'Group Fitness Class Schedule', href: '/documents/fitness/group-fitness-class-schedule.jpg', isExternal: true },
    ],
    extraSections: [
      {
        title: 'Complimentary Gym Orientation',
        content:
          'Kickstart your routine with a complimentary one-hour Gym Orientation. Our Personal Trainers will guide you through equipment use, gym safety, and proper posture and form. Open to Members aged 16 and above.',
      },
      {
        title: 'TGPC (Teenage Gym Proficiency Course)',
        content:
          'Junior Members aged 12 to 15 are welcome to use the Gym after completing the Teenage Gym Proficiency Course. Simply present your Junior Membership card and register for this complimentary orientation with our Personal Trainer. Sign up at the Sports Counter or email sportscounter@amclub.org.sg.',
      },
    ],
    cardSections: [
      {
        cards: [
          {
            heading: 'Personal Training',
            description:
              'Achieve your fitness goals faster with one-on-one sessions tailored to your needs, guided by our experienced Personal Trainers.',
            image: '/images/fitness/gym-personal-training.jpeg',
            imageAlt: 'Personal trainer guiding a member through a dumbbell row',
            cta: {
              label: 'Explore',
              href: '/documents/fitness/personal-training-group-fitness-class.pdf',
              isExternal: true,
            },
          },
          {
            heading: 'Group Fitness Classes',
            description:
              'Energize your workout and stay motivated in a fun, supportive environment with our variety of group classes designed for all fitness levels.',
            image: '/images/fitness/gym-group-fitness-classes.jpeg',
            imageAlt: 'Members performing a kettlebell squat group fitness class',
            cta: {
              label: 'Explore',
              href: '/documents/fitness/group-fitness-class-schedule.jpg',
              isExternal: true,
            },
          },
        ],
      },
    ],
    teamHeading: 'Personal Trainers',
    teamMembers: [
      { name: 'Mubin',    role: 'Personal Trainer', image: '/images/fitness/team-pt/mubin.png',    bioImage: '/images/fitness/team-pt/mubin-bio.png' },
      { name: 'Robert',   role: 'Personal Trainer', image: '/images/fitness/team-pt/robert.jpg',   bioImage: '/images/fitness/team-pt/robert-bio.png' },
      { name: 'Liza',     role: 'Personal Trainer', image: '/images/fitness/team-pt/liza.jpg',     bioImage: '/images/fitness/team-pt/liza-bio.png' },
      { name: 'Irfan',    role: 'Personal Trainer', image: '/images/fitness/team-pt/irfan.jpg',    bioImage: '/images/fitness/team-pt/irfan-bio.png' },
      { name: 'Flinson',  role: 'Personal Trainer', image: '/images/fitness/team-pt/flinson.jpg',  bioImage: '/images/fitness/team-pt/flinson-bio.png' },
      { name: 'Ewan',     role: 'Personal Trainer', image: '/images/fitness/team-pt/ewan.jpg',     bioImage: '/images/fitness/team-pt/ewan-bio.png' },
      { name: 'Eric',     role: 'Personal Trainer', image: '/images/fitness/team-pt/eric.jpg',     bioImage: '/images/fitness/team-pt/eric-bio.png' },
      { name: 'Elaine',   role: 'Personal Trainer', image: '/images/fitness/team-pt/elaine.jpg',   bioImage: '/images/fitness/team-pt/elaine-bio.png' },
      { name: 'Ashton',   role: 'Personal Trainer', image: '/images/fitness/team-pt/ashton.jpg',   bioImage: '/images/fitness/team-pt/ashton-bio.png' },
      { name: 'Adrian',   role: 'Personal Trainer', image: '/images/fitness/team-pt/adrian.jpg',   bioImage: '/images/fitness/team-pt/adrian-bio.png' },
      { name: 'Yattz',    role: 'Personal Trainer', image: '/images/fitness/team-pt/yattz.jpg',    bioImage: '/images/fitness/team-pt/yattz-bio.png' },
      { name: 'Nadesh',   role: 'Personal Trainer', image: '/images/fitness/team-pt/nadesh.jpg',   bioImage: '/images/fitness/team-pt/nadesh-bio.png' },
      { name: 'Sam',      role: 'Personal Trainer', image: '/images/fitness/team-pt/sam.jpg',      bioImage: '/images/fitness/team-pt/sam-bio.png' },
      { name: 'Crystal',  role: 'Personal Trainer', image: '/images/fitness/team-pt/crystal.jpg',  bioImage: '/images/fitness/team-pt/crystal-bio.png' },
      { name: 'Jenny',    role: 'Personal Trainer', image: '/images/fitness/team-pt/jenny.jpg',    bioImage: '/images/fitness/team-pt/jenny-bio.png' },
      { name: 'Vanan',    role: 'Personal Trainer', image: '/images/fitness/team-pt/vanan.jpg',    bioImage: '/images/fitness/team-pt/vanan-bio.png' },
      { name: 'Ghazali',  role: 'Personal Trainer', image: '/images/fitness/team-pt/ghazali.jpg',  bioImage: '/images/fitness/team-pt/ghazali-bio.png' },
      { name: 'Andyn',    role: 'Personal Trainer', image: '/images/fitness/team-pt/andyn.jpg',    bioImage: '/images/fitness/team-pt/andyn-bio.png' },
      { name: 'Zack',     role: 'Personal Trainer',                                                bioImage: '/images/fitness/team-pt/zack-bio.png' },
      { name: 'Desmond',  role: 'Personal Trainer',                                                bioImage: '/images/fitness/team-pt/desmond-bio.png' },
    ],
  },
  {
    slug: 'tennis',
    name: 'Tennis',
    type: 'Racquet Sports',
    description:
      'For Tennis enthusiasts, the Club offers four state-of-the-art artificial grass courts with sand infill which is an ideal surface for both coaching and recreational play.',
    hours:
      'Monday to Friday\n6:00 AM – 11:00 PM\nSaturday, Sunday and PH\n6:30 AM – 11:00 PM',
    level: 'Basement 2',
    phone: '6739-4312',
    email: 'sportscounter@amclub.org.sg',
    image: '/images/fitness/tennis.jpeg',
    parentSection: 'Fitness & Wellness',
    parentHref: '/fitness',
    ctas: [
      { label: 'Book a Court', href: 'mailto:sportscounter@amclub.org.sg', isExternal: true },
      { label: 'TAC Book App Tutorial', href: '/documents/fitness/tac-book-app-download-tutorial.pdf', isExternal: true },
    ],
    teamHeading: 'Meet Our Team',
    teamMembers: [
      { name: 'Azhar Zainudin',    role: 'Director of Tennis',             image: '/images/fitness/team/azhar-zainudin.jpg',    bioImage: '/images/fitness/team/azhar-zainudin-bio.png',    imageOffsetX: 48, imageOffsetY: 35, imageZoom: 2.0 },
      { name: 'Jorge Pinilla',     role: 'Director of Player Development', image: '/images/fitness/team/jorge-pinilla-headshot.png', bioImage: '/images/fitness/team/jorge-pinilla-bio.png',     imageOffsetX: 44, imageOffsetY: 30, imageZoom: 2.0 },
      { name: 'Herman Ali',        role: 'Senior Tennis Professional',     image: '/images/fitness/team/herman-ali.jpg',        bioImage: '/images/fitness/team/herman-ali-bio.png',        imageOffsetX: 48, imageOffsetY: 22, imageZoom: 2.0 },
      { name: 'Reduan Ariffin',    role: 'Tennis Professional',            image: '/images/fitness/team/reduan-ariffin.jpg',    bioImage: '/images/fitness/team/reduan-ariffin-bio.png',    imageOffsetX: 48, imageOffsetY: 30, imageZoom: 1.8 },
      { name: 'Sharassalam Rasak', role: 'Tennis Professional',            image: '/images/fitness/team/sharassalam-rasak.jpg', bioImage: '/images/fitness/team/sharassalam-rasak-bio.png', imageOffsetX: 48, imageOffsetY: 28, imageZoom: 2.0 },
      { name: 'Ethan Lee',         role: 'Tennis Professional',            image: '/images/fitness/team/ethan-lee.jpg',         bioImage: '/images/fitness/team/ethan-lee-bio.png',         imageOffsetX: 48, imageOffsetY: 25, imageZoom: 2.0 },
      { name: 'Ezequiel Suarez',   role: 'Tennis Professional',            image: '/images/fitness/team/ezequiel-suarez.jpg',   bioImage: '/images/fitness/team/ezequiel-suarez-bio.png',   imageOffsetX: 52, imageOffsetY: 30, imageZoom: 2.0 },
      { name: 'Jarek Grela',       role: 'Tennis Professional',            image: '/images/fitness/team/jarek-grela-headshot.png', bioImage: '/images/fitness/team/jarek-grela-bio.png',       imageOffsetX: 48, imageOffsetY: 22, imageZoom: 2.2 },
      { name: 'Jose Nino',         role: 'Tennis Professional',            image: '/images/fitness/team/jose-nino.jpg',         bioImage: '/images/fitness/team/jose-nino-bio.png',         imageOffsetX: 48, imageOffsetY: 18, imageZoom: 2.0 },
    ],
    imagePanels: [
      {
        image: '/images/fitness/tennis-program.jpeg',
        imageAlt: 'Tennis Programs at The American Club',
        imagePosition: 'left',
        heading: 'Tennis Programs',
        cta: {
          label: 'Summer Term 2026 Schedule',
          href: '/documents/fitness/tennis-summer-term-schedule-2026.pdf',
          isExternal: true,
        },
        subheading: 'Tennis Socials',
        body:
          'Join our Tennis Socials and keep fit while making new friends! Socials are open to players of all levels and played in 30-minute intervals. Participants may arrive anytime during the duration of the socials.',
        operatingHours: [
          { title: "Men's Social",            rows: ['Every Monday, 6:30 PM – 9:00 PM'] },
          { title: "Ladies' Social",          rows: ['Every Wednesday, 9:00 AM – 11:30 AM'] },
          { title: 'Stroke of The Week',      rows: ['Every Tuesday, 10:00 AM – 11:00 AM', 'Every Wednesday, 6:00 PM – 7:00 PM'] },
          { title: 'Friday Night Mixed Social', rows: ['Every last Friday of the month, 7:00 PM – 9:30 PM'] },
        ],
        footnote: 'Registration is available on the TAC Book app 48 hours in advance.',
      },
      {
        image: '/images/fitness/tennis-etiquette.jpeg',
        imageAlt: 'Tennis etiquette at The American Club',
        imagePosition: 'right',
        heading: 'Tennis Etiquette',
        subheading: 'Punctuality & Cancellation Policy',
        bullets: [
          'Please arrive 5 minutes early and sign up at the Sports Counter before you head up to the Tennis Courts.',
          'Arriving late will limit the time of your game. Should you be late, please call in advance at 6739-4312 / 6739-4451.',
          'Reservations will be held for a maximum of 15 minutes. Failure to show will incur a "No show" charge and the court will be released to other Members.',
          'Cancellations must be made at least 4 hours in advance.',
        ],
      },
    ],
  },
  {
    slug: 'squash',
    name: 'Squash',
    type: 'Racquet Sports',
    description:
      'The Club features two state-of-the-art Squash Courts with a covered outdoor gallery area. We run an active calendar of events throughout the year for our Squash enthusiasts including Squash Box Ladder, Handicap and Open Tournament and Inter-Club Leagues.\n\nGroup and private lessons are available.',
    hours: 'Monday to Sunday\n6:00 AM – 10:00 PM',
    level: 'Basement 2',
    phone: '6739 4312',
    email: 'sportscenter@amclub.org.sg',
    image:
      'https://framerusercontent.com/images/V7hzkQOjUbyX5TwmyMot6sabVk.jpeg',
    parentSection: 'Fitness & Wellness',
    parentHref: '/fitness',
    ctas: [
      { label: 'View Rates', href: '/documents/fitness/squash-private-lesson-rates.jpg', isExternal: true },
      { label: 'Coach Profiles', href: '/documents/fitness/squash-coach-profiles.pdf', isExternal: true },
      { label: 'Booking Policy', href: '/documents/fitness/squash-courts-booking-policy.pdf', isExternal: true },
    ],
    extraSections: [
      {
        title: 'Court Booking Policy',
        content:
          'Due to high demand for court bookings, the following policy has been implemented:',
        bullets: [
          'A 24-hour cancellation policy applies',
          'No shows or cancellations will incur a $20 fee charge',
          'Members may cancel up to four consecutive bookings. Exceeding this limit will result in a two-week booking restriction.',
        ],
      },
      {
        title: 'Squash Socials',
        content:
          'The Club encourages players of all levels to join the regular Squash Socials.\n\nTuesday and Thursday: 5:30 PM – 8:00 PM\nSaturday: 9:00 AM – 12:00 PM',
      },
    ],
  },
  {
    slug: 'pilates',
    name: 'Pilates',
    type: 'Fitness Classes',
    description:
      'Pilates improves posture, flexibility, strength, and endurance, making it ideal for overall fitness as well as sport-specific training such as tennis, golf, and squash.\n\nOur Pilates program follows the Pilates Academy International (PAI) method, integrating modern exercise science, anatomy, and biomechanics for a safe and effective workout. Small class sizes ensure personalized guidance, while a full range of apparatus, including the Reformer, Cadillac, and Chair, allows us to cater to different fitness levels and individual goals without placing undue stress on the joints.',
    hours:
      'Monday to Friday\n7:00 AM – 6:30 PM\nSaturday\n7:00 AM – 4:30 PM\nSunday & Public Holiday\nBy appointment',
    level: 'Level 2',
    phone: '6739-4312 (Sports Counter), 6739-4465 (Pilates Studio)',
    email: 'sportscounter@amclub.org.sg',
    image: '/images/fitness/pilates.jpeg',
    parentSection: 'Fitness & Wellness',
    parentHref: '/fitness',
    ctas: [
      { label: 'View Price List', href: '/documents/fitness/pilates-price-list.docx', isExternal: true },
      { label: 'View Class Schedule', href: '/documents/fitness/pilates-group-class-schedule.jpeg', isExternal: true },
    ],
    cardSections: [
      {
        cards: [
          {
            heading: 'Group Classes',
            description:
              'Join small-group Reformer, Mat & Reformer Fusion sessions that build core strength and improve mobility under the guidance of our PAI-certified instructors.',
            image: '/images/fitness/groupclass.jpeg',
            imageAlt: 'Members in a group Pilates Reformer class',
            cta: {
              label: 'Explore',
              href: '/documents/fitness/pilates-group-class-schedule.jpeg',
              isExternal: true,
            },
          },
          {
            heading: 'Private Sessions',
            description:
              'Work one-on-one with a Pilates Coach for tailored programming on the Reformer, Cadillac, or Chair — ideal for rehabilitation, sport-specific training, or accelerating your progress.',
            image: '/images/fitness/pilates.jpeg',
            imageAlt: 'A Pilates Coach guiding a member through a Reformer exercise',
            cta: {
              label: 'Explore',
              href: '/documents/fitness/pilates-price-list.docx',
              isExternal: true,
            },
          },
        ],
      },
    ],
    extraSections: [
      {
        title: 'Program Overview',
        content:
          'Classes adopt the Pilates Academy International (PAI) method, integrating modern exercise science, anatomy, and biomechanics. Small class sizes ensure personal attention from our instructors.',
        bullets: [
          'Equipment includes Reformer, Cadillac, and Chair',
          'Accommodates different strength levels and fitness objectives',
          'Group and private sessions available',
        ],
      },
      {
        title: 'Course Levels',
        content: '',
        bullets: [
          'Beginners — basic Reformer knowledge, no health issues',
          'Intermediate — comfortable with basic exercises and have good core strength',
          'Advanced — by instructor recommendation only',
          'Multi-level — open to beginner through advanced practitioners',
        ],
      },
      {
        title: 'Mat and Reformer Fusion',
        content:
          'Combines Mat and Reformer repertoire targeting core, arms, thighs, and legs while challenging coordination and body awareness.',
      },
    ],
    teamHeading: 'Pilates Instructors',
    teamMembers: [
      { name: 'Annie Agoncillo', role: 'Pilates Coach',      image: '/images/fitness/team-pilates/annie-agoncillo.jpg', bioImage: '/images/fitness/team-pilates/annie-agoncillo-bio.png' },
      { name: 'Alvan Chan',      role: 'Pilates Coach',      image: '/images/fitness/team-pilates/alvan-chan.jpg',      bioImage: '/images/fitness/team-pilates/alvan-chan-bio.jpg' },
      { name: 'Anthea Lee',      role: 'Pilates Instructor', image: '/images/fitness/team-pilates/anthea-lee.png',      bioImage: '/images/fitness/team-pilates/anthea-lee-bio.png' },
      { name: 'Felicia Tan',     role: 'Pilates Coach',      image: '/images/fitness/team-pilates/felicia-tan.jpg',     bioImage: '/images/fitness/team-pilates/felicia-tan-bio.png' },
      { name: 'Mary Sng',        role: 'Pilates Coach',      image: '/images/fitness/team-pilates/mary-sng.jpg',        bioImage: '/images/fitness/team-pilates/mary-sng-bio.png' },
      { name: 'Chua Li Li',      role: 'Pilates Coach',      image: '/images/fitness/team-pilates/chua-li-li.jpg',      bioImage: '/images/fitness/team-pilates/chua-li-li-bio.png' },
      { name: 'Danielle Chue',   role: 'Pilates Coach',      image: '/images/fitness/team-pilates/danielle-chue.jpg',   bioImage: '/images/fitness/team-pilates/danielle-chue-bio.png' },
    ],
    bottomCtas: [
      { label: 'Download Class Schedule', href: '/documents/fitness/pilates-group-class-schedule.jpeg', isExternal: true },
    ],
  },
  {
    slug: 'bowling-alley',
    name: 'Bowling',
    type: 'Entertainment',
    description:
      'The Bowling Alley offers best-in-class awesome, anytime fun. From casual family outings, couples\' night, birthday parties, Junior Members\' nights and corporate events, The Bowling Alley offers entertainment that\'s right up your alley.\n\nOur Brunswick bowling lanes are oiled and maintained regularly to provide the best experience. For those who want a colorful twist to their usual games, the Cosmic Bowling feature provides multi-colored disco lights and catchy beats. The state-of-the-art LED lights and pin deck glow lighting feature are sure to impress your friends and family.',
    hours:
      'Regular Days\nMonday to Thursday: 12:00 PM to 7:00 PM\nFriday: 12:00 PM – 8:00 PM\nSaturday: 10:30 AM – 8:00 PM\nSunday: 9:30 AM – 7:00 PM\n\nTerm Break\nMonday to Thursday: 10:00 AM – 7:00 PM\nFriday: 10:30 AM – 8:00 PM\nSaturday: 10:30 AM – 8:00 PM\nSunday: 9:30 AM – 7:00 PM',
    level: 'Basement 2',
    phone: '6739-4392',
    email: 'youth@amclub.org.sg',
    image:
      'https://framerusercontent.com/images/FlYhqxJitkFU5PkKTbhHD4Lho.png',
    parentSection: 'Fitness & Wellness',
    parentHref: '/fitness',
    ctas: [{ label: 'Bowling Rates', href: '#' }],
    extraSections: [
      {
        title: 'Important Notice',
        content:
          'Members will have to book slots in advance before dropping by The Bowling Alley.',
        bullets: [
          'For off-hours booking, please make a reservation 48 hours in advance',
          'Staff will not be physically manning The Bowling Alley on weekdays, unless prior bookings have been secured',
          'Prior bookings are not necessary on weekends and public holidays',
          'For corporate parties or social functions, please email youth@amclub.org.sg',
        ],
      },
    ],
    faq: [...PLACEHOLDER_FAQ],
  },
  // Golf and Multi-Purpose Court are now CMS-driven via scripts/seed-facilities.mjs
  // (facilities collection). Their entries previously lived here as static fallbacks
  // and were removed once the deployed Strapi entries were verified.
];

export const kidsSubpages: SubpageData[] = [
  {
    slug: 'the-quad-poolside',
    name: 'The Quad Poolside',
    type: 'Play Space',
    description:
      'The Quad Poolside is a cozy, indoor play haven designed for children under 6 years old. Little ones can explore the charming treehouse playground, enjoy imaginative play in the dress-up corner, and take part in weekly hands-on activities crafted just for them.\n\nEvery visit is guided and overseen by our trained and professional Youth Team Members, ensuring a warm, safe, and engaging environment for our youngest members.',
    hours:
      'Mondays to Thursdays\n8:30 AM – 7:00 PM\nFridays & Saturdays\n8:30 AM – 8:00 PM\nSundays\n8:30 AM – 7:00 PM',
    level: 'Level 1',
    phone: '6739 4444 / 4413',
    email: 'youth@amclub.org.sg',
    image:
      '/uploads/pages/kids/detail/quadpoolside-hero.jpeg',
    parentSection: 'Kids',
    parentHref: '/kids',
    ctas: [
      { label: 'The Quad Poolside Fees', href: '/documents/kids/the-quad-poolside-fees.pdf', isExternal: true },
    ],
    gallery: {
      rows: [
        {
          direction: 'rtl',
          images: [
            '/images/kids/the-quad-poolside/gallery/quad-image-a.jpg',
            '/images/kids/the-quad-poolside/gallery/dscf-0001.jpg',
            '/images/kids/the-quad-poolside/gallery/dscf-0043.jpg',
            '/images/kids/the-quad-poolside/gallery/dscf-0079.jpg',
            '/images/kids/the-quad-poolside/gallery/dscf-0147.jpg',
            '/images/kids/the-quad-poolside/gallery/dscf-0209.jpg',
            '/images/kids/the-quad-poolside/gallery/quad-extra.jpg',
          ],
        },
        {
          direction: 'ltr',
          images: [
            '/images/kids/the-quad-poolside/gallery/quad-image-b.jpg',
            '/images/kids/the-quad-poolside/gallery/dscf-0020.jpg',
            '/images/kids/the-quad-poolside/gallery/dscf-0046.jpg',
            '/images/kids/the-quad-poolside/gallery/dscf-0119.jpg',
            '/images/kids/the-quad-poolside/gallery/dscf-0163.jpg',
            '/images/kids/the-quad-poolside/gallery/dscf-0247.jpg',
            '/images/kids/the-quad-poolside/gallery/dscf-9917.jpg',
            '/images/kids/the-quad-poolside/gallery/dscf-9971.jpg',
          ],
        },
      ],
    },
    faq: [
      {
        question: 'Why are my Guests charged at The Quad?',
        answer:
          'Member usage is prioritized over guests to ensure members can access The Quad whenever desired. Guest fees help minimize overcrowding and discourage misuse. Fees are $2.50 per entry during off-peak hours and $5 during peak hours (Friday evenings, Saturday, Sunday, and public holidays).',
      },
      {
        question: 'Do I really have to sign my child into The Quad Poolside & The Quad?',
        answer:
          'Parents of children under 12 must be present to sign them in and remain on premises. Authorized helpers or amahs may bring children only for Club-sponsored classes and supervised programs, not for free play, per Club bylaws.',
      },
      {
        question:
          "I have two children. One is 7 years old and the other is 5 years old. Why can't both of them be at The Quad unsupervised?",
        answer:
          'The Quad is not a child-minding area. Children 6+ can play independently and respond to staff guidance. Children 5 and under require more attention and should use The Quad Poolside instead.',
      },
      {
        question: "Why can't my child who is 4.5 year old play at the Wallholla?",
        answer:
          'The Wallholla is a six-level vertical climbing structure requiring independent movement. The Club follows manufacturer recommendations allowing only children 5 years old and above.',
      },
      {
        question: 'Why do I have to pay for child-minding at The Quad Poolside?',
        answer:
          'Child-minding charges apply only during peak periods including weekends and public holidays due to limited capacity at The Quad Poolside.',
      },
      {
        question: 'Why are arcade games chargeable?',
        answer:
          "Token purchases allow parents to track children's gaming time and spending. Additionally, charging enables the Club to offer newest equipment, including brand-new arcade games imported directly from the United States.",
      },
    ],
  },
  {
    slug: 'the-quad',
    name: 'The Quad',
    type: 'Play Zone (6 Years & Above)',
    description:
      'The Quad is an energetic hangout designed for kids 6 years old and above. Packed with arcade machines, interactive games, a dedicated video gaming room, foosball, table tennis, and more, it\'s the perfect spot for active play and friendly competition.',
    hours:
      'Mondays to Thursdays\n12:00 PM – 7:00 PM\nFridays\n12:00 PM – 8:00 PM\nSaturdays\n9:00 AM – 8:00 PM\nSundays\n9:00 AM – 7:00 PM\n\nTerm Break\nMondays to Thursdays: 10:00 AM – 7:00 PM\nFridays: 10:00 AM – 8:00 PM\nSaturdays: 9:00 AM – 8:00 PM\nSundays: 9:00 AM – 7:00 PM',
    level: 'Basement 1',
    phone: '6739 4444 / 4413',
    email: 'youth@amclub.org.sg',
    image:
      '/uploads/pages/kids/detail/quad-hero.jpeg',
    parentSection: 'Kids',
    parentHref: '/kids',
    ctas: [
      { label: 'The Quad Fees', href: '/documents/kids/the-quad-fees.pdf', isExternal: true },
    ],
    gallery: {
      rows: [
        {
          direction: 'rtl',
          images: [
            '/images/kids/the-quad/gallery/quad-image-a.jpg',
            '/images/kids/the-quad/gallery/dscf-0001.jpg',
            '/images/kids/the-quad/gallery/dscf-0043.jpg',
            '/images/kids/the-quad/gallery/dscf-0079.jpg',
            '/images/kids/the-quad/gallery/dscf-0147.jpg',
            '/images/kids/the-quad/gallery/dscf-0209.jpg',
            '/images/kids/the-quad/gallery/quad-extra.jpg',
          ],
        },
        {
          direction: 'ltr',
          images: [
            '/images/kids/the-quad/gallery/quad-image-b.jpg',
            '/images/kids/the-quad/gallery/dscf-0020.jpg',
            '/images/kids/the-quad/gallery/dscf-0046.jpg',
            '/images/kids/the-quad/gallery/dscf-0119.jpg',
            '/images/kids/the-quad/gallery/dscf-0163.jpg',
            '/images/kids/the-quad/gallery/dscf-0247.jpg',
            '/images/kids/the-quad/gallery/dscf-9917.jpg',
            '/images/kids/the-quad/gallery/dscf-9971.jpg',
          ],
        },
      ],
    },
    faq: [
      {
        question: 'Why are my Guests charged at The Quad?',
        answer:
          'Member usage is prioritized over guests to ensure members can access The Quad whenever desired. Guest fees help minimize overcrowding and discourage misuse. Rates are $2.50 per entry during off-peak hours and $5 during peak hours (Friday evenings, Saturday, Sunday, and public holidays).',
      },
      {
        question: 'Do I really have to sign my child into The Quad Poolside & The Quad?',
        answer:
          'Parents of children under 12 must be present to sign them in and remain on premises. Authorized helpers may bring children only for club-sponsored classes and supervised programs, not for free play.',
      },
      {
        question:
          "I have two children. One is 7 years old and the other is 5 years old. Why can't both of them be at The Quad unsupervised?",
        answer:
          'The Quad requires independent play and environmental awareness. Children 6+ can interact safely and respond to staff guidance. Children 5 and under need more attention and should use The Quad Poolside instead.',
      },
      {
        question: "Why can't my child who is 4.5 year old play at the Wallholla?",
        answer:
          "The Wallholla is a six-level vertical climbing structure requiring independent movement. The Club follows the manufacturer's recommendation restricting access to children 5 years and older.",
      },
      {
        question: 'Why do I have to pay for child-minding at The Quad Poolside?',
        answer:
          'Child-minding charges apply during peak periods including weekends and public holidays due to limited capacity in The Quad Poolside.',
      },
      {
        question: 'Why are arcade games chargeable?',
        answer:
          'Token purchases allow parents oversight of gaming time and spending. The system enables the club to offer newest, imported equipment unavailable elsewhere in Singapore. No refunds apply to utilized tokens.',
      },
    ],
  },
  {
    slug: 'the-quad-studios',
    name: 'The Quad Studios',
    type: 'Classes & Events',
    description:
      'The Quad Studios is a versatile, youth-centered space designed for creativity, learning, and celebration. Split into three dedicated studios – Quad Studio 1, 2 & 3 – this vibrant zone hosts a wide range of kids\' recreational classes and can also be seamlessly transformed into fun, customizable party venues, making them ideal for birthdays and special celebrations.',
    hours:
      'Mondays to Thursdays\n12:00 PM – 7:00 PM\nFridays\n12:00 PM – 8:00 PM\nSaturdays\n9:00 AM – 8:00 PM\nSundays\n9:00 AM – 7:00 PM',
    level: 'Basement 3',
    phone: '6739 4413 / 4432',
    email: 'youth@amclub.org.sg',
    image:
      '/uploads/pages/kids/detail/quadstudio-hero.jpeg',
    parentSection: 'Kids',
    parentHref: '/kids',
    ctas: [
      { label: 'Explore Recreational Classes', href: '/kids/recreational-classes' },
      { label: "Kids' Party Packages", href: '/documents/kids/the-quad-studios-party-package.pdf', isExternal: true },
    ],
    gallery: {
      rows: [
        {
          direction: 'rtl',
          images: [
            '/images/kids/the-quad-studio/gallery/classes-image-a.jpg',
            '/images/kids/the-quad-studio/gallery/classes-1.jpg',
            '/images/kids/the-quad-studio/gallery/classes-3.jpg',
          ],
        },
        {
          direction: 'ltr',
          images: [
            '/images/kids/the-quad-studio/gallery/classes-image-b.jpg',
            '/images/kids/the-quad-studio/gallery/classes-2.jpg',
          ],
        },
      ],
    },
    faq: [...PLACEHOLDER_FAQ],
  },
  {
    slug: 'the-hangout',
    name: 'The Hangout',
    type: 'Teen Zone',
    description:
      'The Hangout is an outdoor chill zone designed for kids and teens who want a relaxed space to unwind with friends. Featuring pool tables, foosball, comfy lounge chairs, and a laid-back vibe, it\'s the perfect spot to kick back after school or on weekends.',
    level: 'Level 1',
    phone: '6739 4444 / 4413',
    email: 'youth@amclub.org.sg',
    image:
      '/uploads/pages/kids/hangout.jpeg',
    parentSection: 'Kids',
    parentHref: '/kids',
  },
  {
    slug: 'recreational-classes',
    name: 'Recreational Classes',
    type: 'Recreational Programs',
    description:
      'Our Recreational Classes support your child\'s holistic development through enriching experiences that spark curiosity and build confidence. With thoughtfully curated programs led by trusted instructors and partners, kids can enjoy a wide range of on-site and off-site classes – from arts and movement to sports and STEM.',
    image: '/images/kids/learning/recreational-classes.jpg',
    parentSection: 'Kids',
    parentHref: '/kids',
    ctas: [
      { label: 'View Classes', href: '/documents/kids/recreational-classes.pdf', isExternal: true },
    ],
  },
  {
    slug: 'camps',
    name: 'Seasonal Kids\' Camps',
    type: 'Programs',
    description: 'Check out the various camps available in the video.',
    video: { url: 'https://youtu.be/d7oyA6sLGVw', title: 'Seasonal Kids\' Camps at The American Club' },
    parentSection: 'Kids',
    parentHref: '/kids',
    ctas: [
      { label: 'Summer Camp 2026', href: '/documents/kids/summer-camp-2026.pdf', isExternal: true },
      { label: 'Cancellation Policy', href: '/documents/kids/camp-cancellation-policy.pdf', isExternal: true },
    ],
    bottomCtas: [
      { label: '4 – 7 Years Schedule', href: '/documents/kids/4-7-camp-schedule.pdf', isExternal: true },
      { label: '4 – 7 Years Registration', href: 'https://forms.office.com/pages/responsepage.aspx?id=tNI3gQWbQ0ue5Ad0V1MxKig5SVI1jCxHmIfXpkheevZUQVhSUTFDVlY2QzEyREJDTVpVVTg3OE44TSQlQCN0PWcu&route=shorturl', isExternal: true },
      { label: '8 Years & Above Schedule', href: '/documents/kids/8-12-camp-schedule.pdf', isExternal: true },
      { label: '8 Years & Above Registration', href: 'https://forms.office.com/pages/responsepage.aspx?id=tNI3gQWbQ0ue5Ad0V1MxKig5SVI1jCxHmIfXpkheevZUQVBNREpQRUc1TUdIR1RYUk1IRUFPRDMyUyQlQCN0PWcu&route=shorturl', isExternal: true },
    ],
    extraSections: [
      {
        title: 'Upcoming Camps',
        content:
          'Camp Eagle Explorers – Summer 2026\nMonday, June 8 – Friday, August 7 (9 weeks)\n\nForge new friendships and make unforgettable spring break memories filled with fun and adventure.',
        groups: [
          {
            heading: '4 – 7 Years Old',
            paragraphs: [
              '9:00 AM – 3:00 PM',
              'The Quad Studios & various locations around Singapore',
            ],
            footer:
              'Member: $140 per day | $700 per week\nGuest: $160 per day | $800 per week\nActivity Highlights: DIY Hands-on & Craft Activities, Music Workshops, Sports, Guided Cooking and more.\nView the full camp schedule and sign up using the links below.',
          },
          {
            heading: '8 Years Old & Above',
            paragraphs: [
              '9:00 AM – 3:00 PM',
              'The Quad Studios & various locations around Singapore',
            ],
            footer:
              'Member: $140 per day | $700 per week\nGuest: $160 per day | $800 per week\nActivity Highlights: Educational Field Trips, Outdoor Sports, Trip to the Singapore Zoo and more.\nView the full camp schedule and sign up using the links below.',
          },
        ],
      },
      {
        title: 'Terms and Conditions',
        bullets: [
          '10K & 15K Niche Group Members are entitled to a 5% discount',
          'VIP & Elite Niche Group Members are entitled to a 8% discount',
          'Get 5% off when siblings attend together',
          'Only one discount can be applied per participant and cannot be combined',
          'Daily rates are available',
        ],
      },
    ],
    quotes: {
      heading: 'What parents say about our camps',
      items: [
        {
          text: 'We decided to send our child to camp to have a fruitful Summer holiday by learning new things and making new friends. He likes the water play best. I appreciate the Youth team celebrating his 5th birthday during the camp.',
          attribution: 'Fiona Wu',
          role: 'Member',
        },
        {
          text: 'Samantha loved the breakfast, snacks and lunch provided and she said that the outdoor water play was her absolute favorite. She also enjoyed meeting and making a lot of new friends, that she has since run into at the Club. For me, I appreciated that we could sign up for the camps weekly. That flexibility was great. I also think being able to have Guests join is a really good option. The camp is a wonderful way for kids to be occupied, active and have a ton of fun in a safe environment during the holidays.',
          attribution: 'Jennifer Lim',
          role: 'Member',
        },
      ],
    },
    faq: [
      {
        question: 'Where do the seasonal camps take place?',
        answer:
          'Our seasonal camps are offered both on-site at The American Club Singapore and off-site at selected locations around Singapore, depending on age group and program design.\n\n• Ages 4–7: On-site at the Club, engaging with club-wide facilities\n• Ages 8 and above: Off-site, visiting a variety of destinations around Singapore\n\nPlease note that camp formats, locations, and experiences may evolve over time as we introduce new programs and enhancements.',
      },
      {
        question: 'Is transportation provided for off-site camps?',
        answer:
          'Yes. Two-way transportation is provided from The American Club Singapore to and from the designated daily location for campers aged 8 and above.',
      },
      {
        question: 'What ages are eligible to join the camps?',
        answer:
          'Our camps are designed for children aged 4 to 12 years old.\n\nChildren who are within three months of the minimum age requirement may be permitted to join, subject to assessment and availability.',
      },
      {
        question: 'Are half-day options available?',
        answer:
          'Half-day options are available only for the on-site camp (ages 4 – 7). Availability may vary by season.',
      },
      {
        question: 'What activities can my child expect during camp?',
        answer:
          'Our Eagle Explorers Camps offer a dynamic mix of age-appropriate activities during school holidays.\n\n• Ages 4 – 7: Indoor, on-site activities including culinary, sports, creative play, movement, STEM exploration, and themed programming inspired by seasonal celebrations (e.g. Christmas, Easter, Halloween).\n• Ages 8 and above: Off-site experiences featuring a blend of sports, outdoor exploration, sightseeing, and educational activities across Singapore.\n\nAll activities are curated by our team and may be adjusted to enhance camper experience or respond to operational needs.',
      },
      {
        question: 'Can the camp program or schedule change?',
        answer:
          'Yes. The American Club Singapore reserves the right to amend camp programs, activities, schedules, locations, or formats due to weather conditions, safety considerations, operational requirements, or future program development.\n\nAny changes will be made with campers’ best interests in mind.',
      },
      {
        question: 'What happens in the event of bad weather?',
        answer:
          'Outdoor activities may be replaced with suitable indoor alternatives. Program schedules are subject to change due to weather conditions.',
      },
      {
        question: 'What are the drop-off times and procedures?',
        answer:
          '• On-site camp (Ages 4 – 7): Registration begins at 9:00am at The Quad Studios, Basement 3.\n• Off-site camp (Ages 8 years old and above): Registration begins at 8:15am at The Quad Studios, Basement 3. The bus departs promptly at 9:00am.\n\nParents should email youth@amclub.org.sg if their child is expected to be late.\n\nIf a camper misses the bus, full charges will still apply, unless a valid medical certificate is provided.',
      },
      {
        question: 'What happens if I am late for pick-up?',
        answer:
          'Please contact The Quad at 6739 4444 / 4432 and provide your child’s name and our team members will inform the camp team of the changes in your child’s pick-up arrangement.',
      },
      {
        question: 'What is the counselor-to-camper ratio?',
        answer:
          '• General camp activities: 1:5 (counselor to camper)\n• Water-play activities and pool days: 1:3 (counselor to camper)',
      },
      {
        question: 'Who is eligible to register for camp?',
        answer:
          '• Returning Absentee Members\nReturning Absentee Members with a valid membership card can register their child for camp. Payment can only be made by credit card. Absentee Members will be required to provide their credit card details to the Youth Desk upon registration.\n\n• New Members who have yet to receive a membership card\nNew Members who have been issued a day pass and have made payment to the Membership team are eligible to register their kids for all camps.\n\n• Guest\nThis camp is open to Member’s Guests. Charges for Guests will be charged to the sponsoring Member’s account. The sponsoring Member will need to sign their Guests into the Club.',
      },
      {
        question: 'What is the cancellation and attendance policy?',
        answer:
          'Camp fees are charged per registered session or week.\n\n• No refunds or make-up sessions will be provided for missed days\n• Full first day fees apply if a camper is unable to attend part or all of the registered camp\n• Fees may only be waived upon submission of a valid medical certificate by the end of the camp week\n\nThis policy is strictly enforced to ensure fairness and program integrity.',
      },
      {
        question: 'What should I do if my child is sick?',
        answer:
          'Please notify The Quad at 6739 4444 / 4432 as soon as possible.\n\nA medical certificate must be submitted by the end of the camp week for any fee consideration.',
      },
      {
        question: 'Do I need to provide an emergency contact?',
        answer:
          'Yes. Emergency contact is mandatory for all campers. This ensures that our team can respond promptly in the event of any unexpected situation.',
      },
    ],
  },
  {
    slug: 'kids-parties',
    name: 'Kids\' Parties',
    type: 'Celebrations',
    description:
      'There\'s no better place to celebrate your child\'s big day than right here at the Club. Our dedicated Youth team brings the fun to life with creative themes, engaging activities, tasty treats, and a show-stopping birthday cake. It\'s joyful, stress-free celebrating – designed to make every moment magical for your child and unforgettable for you.',
    phone: '6739-4413 / 4444',
    email: 'youth@amclub.org.sg',
    image:
      '/uploads/pages/kids/parties.jpg',
    parentSection: 'Kids',
    parentHref: '/kids',
    partyPackages: {
      heading: 'Parties Made Easy',
      subheading: "Fun-filled kids' party packages designed for memorable celebrations.",
      items: [
        {
          name: 'The Quad Studio Party Package',
          image: '/images/kids/kids-parties/quad-studio.jpeg',
          imageAlt: 'The Quad Studio Party Package',
          cta: {
            label: 'Download Brochure',
            href: '/documents/kids/the-quad-studios-party-package.pdf',
            isExternal: true,
          },
        },
        {
          name: 'The Bowling Alley Party Package',
          image: '/images/kids/kids-parties/bowling-alley.jpeg',
          imageAlt: 'The Bowling Alley Party Package',
          cta: {
            label: 'Download Brochure',
            href: '/documents/kids/the-bowling-alley-party-package.pdf',
            isExternal: true,
          },
        },
        {
          name: 'Union Bar x The Bowling Alley',
          image: '/images/kids/kids-parties/union-bar.jpeg',
          imageAlt: 'Union Bar x The Bowling Alley Menu',
          cta: {
            label: 'View Menu',
            href: '/documents/kids/union-bar-bowling-alley-menu.jpg',
            isExternal: true,
          },
        },
      ],
    },
  },
];

export const eventSpacesSubpages: SubpageData[] = [
  {
    slug: 'wedding-celebration',
    name: 'Wedding Celebrations',
    type: 'Weddings',
    description:
      'Celebrate your love story in a setting as meaningful as the moment itself. From grand receptions to intimate gatherings, the Club offers timeless venues, thoughtful service, and bespoke culinary experiences.',
    image: '/uploads/package_wedding_1fc9c3830f.jpg',
    parentSection: 'Private Events & Catering',
    parentHref: '/event-spaces',
    ctas: [
      { label: 'Enquire Now', href: 'mailto:catering@amclub.org.sg', isExternal: true },
    ],
    venueCards: {
      columns: 2,
      cards: [
        {
          heading: 'The Galbraith Ballroom',
          capacity: 'Up to 40 pax',
          description:
            'A grand, pillar-less ballroom created for unforgettable "I do" moments. With elegant layouts, seamless audiovisual support, and dedicated event coordination, the space transforms effortlessly from a heartfelt ceremony to an evening of dining and dancing – an enchanting setting for celebrating your love story in style.',
          image:
            'https://amclubdata28a57492.blob.core.windows.net/media/uploads/venue_galbraith_wedding_db3a81af1f.jpg',
          imageAlt: 'The Galbraith Ballroom',
        },
        {
          heading: 'The 2nd Floor',
          capacity: 'Up to 40 pax',
          description:
            'An intimate and refined setting for smaller weddings and cocktail receptions, The 2nd Floor offers couples a beautifully curated space for a celebration that feels personal, elegant, and effortlessly memorable.',
          image:
            'https://amclubdata28a57492.blob.core.windows.net/media/uploads/venue_2nd_floor_wedding_75f86eb499.jpg',
          imageAlt: 'The 2nd Floor',
        },
      ],
    },
    packageCards: {
      heading: 'Packages',
      columns: 3,
      cards: [
        {
          heading: 'The Classic Collection',
          tagline: 'Ideal for intimate weddings and couples seeking a refined yet simple celebration',
          image:
            'https://amclubdata28a57492.blob.core.windows.net/media/uploads/wedding_package_classic_3f7ac22fc3.jpg',
          benefits: [
            'Exclusive use of The Galbraith Ballroom for up to 4 hours',
            'Elegant round table setup with your choice of linen',
            'Complimentary use of stage and projection system for speeches and visual displays',
            'Fresh floral centerpiece for each table',
            'Complimentary parking for the bridal car',
            'One bottle of wine per table (red or white)',
            'Champagne toast for the couple',
            'Ambient background music to set the perfect mood',
          ],
        },
        {
          heading: 'The Signature Collection',
          tagline: 'For mid-sized weddings with personalized touches and elevated flair',
          image:
            'https://amclubdata28a57492.blob.core.windows.net/media/uploads/wedding_package_signature_6d772ce68d.jpg',
          benefits: [
            'Exclusive use of The Galbraith Ballroom for up to 4 hours',
            'Elegant round table setup with your choice of linen',
            'Complimentary use of stage and projection system for speeches and visual displays',
            'Fresh floral centerpiece for each table & enhanced floral centerpiece for the VIP table',
            'Complimentary parking for 5 vehicles',
            '20-liter barrel of beer for your guests to enjoy',
            'Champagne toast for the couple',
            'Curated background music playlist tailored to your celebration',
          ],
        },
        {
          heading: 'The Prestige Collection',
          tagline: 'Our most comprehensive package, designed for a truly premium wedding experience',
          image:
            'https://amclubdata28a57492.blob.core.windows.net/media/uploads/wedding_package_prestige_e7474f1a37.jpg',
          benefits: [
            'Exclusive use of The Galbraith Ballroom for up to 4 hours',
            'Elegant round table setup with your choice of linen',
            'Complimentary use of stage and projection system for speeches and visual displays',
            'Fresh floral centerpiece for each table & enhanced floral centerpiece for the VIP table',
            'Complimentary parking for 5 vehicles',
            'Professional photographer included for 2 hours',
            'Champagne toast for the couple',
            'One bottle of wine per table (red or white)',
            '20-liter barrel of beer for your guests to enjoy',
            'Curated background music playlist tailored to your celebration',
            'Exclusive door gifts for your guests',
          ],
        },
      ],
    },
  },
  {
    slug: 'corporate-functions',
    name: 'Corporate Functions & Meetings',
    type: 'Corporate',
    description:
      'From large-scale conferences to focused strategy sessions and team-building experiences, the Club offers a versatile portfolio of venues designed to elevate every corporate occasion.',
    image:
      'https://framerusercontent.com/images/rA4tJSoJzyWMv0VxMzxueeloOKI.jpg',
    parentSection: 'Private Events & Catering',
    parentHref: '/event-spaces',
    ctas: [
      { label: 'View Capacity Chart', href: '/documents/event-spaces/capacity-chart.pdf', isExternal: true },
      { label: 'Enquire Now', href: 'mailto:catering@amclub.org.sg', isExternal: true },
    ],
    venueCards: {
      columns: 3,
      cards: [
        {
          heading: 'The Galbraith Ballroom',
          capacity: 'Up to 40 pax',
          description:
            "An elegant, pillar-less ballroom ideal for conferences, large-scale meetings, awards nights, and corporate celebrations. Flexible layouts, professional audiovisual support, and a refined setting make it the Club's premier venue for high-profile events.",
          image:
            'https://amclubdata28a57492.blob.core.windows.net/media/uploads/venue_galbraith_wedding_db3a81af1f.jpg',
          imageAlt: 'The Galbraith Ballroom',
        },
        {
          heading: 'Thinkspace Meeting Rooms',
          capacity: 'Up to 40 pax',
          description:
            'Purpose-built for focus and collaboration, our Thinkspace Meeting Rooms offer contemporary spaces for board meetings, workshops, training sessions, and breakouts – featuring presentation technology and flexible seating in a professional, comfortable setting.',
          image:
            'https://amclubdata28a57492.blob.core.windows.net/media/uploads/venue_thinkspace_adult_library_e682b190f4.jpg',
          imageAlt: 'Thinkspace Meeting Rooms',
        },
        {
          heading: 'The Bowling Alley',
          capacity: 'Up to 28 pax',
          description:
            'A refreshing option for team-building, client entertainment, and informal corporate socials, The Bowling Alley offers a lively setting that blends friendly competition with curated food and beverage experiences.',
          image:
            'https://amclubdata28a57492.blob.core.windows.net/media/uploads/venue_bowling_4120_1c684f909e.jpg',
          imageAlt: 'The Bowling Alley',
        },
      ],
    },
  },
  {
    slug: 'parties',
    name: 'Parties',
    type: 'Social Events',
    description:
      'Bring your celebrations to life in The Galbraith Ballroom – an inviting space perfect for birthdays, anniversaries, festive gatherings, or any reason to come together. With flexible layouts, delicious culinary options, and a team dedicated to making every detail shine, your party becomes an experience that your guests will remember long after the last toast.',
    image:
      'https://framerusercontent.com/images/ccM8q1j1oULvaFRDjnPhBdnPRho.jpg',
    parentSection: 'Private Events & Catering',
    parentHref: '/event-spaces',
    ctas: [
      {
        label: 'View Capacity Chart',
        href: 'https://amclubdata28a57492.blob.core.windows.net/media/uploads/capacity_chart_72e78149a2.pdf',
        isExternal: true,
      },
      { label: 'Enquire Now', href: 'mailto:catering@amclub.org.sg', isExternal: true },
    ],
  },
  {
    slug: 'the-gallbrainth-ballroom',
    name: 'The Galbraith Ballroom',
    type: 'Venue',
    description:
      'With over 3,400 square feet of versatile, pillar-less space, The Galbraith Ballroom is the perfect venue to host your next event or meeting.',
    image:
      'https://framerusercontent.com/images/rA4tJSoJzyWMv0VxMzxueeloOKI.jpg',
    capacity: '200+ pax',
    parentSection: 'Private Events & Catering',
    parentHref: '/event-spaces',
    ctas: [
      { label: 'View Capacity Chart', href: '#' },
      { label: 'Enquire Now', href: '#' },
    ],
  },
  {
    slug: 'thinkspace',
    name: 'Thinkspace',
    type: 'Meeting & Co-working',
    description:
      'A dedicated workspace designed for Members who need more than just a workspace. It houses the Business Center as well as the Adult and Children\'s Libraries.',
    hours: 'Daily 8:00 AM – 10:00 PM',
    level: 'Level 3',
    phone: '6739 4478',
    email: 'meetings@amclub.org.sg',
    capacity: 'Max. 40 Pax',
    image:
      'https://framerusercontent.com/images/mVJDWpQ45XvCKY8vEOKrFiKZta0.jpg',
    parentSection: 'Private Events & Catering',
    parentHref: '/event-spaces',
    ctas: [
      {
        label: 'Services & Rates',
        href: 'https://amclubdata28a57492.blob.core.windows.net/media/uploads/thinkspace_services_flyer_9a83799195.jpg',
        isExternal: true,
      },
    ],
  },
  {
    slug: 'bowling-alley',
    name: 'The Bowling Alley',
    type: 'Entertainment Venue',
    description:
      'The Bowling Alley delivers top-notch, anytime fun for all skill levels. Also ideal for birthday celebrations, corporate gatherings, and small group get-togethers.',
    hours: 'Mon-Thu 12pm-7pm, Fri 12pm-8pm, Sat 10:30am-8pm, Sun 9:30am-7pm',
    level: 'Basement 2',
    phone: '6739 4444/4413',
    email: 'youth@amclub.org.sg',
    image:
      'https://framerusercontent.com/images/FlYhqxJitkFU5PkKTbhHD4Lho.png',
    parentSection: 'Private Events & Catering',
    parentHref: '/event-spaces',
    ctas: [
      {
        label: 'Rates',
        href: 'https://amclubdata28a57492.blob.core.windows.net/media/uploads/bowling_alley_rates_95e27a91a0.jpg',
        isExternal: true,
      },
      {
        label: 'Party Packages',
        href: 'https://amclubdata28a57492.blob.core.windows.net/media/uploads/bowling_alley_party_package_13a9e56910.pdf',
        isExternal: true,
      },
      { label: 'Book A Lane', href: 'mailto:youth@amclub.org.sg', isExternal: true },
    ],
  },
  {
    slug: 'library',
    name: 'Library',
    type: 'Resources',
    description:
      'The Club\'s library has over 20,000 books, 1,000 DVDs, 800 audio-books and 37 different magazines.',
    level: 'Level 3',
    phone: '6739-4380',
    email: 'library@amclub.org.sg',
    image:
      'https://amclubdata28a57492.blob.core.windows.net/media/uploads/venue_thinkspace_adult_library_e682b190f4.jpg',
    parentSection: 'Private Events & Catering',
    parentHref: '/event-spaces',
  },
  {
    slug: 'meeting-rooms',
    name: 'Meeting Rooms & Business Center',
    type: 'Workspace',
    description:
      'Thinkspace offers a dedicated hub for Members seeking a professional yet inviting environment to work, meet, or collaborate.',
    hours: 'Daily 9:00 AM – 7:00 PM',
    level: 'Level 3',
    image:
      'https://amclubdata28a57492.blob.core.windows.net/media/uploads/boardroom_7f09a0e833.jpg',
    parentSection: 'Private Events & Catering',
    parentHref: '/event-spaces',
    ctas: [
      {
        label: 'Service & Rates',
        href: 'https://amclubdata28a57492.blob.core.windows.net/media/uploads/thinkspace_services_flyer_9a83799195.jpg',
        isExternal: true,
      },
    ],
  },
];

export const membershipSubpages: SubpageData[] = [
  {
    slug: 'start-application',
    name: 'Start an Application',
    type: 'Application',
    description:
      'Your journey to becoming a Member at The American Club starts here.\n\nGet to know the requirements to start your application.\n\nAll the items outlined in the Application Checklist must be submitted. Incomplete applications will not be accepted.',
    image:
      'https://framerusercontent.com/images/ALiDWPH3U3VnmiEzcoEet6lPIk.jpeg',
    parentSection: 'Membership',
    parentHref: '/membership',
    ctas: [
      {
        label: 'Application Checklist',
        href: '/documents/membership/forms/application-checklist.pdf',
        isExternal: true,
      },
    ],
    operatingHoursSections: [
      {
        title: 'Membership Office Operating Hours',
        rows: [
          { dayRange: 'Monday to Friday', time: '9:00 AM – 7:00 PM' },
          { dayRange: 'Saturday', time: '10:00 AM – 6:00 PM' },
          { dayRange: '', time: 'Closed on Sunday' },
        ],
      },
    ],
    locationContact: {
      locationLevel: 'Level 1 Lobby (Opposite Tradewinds)',
      phone: '6737 3411',
      email: 'membership@amclub.org.sg',
    },
    downloads: {
      heading: "Forms You'll Need",
      items: [
        { label: 'Application Checklist',              href: '/documents/membership/forms/application-checklist.pdf',              isExternal: true },
        { label: 'Application Form',                   href: '/documents/membership/forms/membership-application-form.pdf',        isExternal: true },
        { label: 'Endorsement Form',                   href: '/documents/membership/forms/endorsement-form.pdf',                   isExternal: true },
        { label: 'Junior Membership Application Form', href: 'https://amclub.jotform.com/253623954879979',                           isExternal: true },
        { label: 'PDPA Acknowledgement Form',          href: '/documents/membership/forms/pdpa-acknowledgement-form.pdf',          isExternal: true },
        { label: 'GIRO Payment Form',                  href: '/documents/membership/forms/giro-payment-form.pdf',                  isExternal: true },
        { label: 'Car Registration Form',              href: 'https://amclub.jotform.com/250688995352877',                          isExternal: true },
      ],
    },
  },
  {
    slug: 'joining-fees',
    name: 'Membership Types & Joining Fees',
    type: 'Pricing',
    description:
      'Five distinct membership types designed for different eligibility criteria. All fees are inclusive of prevailing GST.',
    image:
      'https://framerusercontent.com/images/uA8oZioX84LwYdHwDPogQJhk13I.jpg',
    parentSection: 'Membership',
    parentHref: '/membership',
    ctas: [
      { label: 'Start an Application', href: '/membership/start-application' },
      { label: 'View Payment Plans', href: '#' },
    ],
  },
  {
    slug: 'referal',
    name: 'Refer a Friend',
    type: 'Referral Program',
    description:
      'Introduce a friend to become a Member of The American Club and get rewarded with Club dining vouchers.',
    parentSection: 'Membership',
    parentHref: '/membership',
    ctas: [
      {
        label: 'Make a Referral',
        href: 'https://amclub.jotform.com/250639099479878',
      },
    ],
  },
  {
    slug: 'niche-group-membership',
    name: 'Niche Group Membership',
    type: 'Loyalty',
    description:
      'The American Club Niche Group Membership rewards Members for their membership tenure or spending. VIP Gold, 10K, 15K & Elite are the four tiers.',
    phone: '6739-4331',
    email: 'membership@amclub.org.sg',
    image:
      'https://framerusercontent.com/images/9Wx98RDzkCICF2QMOXQadZLRTH4.jpg',
    parentSection: 'Membership',
    parentHref: '/membership',
    tierCards: {
      heading: 'The Niche Group Membership Tiers',
      subheading:
        'From your first tier to the highest level, each level brings added benefits created to enrich your time at your Club.',
      cards: [
        {
          name: 'Elite Membership',
          description:
            'A minimum of $20,000 cumulative calendar year spending, excluding monthly dues.',
          gradientFrom: 'rgb(158, 158, 158)',
          gradientTo: 'rgb(9, 18, 51)',
          benefits: [
            'Welcome dining voucher worth $250 and $150 sên Spa voucher.',
            'Annual welcome gift.',
            'Wedding Anniversary Privilege.',
            'Exclusive privileges during birthday month',
            'Annual Elite party invites.',
            'Up to 25% dining discounts.',
            'Up to 20% off treatments at sên Spa.',
            'Membership card replacement fee waiver ($10 for the first card replacement, $50 for subsequent replacements).',
            'Ad-hoc discounts for products, events etc.',
            'Free parking for two cars (fee waiver will be applied at the next annual billing cycle in July).',
          ],
        },
        {
          name: 'VIP Gold',
          description:
            'Members are accorded this status based on a minimum tenure of 25 years of active membership.',
          gradientFrom: 'rgb(255, 231, 158)',
          gradientTo: 'rgb(150, 121, 59)',
          benefits: [
            'A welcome dining voucher worth $200.',
            'Exclusive privileges during birthday month',
            'Annual VIP party invites.',
            'Up to 20% dining discounts.',
            'Up to 20% off treatments at sên Spa.',
            'Ad-hoc discounts for products, events etc.',
          ],
        },
        {
          name: '15K Membership',
          description:
            'A minimum of $20,000 cumulative calendar year spending, excluding monthly dues.',
          gradientFrom: 'rgb(53, 173, 242)',
          gradientTo: 'rgb(30, 86, 156)',
          benefits: [
            'A welcome dining voucher worth $200.',
            'Exclusive privileges during birthday month',
            'Up to 20% dining discounts.',
            'Up to 15% off treatments at sên Spa.',
            'Membership card replacement fee waiver ($10 for the first card replacement, $50 for subsequent replacements).',
            'Ad-hoc discounts for products, events etc.',
            'Free parking for one car (fee waiver will be applied at the next annual billing cycle in July).',
          ],
        },
        {
          name: '10K Membership',
          description:
            'A minimum of $10,000 cumulative calendar year spending, excluding monthly dues.',
          gradientFrom: 'rgb(129, 97, 255)',
          gradientTo: 'rgb(56, 38, 128)',
          benefits: [
            'Exclusive privileges during birthday month',
            'Up to 15% dining discounts.',
            'Up to 15% off treatments at sên Spa.',
            'Membership card replacement fee waiver ($10 for the first card replacement, $50 for subsequent replacements).',
            'Ad-hoc discounts for products, events etc.',
          ],
        },
      ],
    },
  },
  {
    slug: 'reciprocal-clubs',
    name: 'Reciprocal Clubs',
    type: 'Partner Clubs',
    description:
      'As a Member of The American Club, enjoy privileged access to over 150 distinguished clubs worldwide, extending the comfort of membership wherever you travel.',
    image:
      'https://framerusercontent.com/images/bdz4bVfeQtZyQC6ebpW09r3ujU.jpg',
    parentSection: 'Membership',
    parentHref: '/membership',
    ctas: [
      { label: 'List of Reciprocal Clubs', href: '#' },
      { label: 'Letter of Introduction', href: '#' },
    ],
  },
];

export const homeSubpages: SubpageData[] = [
  {
    slug: 'contact-us',
    name: 'Contact Us',
    type: 'Contact',
    description:
      '10 Claymore Hill, Singapore 229573. Sunday to Thursday: 6:00 AM - 11:00 PM Friday, Saturday & Eve of PH: 6:00 AM - 12:00 AM',
    phone: '+65 6737-3411',
    email: 'info@amclub.org.sg',
    image:
      'https://framerusercontent.com/images/YCNFJanBoXdJFKJlpWh9tMfwrQ.jpg',
    parentSection: 'The American Club',
    parentHref: '/home',
    ctas: [{ label: 'Tell Us What You Think', href: 'https://amclub.jotform.com/252152095231953', isExternal: true }],
  },
  {
    slug: 'advertise-with-us',
    name: 'Advertise with Us',
    type: '',
    description:
      'Reach a community of over 11,000 engaged Members at The American Club.\n\nWith a suite of targeted communication channels, we provide advertising opportunities that connect your message with our Member community in a thoughtful and purposeful way.',
    image: '/marketing/advertise-with-us.jpg',
    parentSection: 'The American Club',
    parentHref: '/home',
    ctas: [
      { label: 'View Advertising Rate Card', href: '/documents/ad-rate-card.pdf', isExternal: true },
      { label: 'Enquire Now', href: 'mailto:marketing@amclub.org.sg', isExternal: true },
    ],
    extraSections: [
      {
        title: 'Sponsorship',
        content:
          'Access a Premium Network of Affluent, International Members\n\nOur sponsors and strategic partners gain prominent brand exposure and meaningful engagement opportunities within our Club community. Reach out to schedule a discussion on the best channels to showcase your brand.',
        contactRows: [
          { label: 'Phone', value: '6739-4388' },
          { label: 'Email', value: 'marketing@amclub.org.sg' },
        ],
      },
    ],
  },
  {
    slug: 'news',
    name: 'Club News',
    type: 'News',
    description:
      'Stay up to date with the latest happenings and announcements at The American Club.',
    parentSection: 'The American Club',
    parentHref: '/home',
  },
  {
    slug: 'gallery',
    name: 'Gallery',
    type: 'Photo Gallery',
    description:
      'Browse photos from recent events and celebrations at The American Club.',
    parentSection: 'The American Club',
    parentHref: '/home',
  },
];

export const allSubpages: SubpageData[] = [
  ...diningSubpages,
  ...fitnessSubpages,
  ...kidsSubpages,
  ...eventSpacesSubpages,
  ...membershipSubpages,
  ...homeSubpages,
];

export function getSubpage(
  section: string,
  slug: string
): SubpageData | undefined {
  const map: Record<string, SubpageData[]> = {
    dining: diningSubpages,
    fitness: fitnessSubpages,
    kids: kidsSubpages,
    'event-spaces': eventSpacesSubpages,
    membership: membershipSubpages,
    'home-sub': homeSubpages,
  };
  return map[section]?.find((s) => s.slug === slug);
}
