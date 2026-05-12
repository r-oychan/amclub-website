/**
 * Static fallback data for /coaches/:section/:slug pages.
 *
 * Source of truth is Strapi (coach collection type). Each entry mirrors the
 * Strapi shape so the detail page can render either path. Lists are stored
 * as newline-separated strings on Strapi; here as ready-to-render arrays.
 */
export interface CoachData {
  slug: string;
  /** Display name as it appears on the avatar grid (e.g. "Greg"). */
  shortName: string;
  /** Full name shown on the detail page hero (e.g. "Greg Fasala"). */
  name: string;
  role: string;
  section: 'aquatics' | 'tennis' | 'squash' | 'gym' | 'pilates' | 'kids' | 'other';
  /** Larger profile photo; falls back to the avatar grid image if unset. */
  photo?: string;
  bio: string;
  expertise?: string[];
  qualifications?: string[];
}

export const coaches: CoachData[] = [
  {
    slug: 'greg',
    shortName: 'Greg',
    name: 'Greg Fasala',
    role: 'Aquatics Manager & Head Coach',
    section: 'aquatics',
    photo: '/images/fitness/team-aquatics/greg.jpg',
    bio:
      "Coach Greg boasts a wealth of experience in swim coaching, coupled with a distinguished past as an Olympic medalist. His commitment to nurturing the swimming community extends to coaching both adult Masters swimmers and aspiring competitive swimmers within The American Club.",
    expertise: ['Adult Learn to Swim', 'Adult Squads', 'Competitive Swim Squads'],
    qualifications: [
      'Australian Representative at the Olympics 1984 — Silver medal',
      'Australian Representative at the Commonwealth Games 1982 — 1 Gold & 1 Silver',
      'Australian Representative at the Commonwealth Games 1986 — 2 Gold & 1 Bronze',
      'Australian Representative at the World Championships 1983',
      'Awarded OAM (Order of Australia Medal) by the Prime Minister of Australia',
      'Australian Swimming Ambassador',
      'SwimAmerica Program Director',
      'ASCTA Silver Coach',
      'Austswim — Teacher of Swimming',
      'Austswim — Teacher of Infant Aquatics',
      'Austswim — Competency Supervisor',
      'International Lifeguard Training Program (Ellis & Associates) — Lifeguard Trainer (2021)',
      'International Lifeguard Training Program (Ellis & Associates) — Lifeguard',
      'International Lifeguard Training Program (Ellis & Associates) — CPR/AED',
      'International Lifeguard Training Program (Ellis & Associates) — First Aid',
    ],
  },
  {
    slug: 'zack',
    shortName: 'Zack',
    name: 'Zack Leong',
    role: 'Aquatics Coordinator',
    section: 'aquatics',
    photo: '/images/fitness/team-aquatics/zack.jpg',
    bio:
      "Zack is a passionate and dedicated swim coach with close to a decade of experience helping individuals of all ages and skill levels achieve their swimming goals. Whether you're a beginner looking to conquer your fear of water or a seasoned swimmer aiming for personal bests, he will help guide you and your child into the right classes to unlock your full aquatic potential.",
    expertise: ['Adult Learn to Swim', 'Children Learn to Swim'],
    qualifications: [
      'SwimAmerica Program Director',
      'International Lifeguard Training Program (Ellis & Associates) — Lifeguard',
      'International Lifeguard Training Program (Ellis & Associates) — CPR/AED',
      'International Lifeguard Training Program (Ellis & Associates) — First Aid',
      'ASCA Level 1 & 2',
      'Austswim — Teacher of Swimming',
      'Swim Australia — Teacher of Babies & Toddlers',
      'SG Coach — Theory 1',
    ],
  },
  {
    slug: 'hariz',
    shortName: 'Hariz',
    name: 'Hariz Zailani',
    role: 'Assistant Coach & Coordinator',
    section: 'aquatics',
    photo: '/images/fitness/team-aquatics/hariz.jpg',
    bio:
      "Hariz's passion for teaching — which he had from a young age — combined with his love for sports eventually led him to a coaching career. Armed with knowledge from his Sports and Exercise Sciences studies at BSC and his love for swimming, Hariz has evolved into a devoted coach. His journey began as a teacher for the Babies Learn to Swim program, and he has since progressed to Assistant Coach. He now works closely with Head Coach Greg Fasala to nurture the Development and Competitive Squad and help them achieve their full potential.",
    expertise: [
      'Toddler Learn to Swim',
      'Fundamental Swimming Strokes',
      'Swimming for Beginners',
      'Competitive Swimming',
      'Strength and Conditioning for Aquatics',
    ],
    qualifications: [
      'Royal Lifesaving — Bronze Medallion',
      'SwimAmerica Program Director',
      'International Lifeguard Training Program (Ellis & Associates) — Lifeguard',
      'International Lifeguard Training Program (Ellis & Associates) — CPR/AED',
      'International Lifeguard Training Program (Ellis & Associates) — First Aid',
      'AustSwim Teacher of Babies and Toddlers',
      'Values and Principles in Sport',
      'Singapore Life Saving — Certificate 123',
    ],
  },
  {
    slug: 'abdul',
    shortName: 'Abdul',
    name: 'Abdul Latip',
    role: 'Chief Lifeguard',
    section: 'aquatics',
    photo: '/images/fitness/team-aquatics/abdul.jpg',
    bio:
      "With 30 years of service and loyalty under his belt, Abdul is no stranger to anyone in The American Club. He earned his Chief Lifeguard title by managing the club's emergency procedures and handling numerous critical situations — more emergency cases than he can count, and countless lives saved both in and out of the pool. Abdul prioritizes pool safety enforcement to maintain a secure environment for members.",
    expertise: ['Adult Learn to Swim', 'Children Learn to Swim'],
    qualifications: [
      'International Lifeguard Training Program (Ellis & Associates) — Lifeguard',
      'International Lifeguard Training Program (Ellis & Associates) — CPR/AED',
      'International Lifeguard Training Program (Ellis & Associates) — First Aid',
      'The American Club — Team Leader for First Responders',
      'The American Club — Club-Wide Safety Officer',
      'The American Club — Crisis Management Team Member',
    ],
  },
  {
    slug: 'rodel',
    shortName: 'Rodel',
    name: 'Rodel Pajo',
    role: 'Swim Coach / Lifeguard Trainer',
    section: 'aquatics',
    photo: '/images/fitness/team-aquatics/rodel.jpg',
    bio:
      "Rodel is dedicated to developing swimmer potential through customized coaching that emphasises building strong foundations, refining stroke techniques, and always promoting water safety. His lifeguard instructor credentials include certifications in CPR, First Aid, and lifeguarding instruction.",
    expertise: [
      'Adult Learn to Swim',
      'Fundamental Swimming Strokes',
      'Swimming for Beginners',
      'Water Safety Education',
    ],
    qualifications: [
      'SwimAmerica Coach',
      'International Lifeguard Training Program (Ellis & Associates) — Lifeguard Trainer (2019, 2021, 2023)',
      'International Lifeguard Training Program (Ellis & Associates) — Lifeguard',
      'International Lifeguard Training Program (Ellis & Associates) — CPR/AED',
      'International Lifeguard Training Program (Ellis & Associates) — First Aid',
      'Philippines Red Cross (2010)',
      'ASCA Level 1 & 2 International (American Swimming Coaches Association)',
    ],
  },
];

export function getCoach(section: string, slug: string): CoachData | undefined {
  return coaches.find((c) => c.section === section && c.slug === slug);
}
