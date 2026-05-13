#!/usr/bin/env node
// Seed fitness facilities (tennis, squash). Uploads hero images + team
// headshots and upserts each facility entry. CTAs that link to PDFs/images
// reference static paths served from frontend/public/documents/fitness/.
//
// HOW TO RUN — this is a Node ES module, not a shell script:
//   node scripts/seed-facilities.mjs --dry-run   # preview only
//   node scripts/seed-facilities.mjs             # live: writes to Strapi
// Do NOT `source` it from bash/zsh — that will try to parse the JS as shell
// and fail on the parentheses in this comment.
//
// Targets the Strapi instance in cms/.env.seed (deployed Azure by default).
// To seed local Strapi, swap in cms/.env.seed.local first.
//
// Known limitation: newly-added media fields on this project's local Strapi
// may not persist via REST PUT (see project_strapi_media_relations memory).
// PUT will return 200 with the ids you sent, but a follow-up populate may
// return the field empty. The frontend fallback in
// frontend/src/data/subpages.ts is the safety net.

import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api, findOneBySlug, uploadAll, isDryRun } from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TEAM_DIR = join(ROOT, 'media', 'fitness', 'team');
const AQUATICS_TEAM_DIR = join(ROOT, 'media', 'fitness', 'team-aquatics');
const FACILITY_DIR = join(ROOT, 'media', 'fitness', 'detail');
const FITNESS_DIR = join(ROOT, 'media', 'fitness');
const DRY = isDryRun();
const ctx = initEnv();

// Headshot (small avatar) + bio card (modal). Same filenames as
// frontend/public/images/fitness/team/ — bare slug for the headshot, -bio.png
// suffix for the full bio card.
// offX/offY/zoom auto-derived by inspecting each headshot's face center.
// The CMS exposes these for fine-tuning per coach (decimal, 0–100 / 1–4).
const TENNIS_TEAM = [
  { name: 'Azhar Zainudin',    role: 'Director of Tennis',             image: 'azhar-zainudin.jpg',    bio: 'azhar-zainudin-bio.png',    offX: 48, offY: 35, zoom: 2.0 },
  { name: 'Jorge Pinilla',     role: 'Director of Player Development', image: 'jorge-pinilla-headshot.png', bio: 'jorge-pinilla-bio.png',     offX: 44, offY: 30, zoom: 2.0 },
  { name: 'Herman Ali',        role: 'Senior Tennis Professional',     image: 'herman-ali.jpg',        bio: 'herman-ali-bio.png',        offX: 48, offY: 22, zoom: 2.0 },
  { name: 'Reduan Ariffin',    role: 'Tennis Professional',            image: 'reduan-ariffin.jpg',    bio: 'reduan-ariffin-bio.png',    offX: 48, offY: 30, zoom: 1.8 },
  { name: 'Sharassalam Rasak', role: 'Tennis Professional',            image: 'sharassalam-rasak.jpg', bio: 'sharassalam-rasak-bio.png', offX: 48, offY: 28, zoom: 2.0 },
  { name: 'Ethan Lee',         role: 'Tennis Professional',            image: 'ethan-lee.jpg',         bio: 'ethan-lee-bio.png',         offX: 48, offY: 25, zoom: 2.0 },
  { name: 'Ezequiel Suarez',   role: 'Tennis Professional',            image: 'ezequiel-suarez.jpg',   bio: 'ezequiel-suarez-bio.png',   offX: 52, offY: 30, zoom: 2.0 },
  { name: 'Jarek Grela',       role: 'Tennis Professional',            image: 'jarek-grela-headshot.png', bio: 'jarek-grela-bio.png',       offX: 48, offY: 22, zoom: 2.2 },
  { name: 'Jose Nino',         role: 'Tennis Professional',            image: 'jose-nino.jpg',         bio: 'jose-nino-bio.png',         offX: 48, offY: 18, zoom: 2.0 },
];

const TEAM_FILES = TENNIS_TEAM.flatMap((m) => [m.image, m.bio]);

// Aquatics roster (12 coaches). Only 5 have public bio pages on amclub.org.sg;
// the rest are tile-only (no click action) until coach profiles are authored.
const AQUATICS_TEAM = [
  { name: 'Greg',      role: 'Aquatics Manager & Head Swim Coach',      image: 'greg.jpg',      offX: 48, offY: 22, zoom: 1.8, link: '/coaches/aquatics/greg' },
  { name: 'Zack',      role: 'Aquatics Coordinator',                     image: 'zack.jpg',      offX: 48, offY: 25, zoom: 1.8, link: '/coaches/aquatics/zack' },
  { name: 'Hariz',     role: 'Assistant Swim Coach & Coordinator',       image: 'hariz.jpg',     offX: 48, offY: 28, zoom: 1.8, link: '/coaches/aquatics/hariz' },
  { name: 'Abdul',     role: 'Chief Lifeguard Trainer',                  image: 'abdul.jpg',     offX: 48, offY: 25, zoom: 1.8, link: '/coaches/aquatics/abdul' },
  { name: 'Marc',      role: 'Swim Coach',                               image: 'marc.png',      offX: 48, offY: 35, zoom: 1.4 },
  { name: 'Rodel',     role: 'Swim Coach / Lifeguard Trainer',           image: 'rodel.jpg',     offX: 48, offY: 22, zoom: 1.8, link: '/coaches/aquatics/rodel' },
  { name: 'Ben',       role: 'Swim Coach / Lifeguard Trainer',           image: 'ben.jpeg',      offX: 48, offY: 28, zoom: 2.0 },
  { name: 'Francesca', role: 'Swim Coach',                               image: 'francesca.jpg', offX: 48, offY: 32, zoom: 1.7 },
  { name: 'Caroline',  role: 'Part-time Swim Coach',                     image: 'caroline.jpg',  offX: 48, offY: 25, zoom: 1.8 },
  { name: 'Daniel',    role: 'Part-time Swim Coach',                     image: 'daniel.jpg',    offX: 48, offY: 25, zoom: 1.8 },
  { name: 'Yat',       role: 'Part-time Swim Coach / Lifeguard Trainer', image: 'yat.jpg',       offX: 48, offY: 22, zoom: 1.6 },
  { name: 'Sia',       role: 'Part-time Lifeguard Trainer',              image: 'sia.jpg',       offX: 50, offY: 30, zoom: 1.5 },
];

const AQUATICS_TEAM_FILES = AQUATICS_TEAM.map((m) => m.image);

// Coach detail entries. Mirrors frontend/src/data/coaches.ts and is seeded
// into the coach collection so /coaches/<section>/<slug> can fetch from CMS.
const AQUATICS_COACHES = [
  {
    slug: 'greg',
    name: 'Greg Fasala',
    role: 'Aquatics Manager & Head Coach',
    photoFile: 'greg.jpg',
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
    order: 0,
  },
  {
    slug: 'zack',
    name: 'Zack Leong',
    role: 'Aquatics Coordinator',
    photoFile: 'zack.jpg',
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
    order: 1,
  },
  {
    slug: 'hariz',
    name: 'Hariz Zailani',
    role: 'Assistant Coach & Coordinator',
    photoFile: 'hariz.jpg',
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
    order: 2,
  },
  {
    slug: 'abdul',
    name: 'Abdul Latip',
    role: 'Chief Lifeguard',
    photoFile: 'abdul.jpg',
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
    order: 3,
  },
  {
    slug: 'rodel',
    name: 'Rodel Pajo',
    role: 'Swim Coach / Lifeguard Trainer',
    photoFile: 'rodel.jpg',
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
    order: 4,
  },
];

const AQUATICS = {
  name: 'Aquatics',
  slug: 'aquatics',
  category: 'fitness',
  categoryLabel: 'Aquatics',
  description:
    "Dive into world-class swimming at The American Club's aquatics facilities — from learn-to-swim and competitive training to lap swimming and aqua fitness. Our aquatics team holds international certifications and welcomes swimmers of every age and ability.",
  locationLevel: 'Level 1',
  phone: '6739-4490',
  email: 'aquatics@amclub.org.sg',
  imageFile: 'aquatics.jpg',
  ctas: [
    { label: 'Request Swim Assessment', href: 'https://amclub.jotform.com/252501876973062', isExternal: true, variant: 'primary', icon: 'arrow' },
    { label: 'Programs Price List',     href: '/documents/fitness/aquatics-program-price-list.pdf', isExternal: true, variant: 'primary', icon: 'arrow' },
  ],
  teamHeading: 'Meet Our Team',
};

const TENNIS = {
  name: 'Tennis',
  slug: 'tennis',
  category: 'fitness',
  categoryLabel: 'Racquet Sports',
  description:
    "For Tennis enthusiasts, the Club offers four state-of-the-art artificial grass courts with sand infill which is an ideal surface for both coaching and recreational play.",
  locationLevel: 'Basement 2',
  phone: '6739-4312',
  email: 'sportscounter@amclub.org.sg',
  imageFile: 'tennis.jpeg',
  ctas: [
    { label: 'Book a Court', href: 'mailto:sportscounter@amclub.org.sg', isExternal: true, variant: 'primary', icon: 'mail' },
    { label: 'TAC Book App Tutorial', href: '/documents/fitness/tac-book-app-download-tutorial.pdf', isExternal: true, variant: 'primary', icon: 'arrow' },
  ],
  teamHeading: 'Meet Our Team',
};

const SQUASH = {
  name: 'Squash',
  slug: 'squash',
  category: 'fitness',
  categoryLabel: 'Racquet Sports',
  description:
    'The Club features two state-of-the-art Squash Courts with a covered outdoor gallery area. We run an active calendar of events throughout the year for our Squash enthusiasts including Squash Box Ladder, Handicap and Open Tournament and Inter-Club Leagues.\n\nGroup and private lessons are available.',
  locationLevel: 'Basement 2',
  phone: '6739 4312',
  email: 'sportscenter@amclub.org.sg',
  imageFile: 'Squash.jpeg',
  ctas: [
    { label: 'View Rates', href: '/documents/fitness/squash-private-lesson-rates.jpg', isExternal: true, variant: 'primary', icon: 'arrow' },
    { label: 'Coach Profiles', href: '/documents/fitness/squash-coach-profiles.pdf', isExternal: true, variant: 'primary', icon: 'arrow' },
    { label: 'Booking Policy', href: '/documents/fitness/squash-courts-booking-policy.pdf', isExternal: true, variant: 'primary', icon: 'arrow' },
  ],
};

async function upsertSquashFacility({ heroImageId }) {
  const payload = {
    name: SQUASH.name,
    slug: SQUASH.slug,
    category: SQUASH.category,
    categoryLabel: SQUASH.categoryLabel,
    description: SQUASH.description,
    locationLevel: SQUASH.locationLevel,
    phone: SQUASH.phone,
    email: SQUASH.email,
    image: heroImageId,
    ctas: SQUASH.ctas,
    publishedAt: new Date().toISOString(),
  };

  if (DRY) {
    console.log(`  [dry] upsert facility squash (ctas=${SQUASH.ctas.length})`);
    return { documentId: 'dry-squash' };
  }

  const existing = await findOneBySlug(ctx, 'facilities', SQUASH.slug);
  if (existing) {
    const resp = await api(ctx, `/facilities/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    console.log(`  ✓ updated facility squash (documentId=${existing.documentId})`);
    return resp.data;
  }
  const resp = await api(ctx, '/facilities', { method: 'POST', body: { data: payload } });
  console.log(`  ✓ created facility squash (documentId=${resp.data?.documentId})`);
  return resp.data;
}

async function upsertTennisFacility({ teamMedia, heroImageId }) {
  const teamMembers = TENNIS_TEAM.map((m, idx) => ({
    name: m.name,
    role: m.role,
    image: teamMedia[m.image]?.id,
    bioImage: teamMedia[m.bio]?.id,
    imageOffsetX: m.offX,
    imageOffsetY: m.offY,
    imageZoom: m.zoom,
    order: idx,
  }));

  const payload = {
    name: TENNIS.name,
    slug: TENNIS.slug,
    category: TENNIS.category,
    categoryLabel: TENNIS.categoryLabel,
    description: TENNIS.description,
    locationLevel: TENNIS.locationLevel,
    phone: TENNIS.phone,
    email: TENNIS.email,
    image: heroImageId,
    ctas: TENNIS.ctas,
    teamHeading: TENNIS.teamHeading,
    teamMembers,
    publishedAt: new Date().toISOString(),
  };

  if (DRY) {
    console.log(`  [dry] upsert facility tennis (members=${teamMembers.length})`);
    return { documentId: 'dry-tennis' };
  }

  const existing = await findOneBySlug(ctx, 'facilities', TENNIS.slug);
  if (existing) {
    const resp = await api(ctx, `/facilities/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    console.log(`  ✓ updated facility tennis (documentId=${existing.documentId})`);
    return resp.data;
  }
  const resp = await api(ctx, '/facilities', { method: 'POST', body: { data: payload } });
  console.log(`  ✓ created facility tennis (documentId=${resp.data?.documentId})`);
  return resp.data;
}

async function upsertCoach(c, photoId, section) {
  const payload = {
    name: c.name,
    slug: c.slug,
    role: c.role,
    section,
    photo: photoId,
    bio: c.bio,
    expertise: c.expertise.join('\n'),
    qualifications: c.qualifications.join('\n'),
    order: c.order ?? 0,
    publishedAt: new Date().toISOString(),
  };

  if (DRY) {
    console.log(`  [dry] upsert coach ${c.slug}`);
    return { documentId: `dry-coach-${c.slug}` };
  }

  const existing = await findOneBySlug(ctx, 'coaches', c.slug);
  if (existing) {
    const resp = await api(ctx, `/coaches/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    console.log(`  ✓ updated coach ${c.slug} (documentId=${existing.documentId})`);
    return resp.data;
  }
  const resp = await api(ctx, '/coaches', { method: 'POST', body: { data: payload } });
  console.log(`  ✓ created coach ${c.slug} (documentId=${resp.data?.documentId})`);
  return resp.data;
}

async function upsertAquaticsFacility({ teamMedia, heroImageId, includeCoachLink = true }) {
  const teamMembers = AQUATICS_TEAM.map((m, idx) => {
    const base = {
      name: m.name,
      role: m.role,
      image: teamMedia[m.image]?.id,
      imageOffsetX: m.offX,
      imageOffsetY: m.offY,
      imageZoom: m.zoom,
      order: idx,
    };
    // coachLink is a newer field; older deployed schemas reject it. Set only when supported.
    if (includeCoachLink && m.link) base.coachLink = m.link;
    return base;
  });

  const payload = {
    name: AQUATICS.name,
    slug: AQUATICS.slug,
    category: AQUATICS.category,
    categoryLabel: AQUATICS.categoryLabel,
    description: AQUATICS.description,
    locationLevel: AQUATICS.locationLevel,
    phone: AQUATICS.phone,
    email: AQUATICS.email,
    image: heroImageId,
    ctas: AQUATICS.ctas,
    teamHeading: AQUATICS.teamHeading,
    teamMembers,
    publishedAt: new Date().toISOString(),
  };

  if (DRY) {
    console.log(`  [dry] upsert facility aquatics (members=${teamMembers.length})`);
    return { documentId: 'dry-aquatics' };
  }

  const existing = await findOneBySlug(ctx, 'facilities', AQUATICS.slug);
  if (existing) {
    const resp = await api(ctx, `/facilities/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    console.log(`  ✓ updated facility aquatics (documentId=${existing.documentId})`);
    return resp.data;
  }
  const resp = await api(ctx, '/facilities', { method: 'POST', body: { data: payload } });
  console.log(`  ✓ created facility aquatics (documentId=${resp.data?.documentId})`);
  return resp.data;
}

async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);

  console.log('\n[1/8] Uploading squash hero image…');
  const squashHeroMedia = await uploadAll(ctx, FITNESS_DIR, [SQUASH.imageFile], { dry: DRY });
  const squashHeroId = squashHeroMedia[SQUASH.imageFile]?.id;

  console.log('\n[2/8] Upserting squash facility…');
  try {
    await upsertSquashFacility({ heroImageId: squashHeroId });
  } catch (e) {
    console.error(`  ✗ squash upsert failed: ${e.message}`);
  }

  console.log('\n[3/8] Uploading tennis team headshots + bio cards…');
  const tennisTeamMedia = await uploadAll(ctx, TEAM_DIR, TEAM_FILES, { dry: DRY });

  console.log('\n[4/8] Uploading tennis hero image…');
  const tennisHeroMedia = await uploadAll(ctx, FACILITY_DIR, [TENNIS.imageFile], { dry: DRY });
  const tennisHeroId = tennisHeroMedia[TENNIS.imageFile]?.id;

  console.log('\n[5/8] Upserting tennis facility…');
  try {
    await upsertTennisFacility({ teamMedia: tennisTeamMedia, heroImageId: tennisHeroId });
  } catch (e) {
    console.error(`  ✗ tennis upsert failed: ${e.message}`);
  }

  console.log('\n[6/8] Uploading aquatics team headshots…');
  const aquaticsTeamMedia = await uploadAll(ctx, AQUATICS_TEAM_DIR, AQUATICS_TEAM_FILES, { dry: DRY });

  console.log('\n[7/8] Uploading aquatics hero image + upserting facility…');
  const aquaticsHeroMedia = await uploadAll(ctx, FACILITY_DIR, [AQUATICS.imageFile], { dry: DRY });
  const aquaticsHeroId = aquaticsHeroMedia[AQUATICS.imageFile]?.id;
  try {
    await upsertAquaticsFacility({ teamMedia: aquaticsTeamMedia, heroImageId: aquaticsHeroId });
  } catch (e) {
    if (/coachLink/.test(e.message)) {
      console.warn(`  ! deployed schema rejected coachLink; retrying without it`);
      try {
        await upsertAquaticsFacility({ teamMedia: aquaticsTeamMedia, heroImageId: aquaticsHeroId, includeCoachLink: false });
      } catch (e2) {
        console.error(`  ✗ aquatics upsert failed: ${e2.message}`);
      }
    } else {
      console.error(`  ✗ aquatics upsert failed: ${e.message}`);
    }
  }

  console.log('\n[8/8] Upserting aquatics coach detail entries…');
  for (const c of AQUATICS_COACHES) {
    const photoId = aquaticsTeamMedia[c.photoFile]?.id;
    try {
      await upsertCoach(c, photoId, 'aquatics');
    } catch (e) {
      console.error(`  ✗ coach ${c.slug} failed: ${e.message}`);
    }
  }

  console.log('\nDone. Verify with:');
  console.log(`  curl "${ctx.BASE}/api/facilities?filters[slug][$eq]=tennis&populate[teamMembers][populate]=*"`);
  console.log(`  curl "${ctx.BASE}/api/facilities?filters[slug][$eq]=aquatics&populate[teamMembers][populate]=*"`);
  console.log(`  curl "${ctx.BASE}/api/coaches?filters[section][$eq]=aquatics&populate[photo]=true"`);
  console.log(`  curl "${ctx.BASE}/api/facilities?filters[slug][$eq]=squash&populate[ctas]=true"`);
}
main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
