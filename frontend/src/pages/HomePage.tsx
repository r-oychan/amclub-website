import { Hero } from '../components/blocks/Hero';
import { AboutSection } from '../components/blocks/AboutSection';
import { CardGrid } from '../components/blocks/CardGrid';
import { FeatureGrid } from '../components/blocks/FeatureGrid';
import { TabsSection } from '../components/blocks/TabsSection';
import { TestimonialSlider } from '../components/blocks/TestimonialSlider';
import { FaqAccordion } from '../components/blocks/FaqAccordion';
import { CtaBanner } from '../components/blocks/CtaBanner';

export default function HomePage() {
  return (
    <>
      <Hero
        heading="A Home Away From Home"
        subheading="Thrive in a vibrant community with a unique American and Canadian culture."
        cta={{ label: 'Request for a Club Tour', href: '#' }}
        variant="full"
        titlePosition="bottom-left"
        subtitlePosition="bottom-right"
        slides={[
          {
            backgroundImage: 'https://framerusercontent.com/images/cEQ0tbJZ9iABZ7aowxb1DaK4U.jpg',
            title: 'A Home Away From Home',
            subtitle: 'Thrive in a vibrant community with a unique American and Canadian culture.',
            cta: { label: 'Request for a Club Tour', href: '#' },
          },
          {
            backgroundImage: 'https://framerusercontent.com/images/ALiDWPH3U3VnmiEzcoEet6lPIk.jpeg',
            title: 'Dine. Drink. Unwind.',
            subtitle: 'From casual bites to fine dining, discover our world-class restaurants and bars.',
            cta: { label: 'Explore Dining', href: '/dining' },
          },
          {
            backgroundImage: 'https://framerusercontent.com/images/FfQ1mhhWwbjsMQKiahq8SzaqLs.jpeg',
            title: 'Stay Active, Stay Healthy',
            subtitle: 'State-of-the-art fitness facilities, pools, and wellness programs for the whole family.',
            cta: { label: 'Discover Fitness', href: '/fitness' },
          },
        ]}
      />

      <AboutSection
        label="About Us"
        heading="Blending American Traditions with Singaporean Charm"
        stats={[
          { value: '11,000+', label: 'Members' },
          { value: '90+', label: 'Nationalities' },
          { value: '77+', label: 'Years of Heritage' },
        ]}
        funFact="Did You Know? The idea of forming a social club for Americans was first mooted in 1932?"
        cta={{ label: 'Discover Our Story', href: '/about' }}
        images={[
          'https://framerusercontent.com/images/RjIIikrBuOoQmOLuWXcoR6GFkOE.jpeg',
          'https://framerusercontent.com/images/ToMfql1ukRrZhj1CjpLEOHmCb4.jpeg',
          'https://framerusercontent.com/images/JkrDtEpbLxJMTiPrF9mJYWb3YQ.jpeg',
          'https://framerusercontent.com/images/PlDsZH1QChc2aIXh0p9duml4TC0.jpeg',
        ]}
      />

      <CardGrid
        label="Events"
        heading="From memorable moments to unforgettable evenings - Your club calendar awaits"
        cta={{ label: 'View Featured Club Events', href: '/whats-on' }}
        variant="event"
        items={[
          { category: 'Dining', title: 'Nostalgic Flavors of Singapore', date: 'DEC 4', image: 'https://framerusercontent.com/images/RjIIikrBuOoQmOLuWXcoR6GFkOE.jpeg' },
          { category: 'Fitness & Wellness', title: 'Pedal to Victory! A Spin Bike Time Challenge', date: 'NOV 5', image: 'https://framerusercontent.com/images/ToMfql1ukRrZhj1CjpLEOHmCb4.jpeg' },
          { category: 'Kids', title: 'Scarily Fun Friday Nights for the Kids!', date: 'OCT 19', image: 'https://framerusercontent.com/images/JkrDtEpbLxJMTiPrF9mJYWb3YQ.jpeg' },
          { category: 'Dining', title: "Smokin' Sundays at Grillhouse", date: 'OCT 11', image: 'https://framerusercontent.com/images/PlDsZH1QChc2aIXh0p9duml4TC0.jpeg' },
          { category: 'Dining', title: 'Kanonkop Wine Dinner', date: 'OCT 22', image: 'https://framerusercontent.com/images/0YNsQiaf0KR8LDUah35vR09jfwc.jpg' },
          { category: 'Dining', title: 'Get Your Green Fix Salad Bar Buffet', date: 'OCT 30', image: 'https://framerusercontent.com/images/rNT1Hh6hiX6cJHoJGmlFogBGWmU.jpg' },
          { category: 'Kids', title: 'National Football League 2025 Live Screening', date: 'DEC 20', image: 'https://framerusercontent.com/images/MlqKdegxMYfk5tpETtAaDIaV2w.jpg' },
          { category: 'Member Engagement', title: 'Classic & Contemporary: A Cocktail Masterclass Series', date: 'NOV 7', image: 'https://framerusercontent.com/images/A9M0VHDW2FE6UoaFatzINqucGp0.jpg' },
          { category: 'Fitness & Wellness', title: 'Adult Team Tennis Challenge 2025', date: 'DEC 30', image: 'https://framerusercontent.com/images/FZCLsivFTgvRBOrZD71tlU6pVRc.jpg' },
        ]}
      />

      <FeatureGrid
        label="Services"
        heading="From shared experiences to lasting bonds - it all starts here"
        cta={{ label: 'Explore Membership', href: '/membership' }}
        dark
        items={[
          { heading: 'The Perfect Club Experience for the Whole Family', description: "From pool time to playtime, dining to downtime \u2014 there's something for everyone in the family to enjoy." },
          { heading: 'Business Done Right. Leisure Done Better.', description: 'Connect, meet, or recharge \u2014 the Club makes balancing work and leisure effortless.' },
          { heading: 'Everyday Concierge, the Club Way', description: 'A welcoming smile, a helping hand. Enjoy seamless support with a personal touch.' },
        ]}
      />

      <TabsSection
        label="Experience"
        heading="Dine. Drink. Unwind. All in one unforgettable club."
        items={[
          { label: 'Dining & Retail', href: '/dining', image: 'https://framerusercontent.com/images/ALiDWPH3U3VnmiEzcoEet6lPIk.jpeg' },
          { label: 'Fitness & Wellness', href: '/fitness', image: 'https://framerusercontent.com/images/FfQ1mhhWwbjsMQKiahq8SzaqLs.jpeg' },
          { label: 'Kids', href: '/kids', image: 'https://framerusercontent.com/images/DytJIjZnqDf7hE6r7WyfxUrNjU.jpeg' },
        ]}
      />

      <TestimonialSlider
        label="Moments"
        heading="Moments that matter, captured and shared by you"
        items={[
          { name: 'Ronald Williams', quote: 'Abuzz with Independence Day cheer on July 1', cta: 'Watch More' },
          { name: 'Sarah Grey', quote: 'A multitude of culinary experience for your tastebuds', cta: 'Watch More' },
          { name: 'Matthew Hallen', quote: 'Fantastic evening of glitz, glamor and giving', cta: 'Watch More' },
          { name: 'Joseph Gunner', quote: 'Abuzz with Independence Day cheer on July 1', cta: 'Watch More' },
        ]}
      />

      <FaqAccordion
        label="FAQ"
        heading="Your Questions, Answered"
        ctas={[{ label: 'View All FAQ', href: '#' }]}
        items={[
          { question: 'What types of membership do you offer?', answer: '' },
          { question: 'What facilities and services are included?', answer: '' },
          { question: 'Is membership transferable?', answer: '' },
          { question: 'Can I upgrade or change my membership type?', answer: '' },
        ]}
      />

      <CtaBanner
        heading="Have an Enquiry?"
        body="We'd love to hear from you. Get in touch with our team."
        ctas={[
          { label: 'Contact Us', href: '#' },
          { label: 'Book a Club Tour', href: '#' },
        ]}
      />
    </>
  );
}
