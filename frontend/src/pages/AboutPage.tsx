import { Hero } from '../components/blocks/Hero';
import { TextBlock } from '../components/blocks/TextBlock';
import { StatsCounter } from '../components/blocks/StatsCounter';
import { TeamGrid } from '../components/blocks/TeamGrid';
import { FeatureGrid } from '../components/blocks/FeatureGrid';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { PartnerOrganizations } from '../components/blocks/PartnerOrganizations';
import { AwardsGrid } from '../components/blocks/AwardsGrid';
import { HeritageTimeline } from '../components/blocks/HeritageTimeline';
import { GovernanceBlock } from '../components/blocks/GovernanceBlock';
import { ManagementSlider } from '../components/blocks/ManagementSlider';

const FRAMER_ASSETS = 'https://framerusercontent.com/images';

export default function AboutPage() {
  return (
    <>
      <Hero
        heading="About the Club"
        variant="compact"
        backgroundImage={`${FRAMER_ASSETS}/5Wnl6bOkKlpqZIDwN798ZEhqs.jpg?width=2560`}
      />

      <HeritageTimeline
        heading="77 Years of Heritage, Community and Connection"
        body="Since 1948, The American Club has been Singapore's cherished sanctuary in the heart of Orchard, where generations of Members from over 60 nations come together to build lifelong friendships, celebrate shared moments, and enjoy a true home away from home."
        backgroundImage={`${FRAMER_ASSETS}/5Wnl6bOkKlpqZIDwN798ZEhqs.jpg?width=2560`}
        slides={[
          {
            year: '1966',
            body: 'In what was regarded as "one of the most significant improvements of the Club\'s amenities in its 19-year history", a new Bowling Alley Complex was built, housing an eight-lane bowling alley, an air-conditioned cocktail lounge, a library, a card room, conference rooms, and office for the American community organization.',
            image: `${FRAMER_ASSETS}/LqyNjKZmAT6eQLWMGwjqYJ4qvyk.jpg?width=1600`,
          },
          {
            year: '1970',
            body: "The Presidential Room - formed of a rooftop garden room and serving as a cocktail lounge and multi-purpose room - was built. The Eagle's Nest was opened to answer the long-standing need of Members for a casual dining facility accessible from all activity areas. It featured a light meals, snacks and a relaxed dress code.",
            image: `${FRAMER_ASSETS}/q4RJmABpcLaL18xk0ENsstWi2E.jpg?width=1600`,
          },
          {
            year: '1978',
            body: 'The Club purchased one acre of land on Claymore Hill at $2.29 million for the construction of the Car park and Sports Complex, featuring three squash courts, two air-conditioned racquetball courts, four tennis courts, and an 88-car parking lot.',
            image: `${FRAMER_ASSETS}/Br8wsd35CiEWsRROc5cb0uw.jpg?width=1600`,
          },
          {
            year: '1983',
            body: "Due to its state of disrepair, a proposed major development plan was mooted with the option to either renovate or demolish and rebuild the clubhouse. As membership had already exceeded the Club's capacity by this time, architects were engaged to draw up a design for a new clubhouse.",
            image: `${FRAMER_ASSETS}/NNmXh9wZuz8PMn8kYcq6xRHDJ7A.jpg?width=1600`,
          },
          {
            year: '1989',
            body: 'The Claymore Hill Complex sees its grand opening in May. It consisted of two levels of underground parking, the Liberty Lounge - an up-market cocktail lounge, the Union Bar - a casual sports bar, and a function room on the third floor.',
            image: `${FRAMER_ASSETS}/qOdPN2jz2g8jc3ohflKsKZtJhg.jpg?width=1600`,
          },
          {
            year: '1990',
            body: 'The Scotts Complex is remodeled to maximize floor space.\nConstruction of the new Library, Jackpot Room, Teen Room and staff locker room begins.',
            image: `${FRAMER_ASSETS}/zL20NMUh0bUXlxaXByninbz4.jpeg?width=1600`,
          },
          {
            year: '2000',
            body: "In addition, the Club's Fitness & Leisure expanded its offerings with more fitness options, including more Aquatics classes and adult recreational and fitness classes. The Club has now evolved to become true home away from home destination for Members, local and overseas alike.",
            image: `${FRAMER_ASSETS}/8AdZeXaiX01zJ8DeEDecvQ5y8c.jpg?width=1600`,
          },
          {
            year: '2015',
            body: 'To meet the growing needs of the membership and in planning for the future, the Club embarked on a $65 million redevelopment project, which replaced the Scotts Road building and pool, and upgraded its Claymore Hill building and Sports Complex. The redevelopment allowed for enhanced usage of space within the Club, increase staff efficiencies, and ultimately elevate Member satisfaction.',
            image: `${FRAMER_ASSETS}/qGgCGqT3R7jhogHscMek1P7gmE.jpg?width=1600`,
          },
        ]}
      />

      <StatsCounter
        heading="The Club Today"
        stats={[
          { value: '11,000+', label: 'Members' },
          { value: '90+', label: 'Nationalities' },
          { value: '77+', label: 'Years of Heritage' },
          { value: '25', label: 'Committees' },
        ]}
      />

      <TextBlock
        vision='A world class Club offering Members a "home away from home" with excellent service and facilities.'
        mission="To be the Members' Club and employer of choice in Singapore, striving to continuously improve Member engagement and satisfaction, while embracing our unique American and Canadian cultures within our Singaporean community."
        image={`${FRAMER_ASSETS}/ALiDWPH3U3VnmiEzcoEet6lPIk.jpeg?width=900`}
        imagePosition="left"
      />

      <GovernanceBlock
        heading="Club Governance"
        body={"The governance structure of the Club is that it is member-owned. There are 25 committees which provide plenty of opportunities to get involved as a volunteer. The committees support the Club management through strategic counsel and policy making.\n\nOnly the General Committee (GC) has approval power.\n\nEach year at the Annual General Meeting (AGM) in November, six spots are available for election/re-election for a two-year tenure. From the GC, the Executive Committee (EXCO) is formed each year in April."}
        sidebarHeading="Join a Committee"
        sidebarBody="If Members wish to volunteer on any of our Committees, please fill in the online Volunteer Interest Form."
        links={[
          { label: 'Volunteer Interest Form', href: '#' },
          { label: 'Committee List', href: '#', caption: '(Updated as at December 3, 2025)' },
          { label: 'Volunteer Code of Conduct', href: '#' },
        ]}
      />

      <TeamGrid
        heading="General Committee"
        variant="light"
        members={[
          { name: 'Daniel Gewirtz', role: 'President', image: `${FRAMER_ASSETS}/yQzuzYzL7t5XQaH5upKt7gruR9Q.png?width=300` },
          { name: 'Tessa Pang', role: 'Secretary', image: `${FRAMER_ASSETS}/0WIEM72I1vgWDuMYqLCBgOrk.png?width=300` },
          { name: 'Alisha Barnes', role: 'Secretary', image: `${FRAMER_ASSETS}/jxU7bm20Hkfa0nt1lQIJg1xft8Q.png?width=300` },
          { name: 'Terry Kim', role: 'Treasurer' },
          { name: 'Charles Santos', role: 'Member at Large', image: `${FRAMER_ASSETS}/bapIqliILvMJllzgOM301TfFbFE.png?width=300` },
          { name: 'Kate Park', role: 'Member at Large' },
          { name: 'Kenny Liu', role: 'Member at Large' },
          { name: 'Marcella Sullivan', role: 'Member at Large', image: `${FRAMER_ASSETS}/7dTc00R0ddDdnpQZ18pBIezRw.png?width=300` },
          { name: 'Michael Schindler', role: 'Member at Large' },
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

      <ManagementSlider
        heading="Club Management"
        watermark={`${FRAMER_ASSETS}/jYpgpsEhknSxMZJWxquvCab3o.webp`}
        members={[
          {
            name: 'Christine Kaelbel-Sheares',
            role: 'General Manager',
            image: `${FRAMER_ASSETS}/Kc4g3gqcDM59xyogzsi9CH62xbo.jpeg?width=1200`,
            bio: "Christine is a seasoned executive with a diverse global leadership experience. She has held key roles in prestigious hotels in Singapore and the United States. She has led teams in The Venetian and The Palazzo in Las Vegas, The Four Seasons in Chicago, Auberge du Soleil Resort and Domaine Chandon, both in Napa Valley, California. She also served as the Director of Guest Product Development and Asia Operations for Princess Cruises, overseeing a fleet of ships in Asia, Australia, and New Zealand.\n\nIn her most recent role, Christine was the Vice President of Food & Beverage at the Marina Bay Sands Singapore. She was part of the pioneer team and was instrumental in designing service protocols and setting new standards for service excellence. Christine holds a Bachelor's Degree in Law and Politics from the University of London and pursued postgraduate studies in Hospitality Management at the Cesar Ritz Colleges in Switzerland.\n\nFluent in English, French, Mandarin and Cantonese, she brings a unique skill set to support the Club's membership. With her love of the Singaporean and American communities and cultures, her extensive global experience in executive management, and her passion for service, Christine is committed to elevating the Club's overall Member experience.",
          },
          {
            name: 'Shah Bahari',
            role: 'Director of Food & Beverage',
            image: `${FRAMER_ASSETS}/4Ef2YIpYt3NnB45ttxaPrldXQg.jpg?width=1200`,
          },
          {
            name: 'Audrey Lim',
            role: 'Director of Finance',
            image: `${FRAMER_ASSETS}/w35xKyRe5sLU0f3k3a7zPVD7w.jpeg?width=1200`,
          },
          {
            name: 'Vincent Lim',
            role: 'Director of Human Resources',
            image: `${FRAMER_ASSETS}/4QRsPlTR6NqbnGUgLe8aJ9XOK0M.jpg?width=1200`,
          },
          {
            name: 'Chang Lim',
            role: 'Director of Information Technology',
            image: `${FRAMER_ASSETS}/eJi2gxT39VUQXoqBU9zkL38ZHM.jpg?width=1200`,
          },
          {
            name: 'Julie Zul',
            role: 'Director of Member Engagement',
            image: `${FRAMER_ASSETS}/jyPhDb3hmo4PPzz1fTXNgrcX3fQ.jpg?width=1200`,
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
