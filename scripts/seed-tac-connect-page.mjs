#!/usr/bin/env node
/**
 * Seed script: /membership/tac-connect
 *
 *   1. FAQ category "TAC Connect" + its faq-items (shared with /faq and the
 *      chatbot knowledge base)
 *   2. The `tac-connect-page` single type (hero, store links, help contacts,
 *      feature cards, steps, FAQ category link)
 *   3. Header nav: adds "TAC Connect" under Membership → Programs (idempotent
 *      patch of the live header — does not clobber other admin edits)
 *
 * Environment-specific links are flags so each env can differ without code
 * changes (they stay editable in /admin afterwards):
 *   --ios-url=<App Store URL>        (omit → keep current value; none → no iOS button / QR)
 *   --android-url=<Google Play URL>  (omit → keep current value; none → no Android button / QR)
 *   --portal-url=<member portal URL> (omit → keep current value, else https://members.amclub.org.sg/)
 *   --app-guide-url=<URL>            "App Login Guide" button (omit → keep current value, else #faq)
 *   --portal-guide-url=<URL>         "Member Portal Login Guide" button (omit → keep current value, else #faq)
 *   --replace                        re-upload images that already exist in the media library
 *   --skip-nav                       don't touch the header
 *
 * Rollout: dev + uat first. Prod 404s until this script is run there, so the
 * page, nav link and sitemap entry all stay off prod until then.
 *
 * Usage:
 *   node scripts/seed-tac-connect-page.mjs --env=dev [--dry-run]
 *
 * Images live in media/membership/tac-connect/ (hero, 4 feature cards, 4
 * step icons) and are uploaded on each run; existing uploads are reused
 * unless --replace is passed.
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEnv, api as rawApi, findOneBySlug as rawFindOneBySlug, isDryRun, uploadAll } from './seed-helpers.mjs';

const DRY = isDryRun();
const ctx = initEnv();
const api = (path, opts) => rawApi(ctx, path, opts);
const findOneBySlug = (plural, slug) => rawFindOneBySlug(ctx, plural, slug);

const flag = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};
const DEFAULT_PORTAL_URL = 'https://members.amclub.org.sg/';
// No login guide pages exist yet — point at the FAQ ("How do I log in?") until they do.
const DEFAULT_GUIDE_URL = '#faq';
const MEDIA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'media', 'membership', 'tac-connect');
const SKIP_NAV = process.argv.includes('--skip-nav');

const PAGE_PATH = '/membership/tac-connect';
const FAQ_CATEGORY = {
  name: 'TAC Connect',
  slug: 'tac-connect',
  description: 'The TAC Connect member app and member portal — logging in, bookings and help.',
  displayOrder: 7,
};

// [question, answer] — order follows the array.
const FAQ_ITEMS = [
  ['What is TAC Connect?', 'TAC Connect is the Club’s member app. It brings bookings, your account and Club information together in one place. There’s also a TAC Connect member portal for when you’re on a computer.'],
  ['What can I do on TAC Connect?', 'Book and keep track of all your events and activities, check your Club spend and account details, browse the Club calendar, access Club services and contact us for quick answers.'],
  ['Where can I download the app?', 'TAC Connect is available on the Apple App Store for iOS devices and the Google Play Store for Android devices.'],
  ['Can I use TAC Connect on my computer?', 'Yes. Log in to the TAC Connect member portal at members.amclub.org.sg. It offers many of the same features as the app, like bookings and your account. Google Chrome is the recommended browser.'],
  ['How do I log in?', 'Your username is your 7-character Membership ID (for example, X123400 – the first character must be a capital letter). Your first password is sent to your registered email address.'],
  ['What happens the first time I log in?', 'You’ll be asked to change your password and choose a security question and answer for future password resets.'],
  ['Do I need to set up the app and the member portal separately?', 'No. You only set up your password and security question once. Your settings work on both the app and the member portal, so there’s no need to repeat it when you switch.'],
  ['I forgot my password. What should I do?', 'You can reset your password using the security question and answer you chose at your first login.'],
  ['Where can I get help?', 'Submit an enquiry via Talk2us! and choose “TAC Connect”, chat with Eli on the Club website, or speak to the Club’s front desk.'],
];

const textToBlocks = (text) => [{ type: 'paragraph', children: [{ type: 'text', text }] }];

// Slugs are namespaced so generic questions ("Where can I get help?") never
// collide with — and overwrite — existing general FAQ entries.
const faqSlug = (question) =>
  `tac-connect-${question.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;

async function upsertBySlug(plural, slug, payload) {
  if (DRY) { console.log(`  [dry] upsert ${plural}: ${slug}`); return { documentId: `dry-${slug}` }; }
  const existing = await findOneBySlug(plural, slug);
  const r = existing
    ? await api(`/${plural}/${existing.documentId}`, { method: 'PUT', body: { data: payload } })
    : await api(`/${plural}`, { method: 'POST', body: { data: payload } });
  return r.data;
}

async function seedFaq() {
  console.log('\n── FAQ ──');
  const category = await upsertBySlug('faq-categories', FAQ_CATEGORY.slug, FAQ_CATEGORY);
  for (const [i, [question, answer]] of FAQ_ITEMS.entries()) {
    await upsertBySlug('faq-items', faqSlug(question), {
      question,
      slug: faqSlug(question),
      order: i + 1,
      category: 'membership',
      faqCategory: category.documentId,
      answer: textToBlocks(answer),
    });
  }
  console.log(`  ✓ category "${FAQ_CATEGORY.name}" + ${FAQ_ITEMS.length} items`);
  return category;
}

// [title, description, image]
const FEATURE_CARDS = [
  ['Bookings', 'Book and track all your events and activities in one place.', 'tac-connect-card-bookings.jpg'],
  ['My Account', 'Check your Club spend and account details anytime.', 'tac-connect-card-account.jpg'],
  ['Club Calendar', 'See what’s coming up at the Club, with all the details.', 'tac-connect-card-calendar.jpg'],
  ['Club Services', 'Quick, easy access to the Club services you use most.', 'tac-connect-card-service.jpg'],
];

// [title, description, icon]
const STEPS = [
  ['Download', 'Get the TAC Connect app from the App Store or Google Play', 'tac-connect-step-download.svg'],
  ['Log In', 'Use your 7-character Membership ID and the password sent to your registered email', 'tac-connect-step-log-in.svg'],
  ['Set Up Once', 'Change your password and pick a security question. It works on the app and the member portal', 'tac-connect-step-set-up-once.svg'],
  ['Start Exploring', 'Make bookings, check your account and discover your member privileges', 'tac-connect-step-start-exploring.svg'],
];

const HERO_IMAGE = 'tac-connect-hero.jpg';

async function uploadMedia() {
  console.log('\n── media ──');
  const names = [HERO_IMAGE, ...FEATURE_CARDS.map(([, , img]) => img), ...STEPS.map(([, , icon]) => icon)];
  const map = await uploadAll(ctx, MEDIA_DIR, names, { dry: DRY });
  return (name) => map[name]?.id || undefined;
}

async function seedPage(category, mediaId) {
  console.log('\n── tac-connect-page ──');
  // Re-running must not wipe links an editor set in /admin: an omitted flag
  // keeps whatever the live entry already has.
  const current = DRY ? null : (await api('/tac-connect-page'))?.data;
  const currentStore = (platform) => current?.appDownload?.links?.find((l) => l.platform === platform)?.url ?? null;
  const IOS_URL = flag('ios-url') ?? currentStore('ios');
  const ANDROID_URL = flag('android-url') ?? currentStore('android');
  const currentCta = (label) => current?.ctas?.find((c) => c.label === label)?.href;
  const PORTAL_URL = flag('portal-url') ?? currentCta('Member Portal') ?? DEFAULT_PORTAL_URL;
  const APP_GUIDE_URL = flag('app-guide-url') ?? currentCta('App Login Guide') ?? DEFAULT_GUIDE_URL;
  const PORTAL_GUIDE_URL = flag('portal-guide-url') ?? currentCta('Member Portal Login Guide') ?? DEFAULT_GUIDE_URL;
  const isExternal = (href) => /^https?:\/\//.test(href);
  const storeLinks = [
    { platform: 'ios', label: 'Download for iOS', url: IOS_URL },
    { platform: 'android', label: 'Download for Android', url: ANDROID_URL },
  ];
  const data = {
    title: 'TAC Connect',
    heading: 'TAC Connect',
    label: 'Your Club. One App.',
    parentLabel: 'Membership',
    parentHref: '/membership',
    description: [
      'TAC Connect is your Club in one app. It’s the simple way to stay connected with The American Club – your bookings, your account and the latest from the Club, all in one place.',
      'Book and track your events and activities, check your Club spend and account details, see what’s on the Club calendar, access Club services and get quick answers – whenever and wherever suits you.',
      `On the go, use the TAC Connect app on iOS and Android. At your desk, log in to the TAC Connect member portal at ${PORTAL_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')}. One login works for both.`,
    ].join('\n\n'),
    heroImage: mediaId(HERO_IMAGE),
    ctas: [
      { label: 'App Login Guide', href: APP_GUIDE_URL, isExternal: isExternal(APP_GUIDE_URL) },
      { label: 'Member Portal Login Guide', href: PORTAL_GUIDE_URL, isExternal: isExternal(PORTAL_GUIDE_URL) },
      { label: 'Member Portal', href: PORTAL_URL, isExternal: true },
    ],
    appDownload: {
      heading: 'Download the App',
      description: 'Scan with your phone camera to download TAC Connect for iOS or Android.',
      links: storeLinks,
    },
    helpContacts: {
      heading: 'Need Help?',
      items: [
        { icon: 'form', text: 'Talk2us! – choose “TAC Connect”', href: 'https://amclub.jotform.com/form/talk2us', action: 'link' },
        { icon: 'chat', text: 'Chat with Eli on the Club website', action: 'open-chat' },
        { icon: 'desk', text: 'Club front desk', action: 'link' },
        { icon: 'phone', text: '6737 3411', href: 'tel:+6567373411', action: 'link' },
      ],
    },
    features: {
      heading: 'What You Can Do on TAC Connect',
      description: 'Everything you need for your Club experience, together in one convenient place.',
      variant: 'overlay',
      columns: 4,
      cards: FEATURE_CARDS.map(([title, subtitle, image]) => ({ title, subtitle, image: mediaId(image) })),
    },
    steps: {
      heading: 'Get Started in 4 Easy Steps',
      iconStyle: 'circle',
      items: STEPS.map(([title, description, icon]) => ({ title, description, icon: mediaId(icon) })),
    },
    faqHeading: 'Frequently Asked Questions',
    faqCategory: category.documentId,
    seo: {
      metaTitle: 'TAC Connect | The American Club Singapore',
      metaDescription: 'TAC Connect is your Club in one app — bookings, your account and the latest from The American Club, on iOS, Android and the member portal.',
    },
  };
  if (DRY) { console.log('  [dry] PUT /tac-connect-page'); return; }
  // Strapi v5 REST writes publish by default (no ?status=draft).
  await api('/tac-connect-page', { method: 'PUT', body: { data } });
  console.log(`  ✓ published${IOS_URL || ANDROID_URL ? '' : ' (no store URLs yet — buttons/QR hidden)'}`);
}

/** Strip ids so components are re-created, and flatten media to ids. */
const toWritable = (value) => {
  if (Array.isArray(value)) return value.map(toWritable);
  if (value && typeof value === 'object') {
    if ('mime' in value && 'url' in value) return value.id;
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (['id', 'documentId', 'createdAt', 'updatedAt', 'publishedAt', 'locale', 'localizations'].includes(k)) continue;
      out[k] = toWritable(v);
    }
    return out;
  }
  return value;
};

async function seedNav() {
  console.log('\n── header nav ──');
  if (SKIP_NAV) { console.log('  skipped (--skip-nav)'); return; }
  const header = (await api('/header'))?.data;
  if (!header) throw new Error('No header entry — run seed-header.mjs first');
  const membership = header.navItems?.find((n) => n.href === '/membership');
  const programs = membership?.columns?.find((c) => c.heading === 'Programs');
  if (!programs) throw new Error('Header has no Membership → Programs column');
  const existing = programs.links.find((l) => l.href === PAGE_PATH);
  // Re-seeding re-adds the "New" badge if it was cleared — pass --skip-nav
  // once the launch badge has been retired in /admin.
  if (existing?.badge) { console.log('  ✓ already present'); return; }
  if (existing) existing.badge = 'New';
  else programs.links.push({ label: 'TAC Connect', href: PAGE_PATH, isExternal: false, badge: 'New' });
  if (DRY) { console.log('  [dry] PUT /header (TAC Connect + New badge)'); return; }
  await api('/header', { method: 'PUT', body: { data: toWritable(header) } });
  console.log(`  ✓ ${existing ? 'badged' : 'added'} under Membership → Programs`);
}

async function main() {
  console.log(`Seeding TAC Connect${DRY ? ' (dry-run)' : ''}`);
  const category = await seedFaq();
  const mediaId = await uploadMedia();
  await seedPage(category, mediaId);
  await seedNav();
  console.log('\nDone.');
}

main().catch((err) => { console.error(err); process.exit(1); });
