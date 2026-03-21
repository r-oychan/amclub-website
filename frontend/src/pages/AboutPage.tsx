import { Hero } from '../components/blocks/Hero';
import { TextBlock } from '../components/blocks/TextBlock';
import { StatsCounter } from '../components/blocks/StatsCounter';
import { TeamGrid } from '../components/blocks/TeamGrid';
import { FeatureGrid } from '../components/blocks/FeatureGrid';
import { CtaBanner } from '../components/blocks/CtaBanner';

export default function AboutPage() {
  return (
    <>
      <Hero
        heading="About the Club"
        subheading="77 Years of Heritage, Community and Connection"
        variant="compact"
      />

      <TextBlock
        body="Since 1948, The American Club has been Singapore's cherished sanctuary in the heart of Orchard, where generations of Members from over 60 nations come together to build lifelong friendships, celebrate shared moments, and enjoy a true home away from home."
        timeline="In 2000, the Club's Fitness & Leisure expanded its offerings with more fitness options, including more Aquatics classes and adult recreational and fitness classes. The Club has now evolved to become true home away from home destination for Members, local and overseas alike."
      />

      <StatsCounter
        label="The Club Today"
        stats={[
          { value: '11,000+', label: 'Members' },
          { value: '90+', label: 'Nationalities' },
          { value: '77+', label: 'Years of Heritage' },
          { value: '25', label: 'Committees' },
        ]}
        dark
      />

      <TextBlock
        vision='A world class Club offering Members a "home away from home" with excellent service and facilities.'
        mission="To be the Members' Club and employer of choice in Singapore, striving to continuously improve Member engagement and satisfaction, while embracing our unique American and Canadian cultures within our Singaporean community."
      />

      <TextBlock
        heading="Club Governance"
        body={"The governance structure of the Club is that it is member-owned. There are 25 committees which provide plenty of opportunities to get involved as a volunteer. The committees support the Club management through strategic counsel and policy making.\n\nOnly the General Committee (GC) has approval power.\n\nEach year at the Annual General Meeting (AGM) in November, six spots are available for election/re-election for a two-year tenure. From the GC, the Executive Committee (EXCO) is formed each year in April."}
        ctas={[
          { label: 'Volunteer Interest Form', href: '#' },
          { label: 'Committee List', href: '#' },
          { label: 'Volunteer Code of Conduct', href: '#' },
        ]}
      />

      <TeamGrid
        heading="General Committee"
        members={[
          { name: 'Daniel Gewirtz', role: 'President' },
          { name: 'Tessa Pang', role: 'Secretary' },
          { name: 'Alisha Barnes', role: 'Secretary' },
          { name: 'Terry Kim', role: 'Treasurer' },
          { name: 'Charles Santos', role: 'Member at Large' },
          { name: 'Kate Park', role: 'Member at Large' },
          { name: 'Kenny Liu', role: 'Member at Large' },
          { name: 'Marcella Sullivan', role: 'Member at Large' },
          { name: 'Michael Schindler', role: 'Member at Large' },
          { name: 'Ngiam Siew Wei', role: 'Member at Large' },
          { name: 'Priyanka Bhalla', role: 'Member at Large' },
          { name: 'Ted Teo', role: 'Member at Large' },
          { name: 'Michelle Reeb', role: 'American Association of Singapore Representative' },
          { name: 'Autumn Vavoso', role: 'American Women\'s Association Representative' },
          { name: 'Sandra Johnson', role: 'Canadian Association of Singapore Representative' },
        ]}
      />

      <FeatureGrid
        heading="Club Advocacy"
        subheading="Everyday is Earth Day at the Club"
        body="At The American Club, we are committed to enhancing sustainability and expanding environmentally-friendly practices."
        listItems={[
          "Meat alternatives on the Club's restaurant menus",
          'Biodegradable straws in all restaurants',
          'Recycling and sorting bins are located throughout the Club',
          'Food takeaway packaging are made from sustainable materials',
          'Sale of reusable tumblers and coffee cups at Central',
          'All lighting fixtures have been replaced with LED bulbs that are energy efficient and emit less heat',
        ]}
      />

      <TeamGrid
        heading="Club Management"
        members={[
          {
            name: 'Christine Kaelbel-Sheares',
            role: 'General Manager',
            bio: 'Christine is a seasoned executive with a diverse global leadership experience. She has held key roles in prestigious hotels in Singapore and the United States.',
          },
        ]}
      />

      <CtaBanner
        heading="Become Part of Our Story"
        body="Join a community that celebrates heritage, connection, and belonging."
        ctas={[
          { label: 'Explore Membership', href: '/membership' },
          { label: 'Book a Club Tour', href: '#' },
        ]}
      />
    </>
  );
}
