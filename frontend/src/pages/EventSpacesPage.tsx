import { Hero } from '../components/blocks/Hero';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { PrivateEventPackages } from '../components/event-spaces/PrivateEventPackages';
import { DistinctiveEventSpaces } from '../components/event-spaces/DistinctiveEventSpaces';
import { OffsiteCateringServices } from '../components/event-spaces/OffsiteCateringServices';

const FRAMER = 'https://framerusercontent.com/images';
const HERO_IMAGE = `${FRAMER}/PuKNfYksOTvRcyOFG9aXzc7w0.jpg?width=1920&height=786`;
const PACKAGE_WEDDING = `${FRAMER}/nNP9pUxK7m12rJImnKZo4zstIiU.jpg?width=612&height=408`;
const PACKAGE_CORPORATE = `${FRAMER}/rA4tJSoJzyWMv0VxMzxueeloOKI.jpg?width=612&height=404`;
const PACKAGE_PARTIES = `${FRAMER}/ccM8q1j1oULvaFRDjnPhBdnPRho.jpg?width=530&height=403`;
const VENUE_GALBRAITH = `${FRAMER}/mPx8EeMoHlWGX7P00gKiDTzIz8.jpeg?width=1600&height=1067`;
const VENUE_THINKSPACE = `${FRAMER}/mVJDWpQ45XvCKY8vEOKrFiKZta0.jpg?width=2048&height=1366`;
const VENUE_BOWLING = `${FRAMER}/REVQbi4R6SUhVy4r7SO84afJT4.jpeg?width=1600&height=1065`;
const VENUE_QUAD = `${FRAMER}/e8U02pyihI3UwamXPYDkbsr2U.jpeg?width=1600&height=1065`;
const CATERING_STYLES = `${FRAMER}/yNckhdqcjyaS8xdhULIdJqi0FQo.jpg?width=612&height=407`;
const CATERING_CULINARY = `${FRAMER}/zj9VdB2uW3kM5V74ZrziM12GV8.jpg?width=612&height=408`;
const CATERING_DIETARY = `${FRAMER}/j0l3s98VsUxfYokhlUGW7Sh0.jpg?width=612&height=407`;
const CATERING_2GO = `${FRAMER}/0blJZhtPby5jQ7WWkC5dXrZiDPQ.png?width=612&height=408`;

export default function EventSpacesPage() {
  return (
    <>
      <Hero
        heading="Host Your Next Event with Us"
        subheading="From weddings and business milestones to meaningful moments with your loved ones, we create experiences that are thoughtfully planned and well executed."
        backgroundImage={HERO_IMAGE}
        variant="compact"
      />

      <PrivateEventPackages
        enquireCta={{ label: 'Make an Enquiry', href: '#enquire' }}
        items={[
          {
            name: 'Wedding Celebrations',
            tagline: 'Your Day. Your Way. Perfectly Executed',
            image: PACKAGE_WEDDING,
            serviceFeatures: ['Custom wedding cake', 'Professional photography'],
            venues: ['The Galbraith Ballroom', 'The 2nd Floor'],
            cta: { label: 'View Packages', href: '/event-spaces/wedding-celebration' },
          },
          {
            name: 'Corporate Functions',
            tagline: 'Blend professionalism with hospitality',
            image: PACKAGE_CORPORATE,
            serviceFeatures: [
              'Video conferencing',
              'Stage, podium, AV support',
              'Coffee breaks & lunch',
            ],
            venues: ['The Galbraith Ballroom', 'Thinkspace Meeting Rooms', 'The Bowling Alley'],
            cta: { label: 'View Packages', href: '/event-spaces/corporate-functions' },
          },
          {
            name: 'Parties',
            tagline: 'Birthdays, Anniversaries & Milestones',
            image: PACKAGE_PARTIES,
            serviceFeatures: [
              'Customized Menus',
              'Full Bar Service',
              'Professional event staff',
              'Dietary Flexibility',
            ],
            venues: ['The Galbraith Ballroom', 'The Bowling Alley', 'The Quad Studios'],
            cta: { label: 'View Packages', href: '/event-spaces/parties' },
          },
        ]}
      />

      <DistinctiveEventSpaces
        items={[
          {
            name: 'The Galbraith Ballroom',
            capacity: ['3400 sqm'],
            description:
              'The Galbraith Ballroom is a versatile, beautifully designed venue that adapts effortlessly to any occasion. With flexible setups and tailored packages, it transforms every gathering into a memorable experience.',
            image: VENUE_GALBRAITH,
            cta: { label: 'Learn More', href: '/event-spaces/the-gallbrainth-ballroom' },
          },
          {
            name: 'Thinkspace',
            capacity: ['Meeting Rooms: From 2 – 16 pax', 'Events Space: Up to 40 pax'],
            description:
              "A dedicated space for Members who need more than just a workspace. Featuring adult and children's libraries, quiet focus areas, meeting rooms, and versatile spaces for small-scale events and networking sessions.",
            image: VENUE_THINKSPACE,
            cta: { label: 'Learn More', href: '/event-spaces/thinkspace' },
          },
          {
            name: 'The Bowling Alley',
            capacity: ['Up to 50 pax'],
            description:
              'Beyond the lanes, The Bowling Alley doubles as a flexible venue for corporate events and private celebrations, where friendly competition meets a lively yet relaxed atmosphere.',
            image: VENUE_BOWLING,
            cta: { label: 'Learn More', href: '/event-spaces/bowling-alley' },
          },
          {
            name: 'The Quad Studios',
            capacity: ['Up to 50 pax'],
            description:
              "A vibrant, youth-focused venue for kids' parties and celebrations. With three flexible spaces – Quad Studio 1, 2 & 3 – it transforms effortlessly into fun, customizable settings for birthdays and special milestones.",
            image: VENUE_QUAD,
            cta: { label: "Kids' Party Packages", href: '/kids' },
          },
        ]}
      />

      <OffsiteCateringServices
        ctas={[
          { label: 'View Menu', href: '#menu' },
          { label: 'Enquire Now', href: '#enquire' },
        ]}
        pillars={[
          {
            heading: 'Service Styles',
            subheading: 'Select the service format that best suits your event.',
            items: [
              'Plated Seated Dinners',
              'Buffet Stations',
              'Cocktail Receptions',
              'Family-style Service',
            ],
            image: CATERING_STYLES,
          },
          {
            heading: 'Culinary Expertise',
            subheading: 'Delicious, diverse cuisine tailored to your preferences.',
            items: ['American Favorites', 'Contemporary Asian'],
            image: CATERING_CULINARY,
          },
          {
            heading: 'Dietary Considerations',
            subheading: 'Dietary requirements thoughtfully accommodated.',
            items: ['Vegetarian', 'Gluten-free Options', 'Allergen Protocols', 'Menu Customization'],
            image: CATERING_DIETARY,
          },
        ]}
        subBanner={{
          heading: 'Catering2Go!',
          body: 'Off-site catering made effortless. Enjoy your Club favorites wherever the occasion takes you.',
          image: CATERING_2GO,
          cta: { label: 'Order Now', href: '#order' },
        }}
      />

      <CtaBanner
        heading="Plan Your Next Event With Us"
        body="Our Club membership opens the door to exceptional event spaces, thoughtfully curated experiences, and seamless off-site catering."
        variant="light"
        ctas={[
          { label: 'Explore Membership', href: '/membership' },
          { label: 'Book a Club Tour', href: '/contact-us' },
        ]}
      />
    </>
  );
}
