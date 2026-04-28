#!/usr/bin/env node
/**
 * Seed AboutPage content into Strapi. Mirrors seed-home-page.mjs.
 *
 * Idempotent. Reads cms/.env.seed for STRAPI_BASE_URL + STRAPI_API_TOKEN.
 *
 * Usage:
 *   node scripts/seed-about-page.mjs              # seed
 *   node scripts/seed-about-page.mjs --dry-run    # plan only
 */

import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initEnv, api, findOneBySlug, uploadAll, slugify, isDryRun,
} from './seed-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MEDIA_DIR = join(ROOT, 'media', 'about');
const DRY = isDryRun();
const ctx = initEnv();
ctx.ROOT = ROOT;

// ── Source data ───────────────────────────────────────────
const IMAGES = [
  // hero
  'hero-about.jpg',
  // heritage 8
  'heritage-1966.jpg', 'heritage-1970.jpg', 'heritage-1978.jpg',
  'heritage-1983.jpg', 'heritage-1989.jpg', 'heritage-1990.jpeg',
  'heritage-2000.jpg', 'heritage-2015.jpg',
  // committee 11 (some members lack photos)
  'gc-daniel-gewirtz.png', 'gc-tessa-pang.png', 'gc-alisha-barnes.png',
  'gc-charles-santos.png', 'gc-marcella-sullivan.png', 'gc-ngiam-siew-wei.png',
  'gc-priyanka-bhalla.png', 'gc-ted-teo.png',
  'gc-michelle-reeb.png', 'gc-autumn-vavoso.png', 'gc-sandra-johnson.png',
  // advocacy
  'advocacy-aside.png',
  // management 6
  'mgmt-christine.jpeg', 'mgmt-shah.jpg', 'mgmt-audrey.jpeg',
  'mgmt-vincent.jpg', 'mgmt-chang.jpg', 'mgmt-julie.jpg',
  // partners 7 + 2 strategic
  'partner-aas.jpg', 'partner-awa.png', 'partner-amcham.jpg', 'partner-cas.png',
  'partner-5.jpg', 'partner-6.jpg', 'partner-7.png',
  'strategic-1.png', 'strategic-2.png',
  // awards 9
  'award-1-isocert.png', 'award-2-platinum.png', 'award-3-tripartite.jpg',
  'award-4-tafep.png', 'award-5-sgclean.png', 'award-6-greenmark.jpg',
  'award-7-water.jpg', 'award-8-bizsafe.jpg', 'award-9-expat.jpg',
];

// HomePage-uploaded reuse: vision/mission image already on Strapi
const HOME_REUSE_FROM_HOME = {
  // logical name → filename uploaded by seed-home-page.mjs
  visionMissionImage: 'hero-slide-2-dine-drink.jpeg',
};

// committee-members: name, role, photo filename | null, memberType, order, bio?
// GC order matches Framer (D2 decision).
const COMMITTEE = [
  // General Committee — Framer order
  ['Daniel Gewirtz',     'President',                                                        'gc-daniel-gewirtz.png',     'general-committee', 1],
  ['Tessa Pang',         'Secretary',                                                        'gc-tessa-pang.png',         'general-committee', 2],
  ['Alisha Barnes',      'Secretary',                                                        'gc-alisha-barnes.png',      'general-committee', 3],
  ['Terry Kim',          'Treasurer',                                                        null,                        'general-committee', 4],
  ['Charles Santos',     'Member at Large',                                                  'gc-charles-santos.png',     'general-committee', 5],
  ['Kate Park',          'Member at Large',                                                  null,                        'general-committee', 6],
  ['Kenny Liu',          'Member at Large',                                                  null,                        'general-committee', 7],
  ['Marcella Sullivan',  'Member at Large',                                                  'gc-marcella-sullivan.png',  'general-committee', 8],
  ['Michael Schindler',  'Member at Large',                                                  null,                        'general-committee', 9],
  ['Ngiam Siew Wei',     'Member at Large',                                                  'gc-ngiam-siew-wei.png',     'general-committee', 10],
  ['Michelle Reeb',      'American Association of Singapore Representative',                 'gc-michelle-reeb.png',      'general-committee', 11],
  ['Autumn Vavoso',      "American Women's Association Representative",                      'gc-autumn-vavoso.png',      'general-committee', 12],
  ['Sandra Johnson',     'Canadian Association of Singapore Representative',                 'gc-sandra-johnson.png',     'general-committee', 13],
  ['Priyanka Bhalla',    'Member at Large',                                                  'gc-priyanka-bhalla.png',    'general-committee', 14],
  ['Ted Teo',            'Member at Large',                                                  'gc-ted-teo.png',            'general-committee', 15],

  // Management
  ['Christine Kaelbel-Sheares', 'General Manager',                          'mgmt-christine.jpeg', 'management', 1,
    "Christine is a seasoned executive with a diverse global leadership experience. She has held key roles in prestigious hotels in Singapore and the United States. She has led teams in The Venetian and The Palazzo in Las Vegas, The Four Seasons in Chicago, Auberge du Soleil Resort and Domaine Chandon, both in Napa Valley, California. She also served as the Director of Guest Product Development and Asia Operations for Princess Cruises, overseeing a fleet of ships in Asia, Australia, and New Zealand.\n\nIn her most recent role, Christine was the Vice President of Food & Beverage at the Marina Bay Sands Singapore. She was part of the pioneer team and was instrumental in designing service protocols and setting new standards for service excellence. Christine holds a Bachelor's Degree in Law and Politics from the University of London and pursued postgraduate studies in Hospitality Management at the Cesar Ritz Colleges in Switzerland.\n\nFluent in English, French, Mandarin and Cantonese, she brings a unique skill set to support the Club's membership. With her love of the Singaporean and American communities and cultures, her extensive global experience in executive management, and her passion for service, Christine is committed to elevating the Club's overall Member experience."],
  ['Shah Bahari',  'Director of Food & Beverage',           'mgmt-shah.jpg',     'management', 2],
  ['Audrey Lim',   'Director of Finance',                   'mgmt-audrey.jpeg',  'management', 3],
  ['Vincent Lim',  'Director of Human Resources',           'mgmt-vincent.jpg',  'management', 4],
  ['Chang Lim',    'Director of Information Technology',    'mgmt-chang.jpg',    'management', 5],
  ['Julie Zul',    'Director of Member Engagement',         'mgmt-julie.jpg',    'management', 6],
];

const HERITAGE_SLIDES = [
  ['1966', 'In what was regarded as "one of the most significant improvements of the Club\'s amenities in its 19-year history", a new Bowling Alley Complex was built, housing an eight-lane bowling alley, an air-conditioned cocktail lounge, a library, a card room, conference rooms, and office for the American community organization.', 'heritage-1966.jpg'],
  ['1970', "The Presidential Room - formed of a rooftop garden room and serving as a cocktail lounge and multi-purpose room - was built. The Eagle's Nest was opened to answer the long-standing need of Members for a casual dining facility accessible from all activity areas. It featured a light meals, snacks and a relaxed dress code.", 'heritage-1970.jpg'],
  ['1978', 'The Club purchased one acre of land on Claymore Hill at $2.29 million for the construction of the Car park and Sports Complex, featuring three squash courts, two air-conditioned racquetball courts, four tennis courts, and an 88-car parking lot.', 'heritage-1978.jpg'],
  ['1983', "Due to its state of disrepair, a proposed major development plan was mooted with the option to either renovate or demolish and rebuild the clubhouse. As membership had already exceeded the Club's capacity by this time, architects were engaged to draw up a design for a new clubhouse.", 'heritage-1983.jpg'],
  ['1989', 'The Claymore Hill Complex sees its grand opening in May. It consisted of two levels of underground parking, the Liberty Lounge - an up-market cocktail lounge, the Union Bar - a casual sports bar, and a function room on the third floor.', 'heritage-1989.jpg'],
  ['1990', 'The Scotts Complex is remodeled to maximize floor space.\nConstruction of the new Library, Jackpot Room, Teen Room and staff locker room begins.', 'heritage-1990.jpeg'],
  ['2000', "In addition, the Club's Fitness & Leisure expanded its offerings with more fitness options, including more Aquatics classes and adult recreational and fitness classes. The Club has now evolved to become true home away from home destination for Members, local and overseas alike.", 'heritage-2000.jpg'],
  ['2015', 'To meet the growing needs of the membership and in planning for the future, the Club embarked on a $65 million redevelopment project, which replaced the Scotts Road building and pool, and upgraded its Claymore Hill building and Sports Complex. The redevelopment allowed for enhanced usage of space within the Club, increase staff efficiencies, and ultimately elevate Member satisfaction.', 'heritage-2015.jpg'],
];

const PARTNER_LOGOS_MAIN = [
  ['American Chamber of Commerce',       'partner-amcham.jpg'],
  ['American Women\'s Association',      'partner-awa.png'],
  ['American Association of Singapore',  'partner-aas.jpg'],
  ['Canadian Association of Singapore',  'partner-cas.png'],
  ['Partner 7',                          'partner-7.png'],
  ['Partner 6',                          'partner-6.jpg'],
  ['Partner 5',                          'partner-5.jpg'],
];
const STRATEGIC_LOGOS = [
  ['Strategic Partner 1', 'strategic-1.png'],
  ['Strategic Partner 2', 'strategic-2.png'],
];

const AWARDS = [
  ['ISOCert-CSA Cyber Essentials and Cyber Trust Certification', 'ISOCert', 'award-1-isocert.png'],
  ['Top 100 Platinum City Clubs of the World 2024-2025',         'PlatinumClubNet™', 'award-2-platinum.png'],
  ['Tripartite Alliance Award 2018',                             'TAFEP', 'award-3-tripartite.jpg'],
  ['TAFEP Exemplary Employer Award 2016',                        'TAFEP', 'award-4-tafep.png'],
  ['SG Clean Quality Mark',                                      'NEA', 'award-5-sgclean.png'],
  ['Green Mark Certification',                                   'BCA', 'award-6-greenmark.jpg'],
  ['Water Efficient Building (Basic) Certification',             'PUB', 'award-7-water.jpg'],
  ['BizSafe Level 3',                                            'Workplace Safety and Health Council', 'award-8-bizsafe.jpg'],
  ['Bronze Winner for the Best Social Club 2024',                'Expat Living', 'award-9-expat.jpg'],
];

// ── Upserts ───────────────────────────────────────────────
async function upsertCommitteeMember(name, role, photoId, memberType, order, bio) {
  const slug = slugify(name);
  if (DRY) { console.log(`  [dry] upsert committee-member: ${name}`); return { documentId: `dry-${slug}`, slug }; }
  const existing = await findOneBySlug(ctx, 'committee-members', slug);
  const payload = { name, slug, role, memberType, order, photo: photoId ?? null, bio: bio ?? null };
  if (existing) {
    const r = await api(ctx, `/committee-members/${existing.documentId}`, { method: 'PUT', body: { data: payload } });
    return r.data;
  }
  const r = await api(ctx, '/committee-members', { method: 'POST', body: { data: payload } });
  return r.data;
}

async function upsertAboutPage({ media, homeMedia }) {
  const data = {
    title: 'About',
    hero: {
      heading: 'About the Club',
      variant: 'compact',
      titlePosition: 'bottom-left',
      subtitlePosition: 'bottom-right',
      backgroundImage: media['hero-about.jpg'].id,
    },
    heritage: {
      heading: '77 Years of Heritage, Community and Connection',
      body: "Since 1948, The American Club has been Singapore's cherished sanctuary in the heart of Orchard, where generations of Members from over 60 nations come together to build lifelong friendships, celebrate shared moments, and enjoy a true home away from home.",
      backgroundImage: media['hero-about.jpg'].id,
      slides: HERITAGE_SLIDES.map(([year, body, img]) => ({ year, body, image: media[img].id })),
    },
    statsToday: {
      heading: 'The Club Today',
      stats: [
        { value: '11,000+', label: 'Members' },
        { value: '90+',     label: 'Nationalities' },
        { value: '77+',     label: 'Years of Heritage' },
        { value: '25',      label: 'Committees' },
      ],
    },
    visionMission: {
      vision: 'A world class Club offering Members a "home away from home" with excellent service and facilities.',
      mission: "To be the Members' Club and employer of choice in Singapore, striving to continuously improve Member engagement and satisfaction, while embracing our unique American and Canadian cultures within our Singaporean community.",
      image: homeMedia.id,
      imagePosition: 'left',
    },
    governance: {
      heading: 'Club Governance',
      body: 'The governance structure of the Club is that it is member-owned. There are 25 committees which provide plenty of opportunities to get involved as a volunteer. The committees support the Club management through strategic counsel and policy making.\n\nOnly the General Committee (GC) has approval power.\n\nEach year at the Annual General Meeting (AGM) in November, six spots are available for election/re-election for a two-year tenure. From the GC, the Executive Committee (EXCO) is formed each year in April.',
      sidebarHeading: 'Join a Committee',
      sidebarBody: 'If Members wish to volunteer on any of our Committees, please fill in the online Volunteer Interest Form.',
      links: [
        { label: 'Volunteer Interest Form', href: '#', variant: 'primary' },
        { label: 'Committee List', href: '#', variant: 'primary', caption: '(Updated as at December 3, 2025)' },
        { label: 'Volunteer Code of Conduct', href: '#', variant: 'primary' },
      ],
    },
    generalCommittee: {
      heading: 'General Committee',
      variant: 'light',
      filterByType: 'general-committee',
    },
    advocacy: {
      heading: 'Club Advocacy',
      subheading: 'Everyday is Earth Day at the Club',
      body: 'At The American Club, we are committed to enhancing sustainability and expanding environmentally-friendly practices.',
      listItems: [
        "Meat alternatives on the Club's restaurant menus",
        'Biodegradable straws in all restaurants',
        'Recycling and sorting bins are located throughout the Club',
        'Food takeaway packaging are made from sustainable materials',
        'Sale of reusable tumblers and coffee cups at Central',
        'All lighting fixtures have been replaced with LED bulbs that are energy efficient and emit less heat',
      ],
      asideImage: media['advocacy-aside.png'].id,
      asideImagePosition: 'left',
    },
    management: {
      heading: 'Club Management',
      filterByType: 'management',
      // watermark omitted on Framer (not required); could be added later
    },
    partners: {
      heading: 'Partner Organizations',
      groups: [
        {
          logos: PARTNER_LOGOS_MAIN.map(([name, img]) => ({ name, image: media[img].id })),
        },
        {
          heading: 'Strategic Partners',
          logos: STRATEGIC_LOGOS.map(([name, img]) => ({ name, image: media[img].id })),
        },
      ],
    },
    awards: {
      heading: 'Awards & Accolades',
      items: AWARDS.map(([title, issuer, img]) => ({ title, issuer, image: media[img].id })),
    },
    ctaBanner: {
      heading: 'Become Part of Our Story',
      body: 'Join a community that celebrates heritage, connection, and belonging.',
      variant: 'default',
      ctas: [
        { label: 'Explore Membership', href: '/membership', variant: 'primary' },
        { label: 'Book a Club Tour', href: '#', variant: 'outline' },
      ],
    },
  };

  if (DRY) {
    console.log('  [dry] PUT /about-page payload size:', JSON.stringify(data).length, 'chars');
    return { documentId: 'dry-about-page' };
  }
  const r = await api(ctx, '/about-page', { method: 'PUT', body: { data } });
  return r.data;
}

// ── Run ──────────────────────────────────────────────────
async function main() {
  console.log(`Strapi base: ${ctx.BASE}`);
  console.log(`Mode:        ${DRY ? 'DRY-RUN' : 'LIVE'}`);

  console.log('\n[1/3] Uploading media…');
  const media = await uploadAll(ctx, MEDIA_DIR, IMAGES, { dry: DRY });

  // Reuse vision/mission image already uploaded by HomePage seed
  console.log('\n  Reusing HomePage-uploaded image for vision/mission…');
  let homeMedia;
  if (DRY) {
    homeMedia = { id: 0, name: HOME_REUSE_FROM_HOME.visionMissionImage };
    console.log(`  [dry] reuse ${HOME_REUSE_FROM_HOME.visionMissionImage}`);
  } else {
    const url = `${ctx.BASE}/api/upload/files?filters[name][$eq]=${encodeURIComponent(HOME_REUSE_FROM_HOME.visionMissionImage)}`;
    const res = await fetch(url, { headers: ctx.auth });
    const arr = res.ok ? await res.json() : [];
    homeMedia = arr[0];
    if (!homeMedia) {
      console.warn(`  ⚠ ${HOME_REUSE_FROM_HOME.visionMissionImage} not found in media library — run seed-home-page.mjs first`);
      // Fallback: use a local About image
      homeMedia = media['heritage-1966.jpg'];
    } else {
      console.log(`  ✓ reused id=${homeMedia.id}`);
    }
  }

  console.log('\n[2/3] Committee members…');
  for (const row of COMMITTEE) {
    const [name, role, imgFile, memberType, order, bio] = row;
    const imgId = imgFile ? media[imgFile]?.id ?? null : null;
    await upsertCommitteeMember(name, role, imgId, memberType, order, bio);
    console.log(`  ✓ ${name}`);
  }

  console.log('\n[3/3] About Page single type…');
  await upsertAboutPage({ media, homeMedia });
  console.log('  ✓ about-page upserted');

  console.log('\nDone.');
}

main().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});
