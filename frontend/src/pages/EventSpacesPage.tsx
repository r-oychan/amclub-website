import { Hero } from '../components/blocks/Hero';
import { CardGrid } from '../components/blocks/CardGrid';
import { FeatureGrid } from '../components/blocks/FeatureGrid';
import { CtaBanner } from '../components/blocks/CtaBanner';

export default function EventSpacesPage() {
  return (
    <>
      <Hero
        heading="Host Your Next Event with Us"
        subheading="From weddings and business milestones to meaningful moments with your loved ones, we create experiences that are thoughtfully planned and well executed."
        variant="compact"
      />

      <CardGrid
        heading="Private Event Packages"
        subheading="Carefully curated venues with customizable packages for every occasion."
        columns={3}
        variant="venue"
        items={[
          {
            name: 'Wedding Celebrations',
            tagline: 'Your Day. Your Way. Perfectly Executed',
            serviceFeatures: ['Custom wedding cake', 'Professional photography'],
            venues: ['The Galbraith Ballroom', 'The 2nd Floor'],
            cta: 'View Packages',
          },
          {
            name: 'Corporate Functions',
            tagline: 'Blend professionalism with hospitality',
            serviceFeatures: ['Video conferencing', 'Stage, podium, AV support', 'Coffee breaks & lunch'],
            venues: ['The Galbraith Ballroom', 'Thinkspace Meeting Rooms', 'The Bowling Alley'],
            cta: 'View Packages',
          },
          {
            name: 'Parties',
            tagline: 'Birthdays, Anniversaries & Milestones',
            serviceFeatures: ['Customized Menus', 'Full Bar Service', 'Professional event staff', 'Dietary Flexibility'],
            venues: ['The Galbraith Ballroom', 'The Bowling Alley', 'The Quad Studios'],
            cta: 'View Packages',
          },
        ]}
      />

      <CardGrid
        heading="Distinctive Event Spaces"
        subheading="Four curated venues, each with a distinct character."
        columns={4}
        items={[
          { name: 'The Galbraith Ballroom', capacity: '3400 SQM', description: 'A versatile, beautifully designed venue that adapts effortlessly to any occasion.', ctas: ['Learn More'] },
          { name: 'Thinkspace', capacity: 'Meeting Rooms: 2-16 pax, Events Space: up to 40 pax', description: 'A dedicated space for Members who need more than just a workspace. Featuring libraries, quiet focus areas, meeting rooms.', ctas: ['Learn More'] },
          { name: 'The Bowling Alley', capacity: 'Up to 50 pax', description: 'Flexible venue for corporate events and private celebrations.', ctas: ['Learn More'] },
          { name: 'The Quad Studios', capacity: 'Up to 50 pax', description: "A vibrant, youth-focused venue for kids' parties and celebrations.", ctas: ["Kids' Party Packages"] },
        ]}
      />

      <FeatureGrid
        heading="Off-site Catering Services"
        body="Bring The American Club's signature dishes and service to your chosen venue."
        items={[
          { heading: 'Plated Seated Dinners' },
          { heading: 'Buffet Stations' },
          { heading: 'Cocktail Receptions' },
          { heading: 'Family-style Service' },
        ]}
        ctas={[
          { label: 'View Menu' },
          { label: 'Enquire Now' },
        ]}
      />

      <CtaBanner
        heading="Plan Your Next Event With Us"
        body="Our Club membership opens the door to exceptional event spaces, thoughtfully curated experiences, and seamless off-site catering."
        ctas={[
          { label: 'Explore Membership', href: '/membership' },
          { label: 'Book a Club Tour' },
        ]}
      />
    </>
  );
}
