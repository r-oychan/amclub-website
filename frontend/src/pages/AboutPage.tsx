import { Hero } from '../components/blocks/Hero';
import { TextBlock } from '../components/blocks/TextBlock';
import { StatsCounter } from '../components/blocks/StatsCounter';
import { TeamGrid } from '../components/blocks/TeamGrid';
import { FeatureGrid } from '../components/blocks/FeatureGrid';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { PartnerOrganizations } from '../components/blocks/PartnerOrganizations';
import { AwardsGrid } from '../components/blocks/AwardsGrid';

const FRAMER_ASSETS = 'https://framerusercontent.com/images';

export default function AboutPage() {
  return (
    <>
      <Hero
        heading="About the Club"
        subheading="77 Years of Heritage, Community and Connection"
        variant="compact"
        backgroundImage={`${FRAMER_ASSETS}/5Wnl6bOkKlpqZIDwN798ZEhqs.jpg?width=2560`}
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
        image={`${FRAMER_ASSETS}/ALiDWPH3U3VnmiEzcoEet6lPIk.jpeg?width=900`}
        imagePosition="left"
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
          { name: 'Daniel Gewirtz', role: 'President', image: `${FRAMER_ASSETS}/yQzuzYzL7t5XQaH5upKt7gruR9Q.png?width=300` },
          { name: 'Tessa Pang', role: 'Secretary', image: `${FRAMER_ASSETS}/0WIEM72I1vgWDuMYqLCBgOrk.png?width=300` },
          { name: 'Alisha Barnes', role: 'Secretary', image: `${FRAMER_ASSETS}/jxU7bm20Hkfa0nt1lQIJg1xft8Q.png?width=300` },
          { name: 'Terry Kim', role: 'Treasurer', image: `${FRAMER_ASSETS}/yQzuzYzL7t5XQaH5upKt7gruR9Q.png?width=300` },
          { name: 'Charles Santos', role: 'Member at Large', image: `${FRAMER_ASSETS}/bapIqliILvMJllzgOM301TfFbFE.png?width=300` },
          { name: 'Kate Park', role: 'Member at Large', image: `${FRAMER_ASSETS}/yQzuzYzL7t5XQaH5upKt7gruR9Q.png?width=300` },
          { name: 'Kenny Liu', role: 'Member at Large', image: `${FRAMER_ASSETS}/yQzuzYzL7t5XQaH5upKt7gruR9Q.png?width=300` },
          { name: 'Marcella Sullivan', role: 'Member at Large', image: `${FRAMER_ASSETS}/7dTc00R0ddDdnpQZ18pBIezRw.png?width=300` },
          { name: 'Michael Schindler', role: 'Member at Large', image: `${FRAMER_ASSETS}/yQzuzYzL7t5XQaH5upKt7gruR9Q.png?width=300` },
          { name: 'Ngiam Siew Wei', role: 'Member at Large', image: `${FRAMER_ASSETS}/LgG3L2KEkC3NpG2yO94nYJQ0yU.png?width=300` },
          { name: 'Priyanka Bhalla', role: 'Member at Large', image: `${FRAMER_ASSETS}/7fAHglucQZFyxm4xbLmhwxyv6wI.png?width=300` },
          { name: 'Ted Teo', role: 'Member at Large', image: `${FRAMER_ASSETS}/tDBTdmmp2D543zjHGjP6DhuvMtA.png?width=300` },
          { name: 'Michelle Reeb', role: 'American Association of Singapore Representative', image: `${FRAMER_ASSETS}/VFJQqqNixmxna4NkTpsiXjzhgY.png?width=300` },
          { name: 'Autumn Vavoso', role: "American Women's Association Representative", image: `${FRAMER_ASSETS}/kFNEb2osoQAJhtv7ojPg3YVE8P4.png?width=300` },
          { name: 'Sandra Johnson', role: 'Canadian Association of Singapore Representative', image: `${FRAMER_ASSETS}/V4o3foYlXnyBgeTKoXF0K1UXU.png?width=300` },
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
        asideImage={`${FRAMER_ASSETS}/pQCJtSqu7qKYWmvnmEruNd1GkI.png?width=900`}
        asideImagePosition="left"
      />

      <TeamGrid
        heading="Club Management"
        members={[
          {
            name: 'Christine Kaelbel-Sheares',
            role: 'General Manager',
            image: `${FRAMER_ASSETS}/Kc4g3gqcDM59xyogzsi9CH62xbo.jpeg?width=600`,
          },
          {
            name: 'Shah Bahari',
            role: 'Director of Food & Beverage',
            image: `${FRAMER_ASSETS}/4Ef2YIpYt3NnB45ttxaPrldXQg.jpg?width=600`,
          },
          {
            name: 'Audrey Lim',
            role: 'Director of Finance',
            image: `${FRAMER_ASSETS}/w35xKyRe5sLU0f3k3a7zPVD7w.jpeg?width=600`,
          },
          {
            name: 'Vincent Lim',
            role: 'Director of Human Resources',
            image: `${FRAMER_ASSETS}/4QRsPlTR6NqbnGUgLe8aJ9XOK0M.jpg?width=600`,
          },
          {
            name: 'Chang Lim',
            role: 'Director of Information Technology',
            image: `${FRAMER_ASSETS}/eJi2gxT39VUQXoqBU9zkL38ZHM.jpg?width=600`,
          },
          {
            name: 'Julie Zul',
            role: 'Director of Member Engagement',
            image: `${FRAMER_ASSETS}/jyPhDb3hmo4PPzz1fTXNgrcX3fQ.jpg?width=600`,
          },
        ]}
      />

      <PartnerOrganizations
        heading="Partner Organizations"
        groups={[
          {
            logos: [
              { name: 'American Association of Singapore', image: `${FRAMER_ASSETS}/c9nSNg8vzoJJHIWBfKiFkk4cIXE.jpg?width=400` },
              { name: "American Women's Association", image: `${FRAMER_ASSETS}/rLS9eBazhnxSlFrZAWKWsQRapzc.png?width=400` },
              { name: 'American Chamber of Commerce', image: `${FRAMER_ASSETS}/VwJAdprWeM5ZjEdN2h5pE3GTTXE.jpg?width=400` },
              { name: 'Canadian Association of Singapore', image: `${FRAMER_ASSETS}/M8rcJzc7UqkbTP4oyYARg5PHA.png?width=400` },
              { name: 'Partner 5', image: `${FRAMER_ASSETS}/lmRS69FfwkUd6i2HlH6joR77k.jpg?width=400` },
              { name: 'Partner 6', image: `${FRAMER_ASSETS}/Hub3OXj3qHL5sK9ztNlbmZKXkXg.jpg?width=400` },
              { name: 'Partner 7', image: `${FRAMER_ASSETS}/lEDAQcu7uHeWdNSRl5WoHacAk.png?width=400` },
            ],
          },
          {
            heading: 'Strategic Partners',
            logos: [
              { name: 'Strategic Partner 1', image: `${FRAMER_ASSETS}/QP5J74CtuaE6APcl4T8BrxjsA.png?width=600` },
              { name: 'Strategic Partner 2', image: `${FRAMER_ASSETS}/g4s9KjETINwf0lO3CxJasNdquYA.png?width=600` },
            ],
          },
        ]}
      />

      <AwardsGrid
        heading="Awards & Accolades"
        items={[
          { title: 'ISOCert-CSA Cyber Essentials and Cyber Trust Certification', issuer: 'ISOCert', image: `${FRAMER_ASSETS}/h7Gh3reWTA8slWV2Hq7IZ8kbTbg.png?width=400` },
          { title: 'Top 100 Platinum City Clubs of the World 2024-2025', issuer: 'PlatinumClubNet™', image: `${FRAMER_ASSETS}/fKdhSQyCEYKHn7CTGSTwy5LVw.png?width=400` },
          { title: 'Tripartite Alliance Award 2018', issuer: 'TAFEP', image: `${FRAMER_ASSETS}/wsCJo3GHKlnDKttHSA0J3niW8jo.jpg?width=400` },
          { title: 'TAFEP Exemplary Employer Award 2016', issuer: 'TAFEP', image: `${FRAMER_ASSETS}/9aYuE7cHSsUVCvYzuB6AT2jl0.png?width=400` },
          { title: 'SG Clean Quality Mark', issuer: 'NEA', image: `${FRAMER_ASSETS}/eMWqj52OM5dzojVwSahw3CYu1k.png?width=400` },
          { title: 'Green Mark Certification', issuer: 'BCA', image: `${FRAMER_ASSETS}/WEmHXC6rfdGCEb043B1OdLgpDWc.jpg?width=400` },
          { title: 'Water Efficient Building (Basic) Certification', issuer: 'PUB', image: `${FRAMER_ASSETS}/vEt0cbGAip2wDbkj41Elj9MUJw.jpg?width=400` },
          { title: 'BizSafe Level 3', issuer: 'Workplace Safety and Health Council', image: `${FRAMER_ASSETS}/z0JgtmwsuQK4dqSSUyTXPeE8.jpg?width=400` },
          { title: 'Bronze Winner for the Best Social Club 2024', issuer: 'Expat Living', image: `${FRAMER_ASSETS}/Aj2u7VMzwgal5ieXNQoWarOeZs.jpg?width=400` },
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
