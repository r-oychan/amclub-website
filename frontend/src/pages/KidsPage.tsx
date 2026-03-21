import { Hero } from '../components/blocks/Hero';
import { FeatureGrid } from '../components/blocks/FeatureGrid';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { OverlaySection } from '../components/blocks/OverlaySection';
import type { OverlaySectionProps } from '../components/blocks/OverlaySection';
import { ThreeColGrid } from '../components/blocks/ThreeColGrid';
import type { ThreeColItem } from '../components/blocks/ThreeColGrid';
import { QuadSection } from '../components/kids/QuadSection';

/* ─── Section model ────────────────────────────────────────────── */

type PageSection =
  | ({ type: 'overlay'; priority: number } & OverlaySectionProps)
  | { type: 'three-col'; priority: number; items: ThreeColItem[]; heading?: string; subheading?: string; columns?: 2 | 3 }
  | { type: 'custom'; priority: number; key: string };

/* ─── Data ─────────────────────────────────────────────────────── */

const SECTIONS: PageSection[] = [
  // QuadSection is custom, rendered separately
  { type: 'custom', priority: 1, key: 'quad' },
  {
    type: 'overlay',
    priority: 2,
    heading: 'The Hangout',
    description:
      'An outdoor chill zone for kids and teens \u2013 designed for laid-back fun with friends, featuring pool and foosball tables, comfy lounge chairs, and space to relax, play, and unwind together.',
    ctas: [{ label: 'Learn More', href: '/kids/the-hangout' }],
    image: '/uploads/pages/kids/hangout.jpeg',
    imageAlt: 'The Hangout',
    textPosition: 'left',
    textVerticalAlign: 'center',
    textBgColor: '#001E62',
    textTheme: 'light',
  },
  {
    type: 'overlay',
    priority: 3,
    heading: "Kids' Parties",
    description: 'From games to giggles, we plan it all so you can enjoy the fun.',
    ctas: [{ label: 'Learn More', href: '/kids/kids-parties' }],
    image: '/uploads/pages/kids/parties.jpg',
    imageAlt: "Kids' Parties",
    textPosition: 'right',
    textVerticalAlign: 'center',
    textBgColor: '#FEB700',
    textBgImage: '/uploads/pages/kids/party-bg.png',
    textTheme: 'dark',
  },
  {
    type: 'three-col',
    priority: 4,
    heading: 'Where Learning Meets Fun, All Year Long',
    subheading:
      'From signature seasonal camps to after-school enrichment classes, children can dive into sports, arts, dance, and STEM.',
    columns: 2,
    items: [
      {
        heading: 'Seasonal Camps',
        description:
          'A mix of sports, arts, STEM fun, and outdoor adventures, all designed to spark curiosity and new friendships.',
        image: '/uploads/pages/kids/camps.jpg',
        imageAlt: 'Seasonal Camps',
        cta: { label: 'Explore', href: '/kids/camps' },
      },
      {
        heading: 'Recreational Classes',
        description:
          'Curated arts, sports, and enrichment classes crafted for curious young learners.',
        image: '/uploads/pages/kids/classes.jpg',
        imageAlt: 'Recreational Classes',
        cta: { label: 'Explore', href: '/kids/classes' },
      },
    ],
  },
];

/* ─── Page ─────────────────────────────────────────────────────── */

export default function KidsPage() {
  const sorted = [...SECTIONS].sort((a, b) => a.priority - b.priority);

  return (
    <>
      <Hero
        heading="Kids"
        subheading="Learn and play without limits."
        backgroundImage="/uploads/pages/kids/hero-bg.jpeg"
        variant="compact"
      />

      {sorted.map((section, i) => {
        if (section.type === 'custom' && section.key === 'quad') {
          return <QuadSection key="quad" />;
        }
        if (section.type === 'overlay') {
          const { type: _type, priority: _priority, ...props } = section;
          return <OverlaySection key={`overlay-${i}`} {...props} />;
        }
        if (section.type === 'three-col') {
          return (
            <ThreeColGrid
              key={`grid-${i}`}
              items={section.items}
              columns={section.columns}
              heading={section.heading}
              subheading={section.subheading}
            />
          );
        }
        return null;
      })}

      <FeatureGrid
        heading="Your Child's Safety Is Our Priority"
        body="All instructors and supervisors are certified professionals, and low child-to-staff ratios ensure personalized attention and close supervision."
        items={[
          { heading: 'Trained & Certified Team Members' },
          { heading: 'Dedicated Attention & Supervision' },
          { heading: 'Safe & Secure Environment' },
        ]}
      />

      <CtaBanner
        heading="Where Kids Learn, Play & Belong"
        body="Join The American Club and give your children access to world-class facilities, enriching programs, and a community that values family and friendship."
        ctas={[
          { label: 'Explore Membership', href: '/membership' },
          { label: 'Book a Club Tour' },
        ]}
      />
    </>
  );
}
