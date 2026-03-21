import { Hero } from '../components/blocks/Hero';
import { CtaBanner } from '../components/blocks/CtaBanner';
import { OverlaySection } from '../components/blocks/OverlaySection';
import type { OverlaySectionProps } from '../components/blocks/OverlaySection';
import { ThreeColGrid } from '../components/blocks/ThreeColGrid';
import type { ThreeColItem } from '../components/blocks/ThreeColGrid';

/* ─── Section model ────────────────────────────────────────────── */

type PageSection =
  | ({ type: 'overlay'; priority: number } & OverlaySectionProps)
  | { type: 'three-col'; priority: number; items: ThreeColItem[] };

/* ─── Data ─────────────────────────────────────────────────────── */

const SECTIONS: PageSection[] = [
  {
    type: 'overlay',
    priority: 1,
    heading: 'sèn Spa',
    description:
      'Step away from the everyday and immerse yourself in a retreat where you can unwind, relax, and rejuvenate your mind and body.',
    ctas: [
      { label: 'Learn More', href: '/fitness/sen-spa' },
      { label: 'View Menu', href: '/fitness/sen-spa' },
    ],
    image: '/uploads/fitness/spa.jpeg',
    imageAlt: 'sèn Spa',
    textPosition: 'right',
    textVerticalAlign: 'center',
    textBgColor: '#F5F0EB',
    textTheme: 'dark',
    logo: '/uploads/fitness/fRArJiszmhGHpOFTkbxpn8pcnAY.png',
  },
  {
    type: 'overlay',
    priority: 2,
    heading: 'Aquatics',
    description:
      "From leisure to competitive swimming, dive into the Club's Aquatics programs and embrace an active lifestyle, whether learning, training, or enjoying water fun with family.",
    ctas: [
      { label: 'Learn More', href: '/fitness/aquatics' },
      { label: 'View Our Aquatics Programs', href: '/fitness/aquatics' },
    ],
    image: '/uploads/fitness/aquatics.jpeg',
    imageAlt: 'Aquatics',
    textPosition: 'left',
    textVerticalAlign: 'end',
    textBgColor: '#001E62',
    textTheme: 'light',
  },
  {
    type: 'overlay',
    priority: 3,
    heading: 'Connect & Discover',
    description: 'Where hobbies become friendship',
    ctas: [{ label: 'View All Activities', href: '/fitness' }],
    image: '/uploads/fitness/connect.jpeg',
    imageAlt: 'Connect & Discover',
    textPosition: 'right',
    textVerticalAlign: 'center',
    textBgColor: '#B8C9B5',
    textTheme: 'dark',
  },
  {
    type: 'overlay',
    priority: 4,
    heading: 'Gym',
    description:
      'Whether you have been training for years or trying to get started, get the right support for your fitness journey',
    ctas: [
      { label: 'Private Trainings', href: '/fitness/gym', bordered: true },
      { label: 'Group Fitness Class', href: '/fitness/gym', bordered: true },
      { label: 'Pilates', href: '/fitness/pilates', bordered: true },
      { label: 'Learn More', href: '/fitness/gym', bordered: true },
    ],
    image: '/uploads/fitness/gym.jpeg',
    imageAlt: 'Gym',
    textPosition: 'left',
    textVerticalAlign: 'end',
    textBgColor: '#001E62',
    textTheme: 'light',
  },
  {
    type: 'overlay',
    priority: 5,
    heading: 'Tennis',
    description:
      "Experience the thrill of tennis on the Club's four state-of-the-art artificial grass courts, ideal for learning, training, or enjoying a friendly match.",
    ctas: [
      { label: 'Learn More', href: '/fitness/tennis' },
      { label: 'Group Fitness Programs', href: '/fitness/tennis' },
    ],
    image: '/uploads/fitness/tennis.jpeg',
    imageAlt: 'Tennis',
    textPosition: 'right',
    textVerticalAlign: 'center',
    textBgColor: '#3B5E4B',
    textTheme: 'light',
  },
  {
    type: 'three-col',
    priority: 6,
    items: [
      {
        heading: 'Golf Activities',
        description: 'Tee Off & Connect.',
        image: '/uploads/fitness/golf-activities.jpg',
        imageAlt: 'Golf Activities',
        cta: { label: 'Explore', href: '/fitness/golf-activities' },
        accentColor: '#DF4661',
      },
      {
        heading: 'Multi-purpose Court',
        description: 'Pickleball & More.',
        image: '/uploads/fitness/multi-purpose-court.jpeg',
        imageAlt: 'Multi-purpose Court',
        cta: { label: 'Explore', href: '/fitness/multi-purpose-court' },
        accentColor: '#E8721E',
      },
      {
        heading: 'Squash',
        description: 'Your Squash Experience Starts Here.',
        image: '/uploads/fitness/Squash.jpeg',
        imageAlt: 'Squash',
        cta: { label: 'Explore', href: '/fitness/squash' },
        accentColor: '#DF4661',
      },
    ],
  },
  {
    type: 'overlay',
    priority: 7,
    heading: 'The Bowling Alley',
    description:
      'Strike up some fun at The Bowling Alley, where friendly competition and good times roll together.',
    ctas: [{ label: 'Learn More', href: '/fitness/bowling-alley' }],
    image: '/uploads/fitness/bowling.jpeg',
    imageAlt: 'The Bowling Alley',
    textPosition: 'left',
    textVerticalAlign: 'start',
    textBgColor: '#001E62',
    textTheme: 'light',
  },
];

/* ─── Page ─────────────────────────────────────────────────────── */

export default function FitnessPage() {
  const sorted = [...SECTIONS].sort((a, b) => a.priority - b.priority);

  return (
    <>
      <Hero
        heading="Fitness & Wellness"
        subheading="Fitness, movement, and wellness experiences that fit seamlessly into your lifestyle."
        backgroundImage="/uploads/fitness/header-bg.jpg"
        variant="compact"
      />

      {sorted.map((section, i) => {
        if (section.type === 'overlay') {
          const { type: _type, priority: _priority, ...props } = section;
          return <OverlaySection key={`overlay-${i}`} {...props} />;
        }
        if (section.type === 'three-col') {
          return <ThreeColGrid key={`grid-${i}`} items={section.items} />;
        }
        return null;
      })}

      <CtaBanner
        heading="Kickstart Your Fitness & Wellness Journey"
        body="Join as a Member and enjoy unlimited access to fitness facilities, energizing group classes, and indulgent spa experiences."
        variant="light"
        ctas={[
          { label: 'Explore Membership', href: '/membership' },
          { label: 'Book a Club Tour' },
        ]}
      />
    </>
  );
}
