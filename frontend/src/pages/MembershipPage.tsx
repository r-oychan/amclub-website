import { Hero } from '../components/blocks/Hero';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { TextBlock } from '../components/blocks/TextBlock';
import { FeatureGrid } from '../components/blocks/FeatureGrid';
import { CardGrid } from '../components/blocks/CardGrid';
import { FaqAccordion } from '../components/blocks/FaqAccordion';

export default function MembershipPage() {
  return (
    <>
      <Hero
        heading="Membership"
        subheading="A diverse, close-knit community founded on the values of freedom, inclusivity and friendship."
        variant="compact"
      />

      <CtaBanner
        heading="Join Our Community"
        body="The American Club is more than a social club \u2013 it's a welcoming community where Members and their families connect, unwind, and belong."
        ctas={[{ label: 'Start Your Application' }]}
        variant="light"
      />

      <TextBlock
        heading="A Home Away From Home"
        body="Designed for American, Canadian and international families in Singapore, the Club offers a seamless blend of comfort, culture, and convenience."
      />

      <FeatureGrid
        items={[
          { heading: 'World-class Facilities', description: 'The Club offers thoughtfully designed facilities and amenities for every lifestyle.' },
          { heading: 'Exceptional Dining', description: 'Savor American comfort food and classic favorites, complemented by diverse dining concepts and seasonal menus across the Club.' },
          { heading: 'Signature Events', description: 'Enjoy a vibrant calendar of American, Canadian, and local celebrations that bring the feeling of home to life all year round.' },
          { heading: 'Where Kids Thrive', description: 'Engaging kids\u2019 camps, enrichment classes, youth activities and spaces that support learning, play, and friendship.' },
          { heading: 'Community & Connection', description: 'Build meaningful relationships through shared experiences, multi-generational programming, and a strong sense of belonging.' },
          { heading: '150+ Reciprocal Clubs', description: 'Your membership extends worldwide, with reciprocal clubs offering the same warm welcome wherever your travels take you.' },
        ]}
      />

      <CtaBanner
        heading="Find the Right Membership for You"
        body="The American Club offers a range of membership options. Membership is open to individuals aged 21 and above."
        ctas={[
          { label: 'Membership Types & Joining Fees' },
          { label: 'Book a Club Tour' },
        ]}
      />

      <CardGrid
        columns={3}
        items={[
          { name: 'Refer & Be Rewarded', description: 'Extend the privilege of membership to your family and friends, and enjoy exclusive rewards through our referral program.', cta: 'Learn More' },
          { name: 'The Eagle Rewards Program', description: 'A tiered rewards experience that offers elevated recognition and privileges as you enjoy more of the Club.', cta: 'Learn More' },
          { name: 'Reciprocal Clubs', description: 'Enjoy privileged access to over 150 distinguished private clubs worldwide.', cta: 'Learn More' },
        ]}
      />

      <FaqAccordion
        heading="Your Questions, Answered"
        subheading="Everything you need to know about joining, including types, fees, and standard policies."
        ctas={[
          { label: 'View All FAQ' },
          { label: 'Enquiries' },
        ]}
        items={[
          { question: 'What types of membership do you offer?', answer: '' },
          { question: 'What facilities and services are included?', answer: '' },
          { question: 'Is membership transferable?', answer: '' },
          { question: 'Can I upgrade or change my membership type?', answer: '' },
        ]}
      />

      <CtaBanner
        heading="Begin Your Membership Journey"
        body="Take the first step toward life at Singapore's premier social club."
        ctas={[
          { label: 'Start Your Application' },
          { label: 'Book a Club Tour' },
        ]}
      />
    </>
  );
}
